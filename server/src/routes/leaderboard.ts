import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';
import { LeaderboardEntry } from '../types/database';

const router = Router();

const defaultCompetitors: LeaderboardEntry[] = [
  {
    name: 'Minh Anh',
    streak: 42,
    words: 1250,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    isCurrent: false,
  },
  {
    name: 'Hoàng Nam',
    streak: 35,
    words: 980,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    isCurrent: false,
  },
  {
    name: 'Thanh Thảo',
    streak: 28,
    words: 820,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
    isCurrent: false,
  },
  {
    name: 'Quốc Bảo',
    streak: 7,
    words: 430,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    isCurrent: false,
  },
];

// GET /api/leaderboard - Lấy danh sách bảng xếp hạng từ bảng profiles
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, streak_count')
      .order('streak_count', { ascending: false })
      .limit(20);

    const dbEntries: LeaderboardEntry[] = (!error && profiles ? profiles : []).map((p) => ({
      name: p.display_name || 'Học viên',
      avatar:
        p.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(p.display_name || 'HV')}&background=2563eb&color=fff&bold=true`,
      streak: p.streak_count || 1,
      words: (p.streak_count || 1) * 12,
      isCurrent: false,
    }));

    // Kết hợp profiles thật từ DB và các vị trí tiêu biểu nếu DB còn ít thành viên
    const existingNames = new Set(dbEntries.map((e) => e.name.toLowerCase()));
    const blended = [
      ...dbEntries,
      ...defaultCompetitors.filter((c) => !existingNames.has(c.name.toLowerCase())),
    ].sort((a, b) => b.words - a.words);

    return sendSuccess(res, blended, 'Lấy bảng xếp hạng thành công', 200, {
      total: blended.length,
      realUsersCount: dbEntries.length,
    });
  } catch (err: any) {
    return sendError(res, err.message, 500, 'LEADERBOARD_FETCH_ERROR');
  }
});

export default router;
