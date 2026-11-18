import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { initialDecks } from '../data/mockData';
import { sendSuccess, sendError } from '../utils/response';
import { edgeCache } from '../middlewares/cache';
import { ConversationItem } from '../types/database';

const router = Router();

function getLevelForDeck(category: string, title: string): string {
  const lower = (category + ' ' + title).toLowerCase();
  if (lower.includes('advanced') || lower.includes('negotiation')) return 'B2';
  if (lower.includes('work') || lower.includes('opinion') || lower.includes('complaint')) return 'B1';
  if (lower.includes('travel') || lower.includes('food') || lower.includes('restaurant') || lower.includes('shopping')) return 'A2';
  return 'A1';
}

// GET /api/conversations - Lấy danh sách các tình huống hội thoại giao tiếp (Edge Cache: 10 phút)
router.get('/', edgeCache(600), async (_req: Request, res: Response) => {
  try {
    const { data: decks, error } = await supabase
      .from('decks')
      .select('id, title, slug, description, category, total_words, order_index')
      .order('order_index', { ascending: true });

    const sourceDecks = !error && decks && decks.length > 0 ? decks : initialDecks;

    const conversations: ConversationItem[] = sourceDecks.map((deck) => ({
      id: `conv-${deck.slug || deck.id}`,
      title: deck.title,
      level: getLevelForDeck(deck.category, deck.title),
      scenario: deck.description,
      deckId: deck.slug || deck.id,
      totalWords: deck.total_words,
    }));

    return sendSuccess(res, conversations, 'Lấy danh sách hội thoại thành công', 200, {
      total: conversations.length,
      fromDb: !error && !!decks && decks.length > 0,
    });
  } catch (err: any) {
    return sendError(res, err.message, 500, 'CONVERSATIONS_FETCH_ERROR');
  }
});

export default router;
