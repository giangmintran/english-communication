import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Calendar,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/context/LanguageContext';

interface SessionSummaryProps {
  deckTitle: string;
  deckSlugOrId: string;
  newWordsLearned: number;
  wordsReviewed: number;
  wordsMastered: number;
  totalDeckWords: number;
  hasMoreNewWords: boolean;
  onLearnMore: () => void;
  onRestart: () => void;
}

export function SessionSummary({
  deckTitle,
  deckSlugOrId,
  newWordsLearned,
  wordsReviewed,
  wordsMastered,
  totalDeckWords,
  hasMoreNewWords,
  onLearnMore,
  onRestart,
}: SessionSummaryProps) {
  const { t } = useTranslation();

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const totalInteractions = newWordsLearned + wordsReviewed;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-card text-center space-y-6 sm:space-y-8 animate-fadeIn max-w-xl mx-auto">
      {/* Trophy & Badge */}
      <div className="relative inline-block">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Headings */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('collectionStudy.sessionCompleteTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {t('collectionStudy.sessionCompleteDesc')}
        </p>
      </div>

      {/* 3 Metric Cards Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
            {newWordsLearned}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-blue-700 dark:text-blue-300 mt-1 leading-tight">
            {t('collectionStudy.newWordsLearned')}
          </div>
        </div>

        <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {wordsReviewed}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-amber-700 dark:text-amber-300 mt-1 leading-tight">
            {t('collectionStudy.wordsReviewed')}
          </div>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {wordsMastered}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1 leading-tight">
            {t('collectionStudy.wordsMastered')}
          </div>
        </div>
      </div>

      {/* SRS Memory Forecast Box */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/70 rounded-2xl p-4 sm:p-5 text-left space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{t('collectionStudy.reviewForecastTitle')}</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-xs">
            <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
              <Clock className="w-4 h-4 text-blue-500 shrink-0" />
              <span>{t('collectionStudy.forecastTomorrow', { count: totalInteractions })}</span>
            </span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40 shrink-0">
              SM-2 Day 1
            </span>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic leading-relaxed">
            {t('collectionStudy.srsExplanation')}
          </p>
        </div>
      </div>

      {/* Action Buttons: Clean 2-tier layout */}
      <div className="space-y-3 pt-1">
        {hasMoreNewWords ? (
          <>
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={onLearnMore}
              className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <span>{t('collectionStudy.learnMoreBtn')}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Secondary Actions: 2 balanced columns */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onRestart}
                className="flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">{t('collectionStudy.reviewSessionBtn')}</span>
              </button>

              <Link
                to={`/collections/${deckSlugOrId}`}
                className="flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">{t('collectionStudy.backToDeckBtn')}</span>
              </Link>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onRestart}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>{t('collectionStudy.reviewSessionBtn')}</span>
            </button>

            <Link
              to={`/collections/${deckSlugOrId}`}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>{t('collectionStudy.backToDeckBtn')}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
