'use client';

import React from 'react';
import { BarChart3, BookOpen, Mic, Trophy } from 'lucide-react';
import { useLearningStore } from '@/lib/store';
import { useTranslation } from '@/context/LanguageContext';

export function YourProgressCard() {
  const { overallProgressPercent, totalWordsLearned, speakingTimeMinutes, streakDays } =
    useLearningStore();
  const { t } = useTranslation();

  // SVG circular calculations
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallProgressPercent / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col justify-between h-full transition-colors">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {t('home.yourProgress')}
          </h3>
        </div>

        {/* Circular Progress Gauge */}
        <div className="flex justify-center my-4">
          <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeLinecap="round"
              />
              {/* Progress Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#2563EB"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Text */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {overallProgressPercent}%
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                {t('home.totalProgress')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats List */}
      <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
        {/* Words Learned */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {totalWordsLearned}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {t('home.wordsLearned')}
            </div>
          </div>
        </div>

        {/* Speaking Time */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {speakingTimeMinutes} min
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {t('home.speakingMinutes')}
            </div>
          </div>
        </div>

        {/* Day Streak */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 fill-amber-400/30" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {streakDays}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {t('home.streakDays')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
