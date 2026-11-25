import React from 'react';
import { TodaysGoalCard } from '@/components/dashboard/TodaysGoalCard';
import { ContinueLearningCard } from '@/components/dashboard/ContinueLearningCard';
import { ExploreCollections } from '@/components/dashboard/ExploreCollections';
import { YourProgressCard } from '@/components/dashboard/YourProgressCard';
import { ActivityHeatmapCard } from '@/components/dashboard/ActivityHeatmapCard';
import { PlacementBanner } from '@/components/placement/PlacementBanner';
import { useAuth } from '@/context/AuthContext';
import { useLearningStore } from '@/lib/store';
import { useTranslation } from '@/context/LanguageContext';

export default function HomePage() {
  const { user } = useAuth();
  const { profile } = useLearningStore();
  const { t } = useTranslation();

  const displayName =
    (user?.id === profile.id && profile.display_name ? profile.display_name : null) ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    (user ? 'Learner' : profile.display_name);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* TOP SECTION: Welcome Banner + Today's Goal */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 items-center">
        {/* Welcome Text */}
        <div className="xl:col-span-5 min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5">
            {t('home.welcomeBack')}, {displayName}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
            {t('home.welcomeDesc')}
          </p>
        </div>

        {/* Today's Goal Card */}
        <div className="xl:col-span-7 min-w-0">
          <TodaysGoalCard />
        </div>
      </div>

      {/* MAIN CONTENT AREA: Activity Heatmap + Continue Learning + Collections on left, Your Progress on right (on mobile, Your Progress is above Explore Collections) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column: Activity Heatmap & Continue Learning & Explore Collections */}
        <div className="xl:col-span-9 space-y-6 sm:space-y-8">
          <PlacementBanner />
          <ActivityHeatmapCard />
          <ContinueLearningCard />

          {/* Trên giao diện điện thoại / tablet (< xl): Hiển thị phần tiến độ bên trên phần Khám phá bộ sưu tập */}
          <div className="xl:hidden">
            <YourProgressCard />
          </div>

          <ExploreCollections />
        </div>

        {/* Right Column: Your Progress Card (chỉ hiển thị ở màn hình desktop xl trở lên) */}
        <div className="hidden xl:block xl:col-span-3 h-full">
          <YourProgressCard />
        </div>
      </div>
    </div>
  );
}
