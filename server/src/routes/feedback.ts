import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase, getScopedSupabaseClient } from '../config/supabase';
import { authenticateUser, AuthRequest } from '../middlewares/auth';
import { sendSuccess, sendError } from '../utils/response';
import { noCache } from '../middlewares/cache';

const router = Router();
router.use(noCache());

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

  try {
    const { data, error } = await supabase
      .from('feedbacks')
      .insert({
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        category,
        rating: numericRating,
        title: title ? String(title).trim().slice(0, 200) : null,
        content: String(content).trim().slice(0, 3000),
        page_url: page_url ? String(page_url).trim().slice(0, 500) : null,
        device_info: typeof device_info === 'object' && device_info !== null ? device_info : {},
        screenshot_url: screenshot_url ? String(screenshot_url).trim() : null,
        status: 'pending',
      })
      .select()
      .single();

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

    return sendSuccess(
      res,
      data,
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
