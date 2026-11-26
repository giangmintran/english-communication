import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Flame,
  BookOpen,
  RotateCcw,
  Target,
  ArrowRight,
  Sun,
  Moon,
  Sunrise,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { getLocalDateStr, isItemDueByDay } from '@/lib/srs';
import { cn } from '@/lib/utils';

interface DailyReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyReminderModal({ isOpen, onClose }: DailyReminderModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
    todayGoal,
    todayLearned,
    lastLearnedDate,
    checkAndResetNewDay,
    streakDays,
    reviews,
    collectionReviews,
    getTodayReviewProgress,
  } = useLearningStore();

  React.useEffect(() => {
    checkAndResetNewDay();
  }, [checkAndResetNewDay]);

  const todayStr = useMemo(() => getLocalDateStr(), []);
  const reviewProgress = getTodayReviewProgress(todayStr);

  // 1. Lời chào theo buổi trong ngày
  const { greetingText, GreetingIcon, greetingColor } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greetingText: t('dailyReminder.morningGreeting'),
        GreetingIcon: Sunrise,
        greetingColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      };
    }
    if (hour >= 12 && hour < 18) {
      return {
        greetingText: t('dailyReminder.afternoonGreeting'),
        GreetingIcon: Sun,
        greetingColor: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
      };
    }
    return {
      greetingText: t('dailyReminder.eveningGreeting'),
      GreetingIcon: Moon,
      greetingColor: 'text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    };
  }, [t]);

  // Tên người dùng
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Learner';

  // 2. Tính số từ mới đã học hôm nay (chuẩn xác theo ngày hôm nay, không nhận giá trị hôm qua)
  const actualLearned = useMemo(() => {
    if (reviewProgress) {
      if (reviewProgress.results && Object.keys(reviewProgress.results).length > 0) {
        const uniqueWords = new Set(
          Object.values(reviewProgress.results)
            .map((r: any) => r.question?.wordId || r.questionId)
            .filter(Boolean)
        );
        return Math.min(todayGoal, uniqueWords.size);
      }
      if (reviewProgress.isCompleted && reviewProgress.wordIds && reviewProgress.wordIds.length > 0) {
        return Math.min(todayGoal, reviewProgress.wordIds.length);
      }
      if (reviewProgress.answeredCount > 0) {
        return Math.min(todayGoal, Math.ceil(reviewProgress.answeredCount / 3));
      }
      return 0;
    }
    if (lastLearnedDate === todayStr) {
      return Math.min(todayGoal, Math.max(0, todayLearned));
    }
    return 0;
  }, [reviewProgress, lastLearnedDate, todayStr, todayGoal, todayLearned]);

  const wordsToLearn = Math.max(0, todayGoal - actualLearned);
  const isGoalReached = actualLearned >= todayGoal && actualLearned > 0;

  // 3. Đếm số từ đến hạn ôn tập theo thuật toán Spaced Repetition (SRS) theo ngày lịch
  const dueReviewsCount = useMemo(() => {
    let count = 0;

    // A. Kiểm tra từ đến hạn trong reviews Daily
    Object.values(reviews).forEach((rev) => {
      if (isItemDueByDay(rev, todayStr)) {
        count++;
      }
    });

    // B. Kiểm tra từ đến hạn trong collectionReviews
    Object.values(collectionReviews).forEach((rev) => {
      if (isItemDueByDay(rev, todayStr)) {
        count++;
      }
    });

    // C. Nếu chưa có từ nào đến hạn SRS nhưng bài Daily hôm nay chưa hoàn thành
    if (count === 0 && reviewProgress && !reviewProgress.isCompleted) {
      const remainingQuestions = Math.max(0, reviewProgress.totalQuestions - reviewProgress.answeredCount);
      // Ước lượng số từ còn lại trong bài review (mỗi từ ~ 3 câu hỏi)
      count = Math.ceil(remainingQuestions / 3);
    }

    return count;
  }, [reviews, collectionReviews, reviewProgress, todayStr]);

  if (!isOpen || !user) return null;

  const handleStartStudy = () => {
    onClose();
    // Điều hướng vào luồng ôn tập / học tập thích hợp
    navigate('/daily/review');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Glowing gradient background decor */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close reminder"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Greeting & Status */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className={cn('w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs', greetingColor)}>
            <GreetingIcon className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0 pr-8">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
              {greetingText}, {userName}! 👋
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
              {t('dailyReminder.title')}
            </p>
          </div>
        </div>

        {/* Motivational Subtitle */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          💡 {t('dailyReminder.subtitle')}
        </p>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
          {/* Card 1: Từ mới cần học hôm nay */}
          <div className="bg-gradient-to-br from-blue-50/70 to-sky-50/40 dark:from-blue-950/30 dark:to-slate-900 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                {t('dailyReminder.wordsToLearn')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>

            <div>
              {isGoalReached ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                    {t('dailyReminder.goalCompleted')}
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                    {wordsToLearn}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    / {todayGoal} {t('common.words')}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {isGoalReached
                ? `Đã đạt ${actualLearned}/${todayGoal} từ hôm nay`
                : `Đã học ${actualLearned} từ hôm nay`}
            </p>
          </div>

          {/* Card 2: Từ đến hạn ôn tập (SRS) */}
          <div className="bg-gradient-to-br from-purple-50/70 to-indigo-50/40 dark:from-purple-950/30 dark:to-slate-900 border border-purple-100 dark:border-purple-900/50 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                {t('dailyReminder.wordsToReview')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                  {dueReviewsCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {t('common.words')}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {dueReviewsCount > 0
                ? 'Ôn đúng hẹn để không bị quên'
                : t('dailyReminder.allCaughtUp')}
            </p>
          </div>
        </div>

        {/* Streak Mini Banner */}
        <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 fill-amber-500 stroke-amber-600 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {streakDays} {t('header.streak')}
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                {t('dailyReminder.streakSub')}
              </div>
            </div>
          </div>

          <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/50 px-2.5 py-1 rounded-full">
            +{1} day
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto sm:flex-1 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
          >
            {t('dailyReminder.remindLater')}
          </button>

          <button
            onClick={handleStartStudy}
            className="w-full sm:w-auto sm:flex-1 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>{t('dailyReminder.startNow')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
