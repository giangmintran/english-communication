import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Heart, MessageSquareHeart, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useFeedbackModal } from '@/context/FeedbackModalContext';

export function Footer() {
  const location = useLocation();
  const pathname = location.pathname;
  const { t } = useTranslation();
  const { openFeedback } = useFeedbackModal();

  // Tự động ẩn Footer khi người dùng đang trong phiên học / bài học tập trung
  const isLessonRoute = useMemo(() => {
    return (
      pathname.startsWith('/daily/lesson') ||
      pathname === '/daily/review' ||
      /\/collections\/[^/]+\/(learn|study)/.test(pathname) ||
      pathname.startsWith('/learn/')
    );
  }, [pathname]);

  if (isLessonRoute) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-auto pt-10 pb-8 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xs transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-4 h-4 fill-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Speak<span className="text-blue-600 dark:text-blue-400">Up</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Column 1: Learning */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('footer.learning')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/daily" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('footer.daily')}
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('footer.collections')}
                </Link>
              </li>
              <li>
                <Link to="/speaking" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('footer.speaking')}
                </Link>
              </li>
              <li>
                <Link to="/dictionary" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('footer.dictionary')}
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('footer.leaderboard')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Legal & Pricing */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('footer.company')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/pricing" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  {t('footer.pricing')} ✨
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support & Feedback */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('footer.support')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('footer.faq')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openFeedback()}
                  className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  <MessageSquareHeart className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{t('footer.feedbackBtn')}</span>
                </button>
              </li>
              <li>
                <Link to="/settings" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('footer.settings')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
          <p>© {currentYear} SpeakUp. {t('footer.rightsReserved')}</p>
          <p className="flex items-center gap-1">
            <span>{t('footer.builtWith')}</span>
            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}
