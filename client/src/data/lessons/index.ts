import { DailyLesson, DailyLessonContent } from '@/types/database';
import restaurantLesson01 from './restaurant-lesson-01.json';

const lessonContents: Record<string, DailyLessonContent> = {
  'lesson-restaurant-01': restaurantLesson01 as unknown as DailyLessonContent,
};

// Danh sách tổng hợp tất cả bài học trong toàn bộ hệ thống
export const allDailyLessons: DailyLesson[] = [
  // Deck Restaurant
  restaurantLesson01.lesson as DailyLesson,
  {
    id: 'lesson-restaurant-02',
    deck_id: 'deck-restaurant',
    title: 'Dealing with Order Issues & Compliments',
    description: 'Cách góp ý nhẹ nhàng khi món ăn bị nhầm hoặc nguội, và khen ngợi món ăn ngon.',
    topic: 'Handling Problems & Compliments',
    level: 'A2',
    estimated_minutes: 30,
    order_index: 2,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  // Deck Travel
  {
    id: 'lesson-travel-01',
    deck_id: 'deck-travel',
    title: 'At the Airport & Checking In',
    description: 'Làm thủ tục lên máy bay, gửi hành lý, hỏi cổng ra tàu bay và điền tờ khai nhập cảnh.',
    topic: 'Airport & Flight Check-in',
    level: 'A2',
    estimated_minutes: 35,
    order_index: 1,
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'lesson-travel-02',
    deck_id: 'deck-travel',
    title: 'Hotel Check-in & Inquiring Amenities',
    description: 'Nhận phòng khách sạn, yêu cầu đổi phòng, hỏi mật khẩu WiFi và bữa sáng buffet.',
    topic: 'Hotel Communication',
    level: 'A2',
    estimated_minutes: 30,
    order_index: 2,
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  },
  // Deck Workplace
  {
    id: 'lesson-workplace-01',
    deck_id: 'deck-workplace',
    title: 'Daily Standup & Project Status Updates',
    description: 'Báo cáo công việc đã hoàn thành hôm qua, dự định hôm nay và các vướng mắc (blockers).',
    topic: 'Agile Standup & Updates',
    level: 'B1',
    estimated_minutes: 40,
    order_index: 1,
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  },
  // Deck Shopping
  {
    id: 'lesson-shopping-01',
    deck_id: 'deck-shopping',
    title: 'Finding Sizes, Trying On & Asking for Discounts',
    description: 'Hỏi kích cỡ quần áo, tìm phòng thử đồ, hỏi chương trình khuyến mãi và đổi trả hàng.',
    topic: 'Retail Shopping & Fitting',
    level: 'A2',
    estimated_minutes: 30,
    order_index: 1,
    image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
  },
  // Deck Daily Conversations
  {
    id: 'lesson-daily-01',
    deck_id: 'deck-daily-conversations',
    title: 'Catching Up with Old Friends',
    description: 'Chào hỏi tự nhiên, hỏi thăm cuộc sống, rủ bạn đi uống cà phê và hẹn gặp lại.',
    topic: 'Casual Social Catch-up',
    level: 'A2',
    estimated_minutes: 30,
    order_index: 1,
    image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  },
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

  // Fallback nếu người dùng mở các bài chưa có JSON riêng, dùng lesson 1 và cập nhật metadata
  const meta = allDailyLessons.find((l) => l.id === lessonId);
  if (meta) {
    return {
      ...restaurantLesson01 as unknown as DailyLessonContent,
      lesson: meta,
    };
  }

  return restaurantLesson01 as unknown as DailyLessonContent;
}
