import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Headphones,
  PenTool,
  Languages,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  PlayCircle,
  Award,
  Lock,
} from 'lucide-react';
import { LearningItem } from '@/types/database';
import {
  ReviewQuestion,
  ReviewAnswerResult,
  ReviewSessionSummary,
  DailyReviewProgress,
} from '@/types/quiz';
import { generateDailyReviewQuestions } from '@/lib/quizGenerator';
import { ListeningQuizCard } from '@/components/daily/review/ListeningQuizCard';
import { WritingQuizCard } from '@/components/daily/review/WritingQuizCard';
import { TranslationQuizCard } from '@/components/daily/review/TranslationQuizCard';
import { ReviewSummary } from '@/components/daily/review/ReviewSummary';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { api } from '@/lib/api';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import dailyItemsJson from '@/data/dailyItems.json';

export default function DailyReviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
    todayGoal,
    recordReviewLocal,
    setTodayLearned,
    getTodayReviewProgress,
    saveDailyReviewProgressLocal,
    saveDailyReviewProgress,
    resetDailyReviewProgress,
  } = useLearningStore();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<LearningItem[]>([]);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<string, ReviewAnswerResult>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [resumedFromPrevious, setResumedFromPrevious] = useState(false);

  // Chế độ ôn tập riêng các câu trả lời sai
  const [isRetryingMistakes, setIsRetryingMistakes] = useState(false);
  const [retryQuestions, setRetryQuestions] = useState<ReviewQuestion[]>([]);
  const [retryIndex, setRetryIndex] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Ref quản lý gom đệm đồng bộ server (Local-first & Batch Sync)
  const pendingSyncProgressRef = useRef<DailyReviewProgress | null>(null);
  const questionsSinceLastSyncRef = useRef<number>(0);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hàm đẩy đệm đồng bộ lên server (chỉ gọi khi đủ 5 câu, sau 3s dừng, hoặc khi kết thúc bài)
  const flushServerSync = useCallback(
    (customProgress?: DailyReviewProgress) => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }

      const toSync = customProgress || pendingSyncProgressRef.current;
      if (!toSync) return;

      questionsSinceLastSyncRef.current = 0;
      pendingSyncProgressRef.current = null;

      if (user?.id) {
        api.progress.saveDailyReview(toSync).catch((err) => {
          console.warn('Background batch sync failed:', err);
        });
      }
    },
    [user?.id]
  );

  // Tự động đẩy tiến trình lên server khi rời trang hoặc ẩn tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushServerSync();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushServerSync();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushServerSync();
    };
  }, [flushServerSync]);

  // 1. Tải danh sách 20 từ vựng và khôi phục tiến trình (từ client store hoặc server)
  useEffect(() => {
    let mounted = true;

    async function initializeSession() {
      try {
        setLoading(true);

        // A. Tải toàn bộ kho từ vựng giao tiếp hàng ngày
        const deckData = await api.decks.getById('daily');
        const items = deckData?.flashcards || deckData?.items || [];
        const sourceItems = items.length > 0 ? items : (dailyItemsJson as LearningItem[]);
        // Khách (chưa đăng nhập): giới hạn học thử 5 từ mới
        const targetCount = !user ? 5 : Math.max(todayGoal || 20, 20);

        // B. Kiểm tra tiến trình đã lưu trước đó (Client LocalStorage trước)
        let savedProgress: DailyReviewProgress | null = getTodayReviewProgress(todayStr);

        // Nếu người dùng đã đăng nhập và local chưa có tiến trình, tải từ server
        if (user && (!savedProgress || savedProgress.answeredCount === 0)) {
          try {
            const serverProgress = await api.progress.getDailyReview(todayStr);
            if (serverProgress && serverProgress.answeredCount > 0) {
              savedProgress = serverProgress;
              // Đồng bộ về local store
              await saveDailyReviewProgress(serverProgress, user.id);
            }
          } catch (_) {}
        }

        // C. Chọn danh sách từ vựng thông minh cho ngày hôm nay (không trùng từ hôm qua)
        let selectedWords: LearningItem[] = [];

        // 1. Nếu hôm nay ĐÃ CÓ phiên học trước đó và đã có wordIds:
        if (savedProgress && savedProgress.wordIds && savedProgress.wordIds.length > 0) {
          const wordIdSet = new Set(savedProgress.wordIds);
          selectedWords = sourceItems.filter((item) => wordIdSet.has(item.id));
        }

        // 2. Nếu hôm nay là phiên MỚI: Chọn 20 từ mới tiếp theo chưa từng học ở các ngày trước
        if (selectedWords.length < targetCount) {
          const storeState = useLearningStore.getState();
          const reviews = storeState.reviews || {};
          const dailyProgress = storeState.dailyReviewProgress || {};

          // Tập hợp tất cả các từ đã học từ các ngày trước
          const learnedWordIds = new Set<string>();
          Object.keys(reviews).forEach((id) => learnedWordIds.add(id));
          Object.entries(dailyProgress).forEach(([date, prog]) => {
            if (date !== todayStr && prog?.wordIds) {
              prog.wordIds.forEach((id) => learnedWordIds.add(id));
            }
          });

          // Lọc ra các từ hoàn toàn MỚI chưa học
          const unlearnedWords = sourceItems.filter((item) => !learnedWordIds.has(item.id));

          // Lọc ra các từ ĐẾN HẠN ôn tập Spaced Repetition (SRS)
          const now = new Date();
          const dueWords = sourceItems.filter((item) => {
            const rev = reviews[item.id];
            return rev && rev.next_review_at && new Date(rev.next_review_at) <= now;
          });

          const candidates: LearningItem[] = [];

          // Ưu tiên 1: Lấy các từ mới chưa học tiếp theo trong kho từ
          if (unlearnedWords.length >= targetCount) {
            candidates.push(...unlearnedWords.slice(0, targetCount));
          } else {
            // Nếu số từ mới còn ít: lấy hết từ mới còn lại + bổ sung từ đến hạn ôn tập
            candidates.push(...unlearnedWords);
            const needed = targetCount - candidates.length;
            const dueAvailable = dueWords.filter((w) => !candidates.some((c) => c.id === w.id));
            candidates.push(...dueAvailable.slice(0, needed));

            // Nếu vẫn chưa đủ (đã học hết kho từ): lấy lại các từ cũ để củng cố
            if (candidates.length < targetCount) {
              const remainingNeeded = targetCount - candidates.length;
              const otherWords = sourceItems.filter((w) => !candidates.some((c) => c.id === w.id));
              candidates.push(...otherWords.slice(0, remainingNeeded));
            }
          }

          selectedWords = candidates.slice(0, targetCount);
        }

        // D. Sinh câu hỏi xáo trộn random bất kỳ (mỗi từ ~ 3 câu hỏi)
        const generated = generateDailyReviewQuestions(selectedWords, targetCount, 'shuffled');

        if (mounted) {
          setWords(selectedWords);
          setQuestions(generated);

          // D. Khôi phục trạng thái làm bài dở hoặc đã hoàn thành
          if (savedProgress && savedProgress.answeredCount > 0) {
            setResults(savedProgress.results || {});

            if (savedProgress.isCompleted) {
              setIsCompleted(true);
            } else {
              // Tiếp tục tại câu hỏi chưa làm
              const resumeIdx = Math.min(
                savedProgress.currentIndex || 0,
                generated.length - 1
              );
              setCurrentIndex(resumeIdx);
              setResumedFromPrevious(true);
            }

            // Tính số từ vựng duy nhất thực tế người dùng đã trả lời trong bài hôm nay
            if (savedProgress.results && Object.keys(savedProgress.results).length > 0) {
              const uniqueWords = new Set(
                Object.values(savedProgress.results)
                  .map((r: any) => r.question?.wordId || r.questionId)
                  .filter(Boolean)
              ).size;
              setTodayLearned(Math.min(todayGoal || 20, uniqueWords));
            } else if (savedProgress.wordIds && savedProgress.wordIds.length > 0) {
              setTodayLearned(Math.min(todayGoal || 20, savedProgress.wordIds.length));
            }
          }
        }
      } catch (err) {
        console.warn('Lỗi khi khởi tạo phiên ôn tập:', err);
        if (mounted) {
          const fallbackCount = !user ? 5 : 20;
          const fallback = (dailyItemsJson as LearningItem[]).slice(0, fallbackCount);
          setWords(fallback);
          setQuestions(generateDailyReviewQuestions(fallback, fallbackCount, 'shuffled'));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeSession();
    return () => {
      mounted = false;
    };
  }, [todayGoal, todayStr, user?.id, user]);

  // Câu hỏi hiện tại (nếu đang ở chế độ làm lại câu sai thì lấy từ retryQuestions)
  const activeQuestion = isRetryingMistakes
    ? retryQuestions[retryIndex]
    : questions[currentIndex];

  const totalQuestions = questions.length || 60;
  const answeredCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter((r) => r.isCorrect).length;

  // 2. Xử lý khi người dùng trả lời 1 câu hỏi -> Lưu ngay vào Local, gom đệm đồng bộ server
  const handleQuestionAnswer = (isCorrect: boolean, userAnswer: string) => {
    if (!activeQuestion) return;

    const answerRecord: ReviewAnswerResult = {
      questionId: activeQuestion.id,
      isCorrect,
      userAnswer,
      correctAnswer: activeQuestion.targetWord,
      question: activeQuestion,
    };

    // Luôn ghi đè / cập nhật vào bảng kết quả tổng thể 60 câu
    const newResults = {
      ...results,
      [activeQuestion.id]: answerRecord,
    };

    setResults(newResults);

    // Cập nhật SRS review cho từ này ở LocalStore (isDaily = true)
    recordReviewLocal(activeQuestion.wordId, isCorrect ? 2 : 0, true);

    // Điểm số mới trong toàn bộ 60 câu
    const newCorrectCount = Object.values(newResults).filter((r) => r.isCorrect).length;
    const newAnsweredCount = Object.keys(newResults).length;

    // Cập nhật tiến độ Daily Goal theo số từ vựng duy nhất thực tế đã làm trong bài Daily hôm nay
    const uniqueWordsAnswered = new Set(
      Object.values(newResults)
        .map((r) => r.question?.wordId || (r as any).questionId)
        .filter(Boolean)
    ).size;
    setTodayLearned(Math.min(todayGoal || 20, uniqueWordsAnswered));

    // Tiến trình tổng thể (luôn lưu trên tổng 60 câu)
    const updatedProgress: DailyReviewProgress = {
      date: todayStr,
      deckId: 'daily',
      wordIds: words.map((w) => w.id),
      // Nếu đang retry câu sai thì giữ currentIndex ở 60, nếu bình thường thì lưu vị trí câu hiện tại
      currentIndex: isRetryingMistakes ? totalQuestions : currentIndex,
      totalQuestions: totalQuestions, // Luôn luôn là 60 câu
      answeredCount: isRetryingMistakes ? totalQuestions : newAnsweredCount,
      correctCount: newCorrectCount,
      isCompleted: isRetryingMistakes ? true : newAnsweredCount >= totalQuestions,
      results: newResults, // Chứa đầy đủ 60 câu với câu vừa sửa
      lastUpdated: new Date().toISOString(),
    };

    // A. LƯU NGAY VÀO LOCALSTORAGE QUA ZUSTAND (0ms, offline-first)
    saveDailyReviewProgressLocal(updatedProgress);

    // B. GOM ĐỆM ĐỒNG BỘ LÊN SERVER (BATCH SYNC & DEBOUNCE)
    pendingSyncProgressRef.current = updatedProgress;
    questionsSinceLastSyncRef.current += 1;

    // Nếu đã làm 5 câu liên tục mà chưa gửi request -> gửi ngay 1 batch request
    if (questionsSinceLastSyncRef.current >= 5) {
      flushServerSync();
    } else {
      // Nếu chưa đủ 5 câu: debounce 3 giây (khi người học dừng lại suy nghĩ thì mới gửi âm thầm)
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        flushServerSync();
      }, 3000);
    }
  };

  // 3. Chuyển sang câu hỏi tiếp theo
  const handleNext = () => {
    // A. Nếu đang ở chế độ làm lại các câu sai
    if (isRetryingMistakes) {
      if (retryIndex + 1 < retryQuestions.length) {
        setRetryIndex((prev) => prev + 1);
      } else {
        // Đã hoàn thành ôn tập lại toàn bộ danh sách câu sai!
        setIsRetryingMistakes(false);
        setIsCompleted(true);

        // Lưu cập nhật cuối cùng cho toàn bộ 60 câu: BATCH SYNC 1 LẦN DUY NHẤT LÊN SERVER
        const finalCorrectCount = Object.values(results).filter((r) => r.isCorrect).length;
        const finalProgress: DailyReviewProgress = {
          date: todayStr,
          deckId: 'daily',
          wordIds: words.map((w) => w.id),
          currentIndex: totalQuestions,
          totalQuestions: totalQuestions,
          answeredCount: totalQuestions,
          correctCount: finalCorrectCount,
          isCompleted: true,
          results: results,
          lastUpdated: new Date().toISOString(),
        };
        saveDailyReviewProgressLocal(finalProgress);
        flushServerSync(finalProgress);
      }
      return;
    }

    // B. Chế độ làm 60 câu thông thường
    if (currentIndex + 1 < totalQuestions) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);

      // Cập nhật vị trí currentIndex vào LocalStorage (0ms, KHÔNG GỌI API)
      const updatedProgress: DailyReviewProgress = {
        date: todayStr,
        deckId: 'daily',
        wordIds: words.map((w) => w.id),
        currentIndex: nextIdx,
        totalQuestions: totalQuestions,
        answeredCount: Object.keys(results).length,
        correctCount: Object.values(results).filter((r) => r.isCorrect).length,
        isCompleted: false,
        results: results,
        lastUpdated: new Date().toISOString(),
      };
      saveDailyReviewProgressLocal(updatedProgress);
      pendingSyncProgressRef.current = updatedProgress;
    } else {
      setIsCompleted(true);
      // Đã hoàn tất toàn bộ 60 câu: GỬI BATCH SYNC 1 LẦN DUY NHẤT LÊN SERVER
      const finalProgress: DailyReviewProgress = {
        date: todayStr,
        deckId: 'daily',
        wordIds: words.map((w) => w.id),
        currentIndex: totalQuestions,
        totalQuestions: totalQuestions,
        answeredCount: totalQuestions,
        correctCount: Object.values(results).filter((r) => r.isCorrect).length,
        isCompleted: true,
        results: results,
        lastUpdated: new Date().toISOString(),
      };
      saveDailyReviewProgressLocal(finalProgress);
      flushServerSync(finalProgress);
    }
  };

  // 4. Tính toán thống kê kết quả bài thi dựa trên toàn bộ 60 câu
  const sessionSummary: ReviewSessionSummary = useMemo(() => {
    const total = questions.length || 60;
    const correct = questions.filter((q) => results[q.id]?.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    const byPart = {
      listening: { total: 0, correct: 0 },
      writing: { total: 0, correct: 0 },
      translation: { total: 0, correct: 0 },
    };

    questions.forEach((q) => {
      byPart[q.part].total++;
      if (results[q.id]?.isCorrect) {
        byPart[q.part].correct++;
      }
    });

    // Chỉ lấy các câu hiện tại vẫn còn sai
    const wrongAnswers = questions
      .filter((q) => results[q.id] && !results[q.id].isCorrect)
      .map((q) => results[q.id]);

    return {
      totalQuestions: total,
      correctCount: correct,
      accuracy,
      byPart,
      wrongAnswers,
    };
  }, [questions, results]);

  // 5. Làm lại toàn bộ 60 câu -> Reset tiến trình trên client và server
  const handleRestartAll = async () => {
    // Hủy bỏ bất kỳ timer đồng bộ đang chờ nào để tránh lưu đè dữ liệu cũ
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    pendingSyncProgressRef.current = null;
    questionsSinceLastSyncRef.current = 0;

    // Xóa tiến trình cũ trên client và server
    await resetDailyReviewProgress(todayStr, user?.id);
    setTodayLearned(0);

    setResults({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setIsRetryingMistakes(false);
    setResumedFromPrevious(false);

    // Sinh bộ câu hỏi mới xáo trộn ngẫu nhiên với các phương án nhiễu mới
    const freshQuestions = generateDailyReviewQuestions(words, 20, 'shuffled');
    setQuestions(freshQuestions);
  };

  // 6. Ôn tập lại các câu đã làm sai (Không xóa tiến trình 60 câu, chỉ cập nhật thêm)
  const handleRetryMistakes = () => {
    const wrongQs = sessionSummary.wrongAnswers.map((w) => w.question);
    if (wrongQs.length === 0) return;

    setRetryQuestions(wrongQs);
    setRetryIndex(0);
    setIsRetryingMistakes(true);
    setIsCompleted(false);
    setResumedFromPrevious(false);
  };

  // 7. Thống kê tiến độ từng phần
  const listeningTotal = useMemo(() => questions.filter((q) => q.partNumber === 1).length, [questions]);
  const writingTotal = useMemo(() => questions.filter((q) => q.partNumber === 2).length, [questions]);
  const translationTotal = useMemo(() => questions.filter((q) => q.partNumber === 3).length, [questions]);

  const listeningDone = useMemo(
    () => questions.filter((q) => q.partNumber === 1 && results[q.id]?.isCorrect).length,
    [questions, results]
  );
  const writingDone = useMemo(
    () => questions.filter((q) => q.partNumber === 2 && results[q.id]?.isCorrect).length,
    [questions, results]
  );
  const translationDone = useMemo(
    () => questions.filter((q) => q.partNumber === 3 && results[q.id]?.isCorrect).length,
    [questions, results]
  );

  // Nhảy tới câu chưa làm tiếp theo của phần này
  const jumpToPart = (partNum: 1 | 2 | 3) => {
    if (isRetryingMistakes) return;

    const nextUnanswered = questions.findIndex(
      (q) => q.partNumber === partNum && !results[q.id]
    );
    if (nextUnanswered !== -1) {
      setCurrentIndex(nextUnanswered);
      return;
    }
    const firstOfPart = questions.findIndex((q) => q.partNumber === partNum);
    if (firstOfPart !== -1) {
      setCurrentIndex(firstOfPart);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {t('dailyReview.loadingSession')}
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
        <p className="text-slate-500">{t('dailyReview.noWordsFound')}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.backHome')}</span>
        </Link>
      </div>
    );
  }

  // Nếu đã làm xong toàn bộ câu hỏi (khi không ở chế độ retry)
  if (isCompleted && !isRetryingMistakes) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <ReviewSummary
          summary={sessionSummary}
          words={words}
          onRestartAll={handleRestartAll}
          onRetryMistakes={handleRetryMistakes}
        />
      </div>
    );
  }

  // Tính tỷ lệ % tiến độ hiển thị
  const progressPercent = isRetryingMistakes
    ? Math.round(((retryIndex + 1) / retryQuestions.length) * 100)
    : Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className="max-w-3xl mx-auto py-3 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs shrink-0"
            title={t('common.backHome')}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 truncate">
              <span>{isRetryingMistakes ? t('dailyReview.retryTitle') : t('dailyReview.pageTitle', { count: words.length })}</span>
              <span
                className={cn(
                  'text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                  isRetryingMistakes
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                    : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                )}
              >
                {isRetryingMistakes
                  ? `${retryIndex + 1}/${retryQuestions.length}`
                  : `${totalQuestions} câu`}
              </span>
            </h1>
            <p className="text-xs text-slate-400 truncate">
              {isRetryingMistakes
                ? 'Trả lời đúng sẽ cập nhật trực tiếp vào tiến độ'
                : activeQuestion?.partTitle}
            </p>
          </div>
        </div>

        {/* Audio Toggle, Action Buttons & Live Score */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {isRetryingMistakes ? (
            <button
              type="button"
              onClick={() => {
                setIsRetryingMistakes(false);
                setIsCompleted(true);
              }}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Quay lại bảng điểm tổng kết"
            >
              <span>Về bảng điểm</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRestartAll}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Bắt đầu lại từ câu 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Làm lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setAutoPlayAudio(!autoPlayAudio)}
            className={cn(
              'p-2 sm:p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer',
              autoPlayAudio
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            )}
            title={autoPlayAudio ? 'Tự động phát âm thanh: BẬT' : 'Tự động phát âm thanh: TẮT'}
          >
            {autoPlayAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{autoPlayAudio ? 'Âm thanh' : 'Tắt âm'}</span>
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {correctCount}/{totalQuestions}
            </span>
          </div>
        </div>
      </div>

      {/* Banner thông báo chế độ ôn lại câu sai */}
      {isRetryingMistakes && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Đang ôn lại <strong>{retryQuestions.length} câu sai</strong> ({correctCount}/{totalQuestions} đúng).
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsRetryingMistakes(false);
              setIsCompleted(true);
            }}
            className="text-amber-700 dark:text-amber-400 hover:underline font-bold ml-2 shrink-0 cursor-pointer"
          >
            Dừng
          </button>
        </div>
      )}

      {/* Banner thông báo tiếp tục tiến trình cũ (nếu có và không ở chế độ retry) */}
      {!isRetryingMistakes && resumedFromPrevious && answeredCount > 0 && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs text-blue-800 dark:text-blue-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Đã khôi phục: <strong>Câu {currentIndex + 1}</strong> ({answeredCount}/{totalQuestions}).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setResumedFromPrevious(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Guest Mode Notice */}
      {!user && !isRetryingMistakes && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">
              Chế độ khách: Bài ôn tập giới hạn <strong>5 từ ({totalQuestions} câu)</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline shrink-0 ml-2 cursor-pointer"
          >
            Mở khóa tất cả →
          </button>
        </div>
      )}

      {/* Part Navigation Pills (Nghe / Viết / Dịch) */}
      {!isRetryingMistakes && (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => jumpToPart(1)}
            className={cn(
              'p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer truncate',
              activeQuestion?.partNumber === 1
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            )}
            title="Nhảy tới câu luyện Nghe tiếp theo"
          >
            <Headphones className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Nghe ({listeningDone}/{listeningTotal})</span>
          </button>

          <button
            type="button"
            onClick={() => jumpToPart(2)}
            className={cn(
              'p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer truncate',
              activeQuestion?.partNumber === 2
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            )}
            title="Nhảy tới câu luyện Viết tiếp theo"
          >
            <PenTool className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Viết ({writingDone}/{writingTotal})</span>
          </button>

          <button
            type="button"
            onClick={() => jumpToPart(3)}
            className={cn(
              'p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer truncate',
              activeQuestion?.partNumber === 3
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            )}
            title="Nhảy tới câu luyện Dịch tiếp theo"
          >
            <Languages className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Dịch ({translationDone}/{translationTotal})</span>
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>
            {isRetryingMistakes
              ? `Câu sai ${retryIndex + 1} / ${retryQuestions.length}`
              : `Câu ${currentIndex + 1} / ${totalQuestions}`}
          </span>
          <span>
            {isRetryingMistakes
              ? `${progressPercent}% (Điểm tổng: ${correctCount}/${totalQuestions})`
              : `${progressPercent}%`}
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isRetryingMistakes ? 'bg-amber-500' : 'bg-blue-600 dark:bg-blue-500'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card based on Type */}
      {activeQuestion && activeQuestion.type === 'listening_choice' && (
        <ListeningQuizCard
          key={`${activeQuestion.id}-${isRetryingMistakes ? 'retry' : 'normal'}`}
          question={activeQuestion}
          onAnswer={handleQuestionAnswer}
          onNext={handleNext}
          autoPlayAudio={autoPlayAudio}
        />
      )}

      {activeQuestion && activeQuestion.type === 'writing_input' && (
        <WritingQuizCard
          key={`${activeQuestion.id}-${isRetryingMistakes ? 'retry' : 'normal'}`}
          question={activeQuestion}
          onAnswer={handleQuestionAnswer}
          onNext={handleNext}
          autoPlayAudio={autoPlayAudio}
        />
      )}

      {activeQuestion && activeQuestion.type === 'translation_choice' && (
        <TranslationQuizCard
          key={`${activeQuestion.id}-${isRetryingMistakes ? 'retry' : 'normal'}`}
          question={activeQuestion}
          onAnswer={handleQuestionAnswer}
          onNext={handleNext}
        />
      )}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        feature="vocab"
      />
    </div>
  );
}
