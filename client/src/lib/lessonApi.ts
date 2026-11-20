import { DailyLesson, DailyLessonContent } from '@/types/database';
import { allDailyLessons, getLessonContentById } from '@/data/lessons';
import {
  getOrGenerateTodayDailyLesson,
  getGeneratedDailyLessonById,
  DailyLessonGeneratorOptions,
} from '@/lib/dailyLessonGenerator';

export const lessonApi = {
  /**
   * Lấy tất cả bài học trong toàn hệ thống
   */
  getAll: async (): Promise<DailyLesson[]> => {
    return allDailyLessons;
  },

  /**
   * Lấy bài học hôm nay sinh động theo chủ đề ngẫu nhiên và từ chưa học
   */
  getTodayLesson: async (options?: DailyLessonGeneratorOptions): Promise<DailyLessonContent> => {
    return getOrGenerateTodayDailyLesson(options);
  },

  /**
   * Lấy bài học theo Deck ID
   */
  getByDeckId: async (deckId: string): Promise<DailyLesson[]> => {
    const cleanId = deckId.replace(/^deck-/, '');
    return allDailyLessons.filter(
      (l) => l.deck_id === deckId || l.deck_id === `deck-${cleanId}` || l.deck_id.replace(/^deck-/, '') === cleanId
    );
  },

  /**
   * Lấy chi tiết nội dung 7 phần bài học
   */
  getContentById: async (lessonId: string): Promise<DailyLessonContent> => {
    // 1. Kiểm tra xem có phải bài học sinh động (dynamic / AI) không
    const generated = getGeneratedDailyLessonById(lessonId);
    if (generated) {
      return generated;
    }

    // 2. Tra cứu ngân hàng bài học
    const content = getLessonContentById(lessonId);
    if (!content) {
      throw new Error(`Lesson with id ${lessonId} not found`);
    }
    return content;
  },
};
