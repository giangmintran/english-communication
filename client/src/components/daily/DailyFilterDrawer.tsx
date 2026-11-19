import React, { useEffect } from 'react';
import {
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  BookOpen,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Deck, DailyLesson } from '@/types/database';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface DailyFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  lessons: DailyLesson[];
  lessonProgress: Record<string, { completed?: boolean; currentStep?: number }>;
  selectedDeckId: string;
  onSelectDeck: (deckId: string) => void;
  selectedLevel: string;
  onSelectLevel: (level: string) => void;
  selectedStatus: 'all' | 'completed' | 'in_progress';
  onSelectStatus: (status: 'all' | 'completed' | 'in_progress') => void;
  onReset: () => void;
}

export function DailyFilterDrawer({
  isOpen,
  onClose,
  decks,
  lessons,
  lessonProgress,
  selectedDeckId,
  onSelectDeck,
  selectedLevel,
  onSelectLevel,
  selectedStatus,
  onSelectStatus,
  onReset,
}: DailyFilterDrawerProps) {
  const { t } = useTranslation();

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate lesson counts per deck
  const getDeckCount = (deckId: string) => {
    if (deckId === 'all') return lessons.length;
    return lessons.filter(
      (l) =>
        l.deck_id === deckId ||
        l.deck_id === `deck-${deckId}` ||
        l.deck_id.replace(/^deck-/, '') === deckId
    ).length;
  };

  const levels = ['all', 'A1', 'A2', 'B1', 'B2'];
  const statuses: { id: 'all' | 'completed' | 'in_progress'; label: string }[] = [
    { id: 'all', label: 'Tất cả trạng thái' },
    { id: 'completed', label: 'Đã hoàn thành' },
    { id: 'in_progress', label: 'Chưa hoàn thành' },
  ];

  const hasActiveFilters =
    selectedDeckId !== 'all' || selectedLevel !== 'all' || selectedStatus !== 'all';

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer Panel from Right */}
      <aside className="fixed inset-y-0 right-0 w-[88vw] max-w-sm sm:max-w-md bg-white dark:bg-[#111827] shadow-2xl z-50 flex flex-col justify-between overflow-hidden border-l border-slate-100 dark:border-slate-800 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bộ lọc bài học
              </h3>
              <p className="text-xs text-slate-400">
                Tùy chỉnh danh sách hiển thị
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng bộ lọc"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Topics / Decks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Chủ đề bài học</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {decks.length + 1} lựa chọn
              </span>
            </div>

            <div className="space-y-1.5">
              {/* Option: Tất cả bài học */}
              <button
                type="button"
                onClick={() => onSelectDeck('all')}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer',
                  selectedDeckId === 'all'
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                      selectedDeckId === 'all'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    )}
                  >
                    {selectedDeckId === 'all' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span>{t('daily.allLessons')}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-500 border border-slate-200/60 dark:border-slate-700">
                  {getDeckCount('all')} bài
                </span>
              </button>

              {/* Options: List of Decks */}
              {decks.map((deck) => {
                const isSelected = selectedDeckId === (deck.slug || deck.id);
                const count = getDeckCount(deck.slug || deck.id);

                return (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => onSelectDeck(deck.slug || deck.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer',
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0',
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        )}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{deck.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-500 border border-slate-200/60 dark:border-slate-700 shrink-0">
                      {count} bài
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Level Selection */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Trình độ (Level)</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {levels.map((lvl) => {
                const isSelected = selectedLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onSelectLevel(lvl)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95',
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    {lvl === 'all' ? 'Tất cả level' : lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Status Selection */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Trạng thái học</span>
            </label>

            <div className="grid grid-cols-1 gap-2">
              {statuses.map((st) => {
                const isSelected = selectedStatus === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onSelectStatus(st.id)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer',
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{st.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/25 flex items-center justify-center cursor-pointer"
          >
            <span>Áp dụng bộ lọc</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
