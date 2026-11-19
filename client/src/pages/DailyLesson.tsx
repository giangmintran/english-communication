import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Lock, Sparkles } from 'lucide-react';
import { DailyLessonContent } from '@/types/database';
import { lessonApi } from '@/lib/lessonApi';
import { LessonStepper } from '@/components/daily/steps/LessonStepper';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';

export default function DailyLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, signInWithGoogle } = useAuth();
  const [content, setContent] = useState<DailyLessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;

    async function loadLesson() {
      if (!lessonId) return;

      try {
        setLoading(true);
        const data = await lessonApi.getContentById(lessonId);
        if (mounted && data) {
          setContent(data);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Lỗi khi tải bài học');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadLesson();
    return () => {
      mounted = false;
    };
  }, [lessonId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-base">
          {error || 'Không tìm thấy bài học'}
        </h3>
        <Link
          to="/daily"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('dailyLesson.backToLessons')}</span>
        </Link>
      </div>
    );
  }

  // Chế độ khách (chưa đăng nhập): chỉ cho phép học thử bài đầu tiên (lesson-restaurant-01 hoặc lesson-daily-1)
  const isLockedForGuest = !user && lessonId !== 'lesson-restaurant-01' && lessonId !== 'lesson-daily-1';

  if (isLockedForGuest) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-amber-50/50 dark:ring-amber-900/20">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chế độ khách bị giới hạn</span>
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Bài học này yêu cầu đăng nhập
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Bạn đang học ở chế độ khách (chỉ được học thử 1 bài mẫu). Vui lòng đăng nhập với tài khoản Google để mở khóa toàn bộ bài học và lưu lộ trình tiến bộ của bạn.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => signInWithGoogle()}
            className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>Đăng nhập với Google để mở khóa</span>
          </button>

          <Link
            to="/daily/lesson/lesson-restaurant-01"
            className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors block"
          >
            <span>Học bài mẫu miễn phí (Bài 1)</span>
          </Link>

          <Link
            to="/daily"
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors inline-block pt-1"
          >
            ← Quay lại danh sách bài học
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0B0F19] transition-colors pb-12">
      <LessonStepper lessonContent={content} />
    </div>
  );
}
