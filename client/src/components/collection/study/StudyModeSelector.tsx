import React from 'react';
import { Layers, Brain, FileCheck2, ArrowLeft, Volume2, VolumeX, Shuffle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export type CollectionStudyMode = 'flashcards' | 'learn' | 'test';

interface StudyModeSelectorProps {
  currentMode: CollectionStudyMode;
  onSelectMode: (mode: CollectionStudyMode) => void;
  deckTitle: string;
  deckSlugOrId: string;
  autoPlayAudio: boolean;
  onToggleAudio: () => void;
  isShuffled?: boolean;
  onToggleShuffle?: () => void;
  isGuest?: boolean;
  totalWordsCount?: number;
  activeWordsCount?: number;
}

export function StudyModeSelector({
  currentMode,
  onSelectMode,
  deckTitle,
  deckSlugOrId,
  autoPlayAudio,
  onToggleAudio,
  isShuffled,
  onToggleShuffle,
  isGuest,
  totalWordsCount,
  activeWordsCount,
}: StudyModeSelectorProps) {
  const { t } = useTranslation();

  const modes: {
    id: CollectionStudyMode;
    label: string;
    mobileLabel: string;
    icon: React.ReactNode;
    desc: string;
  }[] = [
    {
      id: 'flashcards',
      label: t('collectionStudy.modeFlashcards'),
      mobileLabel: t('collectionStudy.modeFlashcards'),
      icon: <Layers className="w-4 h-4" />,
      desc: t('collectionStudy.modeFlashcardsDesc'),
    },
    {
      id: 'learn',
      label: t('collectionStudy.modeLearn'),
      mobileLabel: t('collectionStudy.modeLearn'),
      icon: <Brain className="w-4 h-4" />,
      desc: t('collectionStudy.modeLearnDesc'),
    },
    {
      id: 'test',
      label: t('collectionStudy.modeTest'),
      mobileLabel: t('collectionStudy.modeTest'),
      icon: <FileCheck2 className="w-4 h-4" />,
      desc: t('collectionStudy.modeTestDesc'),
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-card space-y-3 sm:space-y-4">
      {/* Top row: Back button, Title & Quick audio/shuffle toggles */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            to={`/collections/${deckSlugOrId}`}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
            title={t('collectionStudy.backToDeck') || 'Quay lại bộ sưu tập'}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider truncate">
                {deckTitle}
              </p>
              {isGuest && totalWordsCount && activeWordsCount && totalWordsCount > activeWordsCount && (
                <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                  {t('collectionStudy.guestTrialBadge', { current: activeWordsCount, total: totalWordsCount })}
                </span>
              )}
            </div>
            <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 dark:text-white truncate">
              {modes.find((m) => m.id === currentMode)?.label}
            </h1>
          </div>
        </div>

        {/* Global Controls: Audio & Shuffle (for flashcards) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {currentMode === 'flashcards' && onToggleShuffle && (
            <button
              onClick={onToggleShuffle}
              className={cn(
                'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer',
                isShuffled
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
              title={isShuffled ? t('collectionStudy.shuffled') : t('collectionStudy.originalOrder')}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isShuffled ? t('collectionStudy.shuffled') : t('collectionStudy.originalOrder')}
              </span>
            </button>
          )}

          <button
            onClick={onToggleAudio}
            className={cn(
              'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer',
              autoPlayAudio
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
            )}
            title={autoPlayAudio ? t('collectionStudy.turnAudioOff') : t('collectionStudy.turnAudioOn')}
          >
            {autoPlayAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl sm:rounded-2xl">
        {modes.map((mode) => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={cn(
                'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all select-none cursor-pointer',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <div
                className={cn(
                  'w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center shrink-0',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    : 'text-slate-400'
                )}
              >
                {mode.icon}
              </div>
              <span className="truncate">
                <span className="inline sm:hidden">{mode.mobileLabel}</span>
                <span className="hidden sm:inline">{mode.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
