import { LearningItem } from '@/types/database';
import { useLearningStore } from '@/lib/store';
import { supabase } from '@/lib/supabaseClient';
import { sampleCollectionItems } from '@/data/mockData';
import dailyItemsJson from '@/data/dailyItems.json';
import { getLocalDateStr } from '@/lib/srs';
import {
  selectDailyWordsCore,
  SelectedDailyWordsResult,
  SelectDailyWordsCoreInput,
  shuffleArray,
} from '@/lib/dailyWordSelectorCore';

export type { SelectedDailyWordsResult, SelectDailyWordsCoreInput };
export { selectDailyWordsCore, shuffleArray };

export interface SelectDailyWordsOptions {
  dateStr?: string;
  targetCount: number;
  sourceItems: LearningItem[];
  user?: any;
  forceNew?: boolean;
}

/**
 * Tải toàn bộ kho từ vựng từ bảng `collection_items` trên database Supabase
 * Tự động fallback sang tổng hợp tất cả collection items nội bộ và dailyItemsJson nếu offline hoặc lỗi mạng.
 */
export async function loadDailyWordsFromCollectionItems(): Promise<LearningItem[]> {
  try {
    const { data, error } = await supabase
      .from('collection_items')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        deck_id: item.collection_id || 'collection',
        type: item.type || 'phrase',
        english_text: item.english_text,
        phonetic_ipa: item.phonetic_ipa || '',
        vietnamese_meaning: item.vietnamese_meaning || '',
        example_sentence: item.example_sentence || '',
        example_meaning: item.example_meaning || '',
        audio_url: item.audio_url || undefined,
        difficulty_level: item.difficulty_level || 'A2',
        details: item.details || undefined,
      }));
    }
  } catch (err) {
    console.warn('Lỗi khi tải từ bảng collection_items từ Supabase:', err);
  }

  // Fallback 1: Gộp tất cả các từ trong sampleCollectionItems
  const allColItems = Object.values(sampleCollectionItems).flat();
  if (allColItems && allColItems.length > 0) {
    const uniqueMap = new Map<string, LearningItem>();
    allColItems.forEach((item) => {
      uniqueMap.set(item.id, {
        id: item.id,
        deck_id: item.collection_id || 'collection',
        type: item.type || 'phrase',
        english_text: item.english_text,
        phonetic_ipa: item.phonetic_ipa,
        vietnamese_meaning: item.vietnamese_meaning,
        example_sentence: item.example_sentence,
        example_meaning: item.example_meaning,
        audio_url: item.audio_url,
        difficulty_level: item.difficulty_level || 'A2',
      });
    });

    (dailyItemsJson as LearningItem[]).forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    return Array.from(uniqueMap.values());
  }

  return dailyItemsJson as LearningItem[];
}

/**
 * Chọn từ vựng hàng ngày kèm thông tin lý do (Quên, Mơ hồ, Đến hạn, Từ mới)
 */
export function selectDailyWordsWithReasons({
  dateStr = getLocalDateStr(),
  targetCount,
  sourceItems,
  forceNew = false,
}: SelectDailyWordsOptions): SelectedDailyWordsResult {
  const store = useLearningStore.getState();
  return selectDailyWordsCore({
    dateStr,
    targetCount,
    sourceItems,
    reviews: store.reviews || {},
    dailyReviewProgress: store.dailyReviewProgress || {},
    forceNew,
  });
}

/**
 * Thuật toán chọn từ hàng ngày dựa trên mức độ nhớ của từng từ trong kho `collection_items`
 */
export function selectDailyWords(options: SelectDailyWordsOptions): LearningItem[] {
  return selectDailyWordsWithReasons(options).words;
}
