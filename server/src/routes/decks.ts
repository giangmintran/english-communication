import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { initialDecks, sampleLearningItems } from '../data/mockData';
import { sendSuccess, sendError } from '../utils/response';
import { edgeCache } from '../middlewares/cache';

const router = Router();

// GET /api/decks - Lấy danh sách decks (Edge Cache: 10 phút)
router.get('/', edgeCache(600), async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .order('order_index', { ascending: true });

    if (error || !data || data.length === 0) {
      return sendSuccess(res, initialDecks, 'Lấy danh sách decks thành công (fallback)', 200, {
        total: initialDecks.length,
      });
    }

    return sendSuccess(res, data, 'Lấy danh sách decks thành công', 200, {
      total: data.length,
    });
  } catch (err: any) {
    return sendSuccess(res, initialDecks, 'Lấy danh sách decks thành công (fallback)', 200, {
      total: initialDecks.length,
    });
  }
});

// GET /api/decks/:id - Lấy chi tiết deck và items bên trong (Edge Cache: 10 phút)
router.get('/:id', edgeCache(600), async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const isDaily = id === 'daily' || id === 'deck-daily';
    const targetSlug = isDaily ? 'daily' : id.replace(/^deck-/, '');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase.from('decks').select('*, items(*)');
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', targetSlug);
    }

    const { data: deck, error: deckError } = await query.maybeSingle();

    if (deckError || !deck) {
      if (isDaily) {
        const dailyItems = sampleLearningItems['deck-daily'] || sampleLearningItems['daily'] || [];
        const dailyFallbackDeck = {
          id: 'deck-daily',
          title: "Today's Goal",
          slug: 'daily',
          description: 'Mục tiêu học 20 từ vựng mỗi ngày',
          category: 'Daily Routine',
          icon_name: 'Target',
          image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
          total_words: 20,
          flashcards: dailyItems,
        };
        return sendSuccess(res, dailyFallbackDeck, 'Lấy chi tiết Daily Routine thành công (fallback)');
      }

      const fallbackDeck =
        initialDecks.find((d) => d.id === id || d.slug === targetSlug) || initialDecks[0];
      const items = sampleLearningItems[fallbackDeck.id] || sampleLearningItems[fallbackDeck.slug] || [];
      return sendSuccess(
        res,
        { ...fallbackDeck, flashcards: items },
        'Lấy chi tiết deck thành công (fallback)'
      );
    }

    const formattedDeck = {
      ...deck,
      title: isDaily ? "Today's Goal" : deck.title,
      flashcards: deck.items || [],
    };

    return sendSuccess(res, formattedDeck, 'Lấy chi tiết deck thành công');
  } catch (err: any) {
    return sendError(res, `Lỗi khi tải thông tin deck: ${err.message}`, 500, 'DECK_FETCH_ERROR');
  }
});

export default router;
