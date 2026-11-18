import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateUser, AuthRequest } from '../middlewares/auth';
import { sendSuccess, sendError } from '../utils/response';
import { noCache } from '../middlewares/cache';

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
        streak_count: 1,
        daily_goal_words: 10,
        current_level: 'A2',
        last_active_date: new Date().toISOString().split('T')[0],
      };

      const { data: inserted, error: insertError } = await db
        .from('profiles')
        .insert(newProfile)
        .select()
        .maybeSingle();

      if (insertError) {
        return sendError(res, insertError.message, 500, 'PROFILE_INIT_ERROR');
      }

      return sendSuccess(res, inserted || newProfile, 'Khởi tạo profile thành công');
    }

    return sendSuccess(res, profile, 'Lấy thông tin profile thành công');
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

  try {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) updates.display_name = display_name;
    if (daily_goal_words !== undefined) updates.daily_goal_words = daily_goal_words;
    if (current_level !== undefined) updates.current_level = current_level;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

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
        streak_count: 1,
        daily_goal_words: daily_goal_words || 10,
        current_level: current_level || 'A2',
        last_active_date: new Date().toISOString().split('T')[0],
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
