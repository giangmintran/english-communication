import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase, getScopedSupabaseClient } from '../config/supabase';
import { authenticateUser, AuthRequest } from '../middlewares/auth';
import { sendSuccess, sendError } from '../utils/response';
import { noCache } from '../middlewares/cache';
import { PlacementTestResult, CEFRLevel } from '../types/database';

const router = Router();
router.use(noCache());

// Rate limiter cho việc nộp bài kiểm tra trình độ (tối đa 20 lần / 15 phút)
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Bạn đã thực hiện quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút.',
    },
  },
});

const VALID_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2'];

/**
 * POST /api/placement-test/submit
 * Nhận kết quả bài làm:
 * - Nếu người dùng đã đăng nhập: Lưu vào bảng `placement_test_results` và cập nhật `profiles.current_level`.
 * - Nếu là khách vãng lai: Trả về kết quả ngay lập tức (không lưu vào DB lâu dài theo quy định).
 */
router.post('/submit', submitLimiter, async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let userId: string | null = null;
  let scopedClient = supabase;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        scopedClient = getScopedSupabaseClient(token);
      }
    } catch (_) {}
  }

  const {
    overall_level,
    overall_score,
    total_questions = 30,
    percentage = 0,
    skill_scores = {},
    answers = [],
    strengths = [],
    weaknesses = [],
    recommended_collection_id,
    recommended_daily_topic,
  } = req.body;

  // Validation
  if (!overall_level || !VALID_LEVELS.includes(overall_level)) {
    return sendError(res, 'Trình độ CEFR không hợp lệ (hỗ trợ A1, A2, B1, B2).', 400, 'INVALID_LEVEL');
  }

  const scoreNum = Number(overall_score);
  if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 30) {
    return sendError(res, 'Điểm số không hợp lệ (từ 0 đến 30).', 400, 'INVALID_SCORE');
  }

  const resultPayload: PlacementTestResult = {
    id: `result-${Date.now()}`,
    user_id: userId || undefined,
    is_guest: !userId,
    overall_level,
    overall_score: scoreNum,
    total_questions: Number(total_questions) || 30,
    percentage: Math.min(100, Math.max(0, Number(percentage) || 0)),
    skill_scores,
    answers,
    strengths,
    weaknesses,
    recommended_collection_id,
    recommended_daily_topic,
    created_at: new Date().toISOString(),
  };

  // Đối với Khách vãng lai: Phản hồi kết quả ngay lập tức mà không ghi vào DB
  if (!userId) {
    return sendSuccess(
      res,
      resultPayload,
      'Đánh giá trình độ khách thành công',
      200,
      { isGuest: true }
    );
  }

  // Đối với Người dùng đã đăng nhập: Lưu DB và đồng bộ profile
  try {
    const { data: inserted, error: insertError } = await scopedClient
      .from('placement_test_results')
      .insert({
        user_id: userId,
        overall_level,
        overall_score: scoreNum,
        total_questions: resultPayload.total_questions,
        percentage: resultPayload.percentage,
        skill_scores,
        answers,
        recommended_collection_id,
        created_at: resultPayload.created_at,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.warn('Lỗi lưu placement_test_results:', insertError.message);
      // Vẫn tiếp tục cập nhật profile để người dùng không bị gián đoạn
    }

    // Cập nhật current_level trong bảng profiles
    try {
      await scopedClient
        .from('profiles')
        .update({
          current_level: overall_level,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (profileErr: any) {
      console.warn('Lỗi cập nhật profile level:', profileErr.message);
    }

    const finalResult = inserted ? { ...resultPayload, id: inserted.id } : resultPayload;
    return sendSuccess(res, finalResult, 'Lưu kết quả kiểm tra trình độ thành công', 201);
  } catch (err: any) {
    console.error('Lỗi khi nộp bài test:', err);
    return sendError(res, err.message, 500, 'PLACEMENT_SUBMIT_ERROR');
  }
});

/**
 * GET /api/placement-test/latest
 * Lấy kết quả kiểm tra gần nhất của người dùng đã đăng nhập
 */
router.get('/latest', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user.id;
  const db = authReq.supabase || supabase;

  try {
    const { data, error } = await db
      .from('placement_test_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return sendError(res, error.message, 500, 'FETCH_LATEST_ERROR');
    }

    return sendSuccess(res, data || null, 'Lấy kết quả kiểm tra gần nhất thành công');
  } catch (err: any) {
    return sendError(res, err.message, 500, 'FETCH_LATEST_ERROR');
  }
});

/**
 * GET /api/placement-test/history
 * Lấy lịch sử tất cả các bài kiểm tra của người dùng đã đăng nhập
 */
router.get('/history', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user.id;
  const db = authReq.supabase || supabase;

  try {
    const { data, error } = await db
      .from('placement_test_results')
      .select('id, overall_level, overall_score, total_questions, percentage, skill_scores, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return sendError(res, error.message, 500, 'FETCH_HISTORY_ERROR');
    }

    return sendSuccess(res, data || [], 'Lấy lịch sử kiểm tra thành công');
  } catch (err: any) {
    return sendError(res, err.message, 500, 'FETCH_HISTORY_ERROR');
  }
});

export default router;
