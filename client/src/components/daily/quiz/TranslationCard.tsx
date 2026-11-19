import React, { useState } from 'react';
import { CheckCircle2, XCircle, Languages, ArrowRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';

interface TranslationCardProps {
  sourceText: string;
  sourceLang: 'vi' | 'en';
  correctAnswer: string;
  acceptAnswers?: string[];
  hint?: string;
  onAnswer: (isCorrect: boolean) => void;
  disabled?: boolean;
}

function cleanText(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function TranslationCard({
  sourceText,
  sourceLang,
  correctAnswer,
  acceptAnswers = [],
  hint,
  onAnswer,
  disabled,
}: TranslationCardProps) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const { t } = useTranslation();

  const handleCheck = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitted || disabled || !input.trim()) return;

    const userClean = cleanText(input);
    const validTargets = [correctAnswer, ...acceptAnswers].map(cleanText);
    const matched = validTargets.includes(userClean);

    setIsCorrect(matched);
    setSubmitted(true);
    onAnswer(matched);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5" />
          <span>Translation ({sourceLang.toUpperCase()} → EN)</span>
        </span>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
          {sourceLang === 'vi' ? 'Dịch câu sau sang tiếng Anh:' : 'Translate to Vietnamese:'}
        </p>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          "{sourceText}"
        </h3>
      </div>

      <form onSubmit={handleCheck} className="space-y-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={submitted || disabled}
          placeholder={t('dailyLesson.typeTranslation')}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-75"
        />

        {!submitted && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={disabled || !input.trim()}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>{t('dailyLesson.checkTranslation')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </form>

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
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {t('dailyLesson.sampleAnswer')} <span className="text-blue-600 dark:text-blue-400 font-bold">{correctAnswer}</span>
          </p>
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
