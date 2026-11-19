import React, { useState } from 'react';
import { Mic, Volume2, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speakText, calculateSimilarity } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';

interface SpeakingChallengeCardProps {
  prompt: string;
  sampleAnswer: string;
  vietnameseHint?: string;
  onAnswer: (isCorrect: boolean) => void;
  disabled?: boolean;
}

export function SpeakingChallengeCard({
  prompt,
  sampleAnswer,
  vietnameseHint,
  onAnswer,
  disabled,
}: SpeakingChallengeCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ score: number; spoken: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const handlePlayAudio = async () => {
    setIsSpeaking(true);
    await speakText(sampleAnswer);
    setIsSpeaking(false);
  };

  const handleRecord = () => {
    if (disabled || isRecording) return;
    setSpeechResult(null);

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

      setIsRecording(true);

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        const score = calculateSimilarity(spokenText, sampleAnswer);
        setSpeechResult({ score, spoken: spokenText });
        setIsRecording(false);
        setSubmitted(true);
        onAnswer(score >= 50);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        alert(t('flashcards.micFail'));
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5" />
          <span>Speaking Challenge</span>
        </span>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
          {t('dailyLesson.speakingChallengePrompt')}
        </p>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
          {prompt}
        </h3>
        {vietnameseHint && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
            {vietnameseHint}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
        <button
          onClick={handleRecord}
          disabled={disabled || isRecording}
          className={cn(
            'flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 font-semibold text-xs rounded-2xl transition-all shadow-sm cursor-pointer',
            isRecording
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-rose-600 hover:bg-rose-700 text-white'
          )}
        >
          <Mic className="w-4 h-4" />
          <span>
            {isRecording ? t('dailyLesson.recording') : t('dailyLesson.pressToSpeak')}
          </span>
        </button>

        <button
          onClick={handlePlayAudio}
          disabled={isSpeaking}
          className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-4 py-2.5 sm:px-4 sm:py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
        >
          <Volume2 className={cn('w-4 h-4', isSpeaking && 'animate-pulse text-blue-600')} />
          <span>{t('dailyLesson.listenSample')}</span>
        </button>
      </div>

      {speechResult && (
        <div
          className={cn(
            'p-4 rounded-2xl border text-xs space-y-2',
            speechResult.score >= 70
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
              : speechResult.score >= 50
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              {t('dailyLesson.youSpoke')} "{speechResult.spoken}"
            </span>
            <span
              className={cn(
                'font-bold px-2.5 py-0.5 rounded-full text-white text-[11px]',
                speechResult.score >= 70
                  ? 'bg-emerald-500'
                  : speechResult.score >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              )}
            >
              {speechResult.score}% {t('dailyLesson.matchAccuracy')}
            </span>
          </div>

          <p className="font-semibold text-slate-700 dark:text-slate-300 pt-1">
            {t('dailyLesson.sampleAnswer')} <span className="text-blue-600 dark:text-blue-400 font-bold">{sampleAnswer}</span>
          </p>
        </div>
      )}
    </div>
  );
}
