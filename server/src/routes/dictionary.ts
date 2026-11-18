import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sampleLearningItems } from '../data/mockData';
import { sendSuccess, sendError } from '../utils/response';
import { edgeCache } from '../middlewares/cache';
import { DictionaryItem } from '../types/database';

const router = Router();

const sampleFallbackWords: DictionaryItem[] = [
  { word: 'Collocation', ipa: '/ˌkɒləˈkeɪʃn/', meaning: 'Cụm từ thường đi liền với nhau một cách tự nhiên trong tiếng Anh', example: 'Fast food, make an effort, take a shower' },
  { word: 'Touch base', ipa: '/tʌtʃ beɪs/', meaning: 'Liên lạc nhanh để cập nhật tình hình công việc', example: 'Let us touch base tomorrow afternoon.' },
  { word: 'Recommend', ipa: '/ˌrekəˈmend/', meaning: 'Gợi ý, khuyên dùng', example: 'What do you recommend for dinner?' },
  { word: 'Allergic', ipa: '/əˈlɜːdʒɪk/', meaning: 'Dị ứng với một loại thức ăn hoặc phấn hoa', example: 'I am allergic to peanuts.' },
  { word: 'Split the bill', ipa: '/splɪt ðə bɪl/', meaning: 'Chia tiền hóa đơn công bằng', example: 'Can we split the bill please?' },
];

// GET /api/dictionary - Tìm kiếm từ vựng, collocation từ bảng items (Edge Cache: 3 phút)
router.get('/', edgeCache(180), async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    const limit = parseInt(req.query.limit as string, 10) || 30;

    let query = supabase
      .from('items')
      .select('id, english_text, phonetic_ipa, vietnamese_meaning, example_sentence, type')
      .not('english_text', 'is', null);

    if (q) {
      // Tìm kiếm theo từ tiếng Anh hoặc nghĩa tiếng Việt
      query = query.or(`english_text.ilike.%${q}%,vietnamese_meaning.ilike.%${q}%`);
    }

    const { data, error } = await query.limit(limit);

    if (error || !data || data.length === 0) {
      // Fallback tìm kiếm từ mockData nếu Supabase không có kết quả hoặc có lỗi
      const allMockItems = Object.values(sampleLearningItems).flat();
      let matched: DictionaryItem[] = [];

      if (q) {
        matched = allMockItems
          .filter(
            (item) =>
              item.english_text.toLowerCase().includes(q.toLowerCase()) ||
              item.vietnamese_meaning.toLowerCase().includes(q.toLowerCase())
          )
          .slice(0, limit)
          .map((item) => ({
            id: item.id,
            word: item.english_text,
            ipa: item.phonetic_ipa,
            meaning: item.vietnamese_meaning,
            example: item.example_sentence,
            type: item.type,
          }));
      }

      if (matched.length === 0) {
        matched = sampleFallbackWords.filter(
          (w) =>
            !q ||
            w.word.toLowerCase().includes(q.toLowerCase()) ||
            w.meaning.toLowerCase().includes(q.toLowerCase())
        );
      }

      return sendSuccess(res, matched, 'Tra cứu từ điển thành công (fallback)', 200, {
        total: matched.length,
        query: q,
        fallback: true,
      });
    }

    const formattedResults: DictionaryItem[] = data.map((item) => ({
      id: item.id,
      word: item.english_text,
      ipa: item.phonetic_ipa || '',
      meaning: item.vietnamese_meaning || '',
      example: item.example_sentence || '',
      type: item.type,
    }));

    return sendSuccess(res, formattedResults, 'Tra cứu từ điển thành công', 200, {
      total: formattedResults.length,
      query: q,
      limit,
    });
  } catch (err: any) {
    return sendError(res, err.message, 500, 'DICTIONARY_FETCH_ERROR');
  }
});

export default router;
