import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2,
  Mic,
  RotateCw,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LearningItem, ReviewGrade } from '@/types/database';
import {
  ReviewQuestion,
  ReviewAnswerResult,
  ReviewSessionSummary,
  DailyReviewProgress,
  DailyWordReason,
} from '@/types/quiz';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  calculateSM2,
  computeDailySrsBatchFromResults,
  getLocalDateStr,
  SRSItemState,
} from '@/lib/srs';
import { speakText, stopSpeaking, calculateSimilarity } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { generateDailyReviewQuestions } from '@/lib/quizGenerator';
import { ListeningQuizCard } from '@/components/daily/review/ListeningQuizCard';
import { WritingQuizCard } from '@/components/daily/review/WritingQuizCard';
import { TranslationQuizCard } from '@/components/daily/review/TranslationQuizCard';
import { ReviewSummary } from '@/components/daily/review/ReviewSummary';
import { WordReasonBadge } from '@/components/daily/review/WordReasonBadge';
import { QuickDictionaryModal } from '@/components/common/QuickDictionaryModal';

interface FlashcardDeckProps {
  deckTitle: string;
  items: LearningItem[];
  isDaily?: boolean;
  wordReasons?: Record<string, DailyWordReason>;
}

export function FlashcardDeck({ deckTitle, items, isDaily = false, wordReasons }: FlashcardDeckProps) {
  const { user } = useAuth();
  const {
    recordReview,
    addSpeakingTime,
    saveDailyReviewProgress,
    saveDailyReviewProgressLocal,
    applyDailySrsBatch,
  } = useLearningStore();
  const { t, language } = useTranslation();

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
  const [isDictModalOpen, setIsDictModalOpen] = useState(false);

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

  // Ref giữ kết quả mới nhất để tránh stale closure khi lưu tiến trình Daily
  const practiceResultsRef = useRef<Record<string, ReviewAnswerResult>>({});
  const pendingRetryProgressRef = useRef<DailyReviewProgress | null>(null);
  const flashcardGradesRef = useRef<Record<string, ReviewGrade>>({});
  const preSessionReviewsRef = useRef<Record<string, SRSItemState>>({
    ...useLearningStore.getState().reviews,
  });

  const buildDailyProgress = useCallback(
    (latestResults: Record<string, ReviewAnswerResult>): DailyReviewProgress => {
      const todayStr = getLocalDateStr();
      const totalQ = practiceQuestions.length;
      const finalCorrect = Object.values(latestResults).filter((r) => r.isCorrect).length;
      return {
        date: todayStr,
        deckId: 'daily',
        wordIds: practiceWords.map((w) => w.id),
        wordReasons,
        flashcardGrades: { ...flashcardGradesRef.current },
        currentIndex: totalQ,
        totalQuestions: totalQ,
        answeredCount: Object.keys(latestResults).length,
        correctCount: finalCorrect,
        isCompleted: true,
        results: latestResults,
        lastUpdated: new Date().toISOString(),
      };
    },
    [practiceQuestions.length, practiceWords, wordReasons]
  );

  const commitDailySessionSrs = useCallback(
    (latestResults: Record<string, ReviewAnswerResult>) => {
      if (!isDaily) return;
      const updates = computeDailySrsBatchFromResults({
        results: latestResults,
        flashcardGrades: flashcardGradesRef.current,
        baselineReviews: preSessionReviewsRef.current,
      });
      applyDailySrsBatch(updates);
    },
    [isDaily, applyDailySrsBatch]
  );

  const flushPendingRetrySync = useCallback(() => {
    const pending = pendingRetryProgressRef.current;
    if (!pending) return;
    pendingRetryProgressRef.current = null;
    saveDailyReviewProgress(pending, user?.id);
  }, [saveDailyReviewProgress, user?.id]);

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

  // Chuyển sang giai đoạn làm bài tập
  const startPracticeStage = useCallback(() => {
    stopSpeaking();
    const wordsForPractice = items;

    // Sinh danh sách câu hỏi: Mỗi từ có đúng 3 câu hỏi thuộc 2 dạng (Trắc nghiệm & Gõ từ)
    const generatedQuestions = generateDailyReviewQuestions(
      wordsForPractice,
      wordsForPractice.length,
      'shuffled'
    );

    setPracticeWords(wordsForPractice);
    setPracticeQuestions(generatedQuestions);
    setPracticeIndex(0);
    practiceResultsRef.current = {};
    pendingRetryProgressRef.current = null;
    setPracticeResults({});
    setIsRetryingMistakes(false);
    setStep('practice');
  }, [items]);

  // Chuyển sang từ trước đó
  const handlePrevWord = useCallback(() => {
    if (currentIndex > 0) {
      stopSpeaking();
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setSpeechResult(null);
    }
  }, [currentIndex]);

  // Chuyển sang từ kế tiếp (hoặc hoàn tất nếu là từ cuối)
  const handleNextWord = useCallback(() => {
    if (currentIndex + 1 < items.length) {
      stopSpeaking();
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setSpeechResult(null);
    } else {
      startPracticeStage();
    }
  }, [currentIndex, items.length, startPracticeStage]);

  // Xử lý khi người dùng chọn nút đánh giá (Quên, Mơ hồ, Nhớ 3 ngày, Rất dễ 7 ngày)
  const handleRate = (grade: ReviewGrade) => {
    if (!currentItem) return;

    flashcardGradesRef.current[currentItem.id] = grade;

    // 1. Ghi nhận đánh giá vào SM-2 Spaced Repetition (tính từ baseline trước phiên để không cộng dồn khi lùi lại chọn lại)
    if (isDaily) {
      const baseSrs = preSessionReviewsRef.current[currentItem.id] || {
        repetitions: 0,
        interval_days: 1,
        ease_factor: 2.5,
        next_review_at: new Date().toISOString(),
        last_quality: 0,
      };
      const nextSrs = calculateSM2(grade, baseSrs);
      applyDailySrsBatch({ [currentItem.id]: nextSrs });

      if (user?.id) {
        api.progress
          .record({
            itemId: currentItem.id,
            repetitions: nextSrs.repetitions,
            intervalDays: nextSrs.interval_days,
            easeFactor: nextSrs.ease_factor,
            nextReviewAt: nextSrs.next_review_at,
            lastQuality: grade,
            date: getLocalDateStr(),
          })
          .catch(() => {});
      }

      const todayStr = getLocalDateStr();
      const storeState = useLearningStore.getState();
      const existingDaily = storeState.dailyReviewProgress[todayStr];
      saveDailyReviewProgressLocal({
        date: todayStr,
        deckId: 'daily',
        wordIds: existingDaily?.wordIds?.length ? existingDaily.wordIds : items.map((w) => w.id),
        wordReasons: wordReasons || existingDaily?.wordReasons,
        flashcardGrades: { ...flashcardGradesRef.current },
        currentIndex: existingDaily?.currentIndex ?? 0,
        totalQuestions: existingDaily?.totalQuestions ?? items.length * 3,
        answeredCount: existingDaily?.answeredCount ?? 0,
        correctCount: existingDaily?.correctCount ?? 0,
        isCompleted: existingDaily?.isCompleted ?? false,
        results: existingDaily?.results ?? {},
        lastUpdated: new Date().toISOString(),
      });
    } else {
      recordReview(currentItem.id, grade, user?.id, false);
    }

    const updatedRated = new Map(ratedWordsMap);
    updatedRated.set(currentItem.id, { item: currentItem, grade });
    setRatedWordsMap(updatedRated);

    setIsFlipped(false);
    setSpeechResult(null);
    stopSpeaking();

    // 2. Nếu còn thẻ tiếp theo: chuyển sang thẻ kế tiếp
    if (currentIndex + 1 < items.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      startPracticeStage();
    }
  };

  // Hỗ trợ phím tắt chuyển từ qua lại (←, →), lật thẻ (Space) và đánh giá (1, 2, 3, 4)
  useEffect(() => {
    if (step !== 'flashcard') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevWord();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextWord();
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === '1') {
        handleRate(0);
      } else if (e.key === '2') {
        handleRate(1);
      } else if (e.key === '3') {
        handleRate(2);
      } else if (e.key === '4') {
        handleRate(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, handlePrevWord, handleNextWord]);

  // Dọn dẹp âm thanh và đồng bộ kết quả retry còn pending khi unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      flushPendingRetrySync();
    };
  }, [flushPendingRetrySync]);

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

    const nextResults = {
      ...practiceResultsRef.current,
      [activePracticeQuestion.id]: answerRecord,
    };
    practiceResultsRef.current = nextResults;
    setPracticeResults(nextResults);

    // Khi đang làm lại các câu sai ở Daily Routine, cập nhật ngay vào store để không bị mất khi quay lại trang chủ
    if (isDaily && isRetryingMistakes) {
      const updatedProgress = buildDailyProgress(nextResults);
      saveDailyReviewProgressLocal(updatedProgress);
      pendingRetryProgressRef.current = updatedProgress;
    }
  };

  // Chuyển sang câu hỏi bài tập tiếp theo
  const handleNextQuestion = () => {
    // A. Nếu đang ở chế độ làm lại các câu bị sai
    if (isRetryingMistakes) {
      if (retryIndex + 1 < retryQuestions.length) {
        setRetryIndex((prev) => prev + 1);
      } else {
        // Đã hoàn thành ôn tập lại các câu sai -> Lưu kết quả & SRS đã cập nhật và về màn hình tổng kết
        if (isDaily) {
          commitDailySessionSrs(practiceResultsRef.current);
          const finalProgress = buildDailyProgress(practiceResultsRef.current);
          pendingRetryProgressRef.current = null;
          saveDailyReviewProgress(finalProgress, user?.id);
        }
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

      // Lưu kết quả & SRS hoàn thành bài tập vào database nếu là Daily Routine
      if (isDaily) {
        commitDailySessionSrs(practiceResultsRef.current);
        const progress = buildDailyProgress(practiceResultsRef.current);
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
    practiceResultsRef.current = {};
    pendingRetryProgressRef.current = null;
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
    flushPendingRetrySync();
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
          wordReasons={wordReasons}
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
      <div className="max-w-4xl mx-auto py-6 px-4 animate-in fade-in duration-300">
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
              {/* <Sparkles className="w-4 h-4" /> */}
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
                key={`${currentQ.id}-${isRetryingMistakes ? 'retry' : 'normal'}`}
                question={currentQ}
                onAnswer={handleAnswerQuestion}
                onNext={handleNextQuestion}
                autoPlayAudio={true}
              />
            )}

            {currentQ.type === 'writing_input' && (
              <WritingQuizCard
                key={`${currentQ.id}-${isRetryingMistakes ? 'retry' : 'normal'}`}
                question={currentQ}
                onAnswer={handleAnswerQuestion}
                onNext={handleNextQuestion}
                autoPlayAudio={true}
              />
            )}

            {currentQ.type === 'translation_choice' && (
              <TranslationQuizCard
                key={`${currentQ.id}-${isRetryingMistakes ? 'retry' : 'normal'}`}
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

  const currentRatedGrade = currentItem ? ratedWordsMap.get(currentItem.id)?.grade : undefined;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Top bar with back, navigation and progress */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold text-xs sm:text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('flashcards.exit')}</span>
        </Link>

        {/* Navigation buttons & Progress Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handlePrevWord}
            disabled={currentIndex === 0}
            className="p-1 sm:p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Từ trước (Phím ←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[48px] text-center">
            {currentIndex + 1} / {items.length}
          </span>

          <button
            type="button"
            onClick={handleNextWord}
            className="p-1 sm:p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title={currentIndex + 1 < items.length ? 'Từ tiếp theo (Phím →)' : 'Chuyển sang làm bài tập'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-20 sm:w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ml-1">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* FLASHCARD CONTAINER WITH SIDE BUTTONS */}
      <div className="relative">
        {/* Floating Side Button: Prev Word */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevWord();
            }}
            className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 items-center justify-center transition-all cursor-pointer z-10 hover:scale-105 active:scale-95"
            title="Từ trước (Phím ←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Floating Side Button: Next Word */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNextWord();
          }}
          className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 items-center justify-center transition-all cursor-pointer z-10 hover:scale-105 active:scale-95"
          title={currentIndex + 1 < items.length ? 'Từ tiếp theo (Phím →)' : 'Chuyển sang làm bài tập'}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* CARD CONTAINER */}
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
              {isDaily && wordReasons?.[currentItem.id] && (
                <WordReasonBadge reason={wordReasons[currentItem.id]} />
              )}
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs font-medium uppercase">
                {currentItem.details?.part_of_speech || currentItem.type}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] sm:text-xs font-semibold">
                {currentItem.difficulty_level}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Nút tra nhanh từ điển theo ngôn ngữ hiển thị */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDictModalOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                title={t('flashcards.dictionary')}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">{t('flashcards.dictionary')}</span>
              </button>

              <button
                type="button"
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
            // CARD BACK: Meaning, Usage, Collocations & Full Details
            (() => {
              const details = currentItem.details;
              const isVi = language === 'vi';
              const langNode = isVi ? (details?.vi || details) : (details?.en || details);

              const usageNote: string = (langNode as any)?.usage_note || details?.usage_note || (isVi ? details?.vi?.usage_note : details?.en?.usage_note) || '';
              const definition: string = (langNode as any)?.definition || (langNode as any)?.meaning || details?.definition || (isVi ? details?.vi?.meaning : details?.en?.definition) || '';
              const collocations: string[] = (langNode as any)?.collocations || details?.collocations || details?.vi?.collocations || details?.en?.collocations || [];
              const synonyms: string[] = (langNode as any)?.synonyms || details?.synonyms || details?.vi?.synonyms || details?.en?.synonyms || [];
              const antonyms: string[] = (langNode as any)?.antonyms || details?.antonyms || details?.vi?.antonyms || details?.en?.antonyms || [];
              const moreExamples = details?.more_examples || [];

              const hasDetail = Boolean(
                details &&
                (
                  usageNote ||
                  collocations.length > 0 ||
                  synonyms.length > 0 ||
                  antonyms.length > 0 ||
                  moreExamples.length > 0 ||
                  definition ||
                  details.part_of_speech
                )
              );

              return (
                <div className="py-2 sm:py-3 animate-in fade-in zoom-in-95 duration-200 my-auto w-full">
                  <div
                    className="max-h-[460px] sm:max-h-[520px] overflow-y-auto space-y-3.5 px-1 py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 1. Nghĩa tiếng Việt & Định nghĩa */}
                    <div className="text-center">
                      <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        {t('flashcards.vietnameseMeaning')}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                        {currentItem.vietnamese_meaning}
                      </h2>
                      {definition && definition !== currentItem.vietnamese_meaning && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-1 max-w-2xl mx-auto bg-slate-50 dark:bg-slate-800/40 py-1 px-3 rounded-lg border border-slate-100 dark:border-slate-800 inline-block">
                          "{definition}"
                        </p>
                      )}
                    </div>

                    {/* 2. Ngữ cảnh sử dụng (Usage Note) */}
                    {usageNote && (
                      <div className="flex items-start gap-2 p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl text-xs text-amber-900 dark:text-amber-200 text-left w-full max-w-2xl sm:max-w-3xl mx-auto shadow-2xs">
                        <span className="shrink-0 text-base">💡</span>
                        <div className="space-y-0.5">
                          <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                            Ngữ cảnh sử dụng:
                          </span>
                          <p className="leading-relaxed font-medium">{usageNote}</p>
                        </div>
                      </div>
                    )}

                    {/* 3. Cụm từ thường gặp (Collocations) */}
                    {collocations && collocations.length > 0 && (
                      <div className="w-full max-w-2xl sm:max-w-3xl mx-auto text-left">
                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Cụm từ thường gặp (Collocations)</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{collocations.length} cụm</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {collocations.map((col: string, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/90 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer group shadow-2xs"
                              title="Bấm để nghe phát âm"
                            >
                              {/* <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" /> */}
                              <span>{col}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Từ đồng nghĩa & Trái nghĩa (Synonyms & Antonyms) */}
                    {((synonyms && synonyms.length > 0) || (antonyms && antonyms.length > 0)) && (
                      <div className="flex flex-wrap items-center justify-center gap-2 text-xs w-full max-w-2xl sm:max-w-3xl mx-auto">
                        {synonyms && synonyms.length > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-400 text-[11px]">Đồng nghĩa:</span>
                            <span className="font-medium">{synonyms.join(', ')}</span>
                          </div>
                        )}
                        {antonyms && antonyms.length > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                            <span className="font-bold text-rose-500 text-[11px]">Trái nghĩa:</span>
                            <span className="font-medium">{antonyms.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. CÂU VÍ DỤ: Nếu có detail -> không hiện example_sentence gốc; nếu không có detail -> hiện example_sentence */}
                    {hasDetail ? (
                      /* CÓ DETAIL: Chỉ hiển thị more_examples nếu có */
                      moreExamples.length > 0 && (
                        <div className="space-y-2.5 w-full max-w-2xl sm:max-w-3xl mx-auto text-left pt-1">
                          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {t('flashcards.exampleContext')}
                          </div>
                          {moreExamples.map((ex, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800/90 space-y-1 shadow-2xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                  Ví dụ {idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayAudio(ex.en, e);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                  title="Nghe câu ví dụ"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 font-semibold text-xs leading-relaxed">
                                {ex.en}
                              </p>
                              {ex.vi && (
                                <p className="text-slate-500 dark:text-slate-400 text-xs leading-normal">
                                  → {ex.vi}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      /* KHÔNG CÓ DETAIL: Hiển thị example_sentence mặc định */
                      currentItem.example_sentence && (
                        <div className="space-y-2.5 w-full max-w-2xl sm:max-w-3xl mx-auto text-left pt-1">
                          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {t('flashcards.exampleContext')}
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                                Ví dụ ngữ cảnh
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayAudio(currentItem.example_sentence, e);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                title="Nghe câu ví dụ"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-slate-900 dark:text-white font-semibold text-xs sm:text-sm leading-relaxed">
                              {currentItem.example_sentence}
                            </p>
                            {currentItem.example_meaning && (
                              <p className="text-slate-500 dark:text-slate-400 text-xs leading-normal">
                                → {currentItem.example_meaning}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })()
          )}

          {/* Bottom Hint */}
          <div className="text-center text-xs text-slate-400 dark:text-slate-500">
            {!isFlipped ? t('flashcards.flipHintFront') : t('flashcards.flipHintBack')}
          </div>
        </div>
      </div>

      {/* BOTTOM NAVIGATOR BAR */}
      <div className="flex items-center justify-between gap-3 mt-4">
        <button
          type="button"
          onClick={handlePrevWord}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('collectionStudy.prevCard') || 'Từ trước'}</span>
        </button>

        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
          {t('flashcards.keyboardShortcutsHint')}
        </span>

        {currentIndex + 1 < items.length ? (
          <button
            type="button"
            onClick={handleNextWord}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <span>{t('collectionStudy.nextCard') || 'Từ tiếp theo'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startPracticeStage}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <span>{t('collectionStudy.startQuizQuickBtn') || 'Làm bài tập'}</span>
            {/* <Sparkles className="w-3.5 h-3.5" /> */}
          </button>
        )}
      </div>

      {/* SM-2 RATING BUTTONS */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <button
          onClick={() => handleRate(0)}
          className={cn(
            'p-3.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/50 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer relative',
            currentRatedGrade === 0 && 'ring-2 ring-red-500 bg-red-100 dark:bg-red-900/50 font-bold'
          )}
        >
          <div className="flex items-center gap-1">
            {currentRatedGrade === 0 && <Check className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
            <span>{t('flashcards.rateForgot')}</span>
          </div>
          <span className="text-[11px] font-normal text-red-400 dark:text-red-300">
            {t('flashcards.rateForgotDesc')}
          </span>
        </button>

        <button
          onClick={() => handleRate(1)}
          className={cn(
            'p-3.5 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer relative',
            currentRatedGrade === 1 && 'ring-2 ring-amber-500 bg-amber-100 dark:bg-amber-900/50 font-bold'
          )}
        >
          <div className="flex items-center gap-1">
            {currentRatedGrade === 1 && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            <span>{t('flashcards.rateHard')}</span>
          </div>
          <span className="text-[11px] font-normal text-amber-500 dark:text-amber-300">
            {t('flashcards.rateHardDesc')}
          </span>
        </button>

        <button
          onClick={() => handleRate(2)}
          className={cn(
            'p-3.5 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer relative',
            currentRatedGrade === 2 && 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/50 font-bold'
          )}
        >
          <div className="flex items-center gap-1">
            {currentRatedGrade === 2 && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            <span>{t('flashcards.rateGood')}</span>
          </div>
          <span className="text-[11px] font-normal text-blue-400 dark:text-blue-300">
            {t('flashcards.rateGoodDesc')}
          </span>
        </button>

        <button
          onClick={() => handleRate(3)}
          className={cn(
            'p-3.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer relative',
            currentRatedGrade === 3 && 'ring-2 ring-emerald-500 bg-emerald-100 dark:bg-emerald-900/50 font-bold'
          )}
        >
          <div className="flex items-center gap-1">
            {currentRatedGrade === 3 && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            {/* <Sparkles className="w-3.5 h-3.5" /> */}
            <span>{t('flashcards.rateEasy')}</span>
          </div>
          <span className="text-[11px] font-normal text-emerald-500 dark:text-emerald-300">
            {t('flashcards.rateEasyDesc')}
          </span>
        </button>
      </div>

      {/* Tra cứu nhanh từ điển Song ngữ Anh - Việt */}
      <QuickDictionaryModal
        word={currentItem?.english_text || ''}
        vietnameseMeaning={currentItem?.vietnamese_meaning}
        exampleSentence={currentItem?.example_sentence}
        exampleMeaning={currentItem?.example_meaning}
        details={currentItem?.details}
        isOpen={isDictModalOpen}
        onClose={() => setIsDictModalOpen(false)}
      />
    </div>
  );
}
