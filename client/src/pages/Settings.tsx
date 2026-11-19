import React from 'react';
import {
  Settings,
  Save,
  Check,
  LogOut,
  AlertCircle,
  Sun,
  Moon,
  Monitor,
  Globe,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { useTheme, Theme } from '@/context/ThemeContext';
import { useTranslation, Language } from '@/context/LanguageContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { UserAvatar } from '@/components/common/UserAvatar';
import { supabase } from '@/lib/supabaseClient';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { profile, todayGoal, updateProfile } = useLearningStore();
  const { user, signInWithGoogle, signOut } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();

  const displayName =
    (user?.id === profile.id && profile.display_name ? profile.display_name : null) ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    (user ? 'Learner' : profile.display_name);

  const [name, setName] = React.useState(displayName);
  const [goal, setGoal] = React.useState(todayGoal);
  const [level, setLevel] = React.useState(profile.current_level);
  const [saved, setSaved] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Sync state if profile changes
  React.useEffect(() => {
    setName(user ? (profile.id === user.id ? profile.display_name : displayName) : profile.display_name);
    setLevel(profile.current_level);
    setGoal(profile.daily_goal_words || todayGoal);
  }, [profile, todayGoal, user, displayName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // 1. Update local Zustand store
    updateProfile({
      display_name: name,
      daily_goal_words: goal,
      current_level: level,
    });

    // 2. If user is authenticated, sync to Backend API or Supabase
    if (user) {
      try {
        const updated = await api.profile.updateMe({
          display_name: name,
          daily_goal_words: goal,
          current_level: level,
        });
        if (updated) {
          updateProfile(updated);
        }
      } catch (err) {
        console.warn('Backend API update profile error, trying direct Supabase fallback:', err);
        try {
          const { data: subData } = await supabase
            .from('profiles')
            .update({
              display_name: name,
              daily_goal_words: goal,
              current_level: level,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select()
            .maybeSingle();

          if (subData) {
            updateProfile(subData);
          }
        } catch (subErr) {
          console.warn('Could not sync settings to Supabase:', subErr);
        }
      }
    }

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const avatarSrc =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    (user
      ? (profile.id === user.id && profile.avatar_url ? profile.avatar_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&bold=true`)
      : profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');

  const languageOptions: { id: Language; label: string; sub: string; flag: string }[] = [
    {
      id: 'vi',
      label: t('settings.vietnamese'),
      sub: t('settings.vietnameseDesc'),
      flag: '🇻🇳',
    },
    {
      id: 'en',
      label: t('settings.english'),
      sub: t('settings.englishDesc'),
      flag: '🇬🇧',
    },
  ];

  const themeOptions: { id: Theme; label: string; sub: string; icon: React.ElementType }[] = [
    {
      id: 'light',
      label: t('settings.themeLight'),
      sub: t('settings.themeLightDesc'),
      icon: Sun,
    },
    {
      id: 'dark',
      label: t('settings.themeDark'),
      sub: t('settings.themeDarkDesc'),
      icon: Moon,
    },
    {
      id: 'system',
      label: t('settings.themeSystem'),
      sub: t('settings.themeSystemDesc'),
      icon: Monitor,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-4 space-y-5 sm:space-y-6">
      {/* Header Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-2 sm:gap-2.5">
          <Settings className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{t('settings.title')}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Account Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-card transition-colors space-y-4">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {t('settings.accountSection')}
        </h2>

        {user ? (
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-emerald-200 dark:ring-emerald-700/60 shrink-0">
                <UserAvatar
                  src={avatarSrc}
                  name={displayName}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{profile.display_name}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold">
                    <GoogleIcon className="w-2.5 h-2.5" />
                    {t('settings.googleAccount')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('header.logout')}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-850/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t('settings.guestAccountTitle')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {t('settings.guestAccountDesc')}
                </p>
              </div>
            </div>

            <button
              onClick={() => signInWithGoogle()}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <GoogleIcon className="w-3.5 h-3.5" />
              <span>{t('header.login')}</span>
            </button>
          </div>
        )}
      </div>

      {/* NEW: Appearance & Language Settings Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-card transition-colors space-y-6">
        <div>
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            {t('settings.preferencesSection')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('settings.preferencesDesc')}
          </p>
        </div>

        {/* 1. Language Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <label className="text-xs font-bold uppercase tracking-wide">
              {t('settings.languageTitle')}
            </label>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
            {t('settings.languageDesc')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {languageOptions.map((opt) => {
              const isSelected = language === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLanguage(opt.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500/80 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl select-none" role="img" aria-label={opt.label}>
                      {opt.flag}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {opt.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {opt.sub}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* 2. Theme Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <label className="text-xs font-bold uppercase tracking-wide">
              {t('settings.themeTitle')}
            </label>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
            {t('settings.themeDesc')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  className={`flex flex-col justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500/80 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {opt.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Learning Preferences Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-card transition-colors space-y-5">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {t('settings.learningSection')}
        </h2>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
            {t('settings.displayName')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
            {t('settings.dailyGoal')}
          </label>
          <select
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value={5}>{t('settings.goal5')}</option>
            <option value={10}>{t('settings.goal10')}</option>
            <option value={15}>{t('settings.goal15')}</option>
            <option value={20}>{t('settings.goal20')}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
            {t('settings.currentLevel')}
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="A1">{t('settings.levelA1')}</option>
            <option value="A2">{t('settings.levelA2')}</option>
            <option value="B1">{t('settings.levelB1')}</option>
            <option value="B2">{t('settings.levelB2')}</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {saved ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" /> {t('settings.savedSuccess')}
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? t('settings.saving') : t('settings.saveChanges')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
