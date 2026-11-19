import React from 'react';
import {
  X,
  Lock,
  Sparkles,
  BookOpen,
  Flame,
  Cloud,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  feature?: 'daily_lesson' | 'vocab' | 'collection' | 'general';
}

export function AuthPromptModal({
  isOpen,
  onClose,
  title,
  description,
  feature = 'general',
}: AuthPromptModalProps) {
  const { signInWithGoogle, isLoading } = useAuth();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const defaultTitle =
    feature === 'daily_lesson'
      ? 'Mở khóa toàn bộ Bài học hàng ngày'
      : feature === 'vocab'
      ? 'Mở khóa không giới hạn Từ vựng'
      : feature === 'collection'
      ? 'Mở khóa toàn bộ Bộ sưu tập'
      : 'Đăng nhập để trải nghiệm đầy đủ';

  const defaultDescription =
    feature === 'daily_lesson'
      ? 'Chế độ khách chỉ cho phép học thử 1 bài học mẫu. Hãy đăng nhập với Google để mở khóa toàn bộ lộ trình bài học từ cơ bản đến nâng cao và lưu kết quả học tập.'
      : feature === 'vocab'
      ? 'Chế độ khách bị giới hạn học thử 5 từ mới. Đăng nhập ngay để học không giới hạn 20+ từ mỗi ngày và đồng bộ tiến trình lặp lại ngắt quãng (SRS).'
      : feature === 'collection'
      ? 'Chế độ khách chỉ hiển thị 5 bộ sưu tập cơ bản. Hãy đăng nhập với Google để mở khóa toàn bộ các bộ từ vựng theo chủ đề chuyên sâu và đồng bộ tiến trình học tập.'
      : 'Đăng nhập bằng tài khoản Google miễn phí để mở khóa toàn bộ tính năng và đồng bộ trên mọi thiết bị.';

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Lỗi khi đăng nhập:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Glowing background decor */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Badge */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25 mb-4">
            <Lock className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Yêu cầu đăng nhập</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title || defaultTitle}
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {description || defaultDescription}
          </p>
        </div>

        {/* Benefits list */}
        <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3 mb-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Mở khóa không giới hạn
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Toàn bộ các bài học theo chủ đề và kho 1000+ từ vựng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Duy trì chuỗi Streak & Bảng xếp hạng
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ghi nhận nỗ lực học tập mỗi ngày và thi đua cùng bạn bè
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Đồng bộ đám mây đa thiết bị
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tiến độ học tập và thuật toán SRS được lưu vĩnh viễn
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-3.5 px-5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-[0.99] border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <GoogleIcon className="w-5 h-5" />
            <span>Tiếp tục với Google (Miễn phí)</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            Để sau (Tiếp tục dùng thử)
          </button>
        </div>
      </div>
    </div>
  );
}
