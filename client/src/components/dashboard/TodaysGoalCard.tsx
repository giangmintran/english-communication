import React from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';

export function TodaysGoalCard() {
  const { user } = useAuth();
  const { todayLearned, todayGoal } = useLearningStore();
  const { t } = useTranslation();

  // Khi chưa đăng nhập: luôn hiển thị 0 từ đã học; chỉ hiển thị số câu/từ khi đã đăng nhập
  const currentLearned = user ? todayLearned : 0;
  const percentage = Math.min(100, Math.round((currentLearned / todayGoal) * 100));

  return (
    <div className="bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-blue-50/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-blue-100/80 dark:border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs transition-colors">
      <div className="flex items-center gap-5">
        {/* Target Icon with glowing rings */}
        <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
            <Target className="w-7 h-7 text-blue-600 dark:text-blue-400 stroke-[2.2]" />
          </div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white dark:border-slate-800" />
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {t('home.todaysGoal')}
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {todayGoal} {t('home.newWords')}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="w-44 h-2.5 bg-blue-100/80 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {currentLearned} / {todayGoal}
            </span>
          </div>
        </div>
      </div>

      <Link
        to="/learn/daily"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all hover:gap-3 shrink-0"
      >
        <span>
          {!user || currentLearned === 0
            ? t('home.startLearning')
            : currentLearned >= todayGoal
            ? t('home.reviewToday')
            : t('home.continueLearning')}
        </span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
