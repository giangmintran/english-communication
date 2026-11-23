import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  Star,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { LearningItem, CollectionItem } from '@/types/database';
import { SRSItemState } from '@/lib/srs';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { QuickDictionaryModal } from '@/components/common/QuickDictionaryModal';

interface CollectionFlashcardViewerProps {
  items: (LearningItem | CollectionItem)[];
  reviews: Record<string, any>;
  starredIds: Set<string>;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  playingId: string | null;
  onPlayAudio: (text: string, id: string, e: React.MouseEvent) => void;
  deckTitle?: string;
}

export function CollectionFlashcardViewer({
  items,
  reviews,
  starredIds,
  onToggleStar,
  playingId,
  onPlayAudio,
  deckTitle,
}: CollectionFlashcardViewerProps) {
  const { t, language } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDictModalOpen, setIsDictModalOpen] = useState(false);

  // Touch Swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  // Đảm bảo currentIndex luôn hợp lệ khi danh sách items lọc thay đổi
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [items.length]);

  const currentItem = items[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < items.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, items.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Keyboard navigation (ArrowLeft, ArrowRight, Space/Enter to flip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu người dùng đang nhập trong input search
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
  }, [handleNext, handlePrev]);

  // Touch Swipe Handlers
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

  if (!currentItem || items.length === 0) {
    return null;
  }

  const review = reviews[currentItem.id];
  const isMastered = review && (review.repetitions >= 3 || review.interval_days >= 7);
  const isLearning = review && !isMastered;
  const isStarred = starredIds.has(currentItem.id);
  const isSpeaking = playingId === currentItem.id;

  const total = items.length;

  return (
    <div className="space-y-4">
      {/* Top Header: Word Counter & Swipe Hint */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-900 dark:text-white font-extrabold text-sm">
            {t('collectionDetail.wordOfTotal', {
              current: currentIndex + 1,
              total,
            })}
          </span>
          <span className="hidden sm:inline text-slate-400">•</span>
          <span className="hidden sm:inline text-slate-400 font-normal">
            {t('collectionDetail.swipeHint')}
          </span>
        </div>
      </div>

      {/* FLIPPABLE & SWIPEABLE 3D CARD CONTAINER */}
      <div
        className="relative w-full min-h-[360px] sm:min-h-[400px] [perspective:1000px] select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          onClick={handleFlip}
          className={cn(
            'relative w-full h-full min-h-[360px] sm:min-h-[400px] rounded-3xl transition-transform duration-500 [transform-style:preserve-3d] cursor-pointer shadow-card hover:shadow-lg dark:hover:border-slate-700',
            isFlipped && '[transform:rotateY(180deg)]'
          )}
        >
          {/* ================= CARD FRONT (TIẾNG ANH & PHÁT ÂM) ================= */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 md:p-8 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            {/* Top Row: Meta Badges & Star button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {currentItem.difficulty_level && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {currentItem.difficulty_level}
                  </span>
                )}
                {currentItem.type && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 capitalize">
                    {currentItem.type}
                  </span>
                )}
              </div>

              {/* Status pill & Star */}
              <div className="flex items-center gap-1.5">
                {isMastered ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/40">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="hidden sm:inline">{t('collectionDetail.mastered')}</span>
                  </span>
                ) : isLearning ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/40">
                    <Clock className="w-3 h-3" />
                    <span className="hidden sm:inline">{t('collectionDetail.learning')}</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded-full">
                    {t('collectionDetail.notLearned')}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => onToggleStar(currentItem.id, e)}
                  className={cn(
                    'p-1.5 rounded-full transition-colors',
                    isStarred
                      ? 'text-amber-500 hover:text-amber-600'
                      : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                  )}
                  title={isStarred ? 'Bỏ lưu' : 'Lưu từ khó'}
                >
                  <Star className={cn('w-4 h-4', isStarred && 'fill-current')} />
                </button>
              </div>
            </div>

            {/* Center Content: English Text & IPA */}
            <div className="text-center py-4 my-auto space-y-3">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {currentItem.english_text}
              </h3>

              {currentItem.phonetic_ipa && (
                <p className="text-sm sm:text-base font-mono text-slate-400 dark:text-slate-500">
                  /{currentItem.phonetic_ipa}/
                </p>
              )}

              {/* Pronunciation Audio Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => onPlayAudio(currentItem.english_text, currentItem.id, e)}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer',
                    isSpeaking
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
                  )}
                  title="Nghe phát âm"
                >
                  <Volume2 className={cn('w-4 h-4', isSpeaking && 'animate-bounce')} />
                  <span>Nghe phát âm</span>
                </button>
              </div>
            </div>

            {/* Bottom: Flip Hint */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <span className="flex items-center gap-1.5 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <RotateCw className="w-3.5 h-3.5" />
                <span>{t('collectionDetail.flipToSeeMeaning')}</span>
              </span>

              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                Space / Enter để lật
              </span>
            </div>
          </div>

          {/* ================= CARD BACK (NGHĨA TIẾNG VIỆT & VÍ DỤ) ================= */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 md:p-8 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            {/* Top Row: Word Tag & Actions */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full">
                {currentItem.details?.part_of_speech || t('flashcards.vietnameseMeaning')}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDictModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                  title={t('flashcards.dictionary')}
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span className="hidden sm:inline">{t('flashcards.dictionary')}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => onToggleStar(currentItem.id, e)}
                  className={cn(
                    'p-1.5 rounded-full transition-colors cursor-pointer',
                    isStarred
                      ? 'text-amber-500 hover:text-amber-600'
                      : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                  )}
                >
                  <Star className={cn('w-4 h-4', isStarred && 'fill-current')} />
                </button>
              </div>
            </div>

            {/* Center Content: Vietnamese Meaning, Full Details & Examples */}
            {(() => {
              const details = currentItem.details;
              const isVi = language === 'vi';
              const langNode = isVi ? (details?.vi || details) : (details?.en || details);

              const usageNote: string = (langNode as any)?.usage_note || details?.usage_note || (isVi ? details?.vi?.usage_note : details?.en?.usage_note) || '';
              const definition: string = (langNode as any)?.definition || (langNode as any)?.meaning || details?.definition || (isVi ? details?.vi?.meaning : details?.en?.definition) || '';
              const collocations: string[] = (langNode as any)?.collocations || details?.collocations || details?.vi?.collocations || details?.en?.collocations || [];
              const synonyms: string[] = (langNode as any)?.synonyms || details?.synonyms || details?.vi?.synonyms || details?.en?.synonyms || [];
              const antonyms: string[] = (langNode as any)?.antonyms || details?.antonyms || details?.vi?.antonyms || details?.en?.antonyms || [];
              const moreExamples = details?.more_examples || [];

              const hasDetail = Boolean(
                details &&
                (
                  usageNote ||
                  collocations.length > 0 ||
                  synonyms.length > 0 ||
                  antonyms.length > 0 ||
                  moreExamples.length > 0 ||
                  definition ||
                  details.part_of_speech
                )
              );

              return (
                <div className="py-1 my-auto w-full">
                  <div
                    className="max-h-[380px] sm:max-h-[440px] overflow-y-auto space-y-3 px-1 py-1 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-700 dark:text-blue-400 tracking-tight">
                        {currentItem.vietnamese_meaning}
                      </h3>
                      {definition && definition !== currentItem.vietnamese_meaning && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-1 max-w-2xl mx-auto bg-slate-50 dark:bg-slate-800/40 py-1 px-3 rounded-lg border border-slate-100 dark:border-slate-800 inline-block">
                          "{definition}"
                        </p>
                      )}
                    </div>

                    {/* Ngữ cảnh sử dụng (Usage Note) */}
                    {usageNote && (
                      <div className="flex items-start gap-2 p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl text-xs text-amber-900 dark:text-amber-200 text-left w-full max-w-2xl sm:max-w-3xl mx-auto shadow-2xs">
                        <span className="shrink-0 text-base">💡</span>
                        <div className="space-y-0.5">
                          <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                            Ngữ cảnh sử dụng:
                          </span>
                          <p className="leading-relaxed font-medium">{usageNote}</p>
                        </div>
                      </div>
                    )}

                    {/* Cụm từ thường gặp (Collocations) */}
                    {collocations && collocations.length > 0 && (
                      <div className="w-full max-w-2xl sm:max-w-3xl mx-auto text-left">
                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Cụm từ thường gặp (Collocations)</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{collocations.length} cụm</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {collocations.map((col: string, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayAudio(col, `col-${idx}`, e);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/90 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer group shadow-2xs"
                              title="Bấm để nghe phát âm"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />
                              <span>{col}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Từ đồng nghĩa & Trái nghĩa (Synonyms & Antonyms) */}
                    {((synonyms && synonyms.length > 0) || (antonyms && antonyms.length > 0)) && (
                      <div className="flex flex-wrap items-center justify-center gap-2 text-xs w-full max-w-2xl sm:max-w-3xl mx-auto">
                        {synonyms && synonyms.length > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-400 text-[11px]">Đồng nghĩa:</span>
                            <span className="font-medium">{synonyms.join(', ')}</span>
                          </div>
                        )}
                        {antonyms && antonyms.length > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                            <span className="font-bold text-rose-500 text-[11px]">Trái nghĩa:</span>
                            <span className="font-medium">{antonyms.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. CÂU VÍ DỤ: Nếu có detail -> không hiện example_sentence gốc; nếu không có detail -> hiện example_sentence */}
                    {hasDetail ? (
                      /* CÓ DETAIL: Chỉ hiển thị more_examples nếu có */
                      moreExamples.length > 0 && (
                        <div className="space-y-2.5 w-full max-w-2xl sm:max-w-3xl mx-auto text-left pt-1">
                          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {t('flashcards.exampleContext')}
                          </div>
                          {moreExamples.map((ex, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800/90 space-y-1 shadow-2xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                  Ví dụ {idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPlayAudio(ex.en, `ex-more-${idx}`, e);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                                  title="Nghe câu ví dụ"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 font-semibold text-xs leading-relaxed">
                                {ex.en}
                              </p>
                              {ex.vi && (
                                <p className="text-slate-500 dark:text-slate-400 text-xs leading-normal">
                                  → {ex.vi}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      /* KHÔNG CÓ DETAIL: Hiển thị example_sentence mặc định */
                      currentItem.example_sentence && (
                        <div className="space-y-2.5 w-full max-w-2xl sm:max-w-3xl mx-auto text-left pt-1">
                          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {t('flashcards.exampleContext')}
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 sm:p-4 border border-slate-100 dark:border-slate-800 space-y-1 shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                                Ví dụ ngữ cảnh
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPlayAudio(currentItem.example_sentence!, `ex-${currentItem.id}`, e);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Nghe câu ví dụ"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 italic">
                              "{currentItem.example_sentence}"
                            </p>
                            {currentItem.example_meaning && (
                              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                                → {currentItem.example_meaning}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Bottom: Flip Back Hint */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <span className="flex items-center gap-1.5 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <RotateCw className="w-3.5 h-3.5" />
                <span>{t('collectionDetail.flipToSeeFront')}</span>
              </span>

              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                Space / Enter để lật lại
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SWIPE NAVIGATION CONTROLS */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Previous Button */}
        <button
          type="button"
          disabled={currentIndex <= 0}
          onClick={handlePrev}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer',
            currentIndex <= 0
              ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
          )}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{t('collectionDetail.prevPage')}</span>
        </button>

        {/* Counter Badge */}
        <div className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
          {currentIndex + 1} / {total}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={currentIndex >= total - 1}
          onClick={handleNext}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer',
            currentIndex >= total - 1
              ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          )}
        >
          <span>{t('collectionDetail.nextPage')}</span>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Tra cứu nhanh từ điển Song ngữ Anh - Việt */}
      <QuickDictionaryModal
        word={currentItem?.english_text || ''}
        vietnameseMeaning={currentItem?.vietnamese_meaning}
        exampleSentence={currentItem?.example_sentence}
        exampleMeaning={currentItem?.example_meaning}
        details={currentItem?.details}
        isOpen={isDictModalOpen}
        onClose={() => setIsDictModalOpen(false)}
      />
    </div>
  );
}
