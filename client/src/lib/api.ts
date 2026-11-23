import { supabase } from './supabaseClient';
import {
  Deck,
  DeckWithItems,
  SpeakingItem,
  DictionaryItem,
  ConversationItem,
  LeaderboardEntry,
  Profile,
  ReviewRecord,
  Collection,
  CollectionItem,
} from '@/types/database';
import { initialDecks, sampleLearningItems, initialCollections, sampleCollectionItems } from '@/data/mockData';
import { DailyReviewProgress } from '@/types/quiz';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Hàm gọi API chung tự động xử lý base URL và unwrap dữ liệu chuẩn
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackData?: T
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      if (fallbackData !== undefined) return fallbackData;
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as ApiResponse<T>;
    if (json && json.success && json.data !== undefined) {
      return json.data;
    }

    // Tương thích nếu backend trả về thẳng data (không qua wrapper)
    return (json as unknown as T) || (fallbackData as T);
  } catch (err) {
    if (fallbackData !== undefined) {
      console.warn(`[API] Fallback for ${endpoint}:`, err);
      return fallbackData;
    }
    throw err;
  }
}

/**
 * Hàm gọi API có kèm token xác thực Supabase Bearer Token
 */
export async function requestWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success) {
    const errMsg = json?.error?.message || `API error: ${res.status}`;
    throw new Error(errMsg);
  }

  return json.data;
}

/**
 * Bộ SDK gọi API chuẩn cho toàn bộ ứng dụng SpeakUp
 */
export const api = {
  // Bộ thẻ chủ đề (Dành riêng cho Daily Lesson)
  decks: {
    getAll: async (): Promise<Deck[]> => {
      return request<Deck[]>('/decks', {}, initialDecks);
    },
    getById: async (id: string): Promise<DeckWithItems> => {
      const isDaily = id === 'daily' || id === 'deck-daily';
      const targetSlug = isDaily ? 'daily' : id.replace(/^deck-/, '');
      const fallbackDeck =
        initialDecks.find((d) => d.id === id || d.slug === targetSlug) || initialDecks[0];
      const fallbackItems =
        (id && sampleLearningItems[id]) ||
        sampleLearningItems[fallbackDeck.id] ||
        [];

      const defaultDeckWithItems: DeckWithItems = {
        ...fallbackDeck,
        flashcards: fallbackItems,
      };

      return request<DeckWithItems>(`/decks/${id}`, {}, defaultDeckWithItems);
    },
  },

  // Bộ sưu tập chuyên đề (Hoàn toàn độc lập với decks/items của Daily Lesson)
  collections: {
    getAll: async (): Promise<Collection[]> => {
      // 1. Thử gọi backend API
      try {
        const res = await request<Collection[]>('/collections');
        if (res && res.length > 0) return res;
      } catch (_) {}

      // 2. Nếu backend không khả dụng, lấy trực tiếp từ database Supabase với số lượng từ thực tế
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('*, collection_items(count)')
          .order('order_index', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((c: any) => ({
            ...c,
            total_phrases: c.collection_items?.[0]?.count ?? c.total_phrases ?? 0,
          }));
        }
      } catch (_) {}

      // 3. Fallback cuối cùng nếu offline hoàn toàn
      return initialCollections;
    },
    getById: async (idOrSlug: string): Promise<Collection & { items: CollectionItem[] }> => {
      // 1. Thử gọi backend API
      try {
        const res = await request<Collection & { items: CollectionItem[] }>(`/collections/${idOrSlug}`);
        if (res && (res.items || res.phrases)) return res;
      } catch (_) {}

      // 2. Thử lấy trực tiếp từ database Supabase
      try {
        const cleanKey = idOrSlug.replace(/^col-/, '');
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        let query = supabase
          .from('collections')
          .select('*, collection_items(*)')
          .order('order_index', { referencedTable: 'collection_items', ascending: true });

        if (isUuid) {
          query = query.eq('id', idOrSlug);
        } else {
          query = query.or(`id.eq.${idOrSlug},slug.eq.${idOrSlug},slug.eq.${cleanKey}`);
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          return {
            ...data,
            items: data.collection_items || [],
            phrases: data.collection_items || [],
          };
        }
      } catch (_) {}

      // 3. Fallback cuối cùng nếu offline
      const cleanKey = idOrSlug.replace(/^col-/, '');
      const fallbackCol =
        initialCollections.find((c) => c.id === idOrSlug || c.slug === cleanKey || c.id === `col-${cleanKey}`) ||
        initialCollections[0];

      const phrases =
        sampleCollectionItems[idOrSlug] ||
        sampleCollectionItems[fallbackCol.id] ||
        sampleCollectionItems[fallbackCol.slug] ||
        [];

      const defaultCollectionWithItems = {
        ...fallbackCol,
        items: phrases,
        phrases: phrases,
      };

      return defaultCollectionWithItems;
    },
  },

  // Luyện nói (Speaking)
  speaking: {
    getItems: async (limit = 50, level?: string): Promise<SpeakingItem[]> => {
      const query = new URLSearchParams();
      if (limit) query.set('limit', limit.toString());
      if (level) query.set('level', level);

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

      return request<SpeakingItem[]>(`/speaking?${query.toString()}`, {}, fallbackList);
    },
  },

  // Từ điển AI (Dictionary)
  dictionary: {
    search: async (q = '', limit = 30): Promise<DictionaryItem[]> => {
      const query = new URLSearchParams();
      if (q) query.set('q', q);
      if (limit) query.set('limit', limit.toString());

      return request<DictionaryItem[]>(`/dictionary?${query.toString()}`, {}, []);
    },
  },

  // Hội thoại giao tiếp (Conversations)
  conversations: {
    getAll: async (): Promise<ConversationItem[]> => {
      const defaultConversations: ConversationItem[] = initialDecks.map((deck) => ({
        id: `conv-${deck.slug || deck.id}`,
        title: deck.title,
        level: 'A2',
        scenario: deck.description,
        deckId: deck.slug || deck.id,
        totalWords: deck.total_words,
      }));

      return request<ConversationItem[]>('/conversations', {}, defaultConversations);
    },
  },

  // Bảng xếp hạng (Leaderboard)
  leaderboard: {
    get: async (): Promise<LeaderboardEntry[]> => {
      return request<LeaderboardEntry[]>('/leaderboard', {}, []);
    },
  },

  // Hồ sơ & Cài đặt (Profile)
  profile: {
    getMe: async (): Promise<Profile> => {
      return requestWithAuth<Profile>('/profile/me');
    },
    updateMe: async (data: Partial<Profile>): Promise<Profile> => {
      return requestWithAuth<Profile>('/profile/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },

  // Tiến độ học (Progress SM-2)
  progress: {
    get: async (): Promise<ReviewRecord[]> => {
      return requestWithAuth<ReviewRecord[]>('/progress');
    },
    record: async (record: {
      itemId: string;
      repetitions: number;
      intervalDays: number;
      easeFactor: number;
      nextReviewAt: string;
      lastQuality: number;
    }) => {
      return requestWithAuth('/progress/record', {
        method: 'POST',
        body: JSON.stringify(record),
      });
    },

    // Lấy tiến trình ôn tập 20 từ (60 câu)
    getDailyReview: async (dateStr?: string): Promise<DailyReviewProgress | null> => {
      const targetDate = dateStr || new Date().toISOString().split('T')[0];
      try {
        return await requestWithAuth<DailyReviewProgress | null>(
          `/progress/daily-review?date=${targetDate}`
        );
      } catch {
        return null;
      }
    },

    // Lấy toàn bộ lịch sử ôn tập gần đây từ server
    getAllDailyReviews: async (): Promise<DailyReviewProgress[]> => {
      try {
        const res = await requestWithAuth<DailyReviewProgress[]>(
          '/progress/daily-review?all=true'
        );
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },

    // Lưu tiến trình ôn tập lên server
    saveDailyReview: async (progress: DailyReviewProgress): Promise<DailyReviewProgress> => {
      return requestWithAuth<DailyReviewProgress>('/progress/daily-review', {
        method: 'POST',
        body: JSON.stringify({ progress }),
      });
    },

    // Gộp tiến trình từ client lên server khi đăng nhập
    mergeDailyReview: async (clientProgress: DailyReviewProgress): Promise<DailyReviewProgress> => {
      return requestWithAuth<DailyReviewProgress>('/progress/daily-review/merge', {
        method: 'POST',
        body: JSON.stringify({ clientProgress }),
      });
    },

    // Đặt lại / làm lại bài tập
    resetDailyReview: async (dateStr?: string): Promise<void> => {
      const targetDate = dateStr || new Date().toISOString().split('T')[0];
      try {
        await requestWithAuth(`/progress/daily-review?date=${targetDate}`, {
          method: 'DELETE',
        });
      } catch (_) {}
    },

    // Lưu kết quả bài học Daily Lesson 7 bước
    saveDailyLesson: async (payload: {
      date: string;
      lessonId: string;
      collectionId: string;
      sprintDay: number;
      wordIds: string[];
      score: number;
      totalQuestions: number;
      completed: boolean;
    }) => {
      try {
        return await requestWithAuth('/progress/daily-lesson', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Could not save daily lesson to server:', err);
        return null;
      }
    },

    // Lấy lịch sử học các ngày
    getDailyHistory: async () => {
      try {
        return await requestWithAuth<any[]>('/progress/history');
      } catch {
        return [];
      }
    },
  },
};
