import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  BookOpen,
  Mic,
  Star,
  Trophy,
  Award,
  Sparkles,
  Settings,
  GraduationCap,
  BookmarkCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Headphones,
  Layers,
  FileText,
} from 'lucide-react';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { UserAvatar } from '@/components/common/UserAvatar';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { api } from '@/lib/api';
import { getGuestPlacementResult } from '@/lib/placementEngine';
import { PlacementTestResult } from '@/types/database';
import { cn } from '@/lib/utils';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  currentValue: number;
  targetValue: number;
  unit: string;
}

export default function ProfilePage() {
  const { profile, streakDays, speakingTimeMinutes, reviews, collectionReviews, totalWordsLearned: storeWordsLearned } = useLearningStore();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [latestPlacement, setLatestPlacement] = useState<PlacementTestResult | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchPlacement() {
      if (user) {
        try {
          const res = await api.placementTest.getLatest();
          if (mounted && res) setLatestPlacement(res);
        } catch (_) { }
      } else {
        const guestRes = getGuestPlacementResult();
        if (mounted && guestRes) setLatestPlacement(guestRes);
      }
    }
    fetchPlacement();
    return () => {
      mounted = false;
    };
  }, [user]);

  // Count starred words from localStorage
  const savedWordsCount = useMemo(() => {
    try {
      const saved = localStorage.getItem('starred_phrases');
      if (saved) return JSON.parse(saved).length;
    } catch {
      // ignore
    }
    return 0;
  }, []);

  // Count SRS mastered words
  const masteredCount = useMemo(() => {
    const dailyMastered = Object.values(reviews).filter((r) => (r.interval_days || 0) >= 14).length;
    const colMastered = Object.values(collectionReviews).filter((r) => (r.interval_days || 0) >= 14).length;
    return dailyMastered + colMastered;
  }, [reviews, collectionReviews]);

  const totalWordsLearned = Math.max(storeWordsLearned || 0, Object.keys(reviews).length + Object.keys(collectionReviews).length);

  const displayName =
    (user?.id === profile.id && profile.display_name ? profile.display_name : null) ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    profile.display_name ||
    'Learner';

  const avatarSrc =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    (user
      ? (profile.id === user.id && profile.avatar_url ? profile.avatar_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&bold=true`)
      : profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');

  // Gamification Badges definition
  const badges: Badge[] = [
    {
      id: 'streak-3',
      name: 'Khởi đầu rực rỡ',
      description: 'Duy trì chuỗi học liên tiếp 3 ngày',
      icon: '🔥',
      currentValue: streakDays,
      targetValue: 3,
      unit: 'ngày',
    },
    {
      id: 'streak-7',
      name: 'Bền bỉ kiên trì',
      description: 'Duy trì chuỗi học liên tục 7 ngày',
      icon: '⚡',
      currentValue: streakDays,
      targetValue: 7,
      unit: 'ngày',
    },
    {
      id: 'streak-30',
      name: 'Chiến thần thói quen',
      description: 'Đạt chuỗi học 30 ngày kỷ lục',
      icon: '👑',
      currentValue: streakDays,
      targetValue: 30,
      unit: 'ngày',
    },
    {
      id: 'words-20',
      name: 'Nhập môn từ vựng',
      description: 'Nạp thành công 20 từ vựng giao tiếp',
      icon: '📖',
      currentValue: totalWordsLearned,
      targetValue: 20,
      unit: 'từ',
    },
    {
      id: 'words-100',
      name: 'Bậc thầy từ vựng',
      description: 'Chinh phục 100 từ vựng và mẫu câu',
      icon: '🎓',
      currentValue: totalWordsLearned,
      targetValue: 100,
      unit: 'từ',
    },
    {
      id: 'speech-15',
      name: 'Tự tin phát âm',
      description: 'Luyện nói AI tích lũy đạt 15 phút',
      icon: '🎙️',
      currentValue: speakingTimeMinutes || 0,
      targetValue: 15,
      unit: 'phút',
    },
    {
      id: 'speech-60',
      name: 'Cao thủ giao tiếp',
      description: 'Luyện nói AI tích lũy đạt 60 phút',
      icon: '🌟',
      currentValue: speakingTimeMinutes || 0,
      targetValue: 60,
      unit: 'phút',
    },
    {
      id: 'saved-5',
      name: 'Thợ săn từ khó',
      description: 'Lưu 5 từ vựng vào Sổ tay để ôn tập',
      icon: '⭐',
      currentValue: savedWordsCount,
      targetValue: 5,
      unit: 'từ',
    },
  ];

  // Skill scores (0 - 100)
  const skills = [
    {
      name: t('profile.skillVocab'),
      score: Math.min(100, Math.round((totalWordsLearned / 100) * 100) || 20),
      color: 'bg-blue-600',
    },
    {
      name: t('profile.skillSpeaking'),
      score: Math.min(100, Math.round(((speakingTimeMinutes || 0) / 30) * 100) || 15),
      color: 'bg-indigo-600',
    },
    {
      name: t('profile.skillSRS'),
      score: Math.min(100, Math.round((masteredCount / Math.max(1, totalWordsLearned)) * 100) || 30),
      color: 'bg-emerald-600',
    },
    {
      name: t('profile.skillConsistency'),
      score: Math.min(100, Math.round((streakDays / 7) * 100) || 25),
      color: 'bg-amber-500',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-6 space-y-8">
      {/* User Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-blue-500/20 shadow-md shrink-0">
            <UserAvatar src={avatarSrc} name={displayName} />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
                {displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-100 dark:border-blue-900/40">
                {profile.current_level || 'A2'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user ? user.email : 'Tài khoản khách'}
            </p>

            {user && (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <GoogleIcon className="w-3 h-3" />
                <span>Đã liên kết Google Account</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/placement-test"
            className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t('profile.testLevelBtn')}</span>
          </Link>

          <Link
            to="/settings"
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{t('profile.editInSettings')}</span>
          </Link>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-card flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 shrink-0">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
              {t('profile.statStreak')}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {streakDays} <span className="text-xs font-medium text-slate-400">{t('profile.daysLearned')}</span>
            </p>
          </div>
        </div>

        {/* Words Learned */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-card flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
              {t('profile.statLearned')}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {totalWordsLearned} <span className="text-xs font-medium text-slate-400">{t('profile.wordsLearned')}</span>
            </p>
          </div>
        </div>

        {/* Speaking Time */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-card flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
              {t('profile.statSpeaking')}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {speakingTimeMinutes || 0} <span className="text-xs font-medium text-slate-400">{t('profile.minsLearned')}</span>
            </p>
          </div>
        </div>

        {/* Saved Notebook */}
        <Link
          to="/saved"
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-card hover:border-amber-300 dark:hover:border-amber-800/60 transition-all flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 shrink-0 group-hover:scale-105 transition-transform">
            <Star className="w-6 h-6 fill-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider truncate">
              {t('profile.statSaved')}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {savedWordsCount} <span className="text-xs font-medium text-slate-400">{t('profile.wordsLearned')}</span>
            </p>
          </div>
        </Link>
      </div>

      {/* CEFR Placement Test Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {t('placementTest.profileCefrTitle')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold text-xs">
                  {profile.current_level || 'A2'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {latestPlacement
                  ? t('placementTest.profileCefrSummary', {
                    score: latestPlacement.overall_score,
                    percent: latestPlacement.percentage,
                  })
                  : t('placementTest.profileCefrNotTaken')}
              </p>
            </div>
          </div>

          <Link
            to="/placement-test"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
          >
            {/* <Sparkles className="w-3.5 h-3.5" /> */}
            <span>
              {latestPlacement
                ? t('placementTest.profileCefrRetakeBtn')
                : t('placementTest.profileCefrTakeBtn')}
            </span>
          </Link>
        </div>

        {/* Mini 4-skills preview if exists */}
        {latestPlacement?.skill_scores && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">{t('placementTest.skillListening')}</span>
              <p className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                {latestPlacement.skill_scores.listening?.score || 0}/8 ({latestPlacement.skill_scores.listening?.percentage || 0}%)
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">{t('placementTest.skillVocabulary')}</span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {latestPlacement.skill_scores.vocabulary?.score || 0}/8 ({latestPlacement.skill_scores.vocabulary?.percentage || 0}%)
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">{t('placementTest.skillGrammar')}</span>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {latestPlacement.skill_scores.grammar?.score || 0}/8 ({latestPlacement.skill_scores.grammar?.percentage || 0}%)
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">{t('placementTest.skillSpeaking')}</span>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {latestPlacement.skill_scores.speaking?.score || 0}/6 ({latestPlacement.skill_scores.speaking?.percentage || 0}%)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Skills Analysis */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t('profile.skillsTitle')}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {skills.map((s, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">{s.name}</span>
                <span className="text-slate-900 dark:text-white font-bold">{s.score}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', s.color)}
                  style={{ width: `${s.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Badges Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-card space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {t('profile.badgesTitle')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('profile.badgesSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b) => {
            const isUnlocked = b.currentValue >= b.targetValue;
            const progress = Math.min(100, Math.round((b.currentValue / b.targetValue) * 100));

            return (
              <div
                key={b.id}
                className={cn(
                  'rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-3',
                  isUnlocked
                    ? 'bg-gradient-to-b from-amber-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-amber-200/80 dark:border-slate-700 shadow-2xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-75'
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-3xl">{b.icon}</span>
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('profile.unlockedBadge')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <Lock className="w-3 h-3" />
                        <span>{progress}%</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {b.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {b.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Tiến độ:</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {b.currentValue} / {b.targetValue} {b.unit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isUnlocked ? 'bg-amber-500' : 'bg-blue-600'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
