import { LearningItem } from '@/types/database';
import { useLearningStore } from '@/lib/store';
import { supabase } from '@/lib/supabaseClient';
import { sampleCollectionItems } from '@/data/mockData';
import dailyItemsJson from '@/data/dailyItems.json';

export interface SelectDailyWordsOptions {
  dateStr?: string;
  targetCount: number;
  sourceItems: LearningItem[];
  user?: any;
  forceNew?: boolean;
}

/**
 * Hàm xáo trộn mảng ngẫu nhiên theo thuật toán Fisher-Yates Shuffle
 */
export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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

    // Bổ sung thêm từ dailyItemsJson nếu cần thêm kho từ
    (dailyItemsJson as LearningItem[]).forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    return Array.from(uniqueMap.values());
  }

  // Fallback 2: JSON dự phòng
  return dailyItemsJson as LearningItem[];
}

/**
 * Thuật toán chọn RANDOM số lượng từ trong cài đặt từ kho `collection_items`:
 * 1. Nếu ngày hôm nay ĐÃ CÓ phiên học lưu trong store và không forceNew: giữ nguyên để tránh bị nhảy từ khi F5.
 * 2. Lấy danh sách từ chưa từng học trong Daily ở các ngày trước (riêng biệt, không đụng tới collection).
 * 3. Dùng Fisher-Yates shuffle để bốc RANDOM đúng targetCount từ (ví dụ: 5, 10, 15, 20 từ theo cài đặt).
 * 4. Nếu kho từ chưa học ít hơn targetCount, bù thêm các từ ngẫu nhiên khác từ kho từ.
 */
export function selectDailyWords({
  dateStr = new Date().toISOString().split('T')[0],
  targetCount,
  sourceItems,
  forceNew = false,
}: SelectDailyWordsOptions): LearningItem[] {
  if (!sourceItems || sourceItems.length === 0) return [];

  const store = useLearningStore.getState();
  const effectiveTarget = Math.max(1, Math.min(targetCount, sourceItems.length));

  // 1. Nếu ngày hôm nay ĐÃ CÓ session được lưu với wordIds (và không yêu cầu forceNew):
  // Giữ nguyên chính xác danh sách đó để trải nghiệm học trong ngày nhất quán
  const todayProgress = store.dailyReviewProgress[dateStr];
  if (!forceNew && todayProgress?.wordIds && todayProgress.wordIds.length > 0) {
    const itemMap = new Map<string, LearningItem>();
    sourceItems.forEach((item) => itemMap.set(item.id, item));
    const matched = todayProgress.wordIds
      .map((id) => itemMap.get(id))
      .filter(Boolean) as LearningItem[];

    if (matched.length >= effectiveTarget) {
      return matched.slice(0, effectiveTarget);
    } else if (matched.length > 0) {
      // Nếu số từ trong cài đặt tăng lên: giữ lại các từ cũ và bốc random thêm từ mới cho đủ target
      const matchedIds = new Set(matched.map((m) => m.id));
      const remainingPool = shuffleArray(sourceItems.filter((item) => !matchedIds.has(item.id)));
      const needed = effectiveTarget - matched.length;
      return [...matched, ...remainingPool.slice(0, needed)];
    }
  }

  // 2. Thu thập danh sách ID các từ đã học ở các ngày TRƯỚC của Daily Routine
  // LƯU Ý: Phần mục tiêu học Daily hoàn toàn RIÊNG BIỆT với tiến độ của Collection (không lấy từ collectionReviews)
  const learnedDailyWordIds = new Set<string>();

  // A. Từ reviews (SRS của riêng Daily)
  Object.keys(store.reviews || {}).forEach((id) => learnedDailyWordIds.add(id));

  // B. Từ các ngày trước trong dailyReviewProgress
  Object.entries(store.dailyReviewProgress || {}).forEach(([d, prog]) => {
    if (d !== dateStr && prog?.wordIds) {
      prog.wordIds.forEach((id) => learnedDailyWordIds.add(id));
    }
  });

  // 3. Lọc danh sách từ vựng chưa học
  const unlearnedWords = sourceItems.filter((item) => !learnedDailyWordIds.has(item.id));

  // 4. Bốc RANDOM bằng Fisher-Yates Shuffle
  const shuffledUnlearned = shuffleArray(unlearnedWords);

  if (shuffledUnlearned.length >= effectiveTarget) {
    return shuffledUnlearned.slice(0, effectiveTarget);
  }

  // 5. Nếu kho từ chưa học còn ít hơn targetCount:
  // Lấy toàn bộ từ chưa học + bốc ngẫu nhiên thêm các từ khác trong kho để đủ số lượng cài đặt
  const candidates: LearningItem[] = [...shuffledUnlearned];
  const remainingNeeded = effectiveTarget - candidates.length;
  const candidateIds = new Set(candidates.map((c) => c.id));
  const otherItems = shuffleArray(sourceItems.filter((item) => !candidateIds.has(item.id)));

  candidates.push(...otherItems.slice(0, remainingNeeded));
  return candidates.slice(0, effectiveTarget);
}
