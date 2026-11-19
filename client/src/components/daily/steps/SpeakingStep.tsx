import React, { useState } from 'react';
import { Mic, Volume2, Sparkles, MessageSquare, CheckCircle2 } from 'lucide-react';
import { LessonSpeaking } from '@/types/database';
import { speakText, calculateSimilarity } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { useLearningStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface SpeakingStepProps {
  speaking: LessonSpeaking;
}

export function SpeakingStep({ speaking }: SpeakingStepProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { score: number; spoken: string }>>({});
  const { addSpeakingTime } = useLearningStore();
  const { t } = useTranslation();

  const handlePlayAudio = async (text: string, id: string) => {
    setPlayingId(id);
    await speakText(text);
    setPlayingId(null);
  };

  const handleRecord = (targetSentence: { id: string; text: string }) => {
    if (recordingId) return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t('flashcards.micError'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setRecordingId(targetSentence.id);

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        const score = calculateSimilarity(spokenText, targetSentence.text);
        setScores((prev) => ({
          ...prev,
          [targetSentence.id]: { score, spoken: spokenText },
        }));
        setRecordingId(null);
        addSpeakingTime(1);
      };

      recognition.onerror = () => {
        setRecordingId(null);
        alert(t('flashcards.micFail'));
      };

      recognition.onend = () => {
        setRecordingId(null);
      };

      recognition.start();
    } catch {
      setRecordingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
          <Mic className="w-3.5 h-3.5" />
          <span>06 · {t('dailyLesson.speakingStep')}</span>
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          {t('dailyLesson.speakingSubtitle')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {speaking.situation}
        </p>
      </div>

      {/* Reference Dialogue */}
      {speaking.sample_dialogue && speaking.sample_dialogue.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
            <MessageSquare className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{t('dailyLesson.sampleDialogue')}</span>
          </div>

          <div className="space-y-2.5">
            {speaking.sample_dialogue.map((turn, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs flex items-start gap-3"
              >
                <span
                  className={cn(
                    'font-bold px-2 py-0.5 rounded-lg text-[10px] uppercase shrink-0',
                    turn.speaker.toLowerCase() === 'you'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  )}
                >
                  {turn.speaker}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {turn.text}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5">
                    {turn.vietnamese}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice Sentences with Mic */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          {t('dailyLesson.practiceSentences')}
        </h3>

        <div className="space-y-4">
          {speaking.practice_sentences.map((sent, idx) => {
            const result = scores[sent.id];
            const isRec = recordingId === sent.id;
            const isPlaying = playingId === sent.id;

            return (
              <div
                key={sent.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {sent.text}
                      </h4>
                      <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                        {sent.phonetic_ipa}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                        {sent.vietnamese_hint}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions: Listen & Speak */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1">
                  <button
                    onClick={() => handlePlayAudio(sent.text, sent.id)}
                    disabled={isPlaying}
                    className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Volume2 className={cn('w-3.5 h-3.5', isPlaying && 'text-rose-600 animate-pulse')} />
                    <span>{t('dailyLesson.listenSample')}</span>
                  </button>

                  <button
                    onClick={() => handleRecord(sent)}
                    disabled={isRec}
                    className={cn(
                      'flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                      isRec
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                    )}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isRec ? t('dailyLesson.recording') : t('dailyLesson.pressToSpeak')}</span>
                  </button>
                </div>

                {/* Recognition Result */}
                {result && (
                  <div
                    className={cn(
                      'p-3.5 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2',
                      result.score >= 70
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                        : result.score >= 50
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                    )}
                  >
                    <div>
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        {t('dailyLesson.youSpoke')}{' '}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        "{result.spoken}"
                      </span>
                    </div>

                    <span
                      className={cn(
                        'font-bold px-2.5 py-0.5 rounded-full text-white text-[11px]',
                        result.score >= 70
                          ? 'bg-emerald-500'
                          : result.score >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      )}
                    >
                      {result.score}% {t('dailyLesson.matchAccuracy')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
