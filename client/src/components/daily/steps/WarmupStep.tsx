import React from 'react';
import { Flame, Target, MessageSquare, KeyRound, Sparkles } from 'lucide-react';
import { LessonWarmup, DailyLesson } from '@/types/database';
import { useTranslation } from '@/context/LanguageContext';

interface WarmupStepProps {
  lesson: DailyLesson;
  warmup: LessonWarmup;
}

export function WarmupStep({ lesson, warmup }: WarmupStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Hero Banner with Topic & Situation */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white p-6 sm:p-8 shadow-lg shadow-blue-500/10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white">
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>01 · {t('dailyLesson.warmupStep')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {lesson.title}
          </h2>

          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            {warmup.situation}
          </p>
        </div>

        {warmup.image_url && (
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none hidden md:block">
            <img
              src={warmup.image_url}
              alt="Scenario"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Lesson Objectives Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 font-bold text-sm">
          <Target className="w-5 h-5 shrink-0" />
          <span>{t('dailyLesson.objectiveTitle')}</span>
        </div>
        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed pl-7">
          {warmup.objective}
        </p>
      </div>

      {/* Warm-up Reflex Question */}
      <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-400 font-bold text-sm">
          <MessageSquare className="w-5 h-5 shrink-0 text-amber-600" />
          <span>{t('dailyLesson.warmupQuestionTitle')}</span>
        </div>
        <p className="text-slate-800 dark:text-slate-200 font-semibold text-base pl-7 italic">
          "{warmup.warm_up_question}"
        </p>
      </div>

      {/* Key Phrases */}
      {warmup.key_phrases && warmup.key_phrases.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-bold text-sm">
            <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{t('dailyLesson.keyPhrasesTitle')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-7">
            {warmup.key_phrases.map((phrase, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                  {idx + 1}
                </div>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                  {phrase}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
