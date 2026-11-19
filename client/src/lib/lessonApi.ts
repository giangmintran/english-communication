import { DailyLesson, DailyLessonContent } from '@/types/database';
import { allDailyLessons, getLessonContentById } from '@/data/lessons';

export const lessonApi = {
  /**
   * Lấy tất cả bài học trong toàn hệ thống
   */
  getAll: async (): Promise<DailyLesson[]> => {
    // Có thể mở rộng gọi backend API: request<DailyLesson[]>('/lessons')
    return allDailyLessons;
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
    const content = getLessonContentById(lessonId);
    if (!content) {
      throw new Error(`Lesson with id ${lessonId} not found`);
    }
    return content;
  },
};
