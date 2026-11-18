import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateUser, AuthRequest } from '../middlewares/auth';
import { sendSuccess, sendError } from '../utils/response';
import { noCache } from '../middlewares/cache';

const router = Router();

// Đảm bảo tuyệt đối không cache tiến độ học cá nhân
router.use(noCache());

// GET /api/progress - Lấy tiến độ học của user hiện tại
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user.id;
  const db = authReq.supabase || supabase;
  try {
    const { data, error } = await db
      .from('reviews')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return sendError(res, error.message, 500, 'PROGRESS_FETCH_ERROR');
    }

    return sendSuccess(res, data || [], 'Lấy tiến độ học thành công', 200, {
      total: data?.length || 0,
    });
  } catch (err: any) {
    return sendError(res, err.message, 500, 'PROGRESS_FETCH_ERROR');
  }
});

// POST /api/progress/record - Cập nhật tiến độ học cho 1 card/item
router.post('/record', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user.id;
  const db = authReq.supabase || supabase;
  const { itemId, repetitions, intervalDays, easeFactor, nextReviewAt, lastQuality } = req.body;

  if (!itemId) {
    return sendError(res, 'itemId is required', 400, 'BAD_REQUEST');
  }

  try {
    const now = new Date().toISOString();
    const { data: existing } = await db
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .maybeSingle();

    let result;
    if (existing?.id) {
      result = await db
        .from('reviews')
        .update({
          repetitions,
          interval_days: intervalDays,
          ease_factor: easeFactor,
          next_review_at: nextReviewAt,
          last_reviewed_at: now,
          last_quality: lastQuality,
        })
        .eq('id', existing.id)
        .select();
    } else {
      result = await db
        .from('reviews')
        .insert({
          user_id: userId,
          item_id: itemId,
          repetitions,
          interval_days: intervalDays,
          ease_factor: easeFactor,
          next_review_at: nextReviewAt,
          last_reviewed_at: now,
          last_quality: lastQuality,
        })
        .select();
    }

    if (result.error) {
      return sendError(res, result.error.message, 500, 'PROGRESS_UPDATE_ERROR');
    }

    // Update last_active_date in profiles
    await db
      .from('profiles')
      .update({
        last_active_date: now,
        updated_at: now,
      })
      .eq('id', userId);

    return sendSuccess(res, result.data, 'Lưu kết quả ôn tập thành công');
  } catch (err: any) {
    return sendError(res, err.message, 500, 'PROGRESS_UPDATE_ERROR');
  }
});

export default router;
