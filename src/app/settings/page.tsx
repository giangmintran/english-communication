'use client';

import React from 'react';
import Image from 'next/image';
import { Settings, Save, Check, LogOut, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { profile, todayGoal, updateProfile } = useLearningStore();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [name, setName] = React.useState(profile.display_name);
  const [goal, setGoal] = React.useState(todayGoal);
  const [level, setLevel] = React.useState(profile.current_level);
  const [saved, setSaved] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Sync state if profile changes
  React.useEffect(() => {
    setName(profile.display_name);
    setLevel(profile.current_level);
    setGoal(profile.daily_goal_words || todayGoal);
  }, [profile, todayGoal]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // 1. Update local Zustand store
    updateProfile({
      display_name: name,
      daily_goal_words: goal,
      current_level: level,
    });

    // 2. If user is authenticated, sync to Supabase profiles table
    if (user) {
      try {
        const supabase = createClient();
        if (supabase) {
          await supabase
            .from('profiles')
            .update({
              display_name: name,
              daily_goal_words: goal,
              current_level: level,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        }
      } catch (err) {
        console.warn('Could not sync settings to Supabase:', err);
      }
    }

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const avatarSrc =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    profile.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1 flex items-center gap-2.5">
          <Settings className="w-8 h-8 text-blue-600" />
          <span>Settings</span>
        </h1>
        <p className="text-slate-500 text-sm">
          Tùy chỉnh thông tin cá nhân, tài khoản Google và mục tiêu luyện tập tiếng Anh hàng ngày.
        </p>
      </div>

      {/* Account Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Tài khoản & Xác thực
        </h2>

        {user ? (
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-emerald-200 shrink-0">
                <Image
                  src={avatarSrc}
                  alt={profile.display_name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{profile.display_name}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                    <GoogleIcon className="w-2.5 h-2.5" />
                    Google Account
                  </span>
                </div>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Tài khoản Khách (Demo)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tiến độ học hiện chỉ lưu trên trình duyệt này. Đăng nhập bằng Google để đồng bộ trên đám mây.
                </p>
              </div>
            </div>

            <button
              onClick={() => signInWithGoogle()}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs"
            >
              <GoogleIcon className="w-3.5 h-3.5" />
              <span>Đăng nhập Google</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Preferences Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-5">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Mục tiêu & Trình độ học
        </h2>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
            Tên hiển thị
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
            Mục tiêu từ mới mỗi ngày
          </label>
          <select
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 từ / ngày (Khởi động)</option>
            <option value={10}>10 từ / ngày (Chuẩn 10-15 phút)</option>
            <option value={15}>15 từ / ngày (Tăng tốc)</option>
            <option value={20}>20 từ / ngày (Chuyên sâu)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
            Trình độ hiện tại
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="A1">A1 - Mới bắt đầu</option>
            <option value="A2">A2 - Sơ cấp (Giao tiếp căn bản)</option>
            <option value="B1">B1 - Trung cấp (Tự tin phản xạ)</option>
            <option value="B2">B2 - Trung cao cấp (Lưu loát công sở)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {saved ? (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Đã lưu cài đặt thành công!
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
