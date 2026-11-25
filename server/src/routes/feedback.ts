import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase, getScopedSupabaseClient } from '../config/supabase';
import { authenticateUser, AuthRequest } from '../middlewares/auth';
import { sendSuccess, sendError } from '../utils/response';
import { noCache } from '../middlewares/cache';
import { sendTelegramMessage, formatFeedbackTelegram } from '../utils/telegram';

const router = Router();
router.use(noCache());

// Bộ nhớ đệm chống gửi trùng lặp liên tục trong 45 giây (Double click / Rapid flood)
const recentSubmissions = new Map<string, number>();
const CLEANUP_INTERVAL = 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > 60 * 1000) {
      recentSubmissions.delete(key);
    }
  }
}, CLEANUP_INTERVAL).unref();

// Rate limiter riêng cho việc gửi feedback (tối đa 15 lần trong 15 phút cho mỗi IP)
const feedbackSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Bạn đã gửi nhiều phản hồi trong thời gian ngắn. Vui lòng thử lại sau vài phút.',
    },
  },
});

// POST /api/feedback - Gửi góp ý / báo lỗi mới
router.post('/', feedbackSubmitLimiter, async (req: Request, res: Response) => {
  // Trích xuất Bearer token nếu có để liên kết với user
  const authHeader = req.headers.authorization;
  let userId: string | null = null;
  let userEmail: string | null = req.body.user_email?.trim() || null;
  let userName: string | null = req.body.user_name?.trim() || null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = user.email || userEmail;
        userName = user.user_metadata?.full_name || user.user_metadata?.name || userName;
      }
    } catch (_) {}
  }

  const { category, rating, title, content, page_url, device_info, screenshot_url } = req.body;

  // 1. Chống Spam: Kỹ thuật Honeypot (Bẫy bot)
  // Nếu trường website hoặc honeypot ẩn được điền dữ liệu -> 100% là bot tự động quét form
  const honeypot = req.body.website || req.body.honeypot || req.body._hp;
  if (honeypot && typeof honeypot === 'string' && honeypot.trim().length > 0) {
    console.warn(`[Anti-Spam] Bot detected via honeypot from IP: ${req.ip}`);
    // Phản hồi giả thành công 200 để bot tưởng hoàn tất nhưng KHÔNG ghi database, KHÔNG gửi Telegram
    return sendSuccess(
      res,
      true,
      'Cảm ơn bạn đã gửi phản hồi! Ý kiến của bạn giúp SpeakUp ngày càng hoàn thiện hơn.'
    );
  }

  // 2. Chống Spam: Kiểm tra gửi trùng lặp liên tục (Double submission flood)
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const contentSnippet = String(content || '').trim().slice(0, 100).toLowerCase();
  const spamKey = `${clientIp}:${contentSnippet}`;
  const nowTimestamp = Date.now();
  const lastSubmittedAt = recentSubmissions.get(spamKey);

  if (lastSubmittedAt && nowTimestamp - lastSubmittedAt < 45 * 1000) {
    // Nếu gửi cùng nội dung trong vòng 45s -> trả về thành công an toàn (idempotent)
    return sendSuccess(
      res,
      true,
      'Cảm ơn bạn đã gửi phản hồi! Ý kiến của bạn giúp SpeakUp ngày càng hoàn thiện hơn.'
    );
  }
  recentSubmissions.set(spamKey, nowTimestamp);

  // Validation
  if (!content || typeof content !== 'string' || content.trim().length < 5) {
    return sendError(res, 'Nội dung phản hồi phải có ít nhất 5 ký tự.', 400, 'INVALID_CONTENT');
  }

  const validCategories = ['bug', 'feature', 'content', 'general'];
  if (!category || !validCategories.includes(category)) {
    return sendError(res, 'Thể loại phản hồi không hợp lệ.', 400, 'INVALID_CATEGORY');
  }

  const numericRating = rating !== undefined && rating !== null && rating !== '' ? Number(rating) : null;
  if (numericRating !== null && (isNaN(numericRating) || numericRating < 1 || numericRating > 5)) {
    return sendError(res, 'Đánh giá phải từ 1 đến 5 sao.', 400, 'INVALID_RATING');
  }

  // Tiện ích làm sạch và xác thực an toàn URL (chỉ chấp nhận http / https, chống javascript: URI)
  const sanitizeHttpUrl = (rawUrl: unknown, maxLength = 500): string | null => {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    if (trimmed.length === 0 || trimmed.length > maxLength) return null;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return trimmed;
      }
    } catch (_) {}
    return null;
  };

  const safePageUrl = sanitizeHttpUrl(page_url, 500);
  const safeScreenshotUrl = sanitizeHttpUrl(screenshot_url, 1000);

  try {
    const feedbackData = {
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      category,
      rating: numericRating,
      title: title ? String(title).trim().slice(0, 200) : null,
      content: String(content).trim().slice(0, 3000),
      page_url: safePageUrl,
      device_info: typeof device_info === 'object' && device_info !== null ? device_info : {},
      screenshot_url: safeScreenshotUrl,
      status: 'pending',
    };

    // Bỏ .select().single() để tránh kích hoạt SELECT RLS policy khi insert từ client unauthenticated
    const { error } = await supabase
      .from('feedbacks')
      .insert(feedbackData);

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || (error as any).code === '42P01') {
        console.warn('⚠️ [Feedback] Bảng public.feedbacks chưa được tạo trên Supabase. Vui lòng chạy file server/src/db/feedbacks_schema.sql trong Supabase SQL Editor.');
        return sendError(
          res,
          'Bảng dữ liệu góp ý chưa được tạo trên Supabase. Vui lòng chạy script server/src/db/feedbacks_schema.sql trong Supabase SQL Editor.',
          503,
          'DATABASE_TABLE_NOT_FOUND'
        );
      }
      console.error('[Feedback] Insert error:', error);
      return sendError(res, error.message, 500, 'FEEDBACK_INSERT_ERROR');
    }

    // Gửi thông báo qua Telegram Bot (non-blocking, không ảnh hưởng response)
    sendTelegramMessage(
      formatFeedbackTelegram({
        category,
        title: title ? String(title).trim().slice(0, 200) : null,
        content: String(content).trim().slice(0, 3000),
        user_name: userName,
        user_email: userEmail,
        page_url: page_url ? String(page_url).trim() : null,
      })
    ).catch((err) => console.error('[Telegram] Fire-and-forget error:', err));

    return sendSuccess(
      res,
      true,
      'Cảm ơn bạn đã gửi phản hồi! Ý kiến của bạn giúp SpeakUp ngày càng hoàn thiện hơn.'
    );
  } catch (err: any) {
    console.error('[Feedback] Unexpected error:', err);
    return sendError(res, err.message, 500, 'FEEDBACK_ERROR');
  }
});

// GET /api/feedback/my - Lấy lịch sử feedback của người dùng hiện tại
router.get('/my', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user.id;
  const db = authReq.supabase || supabase;

  try {
    const { data, error } = await db
      .from('feedbacks')
      .select('id, category, rating, title, content, page_url, status, admin_notes, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || (error as any).code === '42P01') {
        console.warn('⚠️ [Feedback] Bảng public.feedbacks chưa được tạo trên Supabase. Trả về mảng rỗng để không làm gián đoạn frontend.');
        return sendSuccess(res, [], 'Bảng feedbacks chưa được khởi tạo trên Supabase. Vui lòng chạy file feedbacks_schema.sql');
      }
      console.error('[Feedback] Fetch my feedbacks error:', error);
      return sendError(res, error.message, 500, 'FEEDBACK_FETCH_ERROR');
    }

    return sendSuccess(res, data || [], 'Lấy lịch sử phản hồi thành công');
  } catch (err: any) {
    console.error('[Feedback] Unexpected fetch error:', err);
    return sendError(res, err.message, 500, 'FEEDBACK_FETCH_ERROR');
  }
});

export default router;
