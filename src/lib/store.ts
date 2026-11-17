import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, ReviewGrade } from '@/types/database';
import { mockProfile } from '@/data/mockData';
import { calculateSM2, SRSItemState } from './srs';

interface LearningState {
  profile: Profile;
  todayLearned: number;
  todayGoal: number;
  overallProgressPercent: number;
  totalWordsLearned: number;
  speakingTimeMinutes: number;
  streakDays: number;
  reviews: Record<string, SRSItemState>;

  // Actions
  recordReview: (itemId: string, grade: ReviewGrade) => void;
  addSpeakingTime: (minutes: number) => void;
  updateProfile: (updates: Partial<Profile>) => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      profile: mockProfile,
      todayLearned: 6, // Matches 6/10 in Mockup.png
      todayGoal: 10,
      overallProgressPercent: 72, // Matches 72% in Mockup.png
      totalWordsLearned: 520, // Matches 520 in Mockup.png
      speakingTimeMinutes: 48, // Matches 48 min in Mockup.png
      streakDays: 8, // Matches 8 day streak in Mockup.png
      reviews: {},

      recordReview: (itemId: string, grade: ReviewGrade) => {
        const state = get();
        const currentSRS = state.reviews[itemId] || {
          repetitions: 0,
          interval_days: 1,
          ease_factor: 2.5,
          next_review_at: new Date().toISOString(),
          last_quality: 0,
        };

        const updatedSRS = calculateSM2(grade, currentSRS);
        const newTodayLearned = Math.min(state.todayGoal, state.todayLearned + 1);
        const newTotal = state.totalWordsLearned + 1;
        const newOverallPercent = Math.min(100, Math.round((newTotal / 700) * 100));

        set({
          reviews: {
            ...state.reviews,
            [itemId]: updatedSRS,
          },
          todayLearned: newTodayLearned,
          totalWordsLearned: newTotal,
          overallProgressPercent: newOverallPercent,
        });
      },

      addSpeakingTime: (minutes: number) => {
        set((state) => ({
          speakingTimeMinutes: state.speakingTimeMinutes + minutes,
        }));
      },

      updateProfile: (updates: Partial<Profile>) => {
        set((state) => ({
          profile: { ...state.profile, ...updates },
        }));
      },
    }),
    {
      name: 'speakup-learning-storage',
    }
  )
);
