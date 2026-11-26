import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { getLocalDateStr, isItemDueByDay } from '@/lib/srs';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';

export function TodaysGoalCard() {
  const { user } = useAuth();
  const {
    profile,
    todayLearned,
    lastLearnedDate,
    todayGoal,
    reviews,
    getTodayReviewProgress,
    setTodayLearned,
    checkAndResetNewDay,
  } = useLearningStore();
  const { t } = useTranslation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Tự động kiểm tra sang ngày mới
  React.useEffect(() => {
    checkAndResetNewDay();
  }, [checkAndResetNewDay]);

  // Đối với khách chưa đăng nhập: giới hạn mục tiêu dùng thử là 5 từ. Người dùng đã đăng nhập: lấy theo setting
  const effectiveGoal = !user ? 5 : (profile?.daily_goal_words || todayGoal || 20);

  const todayStr = React.useMemo(() => getLocalDateStr(), []);
  const reviewProgress = getTodayReviewProgress(todayStr);

  // Tính số từ cần ôn hôm nay (từ Quên/Mơ hồ/Đến hạn) và từ mới trong mục tiêu hôm nay
  const dailyMixStats = React.useMemo(() => {
    if (reviewProgress?.wordReasons && Object.keys(reviewProgress.wordReasons).length > 0) {
      const reasons = Object.values(reviewProgress.wordReasons);
      const reviewCount = reasons.filter((r) => r !== 'new').length;
      const newCount = reasons.length - reviewCount;
      return { reviewCount, newCount };
    }
    const dueCount = Object.values(reviews || {}).filter((r) => isItemDueByDay(r, todayStr)).length;
    const reviewCount = Math.min(dueCount, Math.floor(effectiveGoal * 0.7));
    const newCount = Math.max(0, effectiveGoal - reviewCount);
    return { reviewCount, newCount };
  }, [reviewProgress, reviews, todayStr, effectiveGoal]);

  // Tính số từ thực tế của Daily Routine hôm nay dựa trên kết quả bài làm thực tế
  const currentLearned = React.useMemo(() => {
    let wordsFromReview = 0;
    if (reviewProgress) {
      // Nếu đã từng hoàn tất mục tiêu hôm nay thì luôn bảo lưu đầy đủ số từ đã học (không bị giảm khi làm lại bài tập)
      if (reviewProgress.isCompleted && reviewProgress.wordIds && reviewProgress.wordIds.length > 0) {
        wordsFromReview = reviewProgress.wordIds.length;
      } else if (reviewProgress.results && Object.keys(reviewProgress.results).length > 0) {
        const uniqueWords = new Set(
          Object.values(reviewProgress.results)
            .map((r: any) => r.question?.wordId || r.questionId)
            .filter(Boolean)
        );
        wordsFromReview = uniqueWords.size;
      } else if (reviewProgress.answeredCount > 0) {
        wordsFromReview = Math.min(reviewProgress.wordIds?.length || 20, Math.ceil(reviewProgress.answeredCount / 3));
      } else {
        wordsFromReview = 0;
      }
      return Math.min(effectiveGoal, wordsFromReview);
    }
    const wordsFromStore = lastLearnedDate === todayStr ? Math.max(0, todayLearned) : 0;
    return Math.min(effectiveGoal, wordsFromStore);
  }, [reviewProgress, lastLearnedDate, todayStr, todayLearned, effectiveGoal]);

  // Tự động đồng bộ lại todayLearned trong store nếu giá trị cache bị lệch
  React.useEffect(() => {
    if (currentLearned !== todayLearned) {
      setTodayLearned(currentLearned);
    }
  }, [currentLearned, todayLearned, setTodayLearned]);

  const percentage = Math.min(100, Math.round((currentLearned / effectiveGoal) * 100));
  const isGoalReached = currentLearned >= effectiveGoal && currentLearned > 0;

  const isReviewActive = Boolean(
    reviewProgress && !reviewProgress.isCompleted && reviewProgress.answeredCount > 0
  );
  const isReviewDone = Boolean(reviewProgress && reviewProgress.isCompleted);

  const targetRoute =
    isReviewActive || isReviewDone || isGoalReached ? '/daily/review' : '/learn/daily';

  let buttonLabel = t('home.startLearning');
  if (currentLearned === 0) {
    buttonLabel = t('home.startLearning');
  } else if (isReviewActive && reviewProgress) {
    buttonLabel = `${t('home.continueReview')} (${reviewProgress.answeredCount}/${reviewProgress.totalQuestions})`;
  } else if (isGoalReached) {
    buttonLabel = !user ? t('home.loginToUnlockMore') : t('home.reviewToday');
  } else {
    buttonLabel = `${t('home.continueLearning')} (${currentLearned}/${effectiveGoal})`;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-blue-50/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-blue-100/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 xl:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-5 shadow-xs transition-colors overflow-hidden">
      <div className="flex items-center gap-3.5 sm:gap-4.5 min-w-0 flex-1">
        {/* Target Icon with glowing rings */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 rounded-2xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 xl:w-12 xl:h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7 text-blue-600 dark:text-blue-400 stroke-[2.2]" />
          </div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white dark:border-slate-800" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {t('home.todaysGoal')}
            </span>
            {!user && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                <Lock className="w-3 h-3" />
                <span>{t('home.guestTrialBadge')}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 flex-wrap">
            <div className="text-lg sm:text-xl xl:text-2xl font-bold text-slate-900 dark:text-white truncate">
              {effectiveGoal} {t('home.newWords')}
            </div>
            {dailyMixStats.reviewCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100/90 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                {dailyMixStats.newCount > 0
                  ? t('home.dueWordsSummary', {
                      review: dailyMixStats.reviewCount,
                      newCount: dailyMixStats.newCount,
                    })
                  : t('home.dueWordsOnlySummary', { review: dailyMixStats.reviewCount })}
              </span>
            )}
            {user && (isGoalReached || isReviewDone) && profile?.daily_goal_words && profile.daily_goal_words !== effectiveGoal && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100/90 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{t('home.tomorrowGoalBadge', { count: profile.daily_goal_words })}</span>
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex-1 w-24 sm:w-32 xl:w-44 max-w-[176px] h-2.5 bg-blue-100/80 dark:bg-slate-800 rounded-full overflow-hidden shrink min-w-[50px]">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
              {currentLearned} / {effectiveGoal}
            </span>
          </div>
        </div>
      </div>

      {!user && isGoalReached ? (
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 xl:px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all hover:gap-3 shrink-0 cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{buttonLabel}</span>
        </button>
      ) : (
        <Link
          to={targetRoute}
          className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 xl:px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all hover:gap-3 shrink-0 cursor-pointer whitespace-nowrap"
        >
          <span>{buttonLabel}</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Link>
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
