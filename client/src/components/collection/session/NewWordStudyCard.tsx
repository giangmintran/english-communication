import React, { useEffect, useState } from 'react';
import { Volume2, Mic, ArrowRight, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { LearningItem } from '@/types/database';
import { speakText, calculateSimilarity } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface NewWordStudyCardProps {
  item: LearningItem;
  onProceedToCheck: () => void;
  autoPlayAudio?: boolean;
}

export function NewWordStudyCard({
  item,
  onProceedToCheck,
  autoPlayAudio = true,
}: NewWordStudyCardProps) {
  const { t } = useTranslation();
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [isPlayingExample, setIsPlayingExample] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ score: number; spoken: string } | null>(null);

  const handlePlayWord = async () => {
    if (isPlayingWord) return;
    setIsPlayingWord(true);
    try {
      await speakText(item.english_text);
    } finally {
      setIsPlayingWord(false);
    }
  };

  const handlePlayExample = async () => {
    if (!item.example_sentence || isPlayingExample) return;
    setIsPlayingExample(true);
    try {
      await speakText(item.example_sentence);
    } finally {
      setIsPlayingExample(false);
    }
  };

  const handleSpeechTest = () => {
    setSpeechResult(null);

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t('speaking.micError'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsRecording(true);

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        const score = calculateSimilarity(spoken, item.english_text);
        setSpeechResult({ score, spoken });
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  useEffect(() => {
    setSpeechResult(null);
    if (autoPlayAudio) {
      handlePlayWord();
    }
  }, [item.id]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-7 md:p-8 shadow-card space-y-6 transition-all duration-300">
      {/* Step Badge & Word Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{t('collectionStudy.stageLearnNew')}</span>
        </div>

        <div className="flex items-center gap-2">
          {item.difficulty_level && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {item.difficulty_level}
            </span>
          )}
          {item.type && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 capitalize">
              {item.type}
            </span>
          )}
        </div>
      </div>

      {/* Main English Phrase & Phonetic & Audio CTA */}
      <div className="text-center py-2 sm:py-4 space-y-3">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
          {item.english_text}
        </h2>

        {item.phonetic_ipa && (
          <p className="text-sm sm:text-base font-mono text-slate-400 dark:text-slate-500">
            /{item.phonetic_ipa}/
          </p>
        )}

        {/* Audio Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePlayWord}
            disabled={isPlayingWord}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer',
              isPlayingWord
                ? 'bg-blue-600 text-white animate-pulse'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
            )}
            title={t('collectionStudy.listenAudio')}
          >
            <Volume2 className={cn('w-4 h-4', isPlayingWord && 'animate-bounce')} />
            <span>{t('collectionStudy.listenAudio')}</span>
          </button>

          <button
            type="button"
            onClick={handleSpeechTest}
            disabled={isRecording}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer',
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
            title={t('speaking.startSpeaking')}
          >
            <Mic className="w-4 h-4" />
            <span>{isRecording ? t('speaking.listening') : t('speaking.startSpeaking')}</span>
          </button>
        </div>

        {/* Speech Recognition Feedback */}
        {speechResult && (
          <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 inline-block text-xs">
            <span className="text-slate-500">{t('speaking.youSaid')}: </span>
            <strong className="text-slate-800 dark:text-slate-200">"{speechResult.spoken}"</strong>
            <span
              className={cn(
                'ml-2 font-bold px-2 py-0.5 rounded-md',
                speechResult.score >= 80
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
              )}
            >
              {speechResult.score}% {t('speaking.matchScore')}
            </span>
          </div>
        )}
      </div>

      {/* Meaning in User Language */}
      <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">
          {t('flashcards.vietnameseMeaning')}
        </p>
        <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          {item.vietnamese_meaning}
        </p>
      </div>

      {/* Contextual Example Sentence */}
      {item.example_sentence && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('collectionStudy.exampleSentence')}
            </span>
            <button
              type="button"
              onClick={handlePlayExample}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
              title={t('collectionStudy.listenAudio')}
            >
              <Volume2 className={cn('w-4 h-4', isPlayingExample && 'text-blue-600 animate-pulse')} />
            </button>
          </div>
          <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 italic">
            "{item.example_sentence}"
          </p>
          {item.example_meaning && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              → {item.example_meaning}
            </p>
          )}
        </div>
      )}

      {/* Primary CTA: Ready for Immediate Check */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onProceedToCheck}
          className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-md shadow-blue-500/25 transition-all cursor-pointer"
        >
          <span>{t('collectionStudy.readyForCheck')}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
