'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, Flame, LogOut, Settings, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';

export function Header() {
  const { streakDays, profile } = useLearningStore();
  const { user, isLoading, signInWithGoogle, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const avatarSrc =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    profile.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (profile.display_name && profile.display_name !== 'Giang' ? profile.display_name : null) ||
    user?.email?.split('@')[0] ||
    profile.display_name ||
    'Learner';

  return (
    <header className="w-full flex items-center justify-end py-4 px-8 bg-transparent relative z-30">
      <div className="flex items-center gap-4">
        {/* Streak Pill */}
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200/60 rounded-full text-amber-800 text-sm font-semibold shadow-xs">
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
          <span>{streakDays} day streak</span>
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Notification Bell */}
        <button
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 rounded-full transition-colors"
          title="Notifications"
          onClick={() => alert('Bạn không có thông báo mới!')}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Auth Section */}
        {isLoading ? (
          <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
        ) : user ? (
          /* User Profile Dropdown */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-1 cursor-pointer group focus:outline-hidden"
              aria-label="User menu"
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-500/20 group-hover:ring-blue-500 transition-all shadow-xs">
                <Image
                  src={avatarSrc}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="40px"
                  priority
                />
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden ring-1 ring-slate-200 shrink-0">
                      <Image
                        src={avatarSrc}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200/60">
                    <GoogleIcon className="w-3 h-3" />
                    <span>Đã đăng nhập với Google</span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5 space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Cài đặt tài khoản</span>
                  </Link>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Sign In with Google Button */
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-full border border-slate-200 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
}
