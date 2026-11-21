import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';

export function TodaysGoalCard() {
  const { user } = useAuth();
  const {
    profile,
    todayLearned,
    lastLearnedDate,
    todayGoal,
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

  // Đối với khách chưa đăng nhập: giới hạn mục tiêu dùng thử là 5 từ
  const effectiveGoal = !user ? 5 : todayGoal;

  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const reviewProgress = getTodayReviewProgress(todayStr);

  // Tính số từ thực tế của Daily Routine hôm nay dựa trên kết quả bài làm thực tế
  const currentLearned = React.useMemo(() => {
    let wordsFromReview = 0;
    if (reviewProgress) {
      if (reviewProgress.results && Object.keys(reviewProgress.results).length > 0) {
        const uniqueWords = new Set(
          Object.values(reviewProgress.results)
            .map((r: any) => r.question?.wordId || r.questionId)
            .filter(Boolean)
        );
        wordsFromReview = uniqueWords.size;
      } else if (reviewProgress.wordIds && reviewProgress.wordIds.length > 0 && reviewProgress.answeredCount > 0) {
        wordsFromReview = Math.min(reviewProgress.wordIds.length, Math.ceil(reviewProgress.answeredCount / 3));
      }
    }
    const wordsFromStore = lastLearnedDate === todayStr ? Math.max(0, todayLearned) : 0;
    const maxLearned = Math.max(wordsFromReview, wordsFromStore);
    return Math.min(effectiveGoal, maxLearned);
  }, [reviewProgress, lastLearnedDate, todayStr, todayLearned, effectiveGoal]);

  // Tự động đồng bộ lại todayLearned trong store nếu giá trị cache bị lệch
  React.useEffect(() => {
    if (currentLearned > todayLearned) {
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
    <div className="bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-blue-50/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-blue-100/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 sm:gap-6 shadow-xs transition-colors">
      <div className="flex items-center gap-4 sm:gap-5">
        {/* Target Icon with glowing rings */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
            <Target className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400 stroke-[2.2]" />
          </div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white dark:border-slate-800" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('home.todaysGoal')}
            </span>
            {!user && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>{t('home.guestTrialBadge')}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
              {effectiveGoal} {t('home.newWords')}
            </div>
            {user && (isGoalReached || isReviewDone) && profile?.daily_goal_words && profile.daily_goal_words !== todayGoal && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100/90 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{t('home.tomorrowGoalBadge', { count: profile.daily_goal_words })}</span>
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 sm:w-44 sm:flex-none h-2.5 bg-blue-100/80 dark:bg-slate-800 rounded-full overflow-hidden">
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
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all hover:gap-3 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{buttonLabel}</span>
        </button>
      ) : (
        <Link
          to={targetRoute}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all hover:gap-3 shrink-0 cursor-pointer"
        >
          <span>{buttonLabel}</span>
          <ArrowRight className="w-4 h-4" />
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
