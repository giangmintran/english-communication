import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, Mic, RotateCw, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LearningItem, ReviewGrade } from '@/types/database';
import { useLearningStore } from '@/lib/store';
import { speakText, calculateSimilarity } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface FlashcardDeckProps {
  deckTitle: string;
  items: LearningItem[];
}

export function FlashcardDeck({ deckTitle, items }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ score: number; spoken: string } | null>(null);
  const [completed, setCompleted] = useState(false);

  const { recordReview, addSpeakingTime } = useLearningStore();
  const { t } = useTranslation();

  const currentItem = items[currentIndex];

  const handlePlayAudio = async (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsSpeaking(true);
    await speakText(text);
    setIsSpeaking(false);
  };

  const handleSpeechRecognition = (targetText: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSpeechResult(null);

    // Check Web Speech API support
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
        const score = calculateSimilarity(spokenText, targetText);
        setSpeechResult({ score, spoken: spokenText });
        setIsRecording(false);
        addSpeakingTime(1);
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

  const handleRate = (grade: ReviewGrade) => {
    if (!currentItem) return;

    recordReview(currentItem.id, grade);
    setIsFlipped(false);
    setSpeechResult(null);

    if (currentIndex + 1 < items.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  if (completed) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-card text-center transition-colors">
        <div className="w-20 h-20 bg-green-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t('flashcards.completeTitle')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          {t('flashcards.completeDesc')}
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            {t('common.backHome')}
          </Link>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setCompleted(false);
              setIsFlipped(false);
            }}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-2xl transition-all cursor-pointer"
          >
            {t('flashcards.reviewAgain')}
          </button>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="text-center p-8">
        <p className="text-slate-500 dark:text-slate-400">{t('flashcards.noData')}</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 dark:text-blue-400 font-semibold">
          {t('common.backHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Top bar with back and progress */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('flashcards.exit')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
            {currentIndex + 1} / {items.length}
          </span>
          <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* FLASHCARD CONTAINER */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[380px] bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-card cursor-pointer hover:shadow-lg dark:hover:border-slate-700 transition-all flex flex-col justify-between relative group select-none"
      >
        {/* Top Card Badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              {deckTitle}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium uppercase">
              {currentItem.type}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              {currentItem.difficulty_level}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{t('flashcards.flip')}</span>
          </button>
        </div>

        {/* Center Content */}
        {!isFlipped ? (
          // CARD FRONT: English & Pronunciation
          <div className="py-6 text-center my-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
              {currentItem.english_text}
            </h2>
            <p className="text-slate-400 dark:text-slate-500 font-mono text-sm tracking-wide mb-6">
              {currentItem.phonetic_ipa}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={(e) => handlePlayAudio(currentItem.english_text, e)}
                disabled={isSpeaking}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold text-sm rounded-2xl transition-colors shadow-xs cursor-pointer"
              >
                <Volume2 className={cn('w-4 h-4', isSpeaking && 'animate-pulse')} />
                <span>{t('flashcards.listen')}</span>
              </button>

              <button
                onClick={(e) => handleSpeechRecognition(currentItem.english_text, e)}
                disabled={isRecording}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-2xl transition-colors shadow-xs cursor-pointer',
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                )}
              >
                <Mic className="w-4 h-4" />
                <span>{isRecording ? t('flashcards.listening') : t('flashcards.speak')}</span>
              </button>
            </div>

            {speechResult && (
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs inline-block">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {t('flashcards.youSaid')}{' '}
                </span>
                <span className="text-slate-900 dark:text-white font-medium">
                  "{speechResult.spoken}"
                </span>
                <span
                  className={cn(
                    'ml-2 font-bold px-2 py-0.5 rounded-full text-white',
                    speechResult.score >= 80 ? 'bg-green-500' : speechResult.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                >
                  {speechResult.score}% {t('flashcards.match')}
                </span>
              </div>
            )}
          </div>
        ) : (
          // CARD BACK: Meaning & Examples
          <div className="py-6 text-center my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              {t('flashcards.vietnameseMeaning')}
            </div>
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">
              {currentItem.vietnamese_meaning}
            </h2>

            {currentItem.example_sentence && (
              <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-4 text-left border border-slate-100 dark:border-slate-800 mb-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {t('flashcards.exampleContext')}
                  </span>
                  <button
                    onClick={(e) => handlePlayAudio(currentItem.example_sentence, e)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-slate-900 dark:text-white font-semibold text-sm mb-1">
                  {currentItem.example_sentence}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  {currentItem.example_meaning}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bottom Hint */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500">
          {!isFlipped ? t('flashcards.flipHintFront') : t('flashcards.flipHintBack')}
        </div>
      </div>

      {/* SM-2 RATING BUTTONS */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => handleRate(0)}
          className="p-3.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/50 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
        >
          <span>{t('flashcards.rateForgot')}</span>
          <span className="text-[11px] font-normal text-red-400 dark:text-red-300">
            {t('flashcards.rateForgotDesc')}
          </span>
        </button>

        <button
          onClick={() => handleRate(1)}
          className="p-3.5 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
        >
          <span>{t('flashcards.rateHard')}</span>
          <span className="text-[11px] font-normal text-amber-500 dark:text-amber-300">
            {t('flashcards.rateHardDesc')}
          </span>
        </button>

        <button
          onClick={() => handleRate(2)}
          className="p-3.5 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
        >
          <span>{t('flashcards.rateGood')}</span>
          <span className="text-[11px] font-normal text-blue-400 dark:text-blue-300">
            {t('flashcards.rateGoodDesc')}
          </span>
        </button>

        <button
          onClick={() => handleRate(3)}
          className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('flashcards.rateEasy')}</span>
          </div>
          <span className="text-[11px] font-normal text-emerald-500 dark:text-emerald-300">
            {t('flashcards.rateEasyDesc')}
          </span>
        </button>
      </div>
    </div>
  );
}
