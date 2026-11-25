import {
  PlacementQuestion,
  PlacementTestResult,
  CEFRLevel,
  TestSkillType,
  SkillScoreSummary,
} from '@/types/database';
import { placementQuestionBank } from '@/data/placementQuestionBank';

// ==========================================
// 1. THUẬT TOÁN SINH ĐỀ 30 CÂU KHÔNG TRÙNG LẶP
// ==========================================

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Bốc ngẫu nhiên k phần tử từ danh sách, ưu tiên loại trừ các ID đã từng làm
 */
function pickFromPool(
  pool: PlacementQuestion[],
  count: number,
  excludeIds: Set<string>
): PlacementQuestion[] {
  // Lọc các câu chưa từng xuất hiện
  const freshItems = pool.filter((q) => !excludeIds.has(q.id));
  const shuffledFresh = shuffleArray(freshItems);

  if (shuffledFresh.length >= count) {
    return shuffledFresh.slice(0, count);
  }

  // Nếu số câu chưa làm không đủ, lấy hết câu mới rồi lấy bù thêm từ câu cũ (đã xáo trộn)
  const remainingNeeded = count - shuffledFresh.length;
  const oldItems = shuffleArray(pool.filter((q) => excludeIds.has(q.id)));
  return [...shuffledFresh, ...oldItems.slice(0, remainingNeeded)];
}

/**
 * Sinh đề thi Placement Test chuẩn 30 câu hỏi:
 * - 8 câu Listening: 2 A1, 2 A2, 2 B1, 2 B2
 * - 8 câu Vocabulary: 2 A1, 2 A2, 2 B1, 2 B2
 * - 8 câu Grammar: 2 A1, 2 A2, 2 B1, 2 B2
 * - 6 câu Speaking: 1 A1, 2 A2, 2 B1, 1 B2
 * Tổng cộng: đúng 30 câu hỏi, không trùng lặp các câu hỏi đã làm gần đây.
 */
export function generatePlacementTestSession(excludeQuestionIds: string[] = []): PlacementQuestion[] {
  const excludeSet = new Set(excludeQuestionIds);

  const getSubPool = (skill: TestSkillType, level: CEFRLevel) => {
    return placementQuestionBank.filter((q) => q.skill === skill && q.level === level);
  };

  // 1. Bốc 8 câu Listening (2 A1, 2 A2, 2 B1, 2 B2)
  const listeningA1 = pickFromPool(getSubPool('listening', 'A1'), 2, excludeSet);
  const listeningA2 = pickFromPool(getSubPool('listening', 'A2'), 2, excludeSet);
  const listeningB1 = pickFromPool(getSubPool('listening', 'B1'), 2, excludeSet);
  const listeningB2 = pickFromPool(getSubPool('listening', 'B2'), 2, excludeSet);

  // 2. Bốc 8 câu Vocabulary (2 A1, 2 A2, 2 B1, 2 B2)
  const vocabA1 = pickFromPool(getSubPool('vocabulary', 'A1'), 2, excludeSet);
  const vocabA2 = pickFromPool(getSubPool('vocabulary', 'A2'), 2, excludeSet);
  const vocabB1 = pickFromPool(getSubPool('vocabulary', 'B1'), 2, excludeSet);
  const vocabB2 = pickFromPool(getSubPool('vocabulary', 'B2'), 2, excludeSet);

  // 3. Bốc 8 câu Grammar (2 A1, 2 A2, 2 B1, 2 B2)
  const grammarA1 = pickFromPool(getSubPool('grammar', 'A1'), 2, excludeSet);
  const grammarA2 = pickFromPool(getSubPool('grammar', 'A2'), 2, excludeSet);
  const grammarB1 = pickFromPool(getSubPool('grammar', 'B1'), 2, excludeSet);
  const grammarB2 = pickFromPool(getSubPool('grammar', 'B2'), 2, excludeSet);

  // 4. Bốc 6 câu Speaking (1 A1, 2 A2, 2 B1, 1 B2)
  const speakingA1 = pickFromPool(getSubPool('speaking', 'A1'), 1, excludeSet);
  const speakingA2 = pickFromPool(getSubPool('speaking', 'A2'), 2, excludeSet);
  const speakingB1 = pickFromPool(getSubPool('speaking', 'B1'), 2, excludeSet);
  const speakingB2 = pickFromPool(getSubPool('speaking', 'B2'), 1, excludeSet);

  // Ghép các phần lại theo thứ tự sư phạm khoa học:
  // Nghe hiểu -> Từ vựng -> Ngữ pháp chức năng -> Phát âm & Phản xạ nói
  const sessionQuestions: PlacementQuestion[] = [
    ...listeningA1,
    ...listeningA2,
    ...listeningB1,
    ...listeningB2,

    ...vocabA1,
    ...vocabA2,
    ...vocabB1,
    ...vocabB2,

    ...grammarA1,
    ...grammarA2,
    ...grammarB1,
    ...grammarB2,

    ...speakingA1,
    ...speakingA2,
    ...speakingB1,
    ...speakingB2,
  ];

  return sessionQuestions;
}

// ==========================================
// 2. THUẬT TOÁN CHẤM ĐIỂM & CHẨN ĐOÁN CEFR
// ==========================================

export interface UserAnswerInput {
  questionId: string;
  userAnswer: string | number;
  scoreEarned: number;
  isSkipped?: boolean;
}

function calculateSkillLevel(percentage: number): CEFRLevel {
  if (percentage >= 81) return 'B2';
  if (percentage >= 61) return 'B1';
  if (percentage >= 36) return 'A2';
  return 'A1';
}

export function calculatePlacementResults(
  questions: PlacementQuestion[],
  userAnswersMap: Record<string, UserAnswerInput>
): PlacementTestResult {
  const skillTotals: Record<TestSkillType, { score: number; total: number }> = {
    listening: { score: 0, total: 0 },
    vocabulary: { score: 0, total: 0 },
    grammar: { score: 0, total: 0 },
    speaking: { score: 0, total: 0 },
  };

  const formattedAnswers = questions.map((q) => {
    const userAns = userAnswersMap[q.id];
    let scoreEarned = 0;
    let isCorrect = false;

    if (userAns) {
      if (q.skill === 'speaking') {
        scoreEarned = Number(userAns.scoreEarned) || 0;
        isCorrect = scoreEarned >= 0.8;
      } else {
        isCorrect = Number(userAns.userAnswer) === q.correctIndex;
        scoreEarned = isCorrect ? 1 : 0;
      }
    }

    skillTotals[q.skill].total += 1;
    skillTotals[q.skill].score += scoreEarned;

    return {
      questionId: q.id,
      skill: q.skill,
      isCorrect,
      userAnswer: userAns?.userAnswer !== undefined ? userAns.userAnswer : -1,
      scoreEarned,
    };
  });

  const totalQuestions = questions.length || 30;
  const overallScore = Object.values(skillTotals).reduce((sum, s) => sum + s.score, 0);
  const overallPercentage = Math.round((overallScore / totalQuestions) * 100);

  // Xếp loại CEFR tổng thể:
  // 0 - 35%: A1 (Mới bắt đầu)
  // 36 - 60%: A2 (Sơ cấp giao tiếp)
  // 61 - 80%: B1 (Trung cấp phản xạ)
  // 81 - 100%: B2 (Trung cao cấp công sở)
  let overallLevel: CEFRLevel = 'A1';
  if (overallScore >= 24.5 || overallPercentage >= 81) {
    overallLevel = 'B2';
  } else if (overallScore >= 18.5 || overallPercentage >= 61) {
    overallLevel = 'B1';
  } else if (overallScore >= 10.5 || overallPercentage >= 36) {
    overallLevel = 'A2';
  } else {
    overallLevel = 'A1';
  }

  // Tính điểm chi tiết từng kỹ năng
  const skillScores: Record<TestSkillType, SkillScoreSummary> = {
    listening: {
      score: skillTotals.listening.score,
      total: skillTotals.listening.total,
      percentage: Math.round((skillTotals.listening.score / (skillTotals.listening.total || 1)) * 100),
      level: calculateSkillLevel(
        Math.round((skillTotals.listening.score / (skillTotals.listening.total || 1)) * 100)
      ),
    },
    vocabulary: {
      score: skillTotals.vocabulary.score,
      total: skillTotals.vocabulary.total,
      percentage: Math.round((skillTotals.vocabulary.score / (skillTotals.vocabulary.total || 1)) * 100),
      level: calculateSkillLevel(
        Math.round((skillTotals.vocabulary.score / (skillTotals.vocabulary.total || 1)) * 100)
      ),
    },
    grammar: {
      score: skillTotals.grammar.score,
      total: skillTotals.grammar.total,
      percentage: Math.round((skillTotals.grammar.score / (skillTotals.grammar.total || 1)) * 100),
      level: calculateSkillLevel(
        Math.round((skillTotals.grammar.score / (skillTotals.grammar.total || 1)) * 100)
      ),
    },
    speaking: {
      score: skillTotals.speaking.score,
      total: skillTotals.speaking.total,
      percentage: Math.round((skillTotals.speaking.score / (skillTotals.speaking.total || 1)) * 100),
      level: calculateSkillLevel(
        Math.round((skillTotals.speaking.score / (skillTotals.speaking.total || 1)) * 100)
      ),
    },
  };

  // Xác định Điểm mạnh (Strengths) và Điểm cần cải thiện (Weaknesses)
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const strengthsEn: string[] = [];
  const weaknessesEn: string[] = [];

  if (skillScores.listening.percentage >= 70) {
    strengths.push('Nghe hiểu nhạy bén, nắm bắt tốt các tình huống hội thoại và thông tin chính.');
    strengthsEn.push('Strong listening comprehension; effectively grasps conversational contexts and key details.');
  } else {
    weaknesses.push('Cần luyện nghe các đoạn thoại có tốc độ tự nhiên và từ nối âm hàng ngày.');
    weaknessesEn.push('Focus on practicing with natural-speed dialogues and connected speech.');
  }

  if (skillScores.vocabulary.percentage >= 70) {
    strengths.push('Vốn từ vựng và cụm thành ngữ giao tiếp phong phú, hiểu rõ ngữ cảnh đời sống.');
    strengthsEn.push('Rich communicative vocabulary and idioms with good situational awareness.');
  } else {
    weaknesses.push('Nên bổ sung thêm phrasal verbs và collocations thường dùng trong giao tiếp.');
    weaknessesEn.push('Expand your repertoire of practical phrasal verbs and daily collocations.');
  }

  if (skillScores.grammar.percentage >= 70) {
    strengths.push('Nắm vững ngữ pháp chức năng, diễn đạt câu văn hòa nhã và chuẩn mực.');
    strengthsEn.push('Solid functional grammar skills with polite, standard conversational phrasing.');
  } else {
    weaknesses.push('Cần thực hành thêm cách diễn đạt câu điều kiện và câu đề nghị lịch sự.');
    weaknessesEn.push('Practice conditional structures, polite requests, and diplomatic phrasings.');
  }

  if (skillScores.speaking.percentage >= 70) {
    strengths.push('Phát âm rõ ràng, nhịp điệu và ngữ điệu tự nhiên, phản xạ nói tốt.');
    strengthsEn.push('Clear pronunciation, natural cadence, and confident speaking reflexes.');
  } else {
    weaknesses.push('Cần cải thiện việc nhấn trọng âm từ và nối âm mượt mà khi đọc câu thoại dài.');
    weaknessesEn.push('Work on word stress, intonation, and linking sounds in longer utterances.');
  }

  // Gợi ý lộ trình Bộ sưu tập và Bài học tương ứng
  let recommendedCollectionId = 'col-daily';
  let recommendedDailyTopic = 'Giao tiếp Cơ bản Hàng ngày';
  let recommendedDailyTopicEn = 'Confident Greetings & Daily Essentials';

  if (overallLevel === 'B2') {
    recommendedCollectionId = 'col-business';
    recommendedDailyTopic = 'Đàm phán & Giao tiếp Công sở Chuyên nghiệp';
    recommendedDailyTopicEn = 'Professional Business Communication & Negotiation';
  } else if (overallLevel === 'B1') {
    recommendedCollectionId = 'col-travel';
    recommendedDailyTopic = 'Du lịch, Tranh luận & Thể hiện Quan điểm';
    recommendedDailyTopicEn = 'Travel, Discussion & Expressing Opinions';
  } else if (overallLevel === 'A2') {
    recommendedCollectionId = 'col-restaurant';
    recommendedDailyTopic = 'Nhà hàng, Mua sắm & Hỏi đường';
    recommendedDailyTopicEn = 'Dining Out, Shopping & Asking Directions';
  } else {
    recommendedCollectionId = 'col-daily';
    recommendedDailyTopic = 'Chào hỏi & Làm quen Tự tin';
    recommendedDailyTopicEn = 'Confident Greetings & Daily Essentials';
  }

  return {
    id: `pt-${Date.now()}`,
    overall_level: overallLevel,
    overall_score: Math.round(overallScore * 10) / 10,
    total_questions: totalQuestions,
    percentage: overallPercentage,
    skill_scores: skillScores,
    answers: formattedAnswers,
    strengths,
    weaknesses,
    strengths_en: strengthsEn,
    weaknesses_en: weaknessesEn,
    recommended_collection_id: recommendedCollectionId,
    recommended_daily_topic: recommendedDailyTopic,
    recommended_daily_topic_en: recommendedDailyTopicEn,
    created_at: new Date().toISOString(),
  };
}

// ==========================================
// 3. QUẢN LÝ DỮ LIỆU KHÁCH VÃNG LAI (GUEST MODE)
// ==========================================

const GUEST_PLACEMENT_RESULT_KEY = 'speakup_guest_placement_result';
const GUEST_PLACEMENT_DONE_KEY = 'speakup_guest_placement_done';

export function getGuestPlacementResult(): PlacementTestResult | null {
  try {
    const raw = localStorage.getItem(GUEST_PLACEMENT_RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGuestPlacementResult(result: PlacementTestResult): void {
  try {
    localStorage.setItem(GUEST_PLACEMENT_RESULT_KEY, JSON.stringify(result));
    localStorage.setItem(GUEST_PLACEMENT_DONE_KEY, 'true');
  } catch (err) {
    console.warn('Không thể lưu kết quả khách vào localStorage:', err);
  }
}

export function hasGuestCompletedPlacement(): boolean {
  try {
    return localStorage.getItem(GUEST_PLACEMENT_DONE_KEY) === 'true';
  } catch {
    return false;
  }
}
