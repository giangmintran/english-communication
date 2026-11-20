import { LearningItem } from '@/types/database';

export type TestQuestionType = 'en_to_vi' | 'vi_to_en' | 'listening';

export interface TestQuestion {
  id: string;
  item: LearningItem;
  type: TestQuestionType;
  prompt: string;
  audioText?: string;
  options: string[];
  correctAnswer: string;
  correctIndex: number;
}

export interface TestAnswerState {
  questionId: string;
  selectedOptionIndex: number | null;
  userAnswer: string;
  isCorrect: boolean;
  question: TestQuestion;
}

export interface TestEvaluation {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  scorePercentage: number;
  correctAnswers: TestAnswerState[];
  incorrectAnswers: TestAnswerState[];
}

const FALLBACK_VIETNAMESE = [
  'Xin lỗi, bạn có thể nhắc lại được không?',
  'Tôi muốn thanh toán bằng thẻ tín dụng',
  'Làm ơn cho tôi hỏi đường đến ga tàu điện ngầm',
  'Tôi cần sự giúp đỡ của bạn một chút',
  'Hẹn gặp lại bạn vào tuần tới nhé',
  'Rất vui được gặp bạn hôm nay',
  'Cho tôi xin thêm một chút thời gian',
  'Bạn có gợi ý món nào ngon không?',
  'Cảm ơn bạn rất nhiều vì sự giúp đỡ',
  'Chúc bạn một ngày làm việc vui vẻ',
];

const FALLBACK_ENGLISH = [
  'Could you please repeat that?',
  'I would like to pay by credit card',
  'Excuse me, where is the subway station?',
  'I need a little help from you',
  'See you next week',
  'Nice to meet you today',
  'Give me a moment, please',
  'Do you have any recommendations?',
  'Thank you so much for your help',
  'Have a wonderful day ahead',
];

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Sinh danh sách câu hỏi kiểm tra:
 * - Nếu ít hơn 20 từ (ví dụ 12 từ): lấy đúng số từ làm số câu (12 câu)
 * - Nếu >= 20 từ: chọn ngẫu nhiên đúng 20 từ để làm 20 câu
 */
export function generateCollectionTest(
  items: LearningItem[],
  targetCount = 20
): TestQuestion[] {
  if (!items || items.length === 0) return [];

  const actualCount = Math.min(items.length, targetCount);
  const selectedItems = shuffle(items).slice(0, actualCount);

  const questionTypes: TestQuestionType[] = ['en_to_vi', 'vi_to_en', 'listening'];

  return selectedItems.map((item, index) => {
    const type = questionTypes[index % questionTypes.length];
    let prompt = '';
    let correctAnswer = '';
    let distractorPool: string[] = [];
    let audioText: string | undefined = undefined;

    if (type === 'vi_to_en') {
      prompt = item.vietnamese_meaning;
      correctAnswer = item.english_text;

      // Phương án nhiễu tiếng Anh từ các item khác trong bộ
      const otherEnglish = items
        .filter((it) => it.id !== item.id && it.english_text !== correctAnswer)
        .map((it) => it.english_text);
      distractorPool =
        otherEnglish.length >= 3
          ? otherEnglish
          : [...otherEnglish, ...FALLBACK_ENGLISH];
    } else if (type === 'listening') {
      prompt = 'Nghe phát âm và chọn nghĩa tiếng Việt đúng:';
      correctAnswer = item.vietnamese_meaning;
      audioText = item.english_text;

      // Phương án nhiễu tiếng Việt từ các item khác trong bộ
      const otherVi = items
        .filter((it) => it.id !== item.id && it.vietnamese_meaning !== correctAnswer)
        .map((it) => it.vietnamese_meaning);
      distractorPool =
        otherVi.length >= 3 ? otherVi : [...otherVi, ...FALLBACK_VIETNAMESE];
    } else {
      // en_to_vi
      prompt = item.english_text;
      correctAnswer = item.vietnamese_meaning;
      audioText = item.english_text;

      const otherVi = items
        .filter((it) => it.id !== item.id && it.vietnamese_meaning !== correctAnswer)
        .map((it) => it.vietnamese_meaning);
      distractorPool =
        otherVi.length >= 3 ? otherVi : [...otherVi, ...FALLBACK_VIETNAMESE];
    }

    // Chọn 3 phương án nhiễu không trùng với đáp án đúng
    const filteredDistractors = Array.from(
      new Set(distractorPool.filter((d) => d !== correctAnswer))
    );
    const chosenDistractors = shuffle(filteredDistractors).slice(0, 3);

    // Trộn 4 đáp án
    const allOptions = shuffle([correctAnswer, ...chosenDistractors]);
    const correctIndex = allOptions.indexOf(correctAnswer);

    return {
      id: `test-q-${item.id}-${index}-${Date.now()}`,
      item,
      type,
      prompt,
      audioText,
      options: allOptions,
      correctAnswer,
      correctIndex,
    };
  });
}

/**
 * Đánh giá bài kiểm tra sau khi người dùng nộp bài
 */
export function evaluateTest(
  questions: TestQuestion[],
  userSelections: Record<string, number>
): TestEvaluation {
  const correctAnswers: TestAnswerState[] = [];
  const incorrectAnswers: TestAnswerState[] = [];

  for (const q of questions) {
    const selectedIdx = userSelections[q.id];
    const isAnswered = selectedIdx !== undefined && selectedIdx !== null;
    const userAnswer = isAnswered ? q.options[selectedIdx] : '';
    const isCorrect = isAnswered && selectedIdx === q.correctIndex;

    const answerState: TestAnswerState = {
      questionId: q.id,
      selectedOptionIndex: isAnswered ? selectedIdx : null,
      userAnswer,
      isCorrect,
      question: q,
    };

    if (isCorrect) {
      correctAnswers.push(answerState);
    } else {
      incorrectAnswers.push(answerState);
    }
  }

  const totalQuestions = questions.length;
  const correctCount = correctAnswers.length;
  const incorrectCount = incorrectAnswers.length;
  const scorePercentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    correctCount,
    incorrectCount,
    scorePercentage,
    correctAnswers,
    incorrectAnswers,
  };
}
