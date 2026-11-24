import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  CheckCircle2,
  RotateCcw,
  Home,
  Headphones,
  PenTool,
  Languages,
  AlertCircle,
  Volume2,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ReviewSessionSummary } from '@/types/quiz';
import { LearningItem } from '@/types/database';
import { speakText } from '@/lib/speech';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';

interface ReviewSummaryProps {
  summary: ReviewSessionSummary;
  words?: LearningItem[];
  onRestartAll: () => void;
  onRetryMistakes: () => void;
}

export function ReviewSummary({
  summary,
  words = [],
  onRestartAll,
  onRetryMistakes,
}: ReviewSummaryProps) {
  const { user, signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  const [showWordsList, setShowWordsList] = useState(true);
  const totalWords = words.length > 0 ? words.length : Math.round(summary.totalQuestions / 3);

  const hasMistakes = summary.wrongAnswers.length > 0;

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (Desktop): TỪ MỚI ĐÃ HỌC VÀ CÂU CẦN LƯU Ý */}
        <div className="order-2 lg:order-1 lg:col-span-7 space-y-6">
          {/* Words Learned Today Section */}
          {words.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {t('dailyReview.learnedWordsTodayTitle', { count: words.length })}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWordsList((prev) => !prev)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <span>{showWordsList ? t('dailyReview.hideAllWords') : t('dailyReview.showAllWords')}</span>
                  {showWordsList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showWordsList && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto pr-1">
                  {words.map((w, idx) => (
                    <div key={w.id || idx} className="py-3.5 first:pt-1 flex items-start justify-between gap-3 text-sm">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {w.english_text}
                            </span>
                            {w.phonetic_ipa && (
                              <span className="text-xs font-mono text-slate-400">
                                /{w.phonetic_ipa}/
                              </span>
                            )}
                            {w.type && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold uppercase">
                                {w.type}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                            {w.vietnamese_meaning}
                          </p>
                          {w.example_sentence && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-0.5">
                              "{w.example_sentence}"
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => speakText(w.english_text)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer shadow-xs"
                        title="Audio"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Review Mistakes Section (if any) */}
          {hasMistakes && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {t('dailyReview.mistakesTitle', { count: summary.wrongAnswers.length })}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onRetryMistakes}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {t('dailyReview.retryMistakesBtn')}
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto pr-1">
                {summary.wrongAnswers.map((item, idx) => (
                  <div key={idx} className="py-3 first:pt-1 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{item.correctAnswer}</span>
                        <button
                          type="button"
                          onClick={() => speakText(item.correctAnswer)}
                          className="text-slate-400 hover:text-blue-600"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-normal text-slate-400 font-mono">
                          {item.question.phoneticIpa}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('dailyReview.meaningLabel')}: {item.question.vietnameseMeaning}
                      </p>
                      <p className="text-xs text-rose-500 mt-0.5">
                        {t('dailyReview.youAnswered')}{' '}
                        <span className="line-through">{item.userAnswer || t('dailyReview.unanswered')}</span>
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium shrink-0">
                      {item.question.partTitle.split(':')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI (Desktop): PHẦN CHÚC MỪNG & KẾT QUẢ & THAO TÁC */}
        <div className="order-1 lg:order-2 lg:col-span-5 space-y-5 lg:sticky lg:top-6">
          {/* Trophy & Congratulation Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-7 text-center shadow-card space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-900 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 transform hover:scale-105 transition-transform">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                {/* <Sparkles className="w-3.5 h-3.5" /> */}
                <span>{t('dailyReview.completedQuestions', { total: summary.totalQuestions })}</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {summary.accuracy >= 80 ? t('dailyReview.excellentTitle') : t('dailyReview.goodTitle')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
                {t('dailyReview.summaryDesc', { total: totalWords })}
              </p>
            </div>

            {/* Big Score Counter */}
            <div className="inline-flex items-baseline justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 w-full">
              <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                {summary.correctCount}
              </span>
              <span className="text-xl font-bold text-slate-400">/ {summary.totalQuestions}</span>
              <span className="ml-2 px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">
                {summary.accuracy}%
              </span>
            </div>

            {/* 3 Skills Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Nghe */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center space-y-1">
                <Headphones className="w-4 h-4 mx-auto text-blue-600 dark:text-blue-400" />
                <p className="text-[10px] font-semibold text-slate-400 uppercase truncate">
                  {t('dailyReview.listeningSkill')}
                </p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {summary.byPart.listening.correct}/{summary.byPart.listening.total}
                </p>
              </div>

              {/* Viết */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center space-y-1">
                <PenTool className="w-4 h-4 mx-auto text-amber-500" />
                <p className="text-[10px] font-semibold text-slate-400 uppercase truncate">
                  {t('dailyReview.writingSkill')}
                </p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {summary.byPart.writing.correct}/{summary.byPart.writing.total}
                </p>
              </div>

              {/* Dịch */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center space-y-1">
                <Languages className="w-4 h-4 mx-auto text-emerald-500" />
                <p className="text-[10px] font-semibold text-slate-400 uppercase truncate">
                  {t('dailyReview.translationSkill')}
                </p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {summary.byPart.translation.correct}/{summary.byPart.translation.total}
                </p>
              </div>
            </div>
          </div>

          {/* Guest Mode Unlock Banner */}
          {!user && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-3xl p-5 text-center space-y-3 shadow-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                {/* <Sparkles className="w-3.5 h-3.5" /> */}
                <span>{t('dailyReview.guestUnlockTitle')}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('dailyReview.guestReviewNoticeTitle', { total: totalWords })}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('dailyReview.guestReviewNoticeDesc')}
              </p>
              <button
                onClick={() => signInWithGoogle()}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>{t('dailyReview.signInWithGoogle')}</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <Link
              to="/"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>{t('dailyReview.backHome')}</span>
            </Link>

            {hasMistakes && (
              <button
                type="button"
                onClick={onRetryMistakes}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('dailyReview.retryMistakesAction', { count: summary.wrongAnswers.length })}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRestartAll}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('dailyReview.restartAllAction', { count: summary.totalQuestions })}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
