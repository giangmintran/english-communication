import React, { useState } from 'react';
import { MessageCircle, Volume2, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { LessonExpression } from '@/types/database';
import { speakText } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface ExpressionsStepProps {
  expressions: LessonExpression[];
}

export function ExpressionsStep({ expressions }: ExpressionsStepProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const { t } = useTranslation();

  const handlePlayAudio = async (text: string, id: string) => {
    setPlayingId(id);
    await speakText(text);
    setPlayingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>04 · {t('dailyLesson.expressionsStep')}</span>
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          {t('dailyLesson.expressionsSubtitle')}
        </h2>
      </div>

      {/* Expressions Cards */}
      <div className="space-y-4">
        {expressions.map((item, idx) => {
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
            >
              {/* Top Row: Expression & Formality Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {item.expression}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
                      {item.phonetic_ipa}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
                      item.formality === 'formal' || (item.formality as any) === 'polite'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : item.formality === 'informal'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    )}
                  >
                    {item.formality}
                  </span>

                  <button
                    onClick={() => handlePlayAudio(item.expression, item.id)}
                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                    title={t('flashcards.listen')}
                  >
                    <Volume2 className={cn('w-4 h-4', playingId === item.id && 'animate-pulse text-indigo-600')} />
                  </button>
                </div>
              </div>

              {/* Meaning */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  {t('flashcards.vietnameseMeaning')}
                </span>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {item.meaning}
                </p>
              </div>

              {/* Context */}
              {item.context && (
                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {t('dailyLesson.context')}{' '}
                  </span>
                  <span>{item.context}</span>
                </div>
              )}

              {/* Variations */}
              {item.variations && item.variations.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {t('dailyLesson.variations')}
                  </span>
                  <div className="space-y-1.5">
                    {item.variations.map((v, vIdx) => (
                      <div
                        key={vIdx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <span className="font-medium">• {v}</span>
                        <button
                          onClick={() => handlePlayAudio(v, `${item.id}-var-${vIdx}`)}
                          className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer p-1"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
