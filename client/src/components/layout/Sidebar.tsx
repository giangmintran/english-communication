import React from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { t } = useTranslation();

  const navItems = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.daily'), href: '/daily', icon: Calendar },
    { name: t('nav.collections'), href: '/collections', icon: LayoutGrid },
    { name: t('nav.conversations'), href: '/conversations', icon: MessageSquare },
    { name: t('nav.speaking'), href: '/speaking', icon: Mic },
    { name: t('nav.dictionary'), href: '/dictionary', icon: BookOpen },
    { name: t('nav.leaderboard'), href: '/leaderboard', icon: Trophy },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#111827] border-r border-slate-100 dark:border-slate-800/80 flex flex-col justify-between p-5 min-h-screen shrink-0 sticky top-0 h-screen overflow-y-auto transition-colors duration-150">
      <div>
        {/* SpeakUp Logo */}
        <Link to="/" className="flex items-center gap-2.5 px-3 py-2 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <MessageCircle className="w-6 h-6 fill-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Speak<span className="text-blue-600 dark:text-blue-400">Up</span>
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-blue-600 dark:text-blue-400 stroke-[2.2]' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Upgrade to Pro Card */}
      <div className="bg-gradient-to-b from-blue-50/90 to-blue-100/60 dark:from-slate-800/80 dark:to-slate-800/40 rounded-3xl p-5 border border-blue-100/80 dark:border-slate-700/60 text-center mt-6">
        <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
          <Crown className="w-5 h-5 fill-amber-500" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t('nav.upgradePro')}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed">
          {t('nav.upgradeDesc')}
        </p>
        <button
          onClick={() => alert(t('nav.upgradeAlert'))}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
        >
          <span>{t('nav.upgradeBtn')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
