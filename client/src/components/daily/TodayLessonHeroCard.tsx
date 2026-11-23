import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Compass,
  Flame,
  Calendar,
  Layers,
} from 'lucide-react';
import { DailyLesson } from '@/types/database';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface TodayLessonHeroCardProps {
  lesson: DailyLesson;
  deckTitle?: string;
  collectionTitle?: string;
  progress?: {
    completed?: boolean;
    currentStep?: number;
    completedSteps?: number[];
  };
  isGuest: boolean;
  todayFormatted: string;
  onUnlock?: () => void;
  onExploreMore?: () => void;
}

export function TodayLessonHeroCard({
  lesson,
  deckTitle,
  collectionTitle,
  progress,
  isGuest,
  todayFormatted,
  onUnlock,
  onExploreMore,
}: TodayLessonHeroCardProps) {
  const { t } = useTranslation();
  const isCompleted = Boolean(progress?.completed);
  const currentStep = progress?.currentStep ?? 0;
  const hasStarted = !isCompleted && currentStep > 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 p-5 sm:p-7 shadow-xl shadow-blue-500/5 transition-all">
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge: Chủ đề hôm nay / Thematic Sprint */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-xs">
            {lesson.sprint_day ? (
              <span>{t('daily.thematicSprintBadge', { day: lesson.sprint_day })}</span>
            ) : (
              <span>{t('daily.todayTopic')}</span>
            )}
          </span>

          {/* Ngày hôm nay */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{todayFormatted}</span>
          </span>

          {/* Quy tắc 70/30 */}
          {/* <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200/50 dark:border-amber-800/50">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Quy tắc 70/30 (7 mới + 3 ôn)</span>
          </span> */}

          {(collectionTitle || deckTitle) && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/50 dark:border-blue-800/50">
              {collectionTitle || deckTitle}
            </span>
          )}
        </div>

        {/* Trạng thái học bài này */}
        <div>
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-xs font-bold border border-emerald-200/80 dark:border-emerald-800 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('daily.completedToday')}</span>
            </span>
          ) : hasStarted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 text-xs font-bold border border-amber-200/80 dark:border-amber-800 shadow-2xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{t('daily.studyingStep', { step: currentStep + 1 })}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/40 dark:border-blue-900/40">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{t('daily.primaryGoal')}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative pt-5 sm:pt-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
        {/* Left Column: Lesson Details */}
        <div className="md:col-span-8 space-y-3.5">
          {lesson.stage_title && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-100/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-bold border border-blue-200/50 dark:border-blue-800/50">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{lesson.stage_title}</span>
            </div>
          )}

          {lesson.topic && !lesson.stage_title && (
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <span>{lesson.topic}</span>
            </p>
          )}

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {lesson.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            {lesson.description}
          </p>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200/50 dark:border-purple-800/50">
              Level {lesson.level}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>~{lesson.estimated_minutes} {t('common.mins')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('daily.stepProgress')}</span>
            </span>
          </div>

          {/* 7-Step Mini Visual Progress Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1.5">
              <span>{t('daily.stepProgressTitle')}</span>
              <span>
                {isCompleted
                  ? t('daily.stepsCompleted')
                  : t('daily.stepsCount', { current: Math.min(7, currentStep) })}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((stepIdx) => {
                const isStepDone =
                  isCompleted ||
                  (progress?.completedSteps &&
                    progress.completedSteps.includes(stepIdx));
                const isCurrent = !isCompleted && currentStep === stepIdx;

                return (
                  <div
                    key={stepIdx}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      isStepDone
                        ? 'bg-emerald-500'
                        : isCurrent
                          ? 'bg-blue-600 ring-2 ring-blue-300 dark:ring-blue-800'
                          : 'bg-slate-200 dark:bg-slate-800'
                    )}
                    title={`${t('dailyLesson.step')} ${stepIdx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Image thumbnail or Visual Banner */}
        {lesson.image_url && (
          <div className="hidden md:block md:col-span-4">
            <div className="relative group overflow-hidden rounded-2xl aspect-video md:aspect-4/3 border border-slate-200/80 dark:border-slate-800 shadow-md">
              <img
                src={lesson.image_url}
                alt={lesson.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                <span className="text-white text-xs font-semibold drop-shadow-sm flex items-center gap-1">
                  <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                  <span>{t('daily.chosenTopicForToday')}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons & Bottom Callout */}
      <div className="relative mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Information text */}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {isCompleted ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {t('daily.completedHeroNotice')}
              </span>
            </span>
          ) : (
            <span>
              {t('daily.regularStudyTip')}
            </span>
          )}
        </p>

        {/* Button Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {onExploreMore && (
            <button
              type="button"
              onClick={onExploreMore}
              className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            >
              <Compass className="w-4 h-4 text-blue-500" />
              <span>{t('daily.exploreMoreTopics')}</span>
            </button>
          )}

          {isCompleted ? (
            <Link
              to={`/daily/lesson/${lesson.id}`}
              className="px-5 py-3 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('daily.reviewAgain')}</span>
            </Link>
          ) : (
            <Link
              to={`/daily/lesson/${lesson.id}`}
              className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <span>{hasStarted ? t('daily.continueTodayLesson') : t('daily.startTodayLesson')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
