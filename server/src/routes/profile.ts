import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateUser, AuthRequest } from '../middlewares/auth';
import { sendSuccess, sendError } from '../utils/response';
import { noCache } from '../middlewares/cache';
import { isValidDateStr, syncAndUpdateStreak } from '../utils/streak';

const router = Router();

// Đảm bảo tuyệt đối không cache dữ liệu thông tin cá nhân
router.use(noCache());

// GET /api/profile/me - Lấy thông tin cá nhân của người dùng hiện tại
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user.id;
  const db = authReq.supabase || supabase;

  try {
    const { data: profile, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return sendError(res, error.message, 500, 'PROFILE_FETCH_ERROR');
    }

    if (!profile) {
      // Tự động khởi tạo profile mặc định nếu chưa tồn tại
      const userMeta = authReq.user.user_metadata || {};
      const newProfile = {
        id: userId,
        display_name: userMeta.full_name || userMeta.name || authReq.user.email?.split('@')[0] || 'Learner',
        avatar_url: userMeta.avatar_url || userMeta.picture || null,
        streak_count: 0,
        daily_goal_words: 10,
        current_level: 'A2',
        last_active_date: null,
      };

      const { data: inserted, error: insertError } = await db
        .from('profiles')
        .insert(newProfile)
        .select()
        .maybeSingle();

      if (insertError) {
        return sendError(res, insertError.message, 500, 'PROFILE_INIT_ERROR');
      }

      const refDate = isValidDateStr(req.query.date) ? req.query.date : undefined;
      const syncedStreak = await syncAndUpdateStreak(db, userId, { referenceDate: refDate });
      const resolved = inserted || newProfile;
      return sendSuccess(res, { ...resolved, streak_count: syncedStreak }, 'Khởi tạo profile thành công');
    }

    const refDate = isValidDateStr(req.query.date) ? req.query.date : undefined;
    const syncedStreak = await syncAndUpdateStreak(db, userId, { referenceDate: refDate });

    return sendSuccess(res, { ...profile, streak_count: syncedStreak }, 'Lấy thông tin profile thành công');
  } catch (err: any) {
    return sendError(res, err.message, 500, 'PROFILE_FETCH_ERROR');
  }
});

// PUT /api/profile/me - Cập nhật thông tin và mục tiêu học
router.put('/me', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user.id;
  const db = authReq.supabase || supabase;
  const { display_name, daily_goal_words, current_level, avatar_url } = req.body;

  // Validate input dữ liệu đầu vào
  if (display_name !== undefined) {
    if (typeof display_name !== 'string' || display_name.trim().length === 0 || display_name.length > 60) {
      return sendError(res, 'display_name phải là chuỗi từ 1 đến 60 ký tự', 400, 'INVALID_INPUT');
    }
  }

  if (daily_goal_words !== undefined) {
    const goalNum = Number(daily_goal_words);
    if (!Number.isInteger(goalNum) || goalNum < 1 || goalNum > 200) {
      return sendError(res, 'daily_goal_words phải là số nguyên từ 1 đến 200', 400, 'INVALID_INPUT');
    }
  }

  const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  if (current_level !== undefined && !VALID_LEVELS.includes(current_level)) {
    return sendError(res, 'current_level không hợp lệ (hỗ trợ A1, A2, B1, B2, C1, C2)', 400, 'INVALID_INPUT');
  }

  if (avatar_url !== undefined && (typeof avatar_url !== 'string' || avatar_url.length > 500)) {
    return sendError(res, 'avatar_url không hợp lệ', 400, 'INVALID_INPUT');
  }

  try {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) updates.display_name = display_name.trim();
    if (daily_goal_words !== undefined) updates.daily_goal_words = Number(daily_goal_words);
    if (current_level !== undefined) updates.current_level = current_level;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url.trim();

    const { data, error } = await db
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      return sendError(res, error.message, 500, 'PROFILE_UPDATE_ERROR');
    }

    // Nếu profile chưa tồn tại trong DB, thực hiện upsert để tạo mới với dữ liệu cập nhật
    if (!data) {
      const userMeta = authReq.user.user_metadata || {};
      const newProfile = {
        id: userId,
        display_name: display_name || userMeta.full_name || userMeta.name || authReq.user.email?.split('@')[0] || 'Learner',
        avatar_url: avatar_url || userMeta.avatar_url || userMeta.picture || null,
        streak_count: 0,
        daily_goal_words: daily_goal_words || 10,
        current_level: current_level || 'A2',
        last_active_date: null,
        ...updates,
      };

      const { data: upsertedData, error: upsertError } = await db
        .from('profiles')
        .upsert(newProfile)
        .select()
        .maybeSingle();

      if (upsertError) {
        return sendError(res, upsertError.message, 500, 'PROFILE_UPDATE_ERROR');
      }

      return sendSuccess(res, upsertedData, 'Cập nhật profile thành công');
    }

    return sendSuccess(res, data, 'Cập nhật profile thành công');
  } catch (err: any) {
    return sendError(res, err.message, 500, 'PROFILE_UPDATE_ERROR');
  }
});

export default router;
