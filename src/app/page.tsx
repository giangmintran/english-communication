import React from 'react';
import { TodaysGoalCard } from '@/components/dashboard/TodaysGoalCard';
import { ContinueLearningCard } from '@/components/dashboard/ContinueLearningCard';
import { ExploreCollections } from '@/components/dashboard/ExploreCollections';
import { YourProgressCard } from '@/components/dashboard/YourProgressCard';

export default function HomePage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* TOP SECTION: Welcome Banner + Today's Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Welcome Text */}
        <div className="lg:col-span-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Welcome back, Giang! 👋
          </h1>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            Keep going! Learning English every day brings you closer to your goals.
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
