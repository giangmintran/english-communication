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

export type DeckWithItems = Deck & {
  flashcards?: LearningItem[];
  items?: LearningItem[];
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

export type CollectionReviewRecord = {
  id: string;
  user_id: string;
  collection_id: string;
  phrase_id: string;
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  next_review_at: string;
  last_reviewed_at: string;
  last_quality: number;
  is_mastered?: boolean;
  created_at?: string;
  updated_at?: string;
};

// ==========================================
// MÔ HÌNH DỮ LIỆU RIÊNG CHO COLLECTION
// (Tách biệt hoàn toàn với Deck và Item của Daily Lesson)
// ==========================================

export interface CollectionItem {
  id: string;
  collection_id: string;
  type: 'phrase' | 'collocation' | 'sentence' | 'word';
  english_text: string;
  phonetic_ipa: string;
  vietnamese_meaning: string;
  example_sentence: string;
  example_meaning: string;
  difficulty_level: 'A1' | 'A2' | 'B1' | 'B2';
  audio_url?: string;
  order_index?: number;
  sprint_day?: 1 | 2 | 3;
}

export interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  icon_name: string;
  image_url: string;
  total_phrases: number;
  order_index: number;
  items?: CollectionItem[];
  phrases?: CollectionItem[];
}

export interface PhraseProgressState {
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  next_review_at: string;
  last_reviewed_at: string;
  last_quality: number;
  is_mastered: boolean;
}

export interface CollectionProgress {
  collection_id: string;
  learned_count: number;
  mastered_count: number;
  total_phrases: number;
  progress_percent: number;
  last_studied_at?: string;
  phrase_states: Record<string, PhraseProgressState>;
}

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
  rank?: number;
};

// ===== DAILY LESSON TYPES =====

export type DailyLesson = {
  id: string;
  deck_id: string; // Tương thích ngược với hệ thống cũ
  collection_id?: string; // ID của Collection trong Thematic Sprint
  title: string;
  description: string;
  topic: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  estimated_minutes: number;
  order_index: number;
  image_url?: string;
  sprint_day?: 1 | 2 | 3; // Ngày thứ mấy trong Sprint 3 ngày (1: Khởi động, 2: Tương tác, 3: Phản xạ)
  sprint_total_days?: number; // Mặc định là 3
  stage_title?: string; // Tên giai đoạn: VD "Giai đoạn 1: Khởi động & Nền tảng"
};

export type LessonWarmup = {
  situation: string;
  objective: string;
  warm_up_question: string;
  key_phrases: string[];
  image_url?: string;
};

export type LessonVocabItem = {
  id: string;
  word: string;
  phonetic_ipa: string;
  part_of_speech: string;
  vietnamese_meaning: string;
  collocations: string[];
  example_sentence: string;
  example_meaning: string;
  audio_url?: string;
  is_review?: boolean; // True nếu là từ ôn tập 30% theo quy tắc 70/30
  sprint_day?: 1 | 2 | 3;
};

export type LessonGrammar = {
  title: string;
  explanation: string;
  formula: string;
  examples: {
    english: string;
    vietnamese: string;
    highlight?: string;
  }[];
  common_mistakes: {
    wrong: string;
    correct: string;
    explanation: string;
  }[];
};

export type LessonExpression = {
  id: string;
  expression: string;
  phonetic_ipa: string;
  meaning: string;
  context: string;
  formality: 'informal' | 'neutral' | 'formal';
  variations: string[];
  audio_url?: string;
};

export type LessonListening = {
  id: string;
  title: string;
  dialogue: {
    speaker: string;
    text: string;
    vietnamese: string;
  }[];
  audio_url?: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
    explanation?: string;
  }[];
};

export type LessonSpeaking = {
  situation: string;
  sample_dialogue: {
    speaker: string;
    text: string;
    vietnamese: string;
  }[];
  practice_sentences: {
    id: string;
    text: string;
    phonetic_ipa: string;
    vietnamese_hint: string;
  }[];
};

export type PracticeQuizItem =
  | {
      id?: string;
      type: 'vocabulary_quiz';
      question: string;
      options: string[];
      correct_answer: number;
      explanation?: string;
    }
  | {
      id?: string;
      type: 'grammar_quiz';
      question: string;
      options: string[];
      correct_answer: number;
      explanation?: string;
    }
  | {
      id?: string;
      type: 'sentence_building';
      vietnamese: string;
      scrambled_words: string[];
      correct_order: string[];
      hint?: string;
    }
  | {
      id?: string;
      type: 'translation';
      source_text: string;
      source_lang: 'vi' | 'en';
      correct_answer: string;
      accept_answers?: string[];
      hint?: string;
    }
  | {
      id?: string;
      type: 'speaking_challenge';
      prompt: string;
      sample_answer: string;
      vietnamese_hint?: string;
    };

export type DailyLessonContent = {
  lesson: DailyLesson;
  warmup: LessonWarmup;
  vocabulary: LessonVocabItem[];
  grammar: LessonGrammar;
  expressions: LessonExpression[];
  listening: LessonListening[];
  speaking: LessonSpeaking;
  practice: PracticeQuizItem[];
};

