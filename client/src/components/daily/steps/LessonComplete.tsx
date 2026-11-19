import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Trophy, Clock, BookOpen, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyLessonContent } from '@/types/database';
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

  useEffect(() => {
    // Launch festive confetti!
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.55 },
    });
  }, []);

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

      {/* Guest Mode Unlock Banner */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-4 sm:p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Mở khóa toàn bộ bài học</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Bạn đã hoàn thành bài học trải nghiệm! Đăng nhập Google để mở khóa hơn 30+ bài học giao tiếp tiếp theo và lưu kết quả học tập vĩnh viễn.
          </p>
          <button
            onClick={() => signInWithGoogle()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 cursor-pointer transition-all"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>Đăng nhập với Google</span>
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
