'use client';

import React from 'react';
import { Trophy, Flame, Medal } from 'lucide-react';
import { useLearningStore } from '@/lib/store';

const mockLeaderboard = [
  { rank: 1, name: 'Minh Anh', streak: 42, words: 1250, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
  { rank: 2, name: 'Hoàng Nam', streak: 35, words: 980, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
  { rank: 3, name: 'Thanh Thảo', streak: 28, words: 820, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80' },
  { rank: 4, name: 'Giang (Bạn)', streak: 8, words: 520, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', isCurrent: true },
  { rank: 5, name: 'Quốc Bảo', streak: 7, words: 430, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' },
];

export default function LeaderboardPage() {
  const { streakDays, totalWordsLearned, profile } = useLearningStore();

  const currentAvatar =
    profile.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
  const currentName = `${profile.display_name} (Bạn)`;

  const leaderboardList = mockLeaderboard.map((u) => {
    if (u.isCurrent) {
      return {
        ...u,
        name: currentName,
        avatar: currentAvatar,
        streak: streakDays,
        words: totalWordsLearned,
      };
    }
    return u;
  });

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1 flex items-center gap-2.5">
          <Trophy className="w-8 h-8 text-amber-500" />
          <span>Leaderboard</span>
        </h1>
        <p className="text-slate-500 text-sm">
          Bảng xếp hạng chuỗi ngày học liên tục (Streak) và số từ đã thuộc trong tuần.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-3">
        {leaderboardList.map((user) => (
          <div
            key={user.name}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              user.isCurrent
                ? 'bg-blue-50/70 border-blue-200 ring-1 ring-blue-400'
                : 'bg-slate-50/50 border-slate-100'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="w-6 text-center font-bold text-slate-500 text-sm">
                {user.rank <= 3 ? (
                  <Medal className={`w-5 h-5 mx-auto ${user.rank === 1 ? 'text-amber-500' : user.rank === 2 ? 'text-slate-400' : 'text-amber-700'}`} />
                ) : (
                  `#${user.rank}`
                )}
              </span>

              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
              />

              <div>
                <h4 className={`text-sm font-bold ${user.isCurrent ? 'text-blue-600' : 'text-slate-900'}`}>
                  {user.name}
                </h4>
                <span className="text-xs text-slate-400">
                  {user.isCurrent ? totalWordsLearned : user.words} từ đã thuộc
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/60">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{user.isCurrent ? streakDays : user.streak} ngày</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
