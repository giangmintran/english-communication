import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, CheckCircle2, Sparkles } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface SessionHeaderProps {
  deckTitle: string;
  deckSlugOrId: string;
  currentStep: number;
  totalSteps: number;
  autoPlayAudio: boolean;
  onToggleAudio: () => void;
  stageLabel: string;
  correctCount: number;
}

export function SessionHeader({
  deckTitle,
  deckSlugOrId,
  currentStep,
  totalSteps,
  autoPlayAudio,
  onToggleAudio,
  stageLabel,
  correctCount,
}: SessionHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleExit = () => {
    if (window.confirm(t('collectionStudy.exitConfirm'))) {
      navigate(`/collections/${deckSlugOrId}`);
    }
  };

  const progressPercent =
    totalSteps > 0 ? Math.min(100, Math.round((currentStep / totalSteps) * 100)) : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Nav Line */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleExit}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs shrink-0 cursor-pointer"
            title={t('collectionStudy.backToDeck')}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
              {deckTitle}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold truncate">
              {/* <Sparkles className="w-3.5 h-3.5 shrink-0" /> */}
              <span>{stageLabel}</span>
            </div>
          </div>
        </div>

        {/* Audio Toggle & Correct Counter */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleAudio}
            className={cn(
              'p-2 sm:p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
              autoPlayAudio
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            )}
            title={autoPlayAudio ? t('collectionStudy.soundOn') : t('collectionStudy.soundOff')}
          >
            {autoPlayAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {autoPlayAudio ? t('collectionStudy.soundOn') : t('collectionStudy.soundOff')}
            </span>
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {correctCount}/{totalSteps}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
          <span>
            {t('collectionStudy.stepWordOfTotal', {
              current: Math.min(currentStep, totalSteps),
              total: totalSteps,
            })}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
