import { LearningItem } from '@/types/database';
import { SRSItemState } from './srs';

export type LearnMasteryLevel = 0 | 1 | 2; // 0: Chưa thuộc (Unfamiliar), 1: Đang quen (Familiar), 2: Đã thành thạo (Mastered)

export interface LearnWordProgress {
  item: LearningItem;
  level: LearnMasteryLevel;
  consecutiveCorrect: number;
  totalAttempts: number;
  mistakes: number;
}

export interface LearnQueueItem {
  id: string; // unique key for this queue step
  wordId: string;
  item: LearningItem;
  questionType: 'choice' | 'typing';
  choiceFormat?: 'en_to_vi' | 'vi_to_en' | 'listening';
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Chọn ra đúng 10 từ mục tiêu cho một phiên học (Learn Batch)
 * Lộ trình cá nhân hóa ưu tiên:
 * 1. Từ đến hạn ôn tập SRS / từ hay bị sai
 * 2. Từ mới tinh chưa học trong bộ sưu tập
 * 3. Từ đang học dở dang (chưa đạt Mastered)
 */
export function selectLearnBatch(
  allItems: LearningItem[],
  phraseStates: Record<string, SRSItemState> = {},
  batchSize = 10
): LearningItem[] {
  if (allItems.length <= batchSize) {
    return [...allItems];
  }

  const now = Date.now();
  const dueItems: LearningItem[] = [];
  const newItems: LearningItem[] = [];
  const learningItems: LearningItem[] = [];
  const masteredItems: LearningItem[] = [];

  for (const item of allItems) {
    const srs = phraseStates[item.id];
    if (!srs) {
      newItems.push(item);
    } else {
      const isDue = new Date(srs.next_review_at).getTime() <= now;
      const isMastered = srs.repetitions >= 3 || srs.interval_days >= 7;

      if (isDue) {
        dueItems.push(item);
      } else if (!isMastered) {
        learningItems.push(item);
      } else {
        masteredItems.push(item);
      }
    }
  }

  // Kết hợp theo độ ưu tiên: Due -> New -> Learning -> Mastered
  const selected: LearningItem[] = [];

  // 1. Tối đa 3-4 từ due để tránh quá tải
  const duePick = dueItems.slice(0, 4);
  selected.push(...duePick);

  // 2. Lấy từ mới cho đủ
  const remainingNeeded = batchSize - selected.length;
  if (remainingNeeded > 0) {
    const newPick = newItems.slice(0, remainingNeeded);
    selected.push(...newPick);
  }

  // 3. Nếu vẫn chưa đủ 10 từ (ví dụ đã học hết từ mới), lấy các từ đang học
  if (selected.length < batchSize) {
    const needed = batchSize - selected.length;
    const learnPick = learningItems.slice(0, needed);
    selected.push(...learnPick);
  }

  // 4. Nếu vẫn chưa đủ, lấy từ đã thuộc để củng cố
  if (selected.length < batchSize) {
    const needed = batchSize - selected.length;
    const masteredPick = masteredItems.slice(0, needed);
    selected.push(...masteredPick);
  }

  return selected;
}

/**
 * Khởi tạo trạng thái ban đầu của 10 từ trong phiên Learn
 */
export function initializeLearnWordStates(
  items: LearningItem[],
  phraseStates: Record<string, SRSItemState> = {}
): Record<string, LearnWordProgress> {
  const map: Record<string, LearnWordProgress> = {};
  for (const item of items) {
    const srs = phraseStates[item.id];
    // Nếu từ đã từng học qua trong quá khứ và có tiến độ, có thể bắt đầu ở level 1
    const initialLevel: LearnMasteryLevel = srs && srs.repetitions >= 1 ? 1 : 0;
    map[item.id] = {
      item,
      level: initialLevel,
      consecutiveCorrect: 0,
      totalAttempts: 0,
      mistakes: 0,
    };
  }
  return map;
}

/**
 * Sinh hàng đợi câu hỏi ban đầu cho lượt học
 */
export function buildInitialLearnQueue(
  items: LearningItem[],
  wordStates: Record<string, LearnWordProgress>
): LearnQueueItem[] {
  const queue: LearnQueueItem[] = [];
  const shuffledItems = shuffle(items);

  const formats: ('en_to_vi' | 'vi_to_en' | 'listening')[] = [
    'en_to_vi',
    'vi_to_en',
    'listening',
  ];

  shuffledItems.forEach((item, idx) => {
    const state = wordStates[item.id];
    const isLevel1 = state && state.level === 1;

    queue.push({
      id: `${item.id}-init-${Date.now()}-${idx}`,
      wordId: item.id,
      item,
      // Từ mới (Level 0) -> Trắc nghiệm, Từ Level 1 -> Gõ từ
      questionType: isLevel1 ? 'typing' : 'choice',
      choiceFormat: formats[idx % formats.length],
    });
  });

  return queue;
}

/**
 * Xử lý kết quả trả lời trong Chế độ Học (Learn):
 * - Nếu ĐÚNG:
 *   + Level 0 -> Lên Level 1: Lên lịch cho câu hỏi Gõ từ tiếng Anh (Typing) xuất hiện sau vài câu nữa
 *   + Level 1 -> Lên Level 2 (Mastered!): Đạt thành thạo, hoàn thành từ này
 * - Nếu SAI:
 *   + KHÔNG cộng tiến độ
 *   + Hạ cấp hoặc giữ nguyên ở Level 0
 *   + Tự động chèn từ đó vào hàng đợi sau 2-3 câu hỏi để ôn tập lại (Dynamic Retry Queue)
 */
export function processLearnAnswer(params: {
  currentQueue: LearnQueueItem[];
  currentIndex: number;
  wordStates: Record<string, LearnWordProgress>;
  wordId: string;
  isCorrect: boolean;
}): {
  updatedQueue: LearnQueueItem[];
  updatedWordStates: Record<string, LearnWordProgress>;
  newMastered: boolean;
} {
  const { currentQueue, currentIndex, wordStates, wordId, isCorrect } = params;
  const currentProgress = wordStates[wordId];
  if (!currentProgress) {
    return {
      updatedQueue: currentQueue,
      updatedWordStates: wordStates,
      newMastered: false,
    };
  }

  const newWordStates = { ...wordStates };
  const updatedProgress = { ...currentProgress };
  updatedProgress.totalAttempts += 1;

  let newMastered = false;
  const updatedQueue = [...currentQueue];

  if (isCorrect) {
    updatedProgress.consecutiveCorrect += 1;

    if (updatedProgress.level === 0) {
      // Từ mới trả lời đúng trắc nghiệm -> Thăng cấp 1 (Familiar)
      updatedProgress.level = 1;
      // Chèn thử thách Gõ từ vào sau 2-3 câu hỏi để kiểm tra phản xạ chính tả
      const insertIndex = Math.min(updatedQueue.length, currentIndex + 3);
      const nextChallenge: LearnQueueItem = {
        id: `${wordId}-level1-${Date.now()}`,
        wordId,
        item: updatedProgress.item,
        questionType: 'typing',
      };
      updatedQueue.splice(insertIndex, 0, nextChallenge);
    } else if (updatedProgress.level === 1) {
      // Đã gõ đúng từ tiếng Anh -> Thăng cấp 2 (Mastered!)
      updatedProgress.level = 2;
      newMastered = true;
    }
  } else {
    // Trả lời SAI: Không tăng tiến độ, tăng số lần sai
    updatedProgress.mistakes += 1;
    updatedProgress.consecutiveCorrect = 0;
    // Bị rớt về Level 0 để rèn lại trắc nghiệm
    updatedProgress.level = 0;

    // Chèn lại vào hàng đợi sau 2 câu (hoặc cuối hàng đợi) để gặp lại trong cùng phiên
    const retryIndex = Math.min(updatedQueue.length, currentIndex + 3);
    const retryChallenge: LearnQueueItem = {
      id: `${wordId}-retry-${Date.now()}`,
      wordId,
      item: updatedProgress.item,
      questionType: 'choice',
      choiceFormat: 'en_to_vi',
    };
    updatedQueue.splice(retryIndex, 0, retryChallenge);
  }

  newWordStates[wordId] = updatedProgress;

  return {
    updatedQueue,
    updatedWordStates: newWordStates,
    newMastered,
  };
}

/**
 * Kiểm tra xem toàn bộ 10 từ đã đạt trạng thái Mastered (Level 2) hay chưa
 */
export function isLearnBatchComplete(wordStates: Record<string, LearnWordProgress>): boolean {
  const values = Object.values(wordStates);
  if (values.length === 0) return false;
  return values.every((state) => state.level === 2);
}
