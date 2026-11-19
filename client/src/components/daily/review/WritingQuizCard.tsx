import React, { useEffect, useRef, useState } from 'react';
import {
  PenTool,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Eye,
  CornerDownLeft,
} from 'lucide-react';
import { WritingInputQuestion } from '@/types/quiz';
import { speakText } from '@/lib/speech';
import { cn } from '@/lib/utils';

interface WritingQuizCardProps {
  question: WritingInputQuestion;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
  onNext: () => void;
  autoPlayAudio?: boolean;
}

function cleanAnswer(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
    .trim();
}

export function WritingQuizCard({
  question,
  onAnswer,
  onNext,
  autoPlayAudio = true,
}: WritingQuizCardProps) {
  const [input, setInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePlayAudio = async () => {
    setIsPlaying(true);
    try {
      await speakText(question.audioText);
    } finally {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    setInput('');
    setIsAnswered(false);
    setIsCorrect(false);
    setShowHint(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if (autoPlayAudio && question.mode === 'listen_and_type') {
      handlePlayAudio();
    }
  }, [question.id]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isAnswered || !input.trim()) return;

    const userClean = cleanAnswer(input);
    const validTargets = question.acceptableAnswers.map(cleanAnswer);
    const matched = validTargets.includes(userClean);

    setIsCorrect(matched);
    setIsAnswered(true);
    onAnswer(matched, input.trim());
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 sm:p-6 md:p-8 shadow-card space-y-5 sm:space-y-6 transition-colors">
      {/* Header Tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
          <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Phần 2: Luyện Viết</span>
        </div>
        <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">
          {question.mode === 'listen_and_type' ? 'Nghe & gõ lại' : 'Dịch & gõ từ'}
        </span>
      </div>

      {/* Prompt Area */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {question.mode === 'listen_and_type'
            ? 'Nghe âm thanh và gõ lại từ tiếng Anh:'
            : 'Gõ từ tiếng Anh tương ứng với nghĩa:'}
        </p>

        {question.mode === 'listen_and_type' ? (
          <div className="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePlayAudio}
              className={cn(
                'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0',
                isPlaying
                  ? 'bg-amber-600 text-white ring-4 ring-amber-500/20'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              )}
              title="Bấm để nghe lại"
            >
              <Volume2 className={cn('w-6 h-6 sm:w-7 sm:h-7', isPlaying && 'animate-pulse')} />
            </button>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                Nhấn vào nút loa để nghe
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Hãy chú ý cách phát âm và chính tả
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 flex items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                "{question.vietnameseMeaning}"
              </h3>
              {question.exampleMeaning && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-2">
                  Trong ngữ cảnh: "{question.exampleMeaning}"
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handlePlayAudio}
              className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 cursor-pointer transition-colors shrink-0"
              title="Nghe phát âm gợi ý"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isAnswered}
            placeholder="Nhập từ tiếng Anh tại đây..."
            className={cn(
              'w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border text-sm sm:text-base font-semibold transition-all focus:outline-none focus:ring-4',
              !isAnswered &&
              'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20',
              isAnswered &&
              isCorrect &&
              'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20',
              isAnswered &&
              !isCorrect &&
              'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
            )}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {!isAnswered && input.trim() && (
            <button
              type="submit"
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <span>Kiểm tra</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Hint toggle */}
        {!isAnswered && (
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showHint ? 'Ẩn gợi ý' : 'Xem gợi ý chữ cái'}</span>
            </button>

            {showHint && (
              <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold animate-fadeIn">
                {question.hint}
              </span>
            )}
          </div>
        )}
      </form>

      {/* Answer Evaluation Result */}
      {isAnswered && (
        <div className="space-y-4 pt-2 animate-fadeIn">
          <div
            className={cn(
              'p-4 rounded-2xl border text-sm space-y-2',
              isCorrect
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
            )}
          >
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold">Tuyệt vời! Bạn đã viết chính xác.</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    <span className="font-bold">Chưa chính xác!</span>
                    <p className="text-xs mt-0.5">
                      Đáp án đúng:{' '}
                      <strong className="underline text-sm sm:text-base font-mono text-emerald-600 dark:text-emerald-400">
                        {question.correctAnswer}
                      </strong>{' '}
                      (Bạn gõ: <span className="line-through">{input || 'trống'}</span>)
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-current/10 text-xs space-y-1">
              <p>
                <strong>{question.targetWord}</strong> {question.phoneticIpa}: {question.vietnameseMeaning}
              </p>
              {question.exampleSentence && (
                <p className="italic opacity-85">Ví dụ: "{question.exampleSentence}"</p>
              )}
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
