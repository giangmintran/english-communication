import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';

interface VocabQuizCardProps {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  onAnswer: (isCorrect: boolean) => void;
  disabled?: boolean;
}

export function VocabQuizCard({
  question,
  options,
  correctAnswer,
  explanation,
  onAnswer,
  disabled,
}: VocabQuizCardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const handleSelect = (idx: number) => {
    if (submitted || disabled) return;
    setSelectedIdx(idx);
  };

  const handleSubmit = () => {
    if (submitted || disabled || selectedIdx === null) return;
    setSubmitted(true);
    const isCorrect = selectedIdx === correctAnswer;
    onAnswer(isCorrect);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
          Vocabulary Quiz
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
        {question}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrect = idx === correctAnswer;
          let btnStyle = 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200';

          if (!submitted) {
            if (isSelected) {
              btnStyle = 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 ring-2 ring-blue-500/20 font-semibold';
            }
          } else {
            if (isCorrect) {
              btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold';
            } else if (isSelected) {
              btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold';
            } else {
              btnStyle = 'border-slate-200 dark:border-slate-800 opacity-50 bg-slate-50 dark:bg-slate-800/20 text-slate-500';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={submitted || disabled}
              className={cn(
                'flex items-center justify-between p-4 rounded-2xl border text-left text-sm transition-all cursor-pointer',
                btnStyle
              )}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </div>

              {submitted && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              {submitted && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {!submitted && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            disabled={disabled || selectedIdx === null}
            onClick={handleSubmit}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <span>Kiểm tra đáp án</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {submitted && explanation && (
        <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>{explanation}</span>
        </div>
      )}
    </div>
  );
}
