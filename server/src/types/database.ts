export type Profile = {
  id: string;
  display_name: string;
  avatar_url?: string;
  streak_count: number;
  last_active_date: string;
  daily_goal_words: number;
  current_level: string;
  created_at: string;
};

export type Deck = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  icon_name: string;
  image_url: string;
  total_words: number;
  order_index: number;
};

export type ItemType = 'word' | 'collocation' | 'phrase' | 'sentence';

export type LearningItem = {
  id: string;
  deck_id: string;
  type: ItemType;
  english_text: string;
  phonetic_ipa: string;
  vietnamese_meaning: string;
  example_sentence: string;
  example_meaning: string;
  audio_url?: string;
  difficulty_level: 'A1' | 'A2' | 'B1' | 'B2';
};

export type ReviewGrade = 0 | 1 | 2 | 3; // 0: Again (Quên), 1: Hard (Mơ hồ), 2: Good (Nhớ), 3: Easy (Rất dễ)

export type ReviewRecord = {
  id: string;
  user_id: string;
  item_id: string;
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  next_review_at: string;
  last_reviewed_at: string;
  last_quality: number;
};

export type UserDailyProgress = {
  todayLearned: number;
  todayGoal: number;
  overallProgressPercent: number;
  totalWordsLearned: number;
  speakingTimeMinutes: number;
  streakDays: number;
};

export type SpeakingItem = {
  id: string;
  english_text: string;
  phonetic_ipa: string;
  vietnamese_meaning: string;
  difficulty_level: string;
  type?: string;
};

export type DictionaryItem = {
  id?: string;
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  type?: string;
};

export type ConversationItem = {
  id: string;
  title: string;
  level: string;
  scenario: string;
  deckId: string;
  totalWords?: number;
};

export type LeaderboardEntry = {
  name: string;
  avatar: string;
  streak: number;
  words: number;
  isCurrent?: boolean;
};
