import React, { useState, useEffect } from 'react';
import { MessageSquareHeart, Sparkles, X } from 'lucide-react';
import { useFeedbackModal } from '@/context/FeedbackModalContext';
import { useTranslation } from '@/context/LanguageContext';
import { useLocation } from 'react-router-dom';

export function FloatingFeedbackButton() {
  const { openFeedback, isOpen } = useFeedbackModal();
  const { t } = useTranslation();
  const location = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);

  // Ẩn nút nổi khi đang trong bài kiểm tra trắc nghiệm / flashcard toàn màn hình để không phân tâm
  const isImmersiveMode =
    location.pathname.includes('/study') ||
    location.pathname.includes('/learn') ||
    location.pathname.startsWith('/daily/lesson') ||
    location.pathname === '/daily/review';

  // Khôi phục hiển thị khi chuyển trang
  useEffect(() => {
    setIsDismissed(false);
  }, [location.pathname]);

  if (isOpen || isDismissed || isImmersiveMode) return null;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center group">
      <button
        type="button"
        onClick={() => openFeedback()}
        className="flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        title={t('feedback.floatingTooltip') || 'Góp ý & Báo lỗi'}
        aria-label="Open feedback modal"
      >
        <MessageSquareHeart className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
        <span className="text-xs sm:text-sm font-bold tracking-tight pr-0.5 hidden xs:inline sm:inline">
          {t('feedback.floatingBtn') || 'Góp ý'}
        </span>
      </button>

      {/* Quick dismiss button on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsDismissed(true);
        }}
        className="opacity-0 group-hover:opacity-100 -ml-2 -mt-7 w-5 h-5 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs text-xs"
        title="Tạm ẩn"
        aria-label="Dismiss button"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
