import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';
import { edgeCache } from '../middlewares/cache';
import { sanitizePostgrestParam } from '../utils/sanitize';

const router = Router();

// Mock data fallback cho collections nếu database chưa có bảng collections
const initialCollectionsFallback = [
  {
    id: 'col-1000-common',
    title: '1000 từ tiếng Anh thông dụng',
    slug: '1000-common-words',
    description: '1000 từ vựng cốt lõi thường gặp nhất trong giao tiếp đời sống',
    category: 'General',
    icon_name: 'BookOpen',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    total_phrases: 1000,
    order_index: 1,
  },
  {
    id: 'col-1000-a2',
    title: '1000 từ vựng trình độ A2',
    slug: '1000-words-a2',
    description: 'Bộ từ vựng giao tiếp chuẩn bậc A2 theo khung CEFR',
    category: 'A2',
    icon_name: 'GraduationCap',
    image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    total_phrases: 1000,
    order_index: 2,
  },
  {
    id: 'col-restaurant',
    title: 'Restaurant',
    slug: 'restaurant',
    description: 'Order, ask, and enjoy delicious meals!',
    category: 'Daily Life',
    icon_name: 'Utensils',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    total_phrases: 20,
    order_index: 3,
  },
  {
    id: 'col-travel',
    title: 'Travel & Airport',
    slug: 'travel',
    description: 'Check in, board flights, and travel smoothly!',
    category: 'Travel',
    icon_name: 'Plane',
    image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
    total_phrases: 25,
    order_index: 4,
  },
  {
    id: 'col-workplace',
    title: 'Workplace & Office',
    slug: 'workplace',
    description: 'Speak professionally in meetings and standups!',
    category: 'Business',
    icon_name: 'Briefcase',
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    total_phrases: 20,
    order_index: 5,
  },
  {
    id: 'col-shopping',
    title: 'Shopping & Malls',
    slug: 'shopping',
    description: 'Find sizes, ask for discounts, and checkout!',
    category: 'Daily Life',
    icon_name: 'ShoppingBag',
    image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80',
    total_phrases: 20,
    order_index: 6,
  },
  {
    id: 'col-hotel',
    title: 'Hotel & Accommodation',
    slug: 'hotel',
    description: 'Book rooms, ask for amenities, and check out!',
    category: 'Travel',
    icon_name: 'Sun',
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    total_phrases: 25,
    order_index: 7,
  },
  {
    id: 'col-daily-conversations',
    title: 'Daily Conversations',
    slug: 'daily-conversations',
    description: 'Small talk, greetings, and staying in touch!',
    category: 'Social',
    icon_name: 'MessageSquare',
    image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    total_phrases: 30,
    order_index: 8,
  },
];

// GET /api/collections - Lấy danh sách các bộ sưu tập
router.get('/', edgeCache(300), async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*, collection_items(count)')
      .order('order_index', { ascending: true });

    if (error || !data || data.length === 0) {
      return sendSuccess(res, initialCollectionsFallback, 'Lấy danh sách collections thành công (fallback)');
    }

    const formattedData = data.map((c: any) => ({
      ...c,
      total_phrases: c.collection_items?.[0]?.count ?? c.total_phrases ?? 0,
      collection_items: undefined,
    }));

    return sendSuccess(res, formattedData, 'Lấy danh sách collections thành công');
  } catch (err: any) {
    return sendSuccess(res, initialCollectionsFallback, 'Lấy danh sách collections thành công (fallback)');
  }
});

// GET /api/collections/:id - Lấy chi tiết collection và các từ vựng bên trong
router.get('/:id', edgeCache(300), async (req: Request, res: Response) => {
  const { id } = req.params;
  const targetSlug = id.replace(/^col-/, '');

  try {
    let query = supabase
      .from('collections')
      .select('*, collection_items(*)')
      .order('order_index', { referencedTable: 'collection_items', ascending: true });

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      const cleanId = sanitizePostgrestParam(id);
      const cleanSlug = sanitizePostgrestParam(targetSlug);
      query = query.or(`id.eq.${cleanId},slug.eq.${cleanId},slug.eq.${cleanSlug}`);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      const fallbackCol =
        initialCollectionsFallback.find((c) => c.id === id || c.slug === targetSlug) ||
        initialCollectionsFallback[0];

      return sendSuccess(
        res,
        {
          ...fallbackCol,
          items: [],
          phrases: [],
        },
        'Lấy chi tiết collection thành công (fallback)'
      );
    }

    const formattedData = {
      ...data,
      items: data.collection_items || [],
      phrases: data.collection_items || [],
    };

    return sendSuccess(res, formattedData, 'Lấy chi tiết collection thành công');
  } catch (err: any) {
    return sendError(res, `Lỗi khi tải thông tin collection: ${err.message}`, 500, 'COLLECTION_FETCH_ERROR');
  }
});

export default router;
