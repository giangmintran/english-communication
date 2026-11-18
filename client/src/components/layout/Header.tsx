import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Flame, LogOut, Settings, Sun, Moon, Globe } from 'lucide-react';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation, Language } from '@/context/LanguageContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { UserAvatar } from '@/components/common/UserAvatar';

export function Header() {
  const { streakDays, profile } = useLearningStore();
  const { user, isLoading, signInWithGoogle, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    setLangMenuOpen(false);
  };

  return (
    <header className="w-full flex items-center justify-end py-4 px-8 bg-transparent relative z-30">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Streak Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 rounded-full text-amber-800 dark:text-amber-300 text-xs md:text-sm font-semibold shadow-2xs transition-colors">
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
          <span>{streakDays} {t('header.streak')}</span>
        </div>

        {/* Quick Language Switcher Dropdown */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all shadow-2xs cursor-pointer"
            title={t('header.switchLang')}
            aria-label="Change language"
          >
            <span className="text-base leading-none">
              {language === 'vi' ? '🇻🇳' : '🇬🇧'}
            </span>
            <span className="uppercase text-[11px] tracking-wider font-bold">
              {language}
            </span>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <button
                onClick={() => handleSelectLanguage('vi')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                  language === 'vi'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-sm">🇻🇳</span>
                <span>Tiếng Việt</span>
              </button>
              <button
                onClick={() => handleSelectLanguage('en')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                  language === 'en'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-sm">🇬🇧</span>
                <span>English</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-full transition-colors cursor-pointer"
          title={resolvedTheme === 'dark' ? t('header.themeLight') : t('header.themeDark')}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Notification Bell */}
        <button
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-full transition-colors cursor-pointer"
          title={t('header.notifications')}
          onClick={() => alert(t('header.noNotifications'))}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Auth Section */}
        {isLoading ? (
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        ) : user ? (
          /* User Profile Dropdown */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-1 cursor-pointer group focus:outline-hidden"
              aria-label="User menu"
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-500/20 group-hover:ring-blue-500 transition-all shadow-2xs">
                <UserAvatar
                  src={avatarSrc}
                  name={displayName}
                />
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                      <UserAvatar
                        src={avatarSrc}
                        name={displayName}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium border border-emerald-200/60 dark:border-emerald-800/40">
                    <GoogleIcon className="w-3 h-3" />
                    <span>{t('header.signedInWithGoogle')}</span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5 space-y-0.5">
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>{t('header.settings')}</span>
                  </Link>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors font-medium cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>{t('header.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Sign In with Google Button */
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>{t('header.login')}</span>
          </button>
        )}
      </div>
    </header>
  );
}
