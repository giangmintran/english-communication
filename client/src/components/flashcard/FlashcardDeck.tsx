import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2,
  Mic,
  RotateCw,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Home,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LearningItem, ReviewGrade } from '@/types/database';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { speakText, calculateSimilarity } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { cn } from '@/lib/utils';

interface FlashcardDeckProps {
  deckTitle: string;
  items: LearningItem[];
  isDaily?: boolean;
}

export function FlashcardDeck({ deckTitle, items, isDaily = false }: FlashcardDeckProps) {
  const { user, signInWithGoogle } = useAuth();
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

    recordReview(currentItem.id, grade, user?.id, isDaily);
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
      <div className="max-w-5xl mx-auto my-6 sm:my-8 px-3 sm:px-4 transition-colors animate-in fade-in zoom-in-95 duration-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (Desktop): TỪ MỚI ĐÃ HỌC HÔM NAY */}
          <div className="order-2 lg:order-1 lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {t('flashcards.learnedWordsToday')}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {deckTitle}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-900/40">
                {items.length} {t('common.words')}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[520px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="py-3.5 first:pt-1 flex items-start justify-between gap-3 group">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                          {item.english_text}
                        </span>
                        {item.phonetic_ipa && (
                          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                            /{item.phonetic_ipa}/
                          </span>
                        )}
                        {item.type && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold uppercase">
                            {item.type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        {item.vietnamese_meaning}
                      </p>
                      {item.example_sentence && (
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic">
                          <span>"{item.example_sentence}"</span>
                          {item.example_meaning && (
                            <span className="block not-italic text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
                              {item.example_meaning}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handlePlayAudio(item.english_text, e)}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0 cursor-pointer shadow-xs"
                    title={t('flashcards.listen')}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI (Desktop): PHẦN CHÚC MỪNG & THAO TÁC */}
          <div className="order-1 lg:order-2 lg:col-span-5 space-y-5 lg:sticky lg:top-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card text-center space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-sm">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                  {t('flashcards.completeTitle')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {t('flashcards.completeDesc')}
                </p>
              </div>

              {/* Guest Mode Unlock Banner */}
              {!user && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('flashcards.unlockUnlimited')}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {t('flashcards.guestCompleteNotice', { count: items.length })}
                  </p>
                  <button
                    type="button"
                    onClick={() => signInWithGoogle()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                  >
                    <GoogleIcon className="w-4 h-4" />
                    <span>{t('flashcards.signInWithGoogle')}</span>
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                {isDaily && (
                  <Link
                    to="/daily/review"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-2xl shadow-md shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{t('flashcards.startReview')}</span>
                  </Link>
                )}
                <Link
                  to="/"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>{t('common.backHome')}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex(0);
                    setCompleted(false);
                    setIsFlipped(false);
                  }}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('flashcards.reviewAgain')}</span>
                </button>
              </div>
            </div>
          </div>
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
        className="w-full min-h-[320px] sm:min-h-[380px] bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-card cursor-pointer hover:shadow-lg dark:hover:border-slate-700 transition-all flex flex-col justify-between relative group select-none"
      >
        {/* Top Card Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="px-2.5 sm:px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              {deckTitle}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs font-medium uppercase">
              {currentItem.type}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] sm:text-xs font-semibold">
              {currentItem.difficulty_level}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('flashcards.flip')}</span>
          </button>
        </div>

        {/* Center Content */}
        {!isFlipped ? (
          // CARD FRONT: English & Pronunciation
          <div className="py-4 sm:py-6 text-center my-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 sm:mb-3 tracking-tight">
              {currentItem.english_text}
            </h2>
            <p className="text-slate-400 dark:text-slate-500 font-mono text-xs sm:text-sm tracking-wide mb-4 sm:mb-6">
              {currentItem.phonetic_ipa}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <button
                onClick={(e) => handlePlayAudio(currentItem.english_text, e)}
                disabled={isSpeaking}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-colors shadow-xs cursor-pointer"
              >
                <Volume2 className={cn('w-4 h-4', isSpeaking && 'animate-pulse')} />
                <span>{t('flashcards.listen')}</span>
              </button>

              <button
                onClick={(e) => handleSpeechRecognition(currentItem.english_text, e)}
                disabled={isRecording}
                className={cn(
                  'inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-5 sm:py-2.5 font-semibold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-colors shadow-xs cursor-pointer',
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
              <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs inline-block">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {t('flashcards.youSaid')}{' '}
                </span>
                <span className="text-slate-900 dark:text-white font-medium">
                  "{speechResult.spoken}"
                </span>
                <span
                  className={cn(
                    'ml-2 font-bold px-2 py-0.5 rounded-full text-white text-[11px]',
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
          <div className="py-4 sm:py-6 text-center my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              {t('flashcards.vietnameseMeaning')}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4 sm:mb-6">
              {currentItem.vietnamese_meaning}
            </h2>

            {currentItem.example_sentence && (
              <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-3 sm:p-4 text-left border border-slate-100 dark:border-slate-800 mb-4 max-w-lg mx-auto">
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
                <p className="text-slate-900 dark:text-white font-semibold text-xs sm:text-sm mb-1">
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
      <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
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
