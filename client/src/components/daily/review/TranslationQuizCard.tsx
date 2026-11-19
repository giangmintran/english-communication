import React, { useEffect, useState } from 'react';
import { Languages, CheckCircle2, XCircle, HelpCircle, ArrowRight, Volume2, Check } from 'lucide-react';
import { TranslationChoiceQuestion } from '@/types/quiz';
import { speakText } from '@/lib/speech';
import { cn } from '@/lib/utils';

interface TranslationQuizCardProps {
  question: TranslationChoiceQuestion;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
  onNext: () => void;
}

export function TranslationQuizCard({
  question,
  onAnswer,
  onNext,
}: TranslationQuizCardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    setSelectedIdx(null);
    setIsAnswered(false);
  }, [question.id]);

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
  };

  const handleSubmit = () => {
    if (isAnswered || selectedIdx === null) return;
    setIsAnswered(true);
    const chosenWord = question.options[selectedIdx];
    const isCorrect = selectedIdx === question.correctIndex;
    onAnswer(isCorrect, chosenWord);
    // Phát âm từ đúng khi submit
    speakText(question.targetWord);
  };

  // Hỗ trợ phím Enter để Submit hoặc sang câu tiếp theo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (!isAnswered && selectedIdx !== null) {
          e.preventDefault();
          handleSubmit();
        } else if (isAnswered) {
          e.preventDefault();
          onNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, selectedIdx, question.id]);

  const handlePlayWord = (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    speakText(word);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 sm:p-6 md:p-8 shadow-card space-y-5 sm:space-y-6 transition-colors">
      {/* Header Tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Phần 3: Dịch Nghĩa</span>
        </div>
        <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">
          Chọn 1 đáp án rồi kiểm tra
        </span>
      </div>

      {/* Question Prompt */}
      <div className="p-4 sm:p-6 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center space-y-1.5 sm:space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Từ nào trong tiếng Anh có nghĩa là:
        </p>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          "{question.vietnamesePrompt}"
        </h3>
        {question.exampleMeaning && (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            Ví dụ: {question.exampleMeaning}
          </p>
        )}
      </div>

      {/* 4 Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
        {question.options.map((option, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrect = idx === question.correctIndex;

          let btnClass =
            'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-emerald-300 dark:hover:border-emerald-600 text-slate-800 dark:text-slate-100 hover:shadow-xs';

          if (!isAnswered) {
            if (isSelected) {
              btnClass =
                'border-emerald-600 dark:border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30 font-bold shadow-xs';
            }
          } else {
            if (isCorrect) {
              btnClass =
                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20';
            } else if (isSelected) {
              btnClass =
                'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-bold ring-2 ring-rose-500/20';
            } else {
              btnClass =
                'border-slate-200 dark:border-slate-800 opacity-40 bg-slate-50 dark:bg-slate-800/20 text-slate-400';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => handleSelect(idx)}
              className={cn(
                'flex items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left text-sm sm:text-base font-semibold transition-all cursor-pointer group min-h-[52px]',
                btnClass
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors shrink-0',
                    isSelected && !isAnswered
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="truncate">{option}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAnswered && (
                  <button
                    type="button"
                    onClick={(e) => handlePlayWord(option, e)}
                    className="p-1 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}

                {!isAnswered && isSelected && (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Row: Submit button before answered */}
      {!isAnswered && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={selectedIdx === null}
            onClick={handleSubmit}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <span>Kiểm tra đáp án</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Explanation Box & Next Button after answered */}
      {isAnswered && (
        <div className="space-y-4 pt-2 animate-fadeIn">
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-sm space-y-1.5">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {question.targetWord}{' '}
                  <span className="font-normal font-mono text-slate-500 dark:text-slate-400 text-xs">
                    {question.phoneticIpa}
                  </span>
                  : <span className="text-emerald-700 dark:text-emerald-300">{question.vietnameseMeaning}</span>
                </p>
                {question.exampleSentence && (
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                    <p className="font-medium italic">"{question.exampleSentence}"</p>
                    {question.exampleMeaning && (
                      <p className="text-slate-500 dark:text-slate-400">→ {question.exampleMeaning}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onNext}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all hover:gap-3 cursor-pointer"
            >
              <span>Câu tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
