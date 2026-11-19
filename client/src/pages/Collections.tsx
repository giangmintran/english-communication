import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { ExploreCollections } from '@/components/dashboard/ExploreCollections';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

export default function CollectionsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto py-2 sm:py-4 space-y-5 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
          {t('collections.title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          {t('collections.subtitle')}
        </p>
      </div>

      {/* Guest Mode Notice */}
      {!user && (
        <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-slate-900 border border-amber-200/80 dark:border-amber-800/60 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-300/40 dark:border-amber-700/50">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Chế độ khách (Giới hạn 5 bộ sưu tập)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  5 bộ dùng thử
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Bạn đang xem 5 bộ sưu tập mẫu. Đăng nhập tài khoản Google để mở khóa toàn bộ kho bộ sưu tập và lưu tiến độ ôn tập SRS!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 shrink-0 cursor-pointer transition-all"
          >
            <GoogleIcon className="w-3.5 h-3.5" />
            <span>Mở khóa tất cả</span>
          </button>
        </div>
      )}

      <ExploreCollections isPage={true} />

      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        feature="collection"
      />
    </div>
  );
}
