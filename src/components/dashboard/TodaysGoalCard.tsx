'use client';

import React from 'react';
import Link from 'next/link';
import { Target, ArrowRight } from 'lucide-react';
import { useLearningStore } from '@/lib/store';

export function TodaysGoalCard() {
  const { todayLearned, todayGoal } = useLearningStore();
  const percentage = Math.min(100, Math.round((todayLearned / todayGoal) * 100));

  return (
    <div className="bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-blue-50/50 border border-blue-100/80 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
      <div className="flex items-center gap-5">
        {/* Target Icon with glowing rings */}
        <div className="relative w-16 h-16 rounded-2xl bg-white border border-blue-100 flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Target className="w-7 h-7 text-blue-600 stroke-[2.2]" />
          </div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white" />
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Today&apos;s Goal
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-2">
            {todayGoal} new words
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="w-44 h-2.5 bg-blue-100/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {todayLearned} / {todayGoal}
            </span>
          </div>
        </div>
      </div>

      <Link
        href="/learn/deck-restaurant"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all hover:gap-3 shrink-0"
      >
        <span>Continue Learning</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
