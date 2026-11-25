import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLearningStore } from '@/lib/store';
import { useTranslation } from '@/context/LanguageContext';

const DISMISS_KEY = 'speakup_dismiss_placement_banner';

export function PlacementBanner() {
  const { user } = useAuth();
  const { profile } = useLearningStore();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, [user]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 sm:p-6 shadow-md shadow-blue-500/20">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold tracking-tight">
                {t('placementTest.bannerTitle')}
              </span>
            </div>
            <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
              {t('placementTest.bannerDesc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <Link
            to="/placement-test"
            className="w-full sm:w-auto py-2.5 px-5 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <span>{t('placementTest.bannerBtn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            title="Close"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
