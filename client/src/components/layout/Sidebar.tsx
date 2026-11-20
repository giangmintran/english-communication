import React, { useState, useEffect, useMemo } from 'react';
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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  isCollapsed: externalIsCollapsed,
  onToggleCollapse,
}: SidebarProps = {}) {
  const location = useLocation();
  const pathname = location.pathname;
  const { t } = useTranslation();

  // Kiểm tra xem trang hiện tại có phải là bài học / phiên học tập không
  const isLessonRoute = useMemo(() => {
    return (
      pathname.startsWith('/daily/lesson') ||
      pathname === '/daily/review' ||
      /\/collections\/[^/]+\/(learn|study)/.test(pathname) ||
      pathname.startsWith('/learn/')
    );
  }, [pathname]);

  // Quản lý trạng thái thu gọn nội bộ
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(isLessonRoute);

  // Tự động thu gọn menu khi bắt đầu bài học, và mở lại khi quay lại các trang thông thường
  useEffect(() => {
    setInternalIsCollapsed(isLessonRoute);
  }, [isLessonRoute, pathname]);

  const isCollapsed =
    externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalIsCollapsed((prev) => !prev);
    }
  };

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
    <aside
      className={cn(
        'hidden md:flex flex-col justify-between min-h-screen shrink-0 sticky top-0 h-screen overflow-y-auto transition-all duration-300 z-30 bg-white dark:bg-[#111827] border-r border-slate-100 dark:border-slate-800/80',
        isCollapsed ? 'w-20 p-3.5' : 'md:w-20 lg:w-64 p-3.5 lg:p-5'
      )}
    >
      <div>
        {/* SpeakUp Logo & Collapse/Expand Toggle */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 mb-8">
            <Link
              to="/"
              className="flex items-center justify-center group"
              title="SpeakUp"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                <MessageCircle className="w-6 h-6 fill-white" />
              </div>
            </Link>
            {/* Toggle button on desktop */}
            <button
              type="button"
              onClick={handleToggle}
              className="hidden lg:flex w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 items-center justify-center transition-colors cursor-pointer"
              title="Mở rộng menu"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2 lg:px-1 py-1 mb-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 group min-w-0"
              title="SpeakUp"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                <MessageCircle className="w-6 h-6 fill-white" />
              </div>
              <span className="hidden lg:inline text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                Speak<span className="text-blue-600 dark:text-blue-400">Up</span>
              </span>
            </Link>
            {/* Toggle button on desktop */}
            <button
              type="button"
              onClick={handleToggle}
              className="hidden lg:flex w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Thu gọn menu"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                title={item.name}
                className={cn(
                  'flex items-center gap-3.5 px-3 py-3 rounded-2xl text-[15px] font-medium transition-all duration-200',
                  isCollapsed
                    ? 'justify-center'
                    : 'justify-center lg:justify-start lg:px-4',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors shrink-0',
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 stroke-[2.2]'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  )}
                />
                {!isCollapsed && <span className="hidden lg:inline">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Upgrade to Pro */}
      {isCollapsed ? (
        /* Compact icon button when collapsed */
        <button
          type="button"
          onClick={() => alert(t('nav.upgradeAlert'))}
          className="flex items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100/60 dark:from-slate-800 dark:to-slate-800/60 border border-amber-200/70 dark:border-slate-700 text-amber-600 dark:text-amber-400 shadow-xs hover:scale-105 transition-all mt-6 cursor-pointer mx-auto"
          title={t('nav.upgradePro')}
        >
          <Crown className="w-5 h-5 fill-amber-500" />
        </button>
      ) : (
        <>
          {/* Upgrade to Pro - Desktop full card */}
          <div className="hidden lg:block bg-gradient-to-b from-blue-50/90 to-blue-100/60 dark:from-slate-800/80 dark:to-slate-800/40 rounded-3xl p-5 border border-blue-100/80 dark:border-slate-700/60 text-center mt-6">
            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
              <Crown className="w-5 h-5 fill-amber-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {t('nav.upgradePro')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed">
              {t('nav.upgradeDesc')}
            </p>
            <button
              type="button"
              onClick={() => alert(t('nav.upgradeAlert'))}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
            >
              <span>{t('nav.upgradeBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Upgrade to Pro - Tablet icon button */}
          <button
            type="button"
            onClick={() => alert(t('nav.upgradeAlert'))}
            className="lg:hidden flex items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100/60 dark:from-slate-800 dark:to-slate-800/60 border border-amber-200/70 dark:border-slate-700 text-amber-600 dark:text-amber-400 shadow-xs hover:scale-105 transition-all mt-6 cursor-pointer"
            title={t('nav.upgradePro')}
          >
            <Crown className="w-5 h-5 fill-amber-500" />
          </button>
        </>
      )}
    </aside>
  );
}
