import React, { useEffect } from 'react';
import {
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface DailyFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedStatus: 'all' | 'completed' | 'in_progress';
  onSelectStatus: (status: 'all' | 'completed' | 'in_progress') => void;
  onReset: () => void;
  getCategoryCount: (category: string) => number;
}

export function DailyFilterDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  onReset,
  getCategoryCount,
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

  const statuses: { id: 'all' | 'completed' | 'in_progress'; label: string }[] = [
    { id: 'all', label: t('daily.statusAll') },
    { id: 'completed', label: t('daily.statusCompleted') },
    { id: 'in_progress', label: t('daily.statusInProgress') },
  ];

  const hasActiveFilters = selectedCategory !== 'all' || selectedStatus !== 'all';

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
                {t('daily.filterDrawerTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('daily.filterDrawerSubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={t('daily.closeFilter')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{t('daily.filterTopicTitle')}</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {t('daily.optionsCount', { count: categories.length })}
              </span>
            </div>

            <div className="space-y-1.5">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count = getCategoryCount(cat);
                const label = cat === 'all' ? t('daily.allLessons') : cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onSelectCategory(cat)}
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
                      <span className="truncate">{label}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-500 border border-slate-200/60 dark:border-slate-700 shrink-0">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Status Selection */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('daily.filterStatusTitle')}</span>
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
            <span>{t('daily.resetFilters')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/25 flex items-center justify-center cursor-pointer"
          >
            <span>{t('daily.applyFilter')}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
