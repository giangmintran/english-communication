import React, { useState } from 'react';
import {
  Headphones,
  Play,
  Square,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import { LessonListening } from '@/types/database';
import { speakText } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface ListeningStepProps {
  listening: LessonListening[];
}

export function ListeningStep({ listening }: ListeningStepProps) {
  const [activeDialogueIdx, setActiveDialogueIdx] = useState(0);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [playingLineIdx, setPlayingLineIdx] = useState<number | null>(null);

  // Quiz state for questions of active dialogue: { [qId]: selectedOptionIndex }
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const { t } = useTranslation();

  const currentListening = listening[activeDialogueIdx] || listening[0];

  const handlePlayLine = async (text: string, idx: number) => {
    setPlayingLineIdx(idx);
    await speakText(text);
    setPlayingLineIdx(null);
  };

  const handlePlayAll = async () => {
    if (isPlayingAll) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAll(false);
      setPlayingLineIdx(null);
      return;
    }

    setIsPlayingAll(true);
    for (let i = 0; i < currentListening.dialogue.length; i++) {
      setPlayingLineIdx(i);
      await speakText(currentListening.dialogue[i].text);
      // Small pause between dialogue turns
      await new Promise((r) => setTimeout(r, 400));
    }
    setPlayingLineIdx(null);
    setIsPlayingAll(false);
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
  };

  if (!currentListening) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Headphones className="w-3.5 h-3.5" />
          <span>05 · {t('dailyLesson.listeningStep')}</span>
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          {currentListening.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('dailyLesson.listeningSubtitle')}
        </p>
      </div>

      {/* Audio Player Controls */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-md flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayAll}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer shrink-0"
          >
            {isPlayingAll ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-white">
              {isPlayingAll ? t('dailyLesson.stopAudio') : t('dailyLesson.playAll')}
            </h4>
            <p className="text-xs text-blue-100">
              {currentListening.dialogue.length} {t('nav.conversations').toLowerCase()}
            </p>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {showTranscript ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{t('dailyLesson.transcriptToggle')}</span>
          </button>

          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {showTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{t('dailyLesson.vietnameseToggle')}</span>
          </button>
        </div>
      </div>

      {/* Dialogue Conversation Turns */}
      {showTranscript && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          {currentListening.dialogue.map((turn, idx) => {
            const isSpeakingNow = playingLineIdx === idx;
            const isSpeaker1 = idx % 2 === 0;

            return (
              <div
                key={idx}
                className={cn(
                  'p-4 rounded-2xl border transition-all flex items-start gap-3.5',
                  isSpeakingNow
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs shrink-0',
                    isSpeaker1
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {turn.speaker.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-500 dark:text-slate-400">
                      {turn.speaker}
                    </span>
                    <button
                      onClick={() => handlePlayLine(turn.text, idx)}
                      className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <Volume2 className={cn('w-3.5 h-3.5', isSpeakingNow && 'text-blue-600 animate-pulse')} />
                    </button>
                  </div>

                  <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed">
                    {turn.text}
                  </p>

                  {showTranslation && turn.vietnamese && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                      {turn.vietnamese}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comprehension Quiz Questions */}
      {currentListening.questions && currentListening.questions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('dailyLesson.listeningQuestions')}
          </h3>

          {currentListening.questions.map((q, qIdx) => {
            const selectedOpt = userAnswers[q.id];
            const isAnswered = selectedOpt !== undefined;
            const isCorrect = selectedOpt === q.correct_answer;

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {qIdx + 1}
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {q.question}
                  </h4>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    const isRightOpt = optIdx === q.correct_answer;

                    let optClass =
                      'border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200';

                    if (isAnswered) {
                      if (isRightOpt) {
                        optClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold';
                      } else if (isSelected) {
                        optClass = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold';
                      } else {
                        optClass = 'border-slate-200 dark:border-slate-800 opacity-40 bg-slate-50 dark:bg-slate-800/20 text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        disabled={isAnswered}
                        className={cn(
                          'w-full flex items-center justify-between p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer',
                          optClass
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {isAnswered && isRightOpt && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {isAnswered && isSelected && !isRightOpt && (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && q.explanation && (
                  <div className="p-3 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40 text-xs text-cyan-900 dark:text-cyan-200 flex items-start gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
