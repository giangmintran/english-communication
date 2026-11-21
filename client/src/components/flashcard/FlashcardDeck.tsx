import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2,
  Mic,
  RotateCw,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LearningItem, ReviewGrade } from '@/types/database';
import {
  ReviewQuestion,
  ReviewAnswerResult,
  ReviewSessionSummary,
  DailyReviewProgress,
} from '@/types/quiz';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { speakText, calculateSimilarity } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { generateDailyReviewQuestions } from '@/lib/quizGenerator';
import { ListeningQuizCard } from '@/components/daily/review/ListeningQuizCard';
import { WritingQuizCard } from '@/components/daily/review/WritingQuizCard';
import { TranslationQuizCard } from '@/components/daily/review/TranslationQuizCard';
import { ReviewSummary } from '@/components/daily/review/ReviewSummary';

interface FlashcardDeckProps {
  deckTitle: string;
  items: LearningItem[];
  isDaily?: boolean;
}

export function FlashcardDeck({ deckTitle, items, isDaily = false }: FlashcardDeckProps) {
  const { user } = useAuth();
  const { recordReview, addSpeakingTime, saveDailyReviewProgress } = useLearningStore();
  const { t } = useTranslation();

  // Các giai đoạn học:
  // 1. 'flashcard': Lật thẻ và đánh giá mức độ ghi nhớ (Quên, Mơ hồ, Nhớ, Rất dễ)
  // 2. 'practice': Tự động chuyển sang làm bài tập luyện tập liên quan (3 câu hỏi / từ thuộc 2 dạng: Trắc nghiệm & Gõ từ)
  // 3. 'summary': Báo cáo tổng kết kết quả học tập & bài tập
  const [step, setStep] = useState<'flashcard' | 'practice' | 'summary'>('flashcard');

  // Trạng thái của giai đoạn 1: Flashcard
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ score: number; spoken: string } | null>(null);

  // Lưu trữ đánh giá từng từ trong lượt flashcard
  const [ratedWordsMap, setRatedWordsMap] = useState<Map<string, { item: LearningItem; grade: ReviewGrade }>>(
    new Map()
  );

  // Trạng thái của giai đoạn 2: Luyện tập bài tập liên quan
  const [practiceWords, setPracticeWords] = useState<LearningItem[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<ReviewQuestion[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceResults, setPracticeResults] = useState<Record<string, ReviewAnswerResult>>({});

  // Chế độ làm lại các câu bài tập bị sai
  const [isRetryingMistakes, setIsRetryingMistakes] = useState(false);
  const [retryQuestions, setRetryQuestions] = useState<ReviewQuestion[]>([]);
  const [retryIndex, setRetryIndex] = useState(0);

  const currentItem = items[currentIndex];

  const handlePlayAudio = async (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsSpeaking(true);
    await speakText(text);
    setIsSpeaking(false);
  };

  const handleSpeechRecognition = (targetText: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSpeechResult(null);

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t('flashcards.micError'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsRecording(true);

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        const score = calculateSimilarity(spokenText, targetText);
        setSpeechResult({ score, spoken: spokenText });
        setIsRecording(false);
        addSpeakingTime(1);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        alert(t('flashcards.micFail'));
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  // Xử lý khi người dùng chọn nút đánh giá (Quên, Mơ hồ, Nhớ 3 ngày, Rất dễ 7 ngày)
  const handleRate = (grade: ReviewGrade) => {
    if (!currentItem) return;

    // 1. Ghi nhận đánh giá vào SM-2 Spaced Repetition
    recordReview(currentItem.id, grade, user?.id, isDaily);

    const updatedRated = new Map(ratedWordsMap);
    updatedRated.set(currentItem.id, { item: currentItem, grade });
    setRatedWordsMap(updatedRated);

    setIsFlipped(false);
    setSpeechResult(null);

    // 2. Nếu còn thẻ tiếp theo: chuyển sang thẻ kế tiếp
    if (currentIndex + 1 < items.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 3. ĐÃ REVIEW XONG TẤT CẢ CÁC TỪ:
      // Tự động chuyển màn hình sang làm các bài tập liên quan!
      // Ưu tiên các từ người dùng đã chọn "Nhớ" (grade 2) hoặc "Rất dễ" (grade 3).
      // Nếu chưa có từ nào nhớ/rất dễ thì lấy toàn bộ các từ vừa học để củng cố.
      const rememberedWords = Array.from(updatedRated.values())
        .filter((r) => r.grade >= 2)
        .map((r) => r.item);

      const wordsForPractice = rememberedWords.length > 0 ? rememberedWords : items;

      // Sinh danh sách câu hỏi: Mỗi từ có đúng 3 câu hỏi thuộc 2 dạng (Trắc nghiệm & Gõ từ)
      const generatedQuestions = generateDailyReviewQuestions(
        wordsForPractice,
        wordsForPractice.length,
        'shuffled'
      );

      setPracticeWords(wordsForPractice);
      setPracticeQuestions(generatedQuestions);
      setPracticeIndex(0);
      setPracticeResults({});
      setIsRetryingMistakes(false);
      setStep('practice');
    }
  };

  // Câu hỏi bài tập hiện tại
  const activePracticeQuestion = isRetryingMistakes
    ? retryQuestions[retryIndex]
    : practiceQuestions[practiceIndex];

  // Xử lý khi trả lời 1 câu hỏi bài tập
  const handleAnswerQuestion = (isCorrect: boolean, userAnswer: string) => {
    if (!activePracticeQuestion) return;

    const answerRecord: ReviewAnswerResult = {
      questionId: activePracticeQuestion.id,
      isCorrect,
      userAnswer,
      correctAnswer: activePracticeQuestion.targetWord,
      question: activePracticeQuestion,
    };

    setPracticeResults((prev) => ({
      ...prev,
      [activePracticeQuestion.id]: answerRecord,
    }));
  };

  // Chuyển sang câu hỏi bài tập tiếp theo
  const handleNextQuestion = () => {
    // A. Nếu đang ở chế độ làm lại các câu bị sai
    if (isRetryingMistakes) {
      if (retryIndex + 1 < retryQuestions.length) {
        setRetryIndex((prev) => prev + 1);
      } else {
        // Đã hoàn thành ôn tập lại các câu sai -> Về màn hình tổng kết
        setIsRetryingMistakes(false);
        setStep('summary');
      }
      return;
    }

    // B. Chế độ làm bài tập chính
    if (practiceIndex + 1 < practiceQuestions.length) {
      setPracticeIndex((prev) => prev + 1);
    } else {
      // Đã làm xong tất cả các câu bài tập liên quan!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Lưu kết quả hoàn thành bài tập vào database nếu là Daily Routine
      if (isDaily) {
        const todayStr = new Date().toISOString().split('T')[0];
        const finalCorrect = Object.values(practiceResults).filter((r) => r.isCorrect).length;
        const progress: DailyReviewProgress = {
          date: todayStr,
          deckId: 'daily',
          wordIds: practiceWords.map((w) => w.id),
          currentIndex: practiceQuestions.length,
          totalQuestions: practiceQuestions.length,
          answeredCount: practiceQuestions.length,
          correctCount: finalCorrect,
          isCompleted: true,
          results: practiceResults,
          lastUpdated: new Date().toISOString(),
        };
        saveDailyReviewProgress(progress, user?.id);
      }

      setStep('summary');
    }
  };

  // Thống kê kết quả bài tập
  const sessionSummary: ReviewSessionSummary = useMemo(() => {
    const total = practiceQuestions.length || 0;
    const correct = practiceQuestions.filter((q) => practiceResults[q.id]?.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    const byPart = {
      listening: { total: 0, correct: 0 },
      writing: { total: 0, correct: 0 },
      translation: { total: 0, correct: 0 },
    };

    practiceQuestions.forEach((q) => {
      byPart[q.part].total++;
      if (practiceResults[q.id]?.isCorrect) {
        byPart[q.part].correct++;
      }
    });

    const wrongAnswers = practiceQuestions
      .filter((q) => practiceResults[q.id] && !practiceResults[q.id].isCorrect)
      .map((q) => practiceResults[q.id]);

    return {
      totalQuestions: total,
      correctCount: correct,
      accuracy,
      byPart,
      wrongAnswers,
    };
  }, [practiceQuestions, practiceResults]);

  // Làm lại toàn bộ bài tập liên quan
  const handleRestartPractice = () => {
    const freshQuestions = generateDailyReviewQuestions(
      practiceWords,
      practiceWords.length,
      'shuffled'
    );
    setPracticeQuestions(freshQuestions);
    setPracticeIndex(0);
    setPracticeResults({});
    setIsRetryingMistakes(false);
    setStep('practice');
  };

  // Làm lại riêng các câu trả lời sai
  const handleRetryMistakes = () => {
    const wrongQs = sessionSummary.wrongAnswers.map((w) => w.question);
    if (wrongQs.length === 0) return;

    setRetryQuestions(wrongQs);
    setRetryIndex(0);
    setIsRetryingMistakes(true);
    setStep('practice');
  };

  // Quay lại lật thẻ Flashcard từ đầu
  const handleRestartFlashcards = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSpeechResult(null);
    setRatedWordsMap(new Map());
    setStep('flashcard');
  };

  // ==========================================
  // RENDER GIAI ĐOẠN 3: TỔNG KẾT BÀI HỌC & BÀI TẬP
  // ==========================================
  if (step === 'summary') {
    return (
      <div className="space-y-6">
        <ReviewSummary
          summary={sessionSummary}
          words={practiceWords}
          onRestartAll={handleRestartPractice}
          onRetryMistakes={handleRetryMistakes}
        />
        <div className="flex justify-center pb-8">
          <button
            type="button"
            onClick={handleRestartFlashcards}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('flashcards.backToFlashcards')}</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER GIAI ĐOẠN 2: LÀM BÀI TẬP LIÊN QUAN
  // (Mỗi từ 3 câu hỏi thuộc 2 dạng: Trắc nghiệm & Gõ từ)
  // ==========================================
  if (step === 'practice') {
    const currentQ = activePracticeQuestion;
    const currentTotal = isRetryingMistakes ? retryQuestions.length : practiceQuestions.length;
    const currentIdx = isRetryingMistakes ? retryIndex : practiceIndex;
    const progressPercent = currentTotal > 0 ? Math.round(((currentIdx + 1) / currentTotal) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto py-6 px-4 animate-in fade-in duration-300">
        {/* Top bar tiến độ bài tập */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            type="button"
            onClick={handleRestartFlashcards}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('flashcards.backToFlashcards')}</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {currentIdx + 1} / {currentTotal}
            </span>
            <div className="w-28 sm:w-36 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Thông tin bài tập luyện tập */}
        <div className="mb-4 sm:mb-5 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 p-3.5 sm:p-4 rounded-2xl border border-blue-100/80 dark:border-blue-900/40 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {t('flashcards.practiceTitle')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {t('flashcards.practiceDesc')}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] shrink-0 border border-blue-200/60 dark:border-blue-800/60">
            {currentQ?.partNumber === 2 ? 'Dạng 2: Gõ từ' : 'Dạng 1: Trắc nghiệm'}
          </span>
        </div>

        {/* Card câu hỏi tương ứng với 2 dạng */}
        {currentQ && (
          <div className="transition-all duration-200">
            {currentQ.type === 'listening_choice' && (
              <ListeningQuizCard
                question={currentQ}
                onAnswer={handleAnswerQuestion}
                onNext={handleNextQuestion}
                autoPlayAudio={true}
              />
            )}

            {currentQ.type === 'writing_input' && (
              <WritingQuizCard
                question={currentQ}
                onAnswer={handleAnswerQuestion}
                onNext={handleNextQuestion}
                autoPlayAudio={true}
              />
            )}

            {currentQ.type === 'translation_choice' && (
              <TranslationQuizCard
                question={currentQ}
                onAnswer={handleAnswerQuestion}
                onNext={handleNextQuestion}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER GIAI ĐOẠN 1: FLASHCARD REVIEW
  // (Lật thẻ & đánh giá: Quên, Mơ hồ, Nhớ, Rất dễ)
  // ==========================================
  if (!currentItem) {
    return (
      <div className="text-center p-8">
        <p className="text-slate-500 dark:text-slate-400">{t('flashcards.noData')}</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 dark:text-blue-400 font-semibold">
          {t('common.backHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Top bar with back and progress */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('flashcards.exit')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
            {currentIndex + 1} / {items.length}
          </span>
          <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* FLASHCARD CONTAINER */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[320px] sm:min-h-[380px] bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-card cursor-pointer hover:shadow-lg dark:hover:border-slate-700 transition-all flex flex-col justify-between relative group select-none"
      >
        {/* Top Card Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="px-2.5 sm:px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              {deckTitle}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs font-medium uppercase">
              {currentItem.type}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] sm:text-xs font-semibold">
              {currentItem.difficulty_level}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('flashcards.flip')}</span>
          </button>
        </div>

        {/* Center Content */}
        {!isFlipped ? (
          // CARD FRONT: English & Pronunciation
          <div className="py-4 sm:py-6 text-center my-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 sm:mb-3 tracking-tight">
              {currentItem.english_text}
            </h2>
            <p className="text-slate-400 dark:text-slate-500 font-mono text-xs sm:text-sm tracking-wide mb-4 sm:mb-6">
              {currentItem.phonetic_ipa}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <button
                onClick={(e) => handlePlayAudio(currentItem.english_text, e)}
                disabled={isSpeaking}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-colors shadow-xs cursor-pointer"
              >
                <Volume2 className={cn('w-4 h-4', isSpeaking && 'animate-pulse')} />
                <span>{t('flashcards.listen')}</span>
              </button>

              <button
                onClick={(e) => handleSpeechRecognition(currentItem.english_text, e)}
                disabled={isRecording}
                className={cn(
                  'inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-5 sm:py-2.5 font-semibold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-colors shadow-xs cursor-pointer',
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                )}
              >
                <Mic className="w-4 h-4" />
                <span>{isRecording ? t('flashcards.listening') : t('flashcards.speak')}</span>
              </button>
            </div>

            {speechResult && (
              <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs inline-block">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {t('flashcards.youSaid')}{' '}
                </span>
                <span className="text-slate-900 dark:text-white font-medium">
                  "{speechResult.spoken}"
                </span>
                <span
                  className={cn(
                    'ml-2 font-bold px-2 py-0.5 rounded-full text-white text-[11px]',
                    speechResult.score >= 80 ? 'bg-green-500' : speechResult.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                >
                  {speechResult.score}% {t('flashcards.match')}
                </span>
              </div>
            )}
          </div>
        ) : (
          // CARD BACK: Meaning & Examples
          <div className="py-4 sm:py-6 text-center my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              {t('flashcards.vietnameseMeaning')}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4 sm:mb-6">
              {currentItem.vietnamese_meaning}
            </h2>

            {currentItem.example_sentence && (
              <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-3 sm:p-4 text-left border border-slate-100 dark:border-slate-800 mb-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {t('flashcards.exampleContext')}
                  </span>
                  <button
                    onClick={(e) => handlePlayAudio(currentItem.example_sentence, e)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-slate-900 dark:text-white font-semibold text-xs sm:text-sm mb-1">
                  {currentItem.example_sentence}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  {currentItem.example_meaning}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bottom Hint */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500">
          {!isFlipped ? t('flashcards.flipHintFront') : t('flashcards.flipHintBack')}
        </div>
      </div>

      {/* SM-2 RATING BUTTONS */}
      <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <button
          onClick={() => handleRate(0)}
          className="p-3.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/50 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
        >
          <span>{t('flashcards.rateForgot')}</span>
          <span className="text-[11px] font-normal text-red-400 dark:text-red-300">
            {t('flashcards.rateForgotDesc')}
          </span>
        </button>

        <button
          onClick={() => handleRate(1)}
          className="p-3.5 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
        >
          <span>{t('flashcards.rateHard')}</span>
          <span className="text-[11px] font-normal text-amber-500 dark:text-amber-300">
            {t('flashcards.rateHardDesc')}
          </span>
        </button>

        <button
          onClick={() => handleRate(2)}
          className="p-3.5 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
        >
          <span>{t('flashcards.rateGood')}</span>
          <span className="text-[11px] font-normal text-blue-400 dark:text-blue-300">
            {t('flashcards.rateGoodDesc')}
          </span>
        </button>

        <button
          onClick={() => handleRate(3)}
          className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('flashcards.rateEasy')}</span>
          </div>
          <span className="text-[11px] font-normal text-emerald-500 dark:text-emerald-300">
            {t('flashcards.rateEasyDesc')}
          </span>
        </button>
      </div>
    </div>
  );
}
