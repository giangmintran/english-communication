import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  LayoutGrid,
  MessageSquare,
  Mic,
  BookOpen,
  Trophy,
  Settings,
  Crown,
  ArrowRight,
  MessageCircle,
  X,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation, Language } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLearningStore } from '@/lib/store';
import { UserAvatar } from '@/components/common/UserAvatar';
import { GoogleIcon } from '@/components/auth/GoogleIcon';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { t, language, setLanguage } = useTranslation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, signInWithGoogle, signOut } = useAuth();
  const { profile } = useLearningStore();

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navItems = [
    { name: t('nav.home'), href: '/', icon: Home, exact: true },
    { name: t('nav.daily'), href: '/daily', icon: Calendar },
    { name: t('nav.collections'), href: '/collections', icon: LayoutGrid },
    { name: t('nav.conversations'), href: '/conversations', icon: MessageSquare },
    { name: t('nav.speaking'), href: '/speaking', icon: Mic },
    { name: t('nav.dictionary'), href: '/dictionary', icon: BookOpen },
    { name: t('nav.leaderboard'), href: '/leaderboard', icon: Trophy },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  const displayName =
    (user?.id === profile.id && profile.display_name ? profile.display_name : null) ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    (user ? t('header.guestAccount') : profile.display_name);

  const avatarSrc =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    (user
      ? (profile.id === user.id && profile.avatar_url ? profile.avatar_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&bold=true`)
      : profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside className="fixed inset-y-0 left-0 w-[82vw] max-w-xs bg-white dark:bg-[#111827] shadow-2xl flex flex-col justify-between p-5 overflow-y-auto animate-in slide-in-from-left duration-200 border-r border-slate-100 dark:border-slate-800">
        <div>
          {/* Header: Logo & Close Button */}
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <MessageCircle className="w-5 h-5 fill-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Speak<span className="text-blue-600 dark:text-blue-400">Up</span>
              </span>
            </Link>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info or Sign in */}
          <div className="mb-6 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-blue-500/30 shrink-0">
                  <UserAvatar src={avatarSrc} name={displayName} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  signInWithGoogle();
                }}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>{t('header.login')}</span>
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-blue-600 dark:text-blue-400 stroke-[2.2]' : 'text-slate-400 dark:text-slate-500'
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Drawer Section: Pro card & Quick Controls */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Theme & Language Quick Toggles */}
          <div className="flex items-center justify-between gap-2 px-1">
            {/* Language Switch */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer',
                  language === 'vi'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                🇻🇳 VI
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer',
                  language === 'en'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                🇬🇧 EN
              </button>
            </div>

            {/* Dark Mode Switch */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {resolvedTheme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span>Tối</span>
                </>
              )}
            </button>
          </div>

          {/* Upgrade to Pro Banner */}
          <div className="bg-gradient-to-b from-blue-50/90 to-blue-100/60 dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl p-4 border border-blue-100/80 dark:border-slate-700/60 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Crown className="w-4 h-4 fill-amber-500 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {t('nav.upgradePro')}
              </h4>
            </div>
            <button
              onClick={() => alert(t('nav.upgradeAlert'))}
              className="w-full mt-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
            >
              <span>{t('nav.upgradeBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {user && (
            <button
              onClick={() => {
                onClose();
                signOut();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('header.logout')}</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
