import React, { useState, useRef, useEffect } from 'react';
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
  Languages,
} from 'lucide-react';
import { LessonListening } from '@/types/database';
import { speakText, stopSpeaking } from '@/lib/speech';
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

  const isPlayingAllRef = useRef(false);
  const isCancelledRef = useRef(false);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Quiz state for questions of active dialogue: { [qId]: selectedOptionIndex }
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const { t } = useTranslation();

  const currentListening = listening[activeDialogueIdx] || listening[0];

  // Hủy âm thanh khi rời khỏi trang hoặc đổi bài nghe
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      isPlayingAllRef.current = false;
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    isCancelledRef.current = true;
    isPlayingAllRef.current = false;
    stopSpeaking();
    setIsPlayingAll(false);
    setPlayingLineIdx(null);
  }, [activeDialogueIdx]);

  // Tự động cuộn theo câu đang phát
  useEffect(() => {
    if (playingLineIdx !== null && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [playingLineIdx]);

  const handlePlayLine = async (text: string, idx: number) => {
    // Nếu đang phát đúng dòng này mà bấm lại -> Dừng ngay lập tức
    if (playingLineIdx === idx) {
      stopSpeaking();
      setPlayingLineIdx(null);
      return;
    }

    // Dừng phát toàn bộ nếu đang chạy
    if (isPlayingAllRef.current) {
      isCancelledRef.current = true;
      isPlayingAllRef.current = false;
      setIsPlayingAll(false);
    }

    stopSpeaking();
    setPlayingLineIdx(idx);
    await speakText(text);
    setPlayingLineIdx((prev) => (prev === idx ? null : prev));
  };

  const handlePlayAll = async () => {
    // Nếu đang phát mà người dùng bấm dừng -> Dừng ngay lập tức và hủy mọi lời thoại tiếp theo
    if (isPlayingAllRef.current) {
      isCancelledRef.current = true;
      isPlayingAllRef.current = false;
      stopSpeaking();
      setIsPlayingAll(false);
      setPlayingLineIdx(null);
      return;
    }

    // Đánh dấu bắt đầu phát
    isCancelledRef.current = false;
    isPlayingAllRef.current = true;
    setIsPlayingAll(true);

    for (let i = 0; i < currentListening.dialogue.length; i++) {
      if (isCancelledRef.current) break;
      setPlayingLineIdx(i);

      await speakText(currentListening.dialogue[i].text);

      if (isCancelledRef.current) break;
      // Nghỉ ngắn giữa các câu thoại
      await new Promise((r) => setTimeout(r, 400));
      if (isCancelledRef.current) break;
    }

    // Kết thúc bình thường (không bị hủy)
    if (!isCancelledRef.current) {
      setPlayingLineIdx(null);
      setIsPlayingAll(false);
      isPlayingAllRef.current = false;
    }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner - Compact on mobile */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-1.5 sm:space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Headphones className="w-3.5 h-3.5" />
          <span>05 · {t('dailyLesson.listeningStep')}</span>
        </div>

        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
          {currentListening.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('dailyLesson.listeningSubtitle')}
        </p>
      </div>

      {/* Audio Player Controls - Compact & space-optimized for mobile */}
      <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-md">
        <div className="flex items-center justify-between gap-2.5">
          {/* Left: Play/Pause Button + Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={handlePlayAll}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer shrink-0"
              title={isPlayingAll ? t('dailyLesson.stopAudio') : t('dailyLesson.playAll')}
            >
              {isPlayingAll ? (
                <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
              )}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">
                  {isPlayingAll ? (
                    playingLineIdx !== null ? (
                      <>
                        <span className="hidden sm:inline">Đang phát </span>
                        <span>({playingLineIdx + 1}/{currentListening.dialogue.length})</span>
                      </>
                    ) : (
                      t('dailyLesson.stopAudio')
                    )
                  ) : (
                    t('dailyLesson.playAll')
                  )}
                </h4>
                {isPlayingAll && (
                  <span className="flex gap-0.5 items-end h-3 shrink-0">
                    <span className="w-0.5 h-2 bg-white rounded-full animate-pulse" />
                    <span className="w-0.5 h-3 bg-white rounded-full animate-pulse delay-75" />
                    <span className="w-0.5 h-1.5 bg-white rounded-full animate-pulse delay-150" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-100 truncate">
                {currentListening.dialogue.length} {t('nav.conversations').toLowerCase()}
              </p>
            </div>
          </div>

          {/* Right: Toggles for Transcript & Translation */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className={cn(
                'px-2.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer',
                showTranscript
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              )}
              title={t('dailyLesson.transcriptToggle')}
            >
              {showTranscript ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 opacity-70" />
              )}
              <span className="text-[11px] font-bold hidden sm:inline">
                {t('dailyLesson.transcriptToggle')}
              </span>
              <span className="text-[11px] font-bold sm:hidden">Lời thoại</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTranslation(!showTranslation)}
              className={cn(
                'px-2.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer',
                showTranslation
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              )}
              title={t('dailyLesson.vietnameseToggle')}
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold hidden sm:inline">
                {t('dailyLesson.vietnameseToggle')}
              </span>
              <span className="text-[11px] font-bold sm:hidden">
                {showTranslation ? 'Ẩn dịch' : 'Dịch'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Dialogue Conversation Turns - Space-optimized with scroll container & compact speech rows */}
      {showTranscript && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm space-y-2 sm:space-y-2.5 max-h-[360px] sm:max-h-[460px] overflow-y-auto pr-1">
          {currentListening.dialogue.map((turn, idx) => {
            const isSpeakingNow = playingLineIdx === idx;
            const isSpeaker1 = idx % 2 === 0;

            return (
              <div
                key={idx}
                ref={isSpeakingNow ? activeLineRef : null}
                className={cn(
                  'p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all flex items-start gap-2.5 sm:gap-3',
                  isSpeakingNow
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500/20 shadow-xs'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl font-bold flex items-center justify-center text-[11px] shrink-0',
                    isSpeaker1
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {turn.speaker.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      {turn.speaker}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayLine(turn.text, idx)}
                      className="p-1 -mr-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      title={isSpeakingNow ? 'Dừng phát' : 'Nghe câu này'}
                    >
                      <Volume2
                        className={cn(
                          'w-3.5 h-3.5',
                          isSpeakingNow && 'text-blue-600 animate-pulse font-bold'
                        )}
                      />
                    </button>
                  </div>

                  <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm leading-relaxed">
                    {turn.text}
                  </p>

                  {showTranslation && turn.vietnamese && (
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 italic leading-snug">
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
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {t('dailyLesson.listeningQuestions')}
          </h3>

          {currentListening.questions.map((q, qIdx) => {
            const selectedOpt = userAnswers[q.id];
            const isAnswered = selectedOpt !== undefined;
            const isCorrect = selectedOpt === q.correct_answer;

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {qIdx + 1}
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
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
                        optClass =
                          'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold';
                      } else if (isSelected) {
                        optClass =
                          'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold';
                      } else {
                        optClass =
                          'border-slate-200 dark:border-slate-800 opacity-40 bg-slate-50 dark:bg-slate-800/20 text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        disabled={isAnswered}
                        className={cn(
                          'w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left text-xs transition-all cursor-pointer',
                          optClass
                        )}
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center font-bold text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="truncate">{opt}</span>
                        </div>

                        {isAnswered && isRightOpt && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                        )}
                        {isAnswered && isSelected && !isRightOpt && (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && q.explanation && (
                  <div className="p-3 rounded-xl sm:rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40 text-xs text-cyan-900 dark:text-cyan-200 flex items-start gap-2">
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
