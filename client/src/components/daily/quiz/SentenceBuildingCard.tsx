import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';

interface SentenceBuildingCardProps {
  vietnamese: string;
  scrambledWords: string[];
  correctOrder: string[];
  hint?: string;
  onAnswer: (isCorrect: boolean) => void;
  disabled?: boolean;
}

export function SentenceBuildingCard({
  vietnamese,
  scrambledWords,
  correctOrder,
  hint,
  onAnswer,
  disabled,
}: SentenceBuildingCardProps) {
  // Available words in bank (word + unique index to handle duplicate words)
  const [bank, setBank] = useState<{ id: number; text: string }[]>(
    scrambledWords.map((word, idx) => ({ id: idx, text: word }))
  );
  // Selected words in user sentence
  const [selected, setSelected] = useState<{ id: number; text: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const { t } = useTranslation();

  const handlePick = (item: { id: number; text: string }) => {
    if (submitted || disabled) return;
    setBank((prev) => prev.filter((w) => w.id !== item.id));
    setSelected((prev) => [...prev, item]);
  };

  const handleUnpick = (item: { id: number; text: string }) => {
    if (submitted || disabled) return;
    setSelected((prev) => prev.filter((w) => w.id !== item.id));
    setBank((prev) => [...prev, item]);
  };

  const handleReset = () => {
    if (submitted || disabled) return;
    setBank(scrambledWords.map((word, idx) => ({ id: idx, text: word })));
    setSelected([]);
  };

  const handleCheck = () => {
    if (submitted || disabled || selected.length === 0) return;
    const userStr = selected.map((w) => w.text.trim().toLowerCase()).join(' ');
    const targetStr = correctOrder.map((w) => w.trim().toLowerCase()).join(' ');
    const correct = userStr === targetStr;

    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(correct);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full uppercase tracking-wider">
          Sentence Building
        </span>
        {!submitted && selected.length > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('dailyLesson.resetWords')}</span>
          </button>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
          {t('dailyLesson.tapToArrange')}
        </p>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
          "{vietnamese}"
        </h3>
      </div>

      {/* Target construction box */}
      <div className="min-h-[58px] sm:min-h-[64px] p-2.5 sm:p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap gap-1.5 sm:gap-2 items-center">
        {selected.length === 0 && (
          <span className="text-xs text-slate-400 dark:text-slate-500 italic pl-1">
            {t('dailyLesson.yourSentence')} ...
          </span>
        )}
        {selected.map((item) => (
          <button
            key={item.id}
            onClick={() => handleUnpick(item)}
            disabled={submitted || disabled}
            className={cn(
              'px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-2xs cursor-pointer',
              submitted
                ? isCorrect
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rose-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
            )}
          >
            {item.text}
          </button>
        ))}
      </div>

      {/* Scrambled word bank */}
      {!submitted && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1 sm:pt-2">
          {bank.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePick(item)}
              disabled={disabled}
              className="px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              {item.text}
            </button>
          ))}
        </div>
      )}

      {/* Submit button */}
      {!submitted && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleCheck}
            disabled={disabled || selected.length === 0}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <span>{t('dailyLesson.checkAnswer')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Result feedback */}
      {submitted && (
        <div
          className={cn(
            'p-4 rounded-2xl border text-xs space-y-2',
            isCorrect
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
          )}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('dailyLesson.correctAnswer')}</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>{t('dailyLesson.wrongAnswer')}</span>
              </>
            )}
          </div>
          {!isCorrect && (
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {t('dailyLesson.sampleAnswer')} <span className="text-blue-600 dark:text-blue-400 font-bold">{correctOrder.join(' ')}</span>
            </p>
          )}
          {hint && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 pt-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{hint}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
