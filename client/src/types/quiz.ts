import { LearningItem } from './database';

export type ReviewQuestionType = 'listening_choice' | 'writing_input' | 'translation_choice';
export type ReviewPart = 'listening' | 'writing' | 'translation';

export interface BaseReviewQuestion {
  id: string;
  wordId: string;
  targetWord: string;
  phoneticIpa: string;
  vietnameseMeaning: string;
  exampleSentence?: string;
  exampleMeaning?: string;
  type: ReviewQuestionType;
  part: ReviewPart;
  partNumber: 1 | 2 | 3;
  partTitle: string;
}

export interface ListeningChoiceQuestion extends BaseReviewQuestion {
  type: 'listening_choice';
  part: 'listening';
  partNumber: 1;
  audioText: string;
  options: string[];
  correctIndex: number;
}

export interface WritingInputQuestion extends BaseReviewQuestion {
  type: 'writing_input';
  part: 'writing';
  partNumber: 2;
  mode: 'listen_and_type' | 'translate_and_type';
  prompt: string;
  audioText: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  hint: string;
}

export interface TranslationChoiceQuestion extends BaseReviewQuestion {
  type: 'translation_choice';
  part: 'translation';
  partNumber: 3;
  vietnamesePrompt: string;
  options: string[];
  correctIndex: number;
}

export type ReviewQuestion =
  | ListeningChoiceQuestion
  | WritingInputQuestion
  | TranslationChoiceQuestion;

export interface ReviewAnswerResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  question: ReviewQuestion;
}

export interface ReviewSessionSummary {
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  byPart: {
    listening: { total: number; correct: number };
    writing: { total: number; correct: number };
    translation: { total: number; correct: number };
  };
  wrongAnswers: ReviewAnswerResult[];
}

export interface DailyReviewProgress {
  date: string; // YYYY-MM-DD
  deckId: string; // e.g. "daily"
  wordIds: string[]; // Danh sách 20 word IDs
  currentIndex: number; // Vị trí câu hỏi hiện tại (0..59)
  totalQuestions: number; // 60
  answeredCount: number; // Số câu đã làm
  correctCount: number; // Số câu đúng
  isCompleted: boolean; // Đã hoàn tất 60 câu chưa
  results: Record<string, ReviewAnswerResult>; // Kết quả từng câu: questionId -> result
  lastUpdated: string; // ISO timestamp
}
