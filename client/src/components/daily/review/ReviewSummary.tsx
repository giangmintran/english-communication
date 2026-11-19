import React, { useEffect } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ReviewSessionSummary } from '@/types/quiz';
import { speakText } from '@/lib/speech';
import { useAuth } from '@/context/AuthContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';

interface ReviewSummaryProps {
  summary: ReviewSessionSummary;
  onRestartAll: () => void;
  onRetryMistakes: () => void;
}

export function ReviewSummary({
  summary,
  onRestartAll,
  onRetryMistakes,
}: ReviewSummaryProps) {
  const { user, signInWithGoogle } = useAuth();
  const totalWords = Math.round(summary.totalQuestions / 3);

  useEffect(() => {
    // Kích hoạt hiệu ứng pháo hoa chúc mừng
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  const hasMistakes = summary.wrongAnswers.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
      {/* Trophy & Congratulation Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-8 text-center shadow-card space-y-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-900 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 transform hover:scale-105 transition-transform">
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hoàn thành {summary.totalQuestions} câu ôn tập!</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {summary.accuracy >= 80 ? 'Xuất sắc! 🎉' : 'Hoàn thành tốt! 👏'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            Bạn đã ôn tập toàn diện {totalWords} từ vựng của mục tiêu hôm nay qua cả 3 kỹ năng: Nghe, Viết và Dịch.
          </p>
        </div>

        {/* Big Score Counter */}
        <div className="inline-flex items-baseline gap-2 px-5 py-3 sm:px-8 sm:py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
            {summary.correctCount}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-400">/ {summary.totalQuestions}</span>
          <span className="ml-2 sm:ml-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">
            {summary.accuracy}%
          </span>
        </div>
      </div>

      {/* 3 Skills Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Nghe */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Luyện Nghe
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {summary.byPart.listening.correct} / {summary.byPart.listening.total}
            </p>
          </div>
        </div>

        {/* Viết */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Luyện Viết
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {summary.byPart.writing.correct} / {summary.byPart.writing.total}
            </p>
          </div>
        </div>

        {/* Dịch */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Luyện Dịch
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {summary.byPart.translation.correct} / {summary.byPart.translation.total}
            </p>
          </div>
        </div>
      </div>

      {/* Review Mistakes Section (if any) */}
      {hasMistakes && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Các câu cần lưu ý ({summary.wrongAnswers.length} câu)
              </h3>
            </div>
            <button
              type="button"
              onClick={onRetryMistakes}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Luyện tập lại các câu này
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto pr-1">
            {summary.wrongAnswers.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3 text-sm">
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
                    Nghĩa: {item.question.vietnameseMeaning}
                  </p>
                  <p className="text-xs text-rose-500 mt-0.5">
                    Bạn đã trả lời: <span className="line-through">{item.userAnswer || 'Chưa trả lời'}</span>
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

      {/* Guest Mode Unlock Banner */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-3xl p-5 sm:p-6 text-center space-y-3 shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mở khóa không giới hạn & Lưu dữ liệu</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Bạn đang làm bài ở chế độ khách ({totalWords} từ)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            Đăng nhập bằng tài khoản Google để lưu kết quả vào đám mây, kích hoạt thuật toán lặp lại ngắt quãng (SRS) và mở khóa toàn bộ 20+ từ mỗi ngày!
          </p>
          <div className="pt-1">
            <button
              onClick={() => signInWithGoogle()}
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Đăng nhập với Google</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          to="/"
          className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Về Trang Chủ</span>
        </Link>

        {hasMistakes && (
          <button
            type="button"
            onClick={onRetryMistakes}
            className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ôn lại các câu sai ({summary.wrongAnswers.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={onRestartAll}
          className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Làm lại toàn bộ ({summary.totalQuestions} câu)</span>
        </button>
      </div>
    </div>
  );
}
