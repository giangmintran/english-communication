import React, { useEffect, useState } from 'react';
import { Trophy, Medal } from 'lucide-react';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { LeaderboardEntry } from '@/types/database';
import { UserAvatar } from '@/components/common/UserAvatar';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { streakDays, totalWordsLearned, profile } = useLearningStore();
  const { t } = useTranslation();
  const [competitors, setCompetitors] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadLeaderboard() {
      try {
        const data = await api.leaderboard.get();
        if (mounted && data && data.length > 0) {
          setCompetitors(data);
        }
      } catch (err) {
        console.warn('Lỗi khi tải bảng xếp hạng:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadLeaderboard();
    return () => {
      mounted = false;
    };
  }, []);

  const currentDisplayName = user
    ? `${(profile.id === user.id && profile.display_name ? profile.display_name : null) || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || t('common.you')} ${t('leaderboard.youTag')}`
    : `${profile.display_name} ${t('leaderboard.youTag')}`;

  const currentAvatar = user
    ? user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    (profile.id === user.id && profile.avatar_url ? profile.avatar_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentDisplayName)}&background=2563eb&color=fff&bold=true`)
    : profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';

  const currentUserEntry: LeaderboardEntry = {
    name: currentDisplayName,
    avatar: currentAvatar,
    streak: streakDays,
    words: totalWordsLearned,
    isCurrent: true,
  };

  // Trộn current user vào danh sách nếu chưa có, sắp xếp theo số từ đã học
  const leaderboardList = [...competitors.filter((c) => !c.isCurrent), currentUserEntry]
    .sort((a, b) => b.words - a.words)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-2.5">
          <Trophy className="w-8 h-8 text-amber-500" />
          <span>{t('leaderboard.title')}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {t('leaderboard.subtitle')}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-card space-y-3 transition-colors">
        {loading && competitors.length === 0 ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 animate-pulse border border-slate-100 dark:border-slate-800"
              />
            ))}
          </div>
        ) : (
          leaderboardList.map((competitor) => (
            <div
              key={competitor.name}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                competitor.isCurrent
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 ring-1 ring-blue-400 dark:ring-blue-500'
                  : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-center font-bold text-slate-500 dark:text-slate-400 text-sm">
                  {competitor.rank && competitor.rank <= 3 ? (
                    <Medal
                      className={`w-5 h-5 mx-auto ${
                        competitor.rank === 1
                          ? 'text-amber-500'
                          : competitor.rank === 2
                          ? 'text-slate-400'
                          : 'text-amber-700 dark:text-amber-600'
                      }`}
                    />
                  ) : (
                    `#${competitor.rank}`
                  )}
                </span>

                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                  <UserAvatar src={competitor.avatar} name={competitor.name} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {competitor.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                    <span>
                      {competitor.streak} {t('leaderboard.streak')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                  {competitor.words}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  {t('leaderboard.wordsLearned')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
