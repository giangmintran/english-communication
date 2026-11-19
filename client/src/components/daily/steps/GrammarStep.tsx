import React from 'react';
import { Puzzle, CheckCircle2, XCircle, Lightbulb, Sparkles, BookOpen } from 'lucide-react';
import { LessonGrammar } from '@/types/database';
import { useTranslation } from '@/context/LanguageContext';

interface GrammarStepProps {
  grammar: LessonGrammar;
}

export function GrammarStep({ grammar }: GrammarStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Title & Explanation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
          <Puzzle className="w-3.5 h-3.5" />
          <span>03 · {t('dailyLesson.grammarStep')}</span>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {grammar.title}
        </h2>

        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          {grammar.explanation}
        </p>
      </div>

      {/* Formula Box */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/10 space-y-2">
        <div className="flex items-center gap-2 text-purple-200 text-xs font-bold uppercase tracking-wider">
          <Lightbulb className="w-4 h-4 text-amber-300" />
          <span>{t('dailyLesson.formula')}</span>
        </div>
        <p className="font-mono font-bold text-base sm:text-lg tracking-wide text-white bg-black/20 px-4 py-3 rounded-2xl backdrop-blur-sm border border-white/10">
          {grammar.formula}
        </p>
      </div>

      {/* Illustrated Examples */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          {t('dailyLesson.examples')}
        </h3>

        <div className="space-y-3">
          {grammar.examples.map((ex, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1"
            >
              <p className="font-bold text-slate-900 dark:text-white text-base">
                {ex.english}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ex.vietnamese}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Common Mistakes */}
      {grammar.common_mistakes && grammar.common_mistakes.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            <span>{t('dailyLesson.commonMistakes')}</span>
          </h3>

          <div className="space-y-4">
            {grammar.common_mistakes.map((mistake, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 space-y-2 text-xs"
              >
                {/* Wrong */}
                <div className="flex items-start gap-2 text-rose-700 dark:text-rose-300">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{t('dailyLesson.mistakeWrong')}: </span>
                    <span className="line-through">{mistake.wrong}</span>
                  </div>
                </div>

                {/* Correct */}
                <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <span className="font-bold">{t('dailyLesson.mistakeCorrect')}: </span>
                    <span className="font-bold">{mistake.correct}</span>
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-slate-600 dark:text-slate-400 pl-6 pt-1 text-[11px] leading-relaxed">
                  💡 {mistake.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
