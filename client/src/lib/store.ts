import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, ReviewGrade } from '@/types/database';
import { mockProfile } from '@/data/mockData';
import { calculateSM2, SRSItemState } from './srs';
import { supabase } from './supabaseClient';

export interface LearningState {
  profile: Profile;
  todayLearned: number;
  todayGoal: number;
  overallProgressPercent: number;
  totalWordsLearned: number;
  speakingTimeMinutes: number;
  streakDays: number;
  reviews: Record<string, SRSItemState>;

  // Actions
  recordReview: (itemId: string, grade: ReviewGrade, userId?: string) => Promise<void>;
  addSpeakingTime: (minutes: number) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  setUserData: (data: {
    profile: Profile;
    streakDays?: number;
    todayGoal?: number;
    totalWordsLearned?: number;
    todayLearned?: number;
    overallProgressPercent?: number;
    speakingTimeMinutes?: number;
    reviews?: Record<string, SRSItemState>;
  }) => void;
  resetToGuest: () => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      profile: mockProfile,
      todayLearned: 0, // Guest starts with 0 learned words
      todayGoal: 10,
      overallProgressPercent: 72,
      totalWordsLearned: 520,
      speakingTimeMinutes: 48,
      streakDays: 8,
      reviews: {},

      recordReview: async (itemId: string, grade: ReviewGrade, userId?: string) => {
        const state = get();
        const currentSRS = state.reviews[itemId] || {
          repetitions: 0,
          interval_days: 1,
          ease_factor: 2.5,
          next_review_at: new Date().toISOString(),
          last_quality: 0,
        };

        const updatedSRS = calculateSM2(grade, currentSRS);
        const isFirstReview = !state.reviews[itemId];
        const newTodayLearned = Math.min(state.todayGoal, state.todayLearned + 1);
        const newTotal = isFirstReview ? state.totalWordsLearned + 1 : state.totalWordsLearned;
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

        // Persist review to Supabase if authenticated
        try {
          let uid = userId;
          if (!uid) {
            const { data: { session } } = await supabase.auth.getSession();
            uid = session?.user?.id;
          }

          if (uid) {
            const now = new Date().toISOString();
            const { data: existing } = await supabase
              .from('reviews')
              .select('id')
              .eq('user_id', uid)
              .eq('item_id', itemId)
              .maybeSingle();

            if (existing?.id) {
              await supabase
                .from('reviews')
                .update({
                  repetitions: updatedSRS.repetitions,
                  interval_days: updatedSRS.interval_days,
                  ease_factor: updatedSRS.ease_factor,
                  next_review_at: updatedSRS.next_review_at,
                  last_reviewed_at: now,
                  last_quality: grade,
                })
                .eq('id', existing.id);
            } else {
              await supabase.from('reviews').insert({
                user_id: uid,
                item_id: itemId,
                repetitions: updatedSRS.repetitions,
                interval_days: updatedSRS.interval_days,
                ease_factor: updatedSRS.ease_factor,
                next_review_at: updatedSRS.next_review_at,
                last_reviewed_at: now,
                last_quality: grade,
              });
            }

            // Also update last_active_date in profiles
            await supabase
              .from('profiles')
              .update({
                last_active_date: now,
                updated_at: now,
              })
              .eq('id', uid);
          }
        } catch (err) {
          console.warn('Could not sync review to Supabase:', err);
        }
      },

      addSpeakingTime: (minutes: number) => {
        set((state) => ({
          speakingTimeMinutes: state.speakingTimeMinutes + minutes,
        }));
      },

      updateProfile: (updates: Partial<Profile>) => {
        set((state) => ({
          profile: { ...state.profile, ...updates },
          ...(updates.daily_goal_words !== undefined ? { todayGoal: updates.daily_goal_words } : {}),
        }));
      },

      setUserData: (data) => {
        set((state) => ({
          profile: data.profile,
          streakDays: data.streakDays !== undefined ? data.streakDays : state.streakDays,
          todayGoal: data.todayGoal !== undefined ? data.todayGoal : state.todayGoal,
          todayLearned: data.todayLearned !== undefined ? data.todayLearned : state.todayLearned,
          totalWordsLearned: data.totalWordsLearned !== undefined ? data.totalWordsLearned : state.totalWordsLearned,
          overallProgressPercent: data.overallProgressPercent !== undefined ? data.overallProgressPercent : state.overallProgressPercent,
          speakingTimeMinutes: data.speakingTimeMinutes !== undefined ? data.speakingTimeMinutes : state.speakingTimeMinutes,
          reviews: data.reviews !== undefined ? data.reviews : state.reviews,
        }));
      },

      resetToGuest: () => {
        set({
          profile: mockProfile,
          todayLearned: 0,
          todayGoal: 10,
          overallProgressPercent: 72,
          totalWordsLearned: 520,
          speakingTimeMinutes: 48,
          streakDays: 8,
          reviews: {},
        });
      },
    }),
    {
      name: 'speakup-learning-storage',
    }
  )
);
