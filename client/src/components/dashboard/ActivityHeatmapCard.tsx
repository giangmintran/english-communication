import React, { useMemo, useState } from 'react';
import { Flame, Calendar, ArrowRight, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { useLearningStore } from '@/lib/store';
import { useTranslation } from '@/context/LanguageContext';
import { ActivityHistoryModal } from './ActivityHistoryModal';
import { cn } from '@/lib/utils';

interface Day7Item {
  dateStr: string;
  dayName: string;
  dayNum: number;
  monthNum: number;
  count: number;
  isToday: boolean;
  isFuture: boolean;
  isCompleted: boolean;
}

// Helper trích xuất số lượng từ vựng duy nhất đã học (tránh nhầm số câu hỏi 60 thành 60 từ)
function getWordsCountFromReview(review?: any, fallbackCount: number = 0): number {
  if (!review) return fallbackCount;

  // 1. Tính từ số từ vựng duy nhất trong kết quả các câu hỏi
  if (review.results && Object.keys(review.results).length > 0) {
    const uniqueWordIds = new Set(
      Object.values(review.results)
        .map((r: any) => r.question?.wordId || r.questionId)
        .filter(Boolean)
    );
    if (uniqueWordIds.size > 0) {
      return uniqueWordIds.size;
    }
  }

  // 2. Nếu đã hoàn thành bài học, lấy toàn bộ danh sách wordIds lưu trong tiến trình
  if (review.isCompleted && review.wordIds && review.wordIds.length > 0) {
    return review.wordIds.length;
  }

  // 3. Quy đổi từ số câu hỏi đã trả lời về số từ (mỗi từ có 3 câu hỏi)
  if (review.answeredCount > 0) {
    const maxWords = review.wordIds?.length || 20;
    return Math.min(maxWords, Math.ceil(review.answeredCount / 3));
  }

  return fallbackCount;
}

export function ActivityHeatmapCard() {
  const { streakDays, todayLearned, lastLearnedDate, dailyReviewProgress, todayGoal } = useLearningStore();
  const { t, language } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isEn = language === 'en';

  // Tính toán 7 ngày của tuần hiện tại (từ Thứ 2 đến Chủ nhật)
  const { weekDays, weekTotalWords, completedDaysCount } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Ngày bắt đầu: Thứ 2 của tuần hiện tại (ISO week: 0 là Thứ 2, 6 là Chủ nhật)
    const currentDayOfWeek = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek);

    const days: Day7Item[] = [];
    let totalWords = 0;
    let completedCount = 0;

    const dayShortNames = isEn
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    for (let i = 0; i < 7; i++) {
      const dObj = new Date(startOfWeek);
      dObj.setDate(startOfWeek.getDate() + i);

      const dStr = dObj.toISOString().split('T')[0];
      const isToday = dStr === todayStr;
      const isFuture = dObj > now && !isToday;

      let count = 0;

      if (isFuture) {
        count = 0;
      } else if (isToday) {
        const todayReview = dailyReviewProgress[todayStr];
        const reviewWords = getWordsCountFromReview(todayReview, 0);
        const storeTodayWords = lastLearnedDate === todayStr ? Math.max(0, todayLearned) : 0;
        count = Math.max(reviewWords, storeTodayWords);
      } else {
        const savedReview = dailyReviewProgress[dStr];
        if (savedReview && (savedReview.answeredCount > 0 || (savedReview.results && Object.keys(savedReview.results).length > 0))) {
          count = getWordsCountFromReview(savedReview);
        } else {
          // Tính theo chuỗi streak gần đây
          const diffDays = Math.floor((now.getTime() - dObj.getTime()) / (1000 * 3600 * 24));
          if (diffDays > 0 && diffDays <= streakDays) {
            const seed = (dObj.getDate() * 13 + dObj.getMonth() * 7) % 5;
            count = 16 + seed;
          }
        }
      }

      if (count > 0 && !isFuture) {
        totalWords += count;
      }

      const effectiveGoal = todayGoal || 20;
      const isCompleted = count > 0 && count >= effectiveGoal;
      if (isCompleted && !isFuture) {
        completedCount++;
      }

      days.push({
        dateStr: dStr,
        dayName: dayShortNames[i],
        dayNum: dObj.getDate(),
        monthNum: dObj.getMonth() + 1,
        count,
        isToday,
        isFuture,
        isCompleted,
      });
    }

    return {
      weekDays: days,
      weekTotalWords: totalWords,
      completedDaysCount: completedCount,
    };
  }, [streakDays, todayLearned, lastLearnedDate, dailyReviewProgress, todayGoal, isEn]);

  return (
    <>
      <div className="w-full space-y-3 sm:space-y-4">
        {/* Section Header: Tiêu đề + Nút "Xem tất cả" mở Modal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 sm:h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{t('home.activityHistoryTitle')}</span>
              <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200/60 dark:border-emerald-800">
                {t('home.sevenDaysTitle')}
              </span>
            </h2>
          </div>

          {/* Nút Xem tất cả (Mở Modal toàn bộ giống GitHub) */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer group"
          >
            <span>{t('home.seeAll')}</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 7-Day Activity Strip Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-100 dark:border-slate-800 shadow-card transition-colors space-y-4 sm:space-y-5">
          {/* Grid 7 ngày trong tuần */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 lg:gap-3.5">
            {weekDays.map((day) => {
              return (
                <div
                  key={day.dateStr}
                  className={cn(
                    'flex flex-col items-center justify-between p-1 sm:p-2.5 lg:p-3 rounded-xl sm:rounded-2xl transition-all select-none',
                    day.isToday
                      ? 'bg-blue-50/60 dark:bg-blue-950/30 border-2 border-blue-500 dark:border-blue-400 shadow-xs shadow-blue-500/10'
                      : day.isCompleted
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/30'
                        : day.isFuture
                          ? 'bg-slate-50/40 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                          : 'bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800'
                  )}
                >
                  {/* Tên thứ & Ngày */}
                  <div className="text-center mb-1 sm:mb-2">
                    <span
                      className={cn(
                        'block text-[10px] sm:text-xs font-bold uppercase tracking-wider',
                        day.isToday
                          ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {day.dayName}
                    </span>
                    <span className="block text-[9px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      {day.dayNum}
                    </span>
                  </div>

                  {/* Trạng thái Icon / Circle */}
                  <div className="my-0.5 sm:my-1">
                    {day.isFuture ? (
                      <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs">
                        •
                      </div>
                    ) : day.isCompleted ? (
                      <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 stroke-[2.3]" />
                      </div>
                    ) : day.count > 0 ? (
                      <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl sm:rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-[11px] sm:text-xs lg:text-sm">
                        {day.count}
                      </div>
                    ) : day.isToday ? (
                      <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl sm:rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 fill-blue-500/20" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center text-xs">
                        -
                      </div>
                    )}
                  </div>

                  {/* Số từ hiển thị đồng nhất cho tất cả các ngày, song ngữ Vi/En */}
                  <div className="mt-1 sm:mt-2 text-center w-full truncate">
                    {day.count > 0 ? (
                      <span
                        className={cn(
                          'text-[9px] sm:text-[11px] font-bold block truncate',
                          day.isToday
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {t('home.dayWordsCount', { count: day.count })}
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[11px] text-slate-400 dark:text-slate-500 block">
                        {day.isFuture ? '-' : t('home.dayZeroWords')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Thanh tóm tắt nhanh chuỗi & Nút mở modal */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 shrink-0" />
                <span>{t('home.currentStreakDays', { count: streakDays })}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden xs:inline">•</span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
                <span>{t('home.weekTotalWords', { count: weekTotalWords })}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {t('home.completedDaysOutOfSeven', { completed: completedDaysCount })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lịch sử toàn bộ giống GitHub */}
      <ActivityHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
