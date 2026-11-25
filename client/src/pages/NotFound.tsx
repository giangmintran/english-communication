import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Home, LayoutGrid, Calendar, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12 text-center">
      {/* 404 Visual Hero */}
      <div className="relative mb-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
          <Compass className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.8] animate-pulse" />
        </div>
        <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs shadow-md">
          404
        </span>
      </div>

      {/* Title & Description */}
      <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
        {t('notFound.title')}
      </h1>
      <p className="max-w-md text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
        {t('notFound.subtitle')}
      </p>

      {/* Main Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm mb-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full sm:w-1/2 py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        <Link
          to="/"
          className="w-full sm:w-1/2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-500/25 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>{t('notFound.backHome')}</span>
        </Link>
      </div>

      {/* Helpful Shortcuts */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 max-w-md w-full">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
          {t('notFound.hint')}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/daily"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('notFound.dailyLesson')}</span>
          </Link>
          <Link
            to="/collections"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t('notFound.exploreCollections')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
