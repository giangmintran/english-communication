import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sampleLearningItems } from '../data/mockData';
import { sendSuccess, sendError } from '../utils/response';
import { edgeCache } from '../middlewares/cache';
import { SpeakingItem } from '../types/database';

const router = Router();

// GET /api/speaking - Lấy danh sách câu luyện phát âm từ bảng items (Edge Cache: 3 phút)
router.get('/', edgeCache(180), async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const level = req.query.level as string;
    const topic = req.query.topic as string;

    let query = supabase
      .from('items')
      .select('id, english_text, phonetic_ipa, vietnamese_meaning, difficulty_level, type')
      .not('english_text', 'is', null);

    if (level) {
      query = query.eq('difficulty_level', level);
    }

    if (topic) {
      query = query.eq('deck_id', topic);
    }

    const { data, error } = await query.limit(limit);

    if (error || !data || data.length === 0) {
      // Fallback: lấy từ mockData nếu Supabase không phản hồi
      const fallbackList: SpeakingItem[] = Object.values(sampleLearningItems)
        .flat()
        .slice(0, limit)
        .map((item) => ({
          id: item.id,
          english_text: item.english_text,
          phonetic_ipa: item.phonetic_ipa,
          vietnamese_meaning: item.vietnamese_meaning,
          difficulty_level: item.difficulty_level,
          type: item.type,
        }));

      return sendSuccess(
        res,
        fallbackList,
        'Lấy danh sách câu luyện nói thành công (fallback)',
        200,
        { total: fallbackList.length, fallback: true }
      );
    }

    return sendSuccess(res, data, 'Lấy danh sách câu luyện nói thành công', 200, {
      total: data.length,
      limit,
    });
  } catch (err: any) {
    return sendError(res, err.message, 500, 'SPEAKING_FETCH_ERROR');
  }
});

export default router;
