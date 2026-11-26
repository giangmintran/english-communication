import { LearningItem } from '@/types/database';
import { DailyReviewProgress, DailyWordReason } from '@/types/quiz';
import { isItemDueByDay, isItemMastered, SRSItemState } from './srs';

export interface SelectedDailyWordsResult {
  words: LearningItem[];
  reasons: Record<string, DailyWordReason>;
  stats: {
    reviewCount: number;
    newCount: number;
  };
}

export interface SelectDailyWordsCoreInput {
  dateStr: string;
  targetCount: number;
  sourceItems: LearningItem[];
  reviews: Record<string, SRSItemState>;
  dailyReviewProgress: Record<string, DailyReviewProgress>;
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

function inferReasonFromReview(review?: SRSItemState): DailyWordReason {
  if (!review) return 'new';
  if (review.last_quality === 0) return 'forgot';
  if (review.last_quality === 1) return 'hard';
  return 'due';
}

function compareDueUrgency(
  a: LearningItem,
  b: LearningItem,
  reviews: Record<string, SRSItemState>
): number {
  const ra = reviews[a.id];
  const rb = reviews[b.id];
  if (!ra && !rb) return 0;
  if (!ra) return 1;
  if (!rb) return -1;

  const timeA = ra.next_review_at ? new Date(ra.next_review_at).getTime() : 0;
  const timeB = rb.next_review_at ? new Date(rb.next_review_at).getTime() : 0;
  if (timeA !== timeB) return timeA - timeB;

  if (ra.ease_factor !== rb.ease_factor) return ra.ease_factor - rb.ease_factor;
  return ra.repetitions - rb.repetitions;
}

/**
 * Hàm lõi thuần túy chọn từ hàng ngày dựa trên mức độ nhớ (SRS):
 * 1. Nếu hôm nay đã bắt đầu làm bài / đánh giá flashcard và không forceNew: giữ nguyên danh sách từ đã khóa.
 * 2. Ưu tiên từ đến hạn theo thứ tự: Quên (0) -> Mơ hồ (1) -> Đến hạn SM-2 (2/3).
 * 3. Áp dụng tỷ lệ trộn tối đa 70% suất cho từ cần ôn + tối thiểu 30% từ mới (nếu kho từ mới còn).
 * 4. Nếu từ mới ít hơn số suất còn lại, dùng tiếp từ cần ôn còn dư rồi mới tới từ đang học / đã thuộc.
 */
export function selectDailyWordsCore({
  dateStr,
  targetCount,
  sourceItems,
  reviews,
  dailyReviewProgress,
  forceNew = false,
}: SelectDailyWordsCoreInput): SelectedDailyWordsResult {
  if (!sourceItems || sourceItems.length === 0) {
    return { words: [], reasons: {}, stats: { reviewCount: 0, newCount: 0 } };
  }

  const effectiveTarget = Math.max(1, Math.min(targetCount, sourceItems.length));
  const itemMap = new Map<string, LearningItem>();
  sourceItems.forEach((item) => itemMap.set(item.id, item));

  const reasons: Record<string, DailyWordReason> = {};
  const picked: LearningItem[] = [];
  const pickedIds = new Set<string>();

  // 1. Giữ danh sách từ hôm nay nếu phiên học đã thực sự bắt đầu (đã trả lời hoặc đánh giá flashcard)
  const todayProgress = dailyReviewProgress[dateStr];
  const hasActiveProgressToday = Boolean(
    todayProgress &&
      (todayProgress.answeredCount > 0 ||
        todayProgress.isCompleted ||
        (todayProgress.flashcardGrades && Object.keys(todayProgress.flashcardGrades).length > 0))
  );

  if (!forceNew && hasActiveProgressToday && todayProgress?.wordIds?.length) {
    for (const id of todayProgress.wordIds) {
      if (picked.length >= effectiveTarget) break;
      const item = itemMap.get(id);
      if (item && !pickedIds.has(item.id)) {
        picked.push(item);
        pickedIds.add(item.id);
        reasons[item.id] = todayProgress.wordReasons?.[item.id] || inferReasonFromReview(reviews[item.id]);
      }
    }

    if (picked.length >= effectiveTarget) {
      const reviewCount = picked.filter((w) => reasons[w.id] !== 'new').length;
      return {
        words: picked.slice(0, effectiveTarget),
        reasons,
        stats: { reviewCount, newCount: picked.length - reviewCount },
      };
    }
  }

  // 2. Tập ID các từ đã từng xuất hiện ở Daily ở các ngày trước (để phân biệt từ mới tinh vs từ cũ)
  const seenInPastDaily = new Set<string>(Object.keys(reviews || {}));
  Object.entries(dailyReviewProgress || {}).forEach(([d, prog]) => {
    if (d !== dateStr && prog?.wordIds) {
      prog.wordIds.forEach((id) => seenInPastDaily.add(id));
    }
  });

  // 3. Phân nhóm các từ còn lại theo trạng thái SRS
  const forgotDue: LearningItem[] = [];
  const hardDue: LearningItem[] = [];
  const scheduledDue: LearningItem[] = [];
  const unlearnedNew: LearningItem[] = [];
  const learningBackup: LearningItem[] = [];
  const masteredBackup: LearningItem[] = [];

  for (const item of sourceItems) {
    if (pickedIds.has(item.id)) continue;

    const rev = reviews[item.id];
    if (rev) {
      if (isItemDueByDay(rev, dateStr)) {
        if (rev.last_quality === 0) {
          forgotDue.push(item);
        } else if (rev.last_quality === 1) {
          hardDue.push(item);
        } else {
          scheduledDue.push(item);
        }
      } else if (!isItemMastered(rev)) {
        learningBackup.push(item);
      } else {
        masteredBackup.push(item);
      }
    } else if (!seenInPastDaily.has(item.id)) {
      unlearnedNew.push(item);
    } else {
      learningBackup.push(item);
    }
  }

  forgotDue.sort((a, b) => compareDueUrgency(a, b, reviews));
  hardDue.sort((a, b) => compareDueUrgency(a, b, reviews));
  scheduledDue.sort((a, b) => compareDueUrgency(a, b, reviews));

  const dueQueue: Array<{ item: LearningItem; reason: DailyWordReason }> = [
    ...forgotDue.map((item) => ({ item, reason: 'forgot' as const })),
    ...hardDue.map((item) => ({ item, reason: 'hard' as const })),
    ...scheduledDue.map((item) => ({ item, reason: 'due' as const })),
  ];

  const shuffledNew = shuffleArray(unlearnedNew);
  const shuffledLearning = shuffleArray(learningBackup);
  const shuffledMastered = shuffleArray(masteredBackup);

  const remainingSlots = effectiveTarget - picked.length;
  // Tỷ lệ: tối đa 70% suất từ cần ôn + tối thiểu 30% từ mới (nếu kho từ mới vẫn còn)
  const maxReviewSlots =
    shuffledNew.length > 0 ? Math.floor(remainingSlots * 0.7) : remainingSlots;

  const selectedDueCount = Math.min(dueQueue.length, maxReviewSlots);
  for (let i = 0; i < selectedDueCount; i++) {
    const { item, reason } = dueQueue[i];
    picked.push(item);
    pickedIds.add(item.id);
    reasons[item.id] = reason;
  }

  // Bổ sung từ mới vào phần suất còn lại
  for (const item of shuffledNew) {
    if (picked.length >= effectiveTarget) break;
    if (!pickedIds.has(item.id)) {
      picked.push(item);
      pickedIds.add(item.id);
      reasons[item.id] = 'new';
    }
  }

  // Nếu từ mới đã hết mà vẫn chưa đủ target, dùng tiếp các từ cần ôn bị dư khỏi cap 70%
  for (let i = selectedDueCount; i < dueQueue.length && picked.length < effectiveTarget; i++) {
    const { item, reason } = dueQueue[i];
    if (!pickedIds.has(item.id)) {
      picked.push(item);
      pickedIds.add(item.id);
      reasons[item.id] = reason;
    }
  }

  // Dự phòng cuối cùng nếu cả từ cần ôn và từ mới đều không đủ
  for (const item of [...shuffledLearning, ...shuffledMastered]) {
    if (picked.length >= effectiveTarget) break;
    if (!pickedIds.has(item.id)) {
      picked.push(item);
      pickedIds.add(item.id);
      reasons[item.id] = 'reinforce';
    }
  }

  const finalWords = picked.slice(0, effectiveTarget);
  const reviewCount = finalWords.filter((w) => reasons[w.id] !== 'new').length;
  return {
    words: finalWords,
    reasons,
    stats: {
      reviewCount,
      newCount: finalWords.length - reviewCount,
    },
  };
}
