import React from 'react';
import { DailyWordReason } from '@/types/quiz';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface WordReasonBadgeProps {
  reason?: DailyWordReason;
  className?: string;
}

const REASON_STYLES: Record<DailyWordReason, string> = {
  forgot:
    'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50',
  hard:
    'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/50',
  due:
    'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-900/50',
  new:
    'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/50',
  reinforce:
    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700',
};

const REASON_KEYS: Record<DailyWordReason, string> = {
  forgot: 'dailyReview.reasonForgot',
  hard: 'dailyReview.reasonHard',
  due: 'dailyReview.reasonDue',
  new: 'dailyReview.reasonNew',
  reinforce: 'dailyReview.reasonReinforce',
};

/**
 * Hiển thị nhãn lý do xuất hiện của từ vựng trong mục tiêu hàng ngày (Quên, Mơ hồ, Đến hạn, Từ mới)
 */
export function WordReasonBadge({ reason, className }: WordReasonBadgeProps) {
  const { t } = useTranslation();
  if (!reason) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0',
        REASON_STYLES[reason],
        className
      )}
    >
      {t(REASON_KEYS[reason])}
    </span>
  );
}
