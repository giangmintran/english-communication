'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Daily Learning', href: '/daily', icon: Calendar },
  { name: 'Collections', href: '/collections', icon: LayoutGrid },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Speaking Practice', href: '/speaking', icon: Mic },
  { name: 'AI Dictionary', href: '/dictionary', icon: BookOpen },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-5 min-h-screen shrink-0 sticky top-0 h-screen overflow-y-auto">
      <div>
        {/* SpeakUp Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <MessageCircle className="w-6 h-6 fill-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            Speak<span className="text-blue-600">Up</span>
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-blue-600 stroke-[2.2]' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Upgrade to Pro Card */}
      <div className="bg-gradient-to-b from-blue-50/90 to-blue-100/60 rounded-3xl p-5 border border-blue-100/80 text-center mt-6">
        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
          <Crown className="w-5 h-5 fill-amber-500" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 mb-1">Upgrade to Pro</h4>
        <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
          Unlock more features and learn faster!
        </p>
        <button
          onClick={() => alert('Chức năng nâng cấp Pro đang được cập nhật!')}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/25 transition-colors"
        >
          <span>Upgrade Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
