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

export interface ItemDetails {
  part_of_speech?: string; // Ví dụ: 'noun', 'verb', 'phrasal verb', 'idiom'
  definition?: string;     // Định nghĩa mở rộng
  collocations?: string[]; // Ví dụ: ['smooth rollout', 'global rollout']
  synonyms?: string[];     // Ví dụ: ['launch', 'deployment', 'implementation']
  antonyms?: string[];     // Ví dụ: ['withdrawal', 'recall']
  usage_note?: string;     // Ví dụ: 'Thường dùng trong môi trường doanh nghiệp khi ra mắt hệ thống/sản phẩm mới.'
  more_examples?: Array<{
    en: string;
    vi: string;
  }>;
  vi?: {
    meaning?: string;
    definition?: string;
    usage_note?: string;
    collocations?: string[];
    synonyms?: string[];
    antonyms?: string[];
  };
  en?: {
    definition?: string;
    meaning?: string;
    usage_note?: string;
    collocations?: string[];
    synonyms?: string[];
    antonyms?: string[];
  };
}

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
  details?: ItemDetails;
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

export type UserDailyProgress = {
  todayLearned: number;
  todayGoal: number;
  overallProgressPercent: number;
  totalWordsLearned: number;
  speakingTimeMinutes: number;
  streakDays: number;
};

export type DailyReviewProgress = {
  date: string;
  deckId: string;
  wordIds: string[];
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  isCompleted: boolean;
  results: Record<string, any>;
  lastUpdated: string;
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

// ===== DAILY LESSON TYPES =====

export type DailyLesson = {
  id: string;
  deck_id: string;
  title: string;
  description: string;
  topic: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  estimated_minutes: number;
  order_index: number;
  image_url?: string;
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

