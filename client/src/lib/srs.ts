import { LearningItem } from '@/types/database';

export interface SRSItemState {
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  next_review_at: string;
  last_quality: number;
}

/**
 * SuperMemo SM-2 algorithm implementation
 * @param grade 0 (Quên), 1 (Mơ hồ), 2 (Nhớ), 3 (Rất dễ)
 * @param current current state of repetitions, interval, and ease factor
 */
export function calculateSM2(
  grade: 0 | 1 | 2 | 3,
  current: { repetitions: number; interval_days: number; ease_factor: number }
): SRSItemState {
  let { repetitions, interval_days, ease_factor } = current;

  // If grade < 2 (quên hoặc mơ hồ): reset repetitions
  if (grade < 2) {
    repetitions = 0;
    interval_days = 1;
  } else {
    // Correct response
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 3;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
  }

  // Update ease factor: standard SM-2 formula mapped from 0-3 grade
  // Map 0-3 to 0-5 scale: 0->1, 1->3, 2->4, 3->5
  const qMap: Record<number, number> = { 0: 1, 1: 3, 2: 4, 3: 5 };
  const q = qMap[grade] ?? 3;
  ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ease_factor < 1.3) {
    ease_factor = 1.3;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval_days);

  return {
    repetitions,
    interval_days,
    ease_factor: Number(ease_factor.toFixed(2)),
    next_review_at: nextDate.toISOString(),
    last_quality: grade,
  };
}

/**
 * Kiểm tra xem một thẻ từ đã đến hạn ôn tập SRS hay chưa
 */
export function isItemDue(review?: SRSItemState, now = new Date()): boolean {
  if (!review) return false;
  return new Date(review.next_review_at).getTime() <= now.getTime();
}

/**
 * Kiểm tra xem một từ đã đạt chuẩn "Đã thuộc" (Mastered) hay chưa
 * Điều kiện: Đúng liên tiếp >= 3 lần HOẶC khoảng cách ôn tập >= 7 ngày
 */
export function isItemMastered(review?: SRSItemState): boolean {
  if (!review) return false;
  return review.repetitions >= 3 || review.interval_days >= 7;
}

export interface DeckSRSCategorization {
  newItems: LearningItem[];
  dueItems: LearningItem[];
  learningItems: LearningItem[];
  masteredItems: LearningItem[];
}

/**
 * Phân loại từ vựng trong bộ sưu tập thành 4 nhóm theo chu trình SRS
 */
export function categorizeDeckItems(
  items: LearningItem[],
  reviews: Record<string, SRSItemState>,
  now = new Date()
): DeckSRSCategorization {
  const newItems: LearningItem[] = [];
  const dueItems: LearningItem[] = [];
  const learningItems: LearningItem[] = [];
  const masteredItems: LearningItem[] = [];

  for (const item of items) {
    const review = reviews[item.id];
    if (!review) {
      newItems.push(item);
    } else if (isItemDue(review, now)) {
      dueItems.push(item);
    } else if (isItemMastered(review)) {
      masteredItems.push(item);
    } else {
      learningItems.push(item);
    }
  }

  return { newItems, dueItems, learningItems, masteredItems };
}
