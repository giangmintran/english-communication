import { LearningItem, ReviewGrade } from '@/types/database';

export interface SRSItemState {
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  next_review_at: string;
  last_quality: number;
}

/**
 * Lấy chuỗi ngày YYYY-MM-DD theo múi giờ địa phương của thiết bị
 */
export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * SuperMemo SM-2 algorithm implementation
 * @param grade 0 (Quên), 1 (Mơ hồ), 2 (Nhớ), 3 (Rất dễ)
 * @param current current state of repetitions, interval, and ease factor
 */
export function calculateSM2(
  grade: 0 | 1 | 2 | 3,
  current: { repetitions: number; interval_days: number; ease_factor: number },
  now: Date = new Date()
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

  const nextDate = new Date(now.getTime());
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
 * Tổng hợp grade cuối phiên cho 1 từ dựa trên đánh giá Flashcard (nếu có) và kết quả bài tập 3 câu.
 * Quy tắc:
 * - Nếu ở Flashcard đã bấm Quên (0) hoặc Mơ hồ (1): dù trả lời đúng cả 3 câu bài tập cùng phiên
 *   vẫn giữ trần tối đa là Mơ hồ (1) để ngày mai từ yếu tiếp tục xuất hiện lại.
 * - Nếu trả lời sai >= 2/3 câu (hoặc 0 câu đúng) -> Quên (0); sai 1/3 câu -> Mơ hồ (1).
 */
export function computeEffectiveDailyGrade(params: {
  flashcardGrade?: ReviewGrade;
  totalQuestions: number;
  correctCount: number;
}): ReviewGrade {
  const { flashcardGrade, totalQuestions, correctCount } = params;

  let quizGrade: ReviewGrade;
  if (totalQuestions <= 0) {
    quizGrade = flashcardGrade ?? 2;
  } else if (correctCount >= totalQuestions) {
    quizGrade = flashcardGrade === 2 ? 2 : 3;
  } else if (correctCount > Math.floor(totalQuestions / 3)) {
    quizGrade = 1;
  } else {
    quizGrade = 0;
  }

  if (flashcardGrade !== undefined && flashcardGrade < 2) {
    return quizGrade === 0 ? 0 : 1;
  }

  return quizGrade;
}

/**
 * Tổng hợp cập nhật SM-2 cho từng từ từ kết quả bài tập và đánh giá Flashcard (dựa trên baseline trước phiên)
 */
export function computeDailySrsBatchFromResults(params: {
  results: Record<string, { isCorrect: boolean; question?: { wordId?: string }; wordId?: string }>;
  flashcardGrades?: Record<string, ReviewGrade>;
  baselineReviews: Record<string, SRSItemState>;
  now?: Date;
}): Record<string, SRSItemState> {
  const { results, flashcardGrades = {}, baselineReviews, now = new Date() } = params;
  const wordStats: Record<string, { total: number; correct: number }> = {};

  Object.values(results || {}).forEach((r) => {
    const wordId = r.question?.wordId || r.wordId;
    if (!wordId) return;
    if (!wordStats[wordId]) wordStats[wordId] = { total: 0, correct: 0 };
    wordStats[wordId].total += 1;
    if (r.isCorrect) wordStats[wordId].correct += 1;
  });

  const updates: Record<string, SRSItemState> = {};
  Object.entries(wordStats).forEach(([wordId, stat]) => {
    const effectiveGrade = computeEffectiveDailyGrade({
      flashcardGrade: flashcardGrades[wordId],
      totalQuestions: stat.total,
      correctCount: stat.correct,
    });
    const base = baselineReviews[wordId] || {
      repetitions: 0,
      interval_days: 1,
      ease_factor: 2.5,
      next_review_at: now.toISOString(),
      last_quality: 0,
    };
    updates[wordId] = calculateSM2(effectiveGrade, base, now);
  });

  return updates;
}

/**
 * Kiểm tra xem một thẻ từ đã đến hạn ôn tập SRS hay chưa (theo ngày lịch địa phương YYYY-MM-DD)
 * Tránh trường hợp học lúc 21:00 hôm qua nhưng 08:00 sáng hôm sau chưa đủ 24h nên không thấy từ cần ôn.
 */
export function isItemDueByDay(
  review?: SRSItemState,
  todayStr: string = getLocalDateStr()
): boolean {
  if (!review) return false;
  if (!review.next_review_at) return true;
  const parsed = new Date(review.next_review_at);
  if (Number.isNaN(parsed.getTime())) return true;
  return getLocalDateStr(parsed) <= todayStr;
}

/**
 * Kiểm tra xem một thẻ từ đã đến hạn ôn tập SRS hay chưa
 */
export function isItemDue(review?: SRSItemState, now = new Date()): boolean {
  return isItemDueByDay(review, getLocalDateStr(now));
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
