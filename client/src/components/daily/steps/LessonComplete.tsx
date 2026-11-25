import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Trophy, Clock, BookOpen, RotateCcw, ArrowRight, Sparkles, Volume2 } from 'lucide-react';
import { DailyLessonContent } from '@/types/database';
import { speakText } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';

interface LessonCompleteProps {
  lessonContent: DailyLessonContent;
  score: number;
  totalQuestions: number;
  onReviewAgain: () => void;
}

export function LessonComplete({
  lessonContent,
  score,
  totalQuestions,
  onReviewAgain,
}: LessonCompleteProps) {
  const { user, signInWithGoogle } = useAuth();
  const { t } = useTranslation();

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 100;

  return (
    <div className="max-w-xl mx-auto my-4 sm:my-6 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-card text-center space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-sm">
        <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5 sm:mb-2">
          {t('dailyLesson.congratsTitle')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          {t('dailyLesson.congratsSubtitle')}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
        <div className="space-y-0.5 sm:space-y-1">
          <BookOpen className="w-4 h-4 mx-auto text-blue-600 dark:text-blue-400" />
          <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            {lessonContent.vocabulary.length}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold truncate">
            {t('dailyLesson.wordsLearned')}
          </p>
        </div>

        <div className="space-y-0.5 sm:space-y-1 border-x border-slate-200 dark:border-slate-700">
          <Trophy className="w-4 h-4 mx-auto text-amber-500" />
          <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            {score}/{totalQuestions}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold truncate">
            {percentage}%
          </p>
        </div>

        <div className="space-y-0.5 sm:space-y-1">
          <Clock className="w-4 h-4 mx-auto text-indigo-500" />
          <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            ~{lessonContent.lesson.estimated_minutes}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold truncate">
            {t('dailyLesson.min')}
          </p>
        </div>
      </div>

      {/* Vocabulary List Learned in Lesson */}
      {lessonContent.vocabulary && lessonContent.vocabulary.length > 0 && (
        <div className="text-left bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {t('flashcards.learnedWordsToday')}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
              {lessonContent.vocabulary.length} {t('common.words')}
            </span>
          </div>

          <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60 max-h-56 overflow-y-auto pr-1">
            {lessonContent.vocabulary.map((vocab, idx) => (
              <div key={vocab.id || idx} className="py-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {vocab.word}
                    </span>
                    {vocab.phonetic_ipa && (
                      <span className="text-slate-400 font-mono">/{vocab.phonetic_ipa}/</span>
                    )}
                    {vocab.part_of_speech && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-semibold">
                        {vocab.part_of_speech}
                      </span>
                    )}
                  </div>
                  <p className="text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                    {vocab.vietnamese_meaning}
                  </p>
                  {vocab.example_sentence && (
                    <p className="text-slate-500 dark:text-slate-400 italic mt-0.5">
                      "{vocab.example_sentence}"
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => speakText(vocab.word)}
                  className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 transition-colors shrink-0 shadow-xs cursor-pointer"
                  title="Audio"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest Mode Unlock Banner */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-4 sm:p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {/* <Sparkles className="w-4 h-4" /> */}
            <span>{t('dailyLesson.unlockAllLessons')}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {t('dailyLesson.guestCompleteNotice')}
          </p>
          <button
            onClick={() => signInWithGoogle()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 cursor-pointer transition-all"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>{t('dailyLesson.signInWithGoogle')}</span>
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          to="/daily"
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{t('dailyLesson.backToLessons')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <button
          onClick={onReviewAgain}
          className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('dailyLesson.reviewAgain')}</span>
        </button>
      </div>
    </div>
  );
}
