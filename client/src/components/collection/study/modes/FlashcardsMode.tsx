import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2,
  Star,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { LearningItem } from '@/types/database';
import { SRSItemState } from '@/lib/srs';
import { speakText } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface FlashcardsModeProps {
  items: LearningItem[];
  reviews: Record<string, SRSItemState>;
  starredIds: Set<string>;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  autoPlayAudio: boolean;
  isShuffled: boolean;
  onToggleShuffle: () => void;
  onSwitchToLearn: () => void;
  isGuest?: boolean;
  totalCollectionWords?: number;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function formatIpa(ipa?: string): string {
  if (!ipa) return '';
  const trimmed = ipa.replace(/^\/+|\/+$/g, '').trim();
  return trimmed ? `/${trimmed}/` : '';
}

export function FlashcardsMode({
  items,
  reviews,
  starredIds,
  onToggleStar,
  autoPlayAudio,
  isShuffled,
  onToggleShuffle,
  onSwitchToLearn,
  isGuest,
  totalCollectionWords,
}: FlashcardsModeProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Active items based on items & shuffle
  const activeItems = useMemo(() => {
    if (isShuffled) {
      return shuffleArray(items);
    }
    return [...items];
  }, [items, isShuffled]);

  // Reset index when items or shuffle change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  }, [activeItems.length, isShuffled]);

  const currentItem = activeItems[currentIndex];

  const playAudio = useCallback(
    async (text: string) => {
      if (isPlayingAudio) return;
      setIsPlayingAudio(true);
      try {
        await speakText(text);
      } finally {
        setIsPlayingAudio(false);
      }
    },
    [isPlayingAudio]
  );

  // Auto-play audio when word changes
  useEffect(() => {
    if (currentItem && autoPlayAudio && !isCompleted) {
      playAudio(currentItem.english_text);
    }
  }, [currentIndex, isShuffled]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < activeItems.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, activeItems.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setIsCompleted(false);
    }
  }, [currentIndex]);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Touch Swipe tracking
  const touchStartX = useRef<number | null>(null);
  const minSwipeDistance = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const distance = touchStartX.current - touchEndX;
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  if (!currentItem || activeItems.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-xs sm:text-sm">
        Không có từ vựng nào trong danh sách.
      </div>
    );
  }

  const review = reviews[currentItem.id];
  const isMastered = review && (review.repetitions >= 3 || review.interval_days >= 7);
  const isStarred = starredIds.has(currentItem.id);

  // Màn hình hoàn thành toàn bộ thẻ
  if (isCompleted) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center space-y-5 sm:space-y-6 shadow-card">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {t('collectionStudy.allCardsCompleted', { total: activeItems.length })}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {t('collectionStudy.allCardsCompletedDesc')}
          </p>
        </div>

        {/* Guest locked remaining words notice */}
        {isGuest && totalCollectionWords && totalCollectionWords > activeItems.length && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 text-center space-y-2.5 max-w-md mx-auto">
            <p className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-200">
              {t('collectionStudy.guestRemainingWordsLocked', { count: totalCollectionWords - activeItems.length })}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t('collectionStudy.guestUnlockAllBtn', { total: totalCollectionWords })}</span>
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-1">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
              setIsCompleted(false);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('collectionStudy.restartFromStart')}</span>
          </button>

          <button
            onClick={onSwitchToLearn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('collectionStudy.switchToLearn')}</span>
          </button>
        </div>
      </div>
    );
  }

  const formattedIpa = formatIpa(currentItem.phonetic_ipa);
  const progressPercent = Math.round(((currentIndex + 1) / activeItems.length) * 100);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Header Progress Bar & Counter (Thay thế hoàn toàn Bước 1, Bước 2...) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-card space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm whitespace-nowrap">
              {t('collectionStudy.cardOfTotal', { current: currentIndex + 1, total: activeItems.length })}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              {progressPercent}%
            </span>
          </div>

          <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px] whitespace-nowrap hidden sm:inline">
            {t('collectionStudy.keyboardHint')}
          </span>
        </div>

        {/* Prominent Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2. 3D Flippable Card with Spacious Quizlet Width */}
      <div
        className="relative w-full min-h-[270px] sm:min-h-[340px] md:min-h-[380px] perspective-1000 select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          onClick={handleFlip}
          className={cn(
            'relative w-full h-full min-h-[270px] sm:min-h-[340px] md:min-h-[380px] rounded-2xl sm:rounded-3xl transition-transform duration-500 preserve-3d cursor-pointer shadow-card hover:shadow-lg dark:hover:border-slate-700',
            isFlipped && 'rotate-y-180'
          )}
        >
          {/* FRONT: English text + IPA + Audio */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            {/* Top row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {currentItem.difficulty_level && (
                  <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {currentItem.difficulty_level}
                  </span>
                )}
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 capitalize">
                  {currentItem.type || 'từ vựng'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {isMastered && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/40">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{t('collectionDetail.mastered')}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => onToggleStar(currentItem.id, e)}
                  className={cn(
                    'p-1.5 rounded-full transition-colors cursor-pointer',
                    isStarred
                      ? 'text-amber-500 hover:text-amber-600'
                      : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                  )}
                  title={isStarred ? t('collectionDetail.filterStarred') : t('collectionDetail.filterStarred')}
                >
                  <Star className={cn('w-4 h-4', isStarred && 'fill-current')} />
                </button>
              </div>
            </div>

            {/* Center: English */}
            <div className="text-center py-2 sm:py-3 my-auto space-y-2">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug break-words px-2">
                {currentItem.english_text}
              </h3>
              {formattedIpa && (
                <p className="text-xs sm:text-sm font-mono text-slate-400 dark:text-slate-500">
                  {formattedIpa}
                </p>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(currentItem.english_text);
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer',
                    isPlayingAudio
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                  )}
                >
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{t('collectionStudy.listenAudio')}</span>
                </button>
              </div>
            </div>

            {/* Bottom hint */}
            <div className="text-center pt-2 border-t border-slate-50 dark:border-slate-800/80">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                <RotateCw className="w-3 h-3" />
                <span>{t('collectionStudy.flipToSeeBack')}</span>
              </span>
            </div>
          </div>

          {/* BACK: Vietnamese meaning + Example */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-slate-50 dark:bg-slate-900/95 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-blue-200 dark:border-blue-900/50 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t('collectionStudy.contextExample')}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(currentItem.english_text);
                }}
                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                title={t('collectionStudy.listenAudio')}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="my-auto py-1 sm:py-2 space-y-2 text-center">
              <h4 className="text-lg sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 break-words px-2">
                {currentItem.vietnamese_meaning}
              </h4>

              {currentItem.example_sentence && (
                <div className="bg-white dark:bg-slate-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-700/60 text-left max-w-2xl mx-auto space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      "{currentItem.example_sentence}"
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(currentItem.example_sentence);
                      }}
                      className="text-slate-400 hover:text-blue-600 p-0.5 shrink-0 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {currentItem.example_meaning && (
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      → {currentItem.example_meaning}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="text-center pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                <RotateCw className="w-3 h-3" />
                <span>{t('collectionStudy.flipToSeeFront')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Buttons */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 pt-1">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('collectionStudy.prevCard')}</span>
        </button>

        <button
          onClick={handleFlip}
          className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title={t('collectionStudy.flipCard')}
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <span>{currentIndex + 1 === activeItems.length ? t('collectionStudy.completeSet') : t('collectionStudy.nextCard')}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
