import { DailyLesson, DailyLessonContent } from '@/types/database';
import restaurantLesson01 from './restaurant-lesson-01.json';
import restaurantLesson02 from './restaurant-lesson-02.json';
import travelLesson01 from './travel-lesson-01.json';
import travelLesson02 from './travel-lesson-02.json';
import workplaceLesson01 from './workplace-lesson-01.json';
import shoppingLesson01 from './shopping-lesson-01.json';
import dailyLesson01 from './daily-lesson-01.json';

const lessonContents: Record<string, DailyLessonContent> = {
  'lesson-restaurant-01': restaurantLesson01 as unknown as DailyLessonContent,
  'lesson-restaurant-02': restaurantLesson02 as unknown as DailyLessonContent,
  'lesson-travel-01': travelLesson01 as unknown as DailyLessonContent,
  'lesson-travel-02': travelLesson02 as unknown as DailyLessonContent,
  'lesson-workplace-01': workplaceLesson01 as unknown as DailyLessonContent,
  'lesson-shopping-01': shoppingLesson01 as unknown as DailyLessonContent,
  'lesson-daily-01': dailyLesson01 as unknown as DailyLessonContent,
};

// Danh sách tổng hợp tất cả bài học trong toàn bộ hệ thống
export const allDailyLessons: DailyLesson[] = [
  restaurantLesson01.lesson as DailyLesson,
  restaurantLesson02.lesson as DailyLesson,
  travelLesson01.lesson as DailyLesson,
  travelLesson02.lesson as DailyLesson,
  workplaceLesson01.lesson as DailyLesson,
  shoppingLesson01.lesson as DailyLesson,
  dailyLesson01.lesson as DailyLesson,
];

/**
 * Lấy danh sách bài học theo deckId
 */
export function getLessonsByDeckId(deckId: string): DailyLesson[] {
  return allDailyLessons.filter(
    (l) => l.deck_id === deckId || l.deck_id === `deck-${deckId}` || deckId === l.deck_id.replace(/^deck-/, '')
  );
}

/**
 * Lấy nội dung chi tiết bài học (full 7 sections) theo lessonId
 */
export function getLessonContentById(lessonId: string): DailyLessonContent | null {
  if (lessonContents[lessonId]) {
    return lessonContents[lessonId];
  }

  // Fallback nếu người dùng mở bài chưa đăng ký
  const meta = allDailyLessons.find((l) => l.id === lessonId);
  if (meta) {
    return {
      ...restaurantLesson01 as unknown as DailyLessonContent,
      lesson: meta,
    };
  }

  return restaurantLesson01 as unknown as DailyLessonContent;
}

