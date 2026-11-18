import React from 'react';
import { TodaysGoalCard } from '@/components/dashboard/TodaysGoalCard';
import { ContinueLearningCard } from '@/components/dashboard/ContinueLearningCard';
import { ExploreCollections } from '@/components/dashboard/ExploreCollections';
import { YourProgressCard } from '@/components/dashboard/YourProgressCard';
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* TOP SECTION: Welcome Banner + Today's Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Welcome Text */}
        <div className="lg:col-span-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            {t('home.welcomeBack')}, {displayName}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            {t('home.welcomeDesc')}
          </p>
        </div>

        {/* Today's Goal Card */}
        <div className="lg:col-span-6">
          <TodaysGoalCard />
        </div>
      </div>

      {/* MAIN CONTENT AREA: Continue Learning + Collections on left, Your Progress on right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Continue Learning & Explore Collections */}
        <div className="xl:col-span-9 space-y-8">
          <ContinueLearningCard />
          <ExploreCollections />
        </div>

        {/* Right Column: Your Progress Card */}
        <div className="xl:col-span-3 h-full">
          <YourProgressCard />
        </div>
      </div>
    </div>
  );
}
