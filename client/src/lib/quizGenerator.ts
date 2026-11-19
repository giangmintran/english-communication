import { LearningItem } from '@/types/database';
import {
  ReviewQuestion,
  ListeningChoiceQuestion,
  WritingInputQuestion,
  TranslationChoiceQuestion,
} from '@/types/quiz';

// Danh sách từ dự phòng để lấy phương án nhiễu nếu danh sách đầu vào quá ít
const FALLBACK_WORDS = [
  'greet',
  'introduce',
  'invite',
  'apologize',
  'suggest',
  'complain',
  'appreciate',
  'discuss',
  'congratulate',
  'recommend',
  'schedule',
  'confirm',
  'reschedule',
  'remind',
  'prepare',
  'participate',
  'coordinate',
  'collaborate',
  'negotiate',
  'finalize',
];

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Xáo trộn ngẫu nhiên toàn bộ câu hỏi và hạn chế tối đa việc 2 câu cùng 1 từ vựng xuất hiện liền kề
 */
function shuffleQuestionsRandomly(questions: ReviewQuestion[]): ReviewQuestion[] {
  const shuffled = shuffle(questions);

  // Thuật toán giãn cách: tránh trùng lặp từ vựng liên tiếp
  for (let i = 1; i < shuffled.length - 1; i++) {
    if (shuffled[i].wordId === shuffled[i - 1].wordId) {
      // Tìm vị trí xa hơn có wordId khác để hoán đổi
      const swapIdx = shuffled.findIndex(
        (q, idx) =>
          idx > i &&
          q.wordId !== shuffled[i - 1].wordId &&
          (idx === shuffled.length - 1 || q.wordId !== shuffled[idx + 1]?.wordId)
      );
      if (swapIdx !== -1) {
        const temp = shuffled[i];
        shuffled[i] = shuffled[swapIdx];
        shuffled[swapIdx] = temp;
      }
    }
  }

  return shuffled;
}

/**
 * Thuật toán sinh 60 câu hỏi ôn tập (3 câu cho mỗi từ) từ danh sách 20 từ vựng.
 *
 * Mặc định: Xáo trộn RANDOM BẤT KỲ toàn bộ 60 câu hỏi giữa cả 3 phần:
 * - Phần 1: Nghe và chọn từ tiếng Anh (Listening Choice)
 * - Phần 2: Viết chính tả từ vừa nghe HOẶC nhìn tiếng Việt gõ từ tiếng Anh (Writing Input)
 * - Phần 3: Nhìn nghĩa tiếng Việt và chọn đáp án tiếng Anh (Translation Choice)
 */
export function generateDailyReviewQuestions(
  items: LearningItem[],
  maxWords = 20,
  orderMode: 'shuffled' | 'grouped' = 'shuffled'
): ReviewQuestion[] {
  if (!items || items.length === 0) return [];

  // Lấy tối đa 20 từ (hoặc toàn bộ nếu ít hơn 20)
  const targetWords = items.slice(0, maxWords);

  // Tập hợp toàn bộ từ tiếng Anh để sinh distractors
  const allEnglishWords = Array.from(
    new Set([
      ...targetWords.map((w) => w.english_text.trim()),
      ...FALLBACK_WORDS,
    ])
  );

  const listeningQuestions: ListeningChoiceQuestion[] = [];
  const writingQuestions: WritingInputQuestion[] = [];
  const translationQuestions: TranslationChoiceQuestion[] = [];

  targetWords.forEach((wordItem, index) => {
    const target = wordItem.english_text.trim();

    // 1. Lựa chọn 3 đáp án nhiễu (distractors) không trùng với đáp án đúng
    const candidateDistractors = allEnglishWords.filter(
      (w) => w.toLowerCase() !== target.toLowerCase()
    );
    const distractors = shuffle(candidateDistractors).slice(0, 3);

    // ==========================================
    // PHẦN 1: NGHE VÀ CHỌN TỪ (LISTENING CHOICE)
    // ==========================================
    const listenOptions = shuffle([target, ...distractors]);
    const listenCorrectIndex = listenOptions.indexOf(target);

    listeningQuestions.push({
      id: `review-${wordItem.id}-listen`,
      wordId: wordItem.id,
      targetWord: target,
      phoneticIpa: wordItem.phonetic_ipa || '',
      vietnameseMeaning: wordItem.vietnamese_meaning,
      exampleSentence: wordItem.example_sentence,
      exampleMeaning: wordItem.example_meaning,
      type: 'listening_choice',
      part: 'listening',
      partNumber: 1,
      partTitle: 'Luyện Nghe (Listening)',
      audioText: target,
      options: listenOptions,
      correctIndex: listenCorrectIndex,
    });

    // ==========================================
    // PHẦN 2: VIẾT TỪ (WRITING INPUT)
    // ==========================================
    // Xen kẽ: một nửa câu luyện nghe gõ lại (dictation), một nửa dịch nghĩa gõ từ
    const isListenMode = index % 2 === 0;
    const firstChar = target.charAt(0).toUpperCase();
    const maskedLength = target.length > 1 ? `${firstChar}${' _'.repeat(target.length - 1)}` : firstChar;
    const hintText = isListenMode
      ? `Gợi ý: ${maskedLength} (${target.length} chữ cái) • ${wordItem.phonetic_ipa || ''}`
      : `Gợi ý: Bắt đầu bằng chữ "${firstChar}" • ${wordItem.phonetic_ipa || ''}`;

    writingQuestions.push({
      id: `review-${wordItem.id}-write`,
      wordId: wordItem.id,
      targetWord: target,
      phoneticIpa: wordItem.phonetic_ipa || '',
      vietnameseMeaning: wordItem.vietnamese_meaning,
      exampleSentence: wordItem.example_sentence,
      exampleMeaning: wordItem.example_meaning,
      type: 'writing_input',
      part: 'writing',
      partNumber: 2,
      partTitle: 'Luyện Viết (Writing)',
      mode: isListenMode ? 'listen_and_type' : 'translate_and_type',
      prompt: isListenMode
        ? 'Nghe phát âm và gõ lại từ tiếng Anh chính xác:'
        : `Nghĩa tiếng Việt: "${wordItem.vietnamese_meaning}"`,
      audioText: target,
      correctAnswer: target,
      acceptableAnswers: [
        target.toLowerCase().trim(),
        target.trim(),
      ],
      hint: hintText,
    });

    // ==========================================
    // PHẦN 3: DỊCH NGHĨA CHỌN TỪ (TRANSLATION CHOICE)
    // ==========================================
    const transOptions = shuffle([target, ...distractors]);
    const transCorrectIndex = transOptions.indexOf(target);

    translationQuestions.push({
      id: `review-${wordItem.id}-trans`,
      wordId: wordItem.id,
      targetWord: target,
      phoneticIpa: wordItem.phonetic_ipa || '',
      vietnameseMeaning: wordItem.vietnamese_meaning,
      exampleSentence: wordItem.example_sentence,
      exampleMeaning: wordItem.example_meaning,
      type: 'translation_choice',
      part: 'translation',
      partNumber: 3,
      partTitle: 'Dịch Nghĩa (Translation)',
      vietnamesePrompt: wordItem.vietnamese_meaning,
      options: transOptions,
      correctIndex: transCorrectIndex,
    });
  });

  const allQuestions = [
    ...listeningQuestions,
    ...writingQuestions,
    ...translationQuestions,
  ];

  if (orderMode === 'grouped') {
    return allQuestions;
  }

  // Mặc định: Random xáo trộn ngẫu nhiên bất kỳ toàn bộ 60 câu hỏi
  return shuffleQuestionsRandomly(allQuestions);
}
