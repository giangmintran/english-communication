import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Volume2,
  Lock,
} from 'lucide-react';
import { TestEvaluation } from '@/lib/testQuizGenerator';
import { speakText } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface TestResultReportProps {
  evaluation: TestEvaluation;
  onRetestAll: () => void;
  onRetestWrongOnly?: () => void;
  onSwitchToLearn: () => void;
  deckTitle?: string;
  isGuest?: boolean;
}

export function TestResultReport({
  evaluation,
  onRetestAll,
  onRetestWrongOnly,
  onSwitchToLearn,
  deckTitle,
  isGuest,
}: TestResultReportProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'wrong' | 'correct'>('all');
  const [playingText, setPlayingText] = useState<string | null>(null);

  const { scorePercentage, correctCount, incorrectCount, totalQuestions, correctAnswers, incorrectAnswers } =
    evaluation;

  const playAudio = async (text: string) => {
    if (playingText) return;
    setPlayingText(text);
    try {
      await speakText(text);
    } finally {
      setPlayingText(null);
    }
  };

  let gradeTitle = t('collectionStudy.testGradePractice');
  let gradeColor = 'text-amber-500';
  let gradeBg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40';

  if (scorePercentage >= 90) {
    gradeTitle = t('collectionStudy.testGradeExcellent');
    gradeColor = 'text-emerald-500';
    gradeBg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40';
  } else if (scorePercentage >= 70) {
    gradeTitle = t('collectionStudy.testGradeGood');
    gradeColor = 'text-blue-500';
    gradeBg = 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/40';
  }

  const allAnswers = [...correctAnswers, ...incorrectAnswers];
  const displayedAnswers =
    activeTab === 'wrong'
      ? incorrectAnswers
      : activeTab === 'correct'
      ? correctAnswers
      : allAnswers;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      {/* Top Banner: Score & Grade */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-center space-y-4 sm:space-y-6 shadow-card">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
          <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <span
            className={cn(
              'inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border',
              gradeBg,
              gradeColor
            )}
          >
            {gradeTitle}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            {scorePercentage}%
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('collectionStudy.testScoreSub', { correct: correctCount, total: totalQuestions })}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md mx-auto">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              {t('collectionStudy.correctCount')}
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {correctCount}
            </p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">
              {t('collectionStudy.incorrectCount')}
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-rose-600 dark:text-rose-400">
              {incorrectCount}
            </p>
          </div>
        </div>

        {/* Guest Warning Notice */}
        {isGuest && (
          <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-3.5 sm:p-4 text-xs text-amber-800 dark:text-amber-200 space-y-2 max-w-md mx-auto text-center">
            <div className="flex items-center justify-center gap-2 font-bold">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t('collectionStudy.guestTestCompletedNotice')}</span>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <span>{t('collectionStudy.guestLoginBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-1">
          {isGuest ? (
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 text-amber-500" />
              <span>{t('collectionStudy.loginToRetest')}</span>
            </Link>
          ) : (
            <button
              onClick={onRetestAll}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('collectionStudy.retestAll')}</span>
            </button>
          )}

          {!isGuest && incorrectCount > 0 && onRetestWrongOnly && (
            <button
              onClick={onRetestWrongOnly}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md shadow-rose-500/20 cursor-pointer"
            >
              <span>{t('collectionStudy.retestWrongOnly', { count: incorrectCount })}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onSwitchToLearn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('collectionStudy.switchToLearn')}</span>
          </button>
        </div>
      </div>

      {/* Answer Review Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-card space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            {t('collectionStudy.detailsTitle')}
          </h3>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0',
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              {t('collectionStudy.tabAll', { total: totalQuestions })}
            </button>
            <button
              onClick={() => setActiveTab('wrong')}
              className={cn(
                'px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0',
                activeTab === 'wrong'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              )}
            >
              {t('collectionStudy.tabWrong', { count: incorrectCount })}
            </button>
            <button
              onClick={() => setActiveTab('correct')}
              className={cn(
                'px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0',
                activeTab === 'correct'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              )}
            >
              {t('collectionStudy.tabCorrect', { count: correctCount })}
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-2.5 sm:space-y-3">
          {displayedAnswers.map((ans, idx) => {
            const isRight = ans.isCorrect;
            const q = ans.question;

            return (
              <div
                key={ans.questionId}
                className={cn(
                  'p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all space-y-1.5 sm:space-y-2',
                  isRight
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/30'
                    : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/30'
                )}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-400">
                        #{idx + 1}
                      </span>
                      {isRight ? (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('collectionStudy.correctFeedback')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{t('collectionStudy.incorrectToast')}</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white break-words">
                      {q.prompt}
                    </h4>
                  </div>

                  <button
                    onClick={() => playAudio(q.item.english_text)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer shrink-0"
                    title={t('collectionStudy.listenAudio')}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[11px] sm:text-xs space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {!isRight && (
                    <p className="text-rose-600 dark:text-rose-400 font-medium break-words">
                      {t('collectionStudy.youChose')}{' '}
                      <span className="line-through">{ans.userAnswer || t('collectionStudy.skipped')}</span>
                    </p>
                  )}
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold break-words">
                    {t('collectionStudy.rightAnswer')} <span>{q.correctAnswer}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
