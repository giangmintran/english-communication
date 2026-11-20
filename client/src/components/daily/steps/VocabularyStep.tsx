import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  BookOpen,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  LayoutGrid,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LessonVocabItem } from '@/types/database';
import { speakText } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface VocabularyStepProps {
  vocabulary: LessonVocabItem[];
}

export function VocabularyStep({ vocabulary }: VocabularyStepProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [viewedIds, setViewedIds] = useState<Set<string>>(
    () => new Set(vocabulary[0]?.id ? [vocabulary[0].id] : [])
  );
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [expandedListId, setExpandedListId] = useState<string | null>(vocabulary[0]?.id || null);

  // Touch Swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const total = vocabulary.length;
  const currentItem = vocabulary[currentIndex];

  // Mark current word as viewed whenever index changes
  useEffect(() => {
    if (vocabulary[currentIndex]?.id) {
      setViewedIds((prev) => {
        const next = new Set(prev);
        next.add(vocabulary[currentIndex].id);
        return next;
      });
    }
    setIsFlipped(false);
  }, [currentIndex, vocabulary]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < total) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, total]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handlePlayAudio = async (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlayingWord(text);
    await speakText(text);
    setPlayingWord(null);
  };

  // Keyboard navigation (ArrowLeft, ArrowRight, Space/Enter to flip)
  useEffect(() => {
    if (viewMode !== 'card') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

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
  }, [handleNext, handlePrev, viewMode]);

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
  };

  if (!vocabulary || vocabulary.length === 0) {
    return null;
  }

  const isWordPlaying = playingWord === currentItem?.word;
  const isExamplePlaying = playingWord === currentItem?.example_sentence;
  const isCurrentViewed = currentItem ? viewedIds.has(currentItem.id) : false;

  return (
    <div className="space-y-6">
      {/* Header Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>02 · {t('dailyLesson.vocabularyStep')}</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t('dailyLesson.vocabCount', { count: total })}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('dailyLesson.vocabLearnedNotice')}
          </p>
        </div>

        {/* View Mode Toggle & Progress Counter */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                viewMode === 'card'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
              title={t('dailyLesson.viewModeCards')}
            >
              <CreditCard className="w-3.5 h-3.5" />
              {/* <span className="hidden sm:inline">{t('dailyLesson.viewModeCards')}</span> */}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
              title={t('dailyLesson.viewModeList')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {/* <span className="hidden sm:inline">{t('dailyLesson.viewModeList')}</span> */}
            </button>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold shrink-0">
            <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            <span>
              {viewedIds.size} / {total}
            </span>
          </div>
        </div>
      </div>

      {viewMode === 'card' ? (
        /* ================= SINGLE CARD FLASHCARD VIEW ================= */
        <div className="space-y-4">
          {/* Quick Word Indicator Dots / Jump Bar */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {vocabulary.map((item, idx) => {
                const isActive = idx === currentIndex;
                const isViewed = viewedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsFlipped(false);
                    }}
                    className={cn(
                      'h-7 min-w-7 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer',
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20 scale-105'
                        : isViewed
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                    title={`Từ ${idx + 1}: ${item.word}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 hidden sm:inline">
              {t('dailyLesson.cardCounter', { current: currentIndex + 1, total })}
            </span>
          </div>

          {/* 3D FLIPPABLE FLASHCARD */}
          <div
            className="relative w-full min-h-[380px] sm:min-h-[420px] [perspective:1200px] select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              onClick={handleFlip}
              className={cn(
                'relative w-full h-full min-h-[380px] sm:min-h-[420px] rounded-3xl transition-transform duration-500 [transform-style:preserve-3d] cursor-pointer shadow-sm hover:shadow-md dark:border-slate-800',
                isFlipped && '[transform:rotateY(180deg)]'
              )}
            >
              {/* ================= CARD FRONT (TIẾNG ANH & PHÁT ÂM) ================= */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                {/* Top Meta Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      {t('dailyLesson.cardCounter', { current: currentIndex + 1, total })}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                      {currentItem.part_of_speech}
                    </span>
                    {currentItem.is_review ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80">
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Ôn tập 70/30</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                        <span>Từ mới</span>
                      </span>
                    )}
                  </div>

                  {isCurrentViewed && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã học</span>
                    </span>
                  )}
                </div>

                {/* Center Content: English Word & IPA */}
                <div className="text-center py-4 my-auto space-y-3">
                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {currentItem.word}
                  </h3>

                  {currentItem.phonetic_ipa && (
                    <p className="text-base sm:text-lg font-mono text-slate-400 dark:text-slate-500 font-medium">
                      /{currentItem.phonetic_ipa}/
                    </p>
                  )}

                  {/* Pronunciation Audio Button */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={(e) => handlePlayAudio(currentItem.word, e)}
                      className={cn(
                        'inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm cursor-pointer',
                        isWordPlaying
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
                      )}
                      title={t('dailyLesson.listenWord')}
                    >
                      <Volume2 className={cn('w-4 h-4', isWordPlaying && 'animate-bounce')} />
                      {/* <span>{t('dailyLesson.listenWord')}</span> */}
                    </button>
                  </div>
                </div>

                {/* Bottom Flip Hint */}
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{t('dailyLesson.flipCard')}</span>
                  </span>

                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {t('dailyLesson.spaceToFlip')}
                  </span>
                </div>
              </div>

              {/* ================= CARD BACK (NGHĨA TIẾNG VIỆT & VÍ DỤ) ================= */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-100 dark:border-slate-800 flex flex-col justify-between overflow-y-auto">
                {/* Top Meta Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">
                    {t('flashcards.vietnameseMeaning')}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {t('dailyLesson.cardCounter', { current: currentIndex + 1, total })}
                  </span>
                </div>

                {/* Center Content: Vietnamese Meaning, Collocations & Context */}
                <div className="py-2 sm:py-4 my-auto space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                      {currentItem.vietnamese_meaning}
                    </h3>
                  </div>

                  {/* Collocations */}
                  {currentItem.collocations && currentItem.collocations.length > 0 && (
                    <div className="text-center space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {t('dailyLesson.collocations')}
                      </span>
                      <div className="flex flex-wrap justify-center gap-2">
                        {currentItem.collocations.map((col, cIdx) => (
                          <span
                            key={cIdx}
                            className="px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-100 dark:border-slate-700/80"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Context Example */}
                  {currentItem.example_sentence && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-left max-w-lg mx-auto space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {t('dailyLesson.example')}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handlePlayAudio(currentItem.example_sentence, e)}
                          className={cn(
                            'flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer',
                            isExamplePlaying && 'animate-pulse font-bold'
                          )}
                          title={t('dailyLesson.listenExample')}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{t('dailyLesson.listenExample')}</span>
                        </button>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        "{currentItem.example_sentence}"
                      </p>
                      {currentItem.example_meaning && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          → {currentItem.example_meaning}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Flip Back Hint */}
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{t('dailyLesson.flipBack')}</span>
                  </span>

                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {t('dailyLesson.spaceToFlip')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD NAVIGATION CONTROLS (ARROWS ONLY) */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={handlePrev}
              aria-label={t('dailyLesson.prevWord')}
              title={t('dailyLesson.prevWord')}
              className={cn(
                'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all shadow-xs cursor-pointer',
                currentIndex <= 0
                  ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 active:scale-95'
              )}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 shrink-0 min-w-[80px] text-center shadow-xs">
              {currentIndex + 1} / {total}
            </div>

            <button
              type="button"
              disabled={currentIndex >= total - 1}
              onClick={handleNext}
              aria-label={t('dailyLesson.nextWord')}
              title={t('dailyLesson.nextWord')}
              className={cn(
                'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm cursor-pointer',
                currentIndex >= total - 1
                  ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:scale-105 active:scale-95'
              )}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      ) : (
        /* ================= LIST VIEW (EXPANDABLE ROWS) ================= */
        <div className="space-y-3">
          {vocabulary.map((item, idx) => {
            const isExpanded = expandedListId === item.id;
            const isViewed = viewedIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  setExpandedListId((prev) => (prev === item.id ? null : item.id));
                  setViewedIds((prev) => new Set(prev).add(item.id));
                }}
                className={cn(
                  'rounded-3xl border transition-all cursor-pointer select-none overflow-hidden',
                  isExpanded
                    ? 'bg-white dark:bg-slate-900 border-blue-500/50 shadow-md ring-2 ring-blue-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'
                )}
              >
                {/* Collapsed Bar */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 transition-colors',
                        isViewed
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      )}
                    >
                      {idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-base">
                          {item.word}
                        </span>
                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                          {item.phonetic_ipa}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium uppercase">
                          {item.part_of_speech}
                        </span>
                        {item.is_review ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/70">
                            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                            <span>Ôn tập 70/30</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/70">
                            <span>Từ mới</span>
                          </span>
                        )}
                      </div>

                      {!isExpanded && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate mt-0.5">
                          {item.vietnamese_meaning}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handlePlayAudio(item.word, e)}
                      className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                      title={t('dailyLesson.listenWord')}
                    >
                      <Volume2
                        className={cn(
                          'w-4 h-4',
                          playingWord === item.word && 'animate-pulse text-indigo-600'
                        )}
                      />
                    </button>

                    <div className="p-1 text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs animate-in fade-in duration-200">
                    <div>
                      <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                        {t('flashcards.vietnameseMeaning')}
                      </span>
                      <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                        {item.vietnamese_meaning}
                      </p>
                    </div>

                    {item.collocations && item.collocations.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                          {t('dailyLesson.collocations')}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {item.collocations.map((col, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium border border-slate-100 dark:border-slate-700/80"
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.example_sentence && (
                      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                            {t('dailyLesson.example')}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handlePlayAudio(item.example_sentence, e)}
                            className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{t('dailyLesson.listenExample')}</span>
                          </button>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {item.example_sentence}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs italic">
                          {item.example_meaning}
                        </p>
                      </div>
                    )}
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
