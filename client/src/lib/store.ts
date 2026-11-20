import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, ReviewGrade, CollectionProgress, PhraseProgressState } from '@/types/database';
import { mockProfile } from '@/data/mockData';
import { calculateSM2, SRSItemState } from './srs';
import { supabase } from './supabaseClient';
import { DailyReviewProgress } from '@/types/quiz';
import { api } from '@/lib/api';

export interface LessonProgressState {
  currentStep: number;
  completedSteps: number[];
  quizScore: number;
  totalQuestions: number;
  completed: boolean;
  lastStudiedAt: string;
}

export interface LearningState {
  profile: Profile;
  todayLearned: number;
  lastLearnedDate: string;
  todayGoal: number;
  overallProgressPercent: number;
  totalWordsLearned: number;
  speakingTimeMinutes: number;
  streakDays: number;
  reviews: Record<string, SRSItemState>;
  collectionReviews: Record<string, SRSItemState>;
  collectionProgress: Record<string, CollectionProgress>;
  lessonProgress: Record<string, LessonProgressState>;
  dailyReviewProgress: Record<string, DailyReviewProgress>;

  // Actions
  checkAndResetNewDay: () => void;
  recordReview: (itemId: string, grade: ReviewGrade, userId?: string, isDaily?: boolean) => Promise<void>;
  recordReviewLocal: (itemId: string, grade: ReviewGrade, isDaily?: boolean) => void;
  recordCollectionReview: (deckId: string, itemId: string, grade: ReviewGrade, userId?: string) => Promise<void>;
  recordCollectionPhraseProgress: (
    collectionId: string,
    phraseId: string,
    grade: ReviewGrade,
    totalPhrases?: number,
    userId?: string
  ) => Promise<void>;
  getCollectionProgress: (collectionId: string) => CollectionProgress | null;
  setCollectionReviews: (reviews: Record<string, SRSItemState>) => void;
  setTodayLearned: (count: number) => void;
  recordLessonProgress: (
    lessonId: string,
    updates: Partial<LessonProgressState>,
    meta?: { collectionId?: string; sprintDay?: number; wordIds?: string[]; dateStr?: string }
  ) => void;
  saveDailyReviewProgress: (progress: DailyReviewProgress, userId?: string) => Promise<void>;
  saveDailyReviewProgressLocal: (progress: DailyReviewProgress) => void;
  resetDailyReviewProgress: (dateStr?: string, userId?: string) => Promise<void>;
  getTodayReviewProgress: (dateStr?: string) => DailyReviewProgress | null;
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
    collectionReviews?: Record<string, SRSItemState>;
    collectionProgress?: Record<string, CollectionProgress>;
    dailyReviewProgress?: Record<string, DailyReviewProgress>;
  }) => void;
  resetToGuest: () => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      profile: mockProfile,
      todayLearned: 0, // Guest starts with 0 learned words
      lastLearnedDate: new Date().toISOString().split('T')[0],
      todayGoal: 20,
      overallProgressPercent: 72,
      totalWordsLearned: 520,
      speakingTimeMinutes: 48,
      streakDays: 8,
      reviews: {},
      collectionReviews: {},
      collectionProgress: {},
      lessonProgress: {},
      dailyReviewProgress: {},

      getCollectionProgress: (collectionId: string) => {
        return get().collectionProgress[collectionId] || null;
      },

      recordCollectionPhraseProgress: async (
        collectionId: string,
        phraseId: string,
        grade: ReviewGrade,
        totalPhrases: number = 20,
        userId?: string
      ) => {
        const state = get();
        const currentColProgress = state.collectionProgress[collectionId] || {
          collection_id: collectionId,
          learned_count: 0,
          mastered_count: 0,
          total_phrases: totalPhrases,
          progress_percent: 0,
          last_studied_at: new Date().toISOString(),
          phrase_states: {},
        };

        const currentPhraseSRS = currentColProgress.phrase_states[phraseId] || {
          repetitions: 0,
          interval_days: 1,
          ease_factor: 2.5,
          next_review_at: new Date().toISOString(),
          last_reviewed_at: new Date().toISOString(),
          last_quality: 0,
          is_mastered: false,
        };

        const updatedSRS = calculateSM2(grade, currentPhraseSRS);
        const isMastered = updatedSRS.repetitions >= 3 || updatedSRS.interval_days >= 7;

        const updatedPhraseState: PhraseProgressState = {
          repetitions: updatedSRS.repetitions,
          interval_days: updatedSRS.interval_days,
          ease_factor: updatedSRS.ease_factor,
          next_review_at: updatedSRS.next_review_at,
          last_reviewed_at: new Date().toISOString(),
          last_quality: grade,
          is_mastered: isMastered,
        };

        const newPhraseStates = {
          ...currentColProgress.phrase_states,
          [phraseId]: updatedPhraseState,
        };

        const learnedCount = Object.keys(newPhraseStates).length;
        const masteredCount = Object.values(newPhraseStates).filter((p) => p.is_mastered).length;
        const effectiveTotal = Math.max(currentColProgress.total_phrases || totalPhrases, learnedCount);
        const progressPercent = effectiveTotal > 0 ? Math.min(100, Math.round((masteredCount / effectiveTotal) * 100)) : 0;

        const updatedColProgress: CollectionProgress = {
          collection_id: collectionId,
          learned_count: learnedCount,
          mastered_count: masteredCount,
          total_phrases: effectiveTotal,
          progress_percent: progressPercent,
          last_studied_at: new Date().toISOString(),
          phrase_states: newPhraseStates,
        };

        // Lưu vào state riêng của Collection
        set((s) => ({
          collectionProgress: {
            ...s.collectionProgress,
            [collectionId]: updatedColProgress,
          },
          // Đồng thời duy trì collectionReviews để tra cứu nhanh SRS
          collectionReviews: {
            ...s.collectionReviews,
            [phraseId]: updatedSRS,
          },
        }));

        // Ghi nhận lên bảng riêng của Collection trên Supabase (nếu bảng đã tồn tại)
        try {
          let uid = userId;
          if (!uid) {
            const { data: { session } } = await supabase.auth.getSession();
            uid = session?.user?.id;
          }

          if (uid) {
            const now = new Date().toISOString();
            // Thử lưu vào bảng riêng collection_reviews / user_collection_progress
            const { data: existing, error: checkErr } = await supabase
              .from('collection_reviews')
              .select('id')
              .eq('user_id', uid)
              .eq('collection_id', collectionId)
              .eq('phrase_id', phraseId)
              .maybeSingle();

            if (!checkErr) {
              if (existing?.id) {
                await supabase
                  .from('collection_reviews')
                  .update({
                    repetitions: updatedSRS.repetitions,
                    interval_days: updatedSRS.interval_days,
                    ease_factor: updatedSRS.ease_factor,
                    next_review_at: updatedSRS.next_review_at,
                    last_reviewed_at: now,
                    last_quality: grade,
                    is_mastered: isMastered,
                    updated_at: now,
                  })
                  .eq('id', existing.id);
              } else {
                await supabase.from('collection_reviews').insert({
                  user_id: uid,
                  collection_id: collectionId,
                  phrase_id: phraseId,
                  repetitions: updatedSRS.repetitions,
                  interval_days: updatedSRS.interval_days,
                  ease_factor: updatedSRS.ease_factor,
                  next_review_at: updatedSRS.next_review_at,
                  last_reviewed_at: now,
                  last_quality: grade,
                  is_mastered: isMastered,
                  created_at: now,
                  updated_at: now,
                });
              }
            }
          }
        } catch (_) {
          // Bảng riêng trên DB sẽ được tạo sau, tiến trình được bảo toàn local an toàn
        }
      },

      setCollectionReviews: (reviews: Record<string, SRSItemState>) => {
        set((state) => ({
          collectionReviews: { ...state.collectionReviews, ...reviews },
        }));
      },

      saveDailyReviewProgressLocal: (progress: DailyReviewProgress) => {
        set((state) => ({
          dailyReviewProgress: {
            ...state.dailyReviewProgress,
            [progress.date]: progress,
          },
        }));
      },

      saveDailyReviewProgress: async (progress: DailyReviewProgress, userId?: string) => {
        set((state) => ({
          dailyReviewProgress: {
            ...state.dailyReviewProgress,
            [progress.date]: progress,
          },
        }));

        // Đồng bộ lên server nếu có người dùng đăng nhập
        try {
          let uid = userId;
          if (!uid) {
            const { data: { session } } = await supabase.auth.getSession();
            uid = session?.user?.id;
          }

          if (uid) {
            await api.progress.saveDailyReview(progress);
          }
        } catch (err) {
          console.warn('Could not sync daily review progress to server:', err);
        }
      },

      resetDailyReviewProgress: async (dateStr?: string, userId?: string) => {
        const targetDate = dateStr || new Date().toISOString().split('T')[0];
        set((state) => {
          const next = { ...state.dailyReviewProgress };
          delete next[targetDate];
          return { dailyReviewProgress: next };
        });

        try {
          let uid = userId;
          if (!uid) {
            const { data: { session } } = await supabase.auth.getSession();
            uid = session?.user?.id;
          }

          if (uid) {
            await api.progress.resetDailyReview(targetDate);
          }
        } catch (err) {
          console.warn('Could not reset daily review progress on server:', err);
        }
      },

      getTodayReviewProgress: (dateStr?: string) => {
        const targetDate = dateStr || new Date().toISOString().split('T')[0];
        return get().dailyReviewProgress[targetDate] || null;
      },

      recordLessonProgress: (
        lessonId: string,
        updates: Partial<LessonProgressState>,
        meta?: { collectionId?: string; sprintDay?: number; wordIds?: string[]; dateStr?: string }
      ) => {
        set((state) => {
          const current = state.lessonProgress[lessonId] || {
            currentStep: 0,
            completedSteps: [],
            quizScore: 0,
            totalQuestions: 0,
            completed: false,
            lastStudiedAt: new Date().toISOString(),
          };

          const isNowCompleted = updates.completed ?? current.completed;
          let todayLearnedCount = state.todayLearned;
          let totalWordsCount = state.totalWordsLearned;

          // Nếu vừa mới hoàn thành bài học, tăng số từ đã học hôm nay và tổng từ
          if (updates.completed && !current.completed) {
            const addedWords = meta?.wordIds?.length || 10;
            todayLearnedCount += addedWords;
            totalWordsCount += addedWords;
          }

          return {
            todayLearned: todayLearnedCount,
            totalWordsLearned: totalWordsCount,
            lessonProgress: {
              ...state.lessonProgress,
              [lessonId]: {
                ...current,
                ...updates,
                completed: isNowCompleted,
                lastStudiedAt: new Date().toISOString(),
              },
            },
          };
        });

        // Nếu bài học hoàn thành, lưu receipt lên server
        if (updates.completed) {
          const todayStr = meta?.dateStr || new Date().toISOString().split('T')[0];
          api.progress.saveDailyLesson({
            date: todayStr,
            lessonId,
            collectionId: meta?.collectionId || 'col-restaurant',
            sprintDay: meta?.sprintDay || 1,
            wordIds: meta?.wordIds || [],
            score: updates.quizScore || 0,
            totalQuestions: updates.totalQuestions || 8,
            completed: true,
          }).catch((err) => {
            console.warn('Lỗi khi lưu kết quả bài học daily lên server:', err);
          });
        }
      },

      // Tự động kiểm tra sang ngày mới để reset todayLearned về 0 nếu chưa học hôm nay
      checkAndResetNewDay: () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const state = get();
        if (state.lastLearnedDate !== todayStr) {
          const todayReview = state.dailyReviewProgress[todayStr];
          let countToday = 0;
          if (todayReview) {
            if (todayReview.results && Object.keys(todayReview.results).length > 0) {
              const uniqueWords = new Set(
                Object.values(todayReview.results)
                  .map((r: any) => r.question?.wordId || r.questionId)
                  .filter(Boolean)
              );
              countToday = uniqueWords.size;
            } else if (todayReview.wordIds && todayReview.wordIds.length > 0) {
              countToday = todayReview.wordIds.length;
            } else {
              countToday = Math.min(state.todayGoal || 20, Math.ceil((todayReview.answeredCount || 0) / 3));
            }
          }
          set({
            todayLearned: countToday,
            lastLearnedDate: todayStr,
          });
        }
      },

      setTodayLearned: (count: number) => {
        const goal = get().todayGoal || 20;
        const todayStr = new Date().toISOString().split('T')[0];
        set({
          todayLearned: Math.min(goal, Math.max(0, count)),
          lastLearnedDate: todayStr,
        });
      },

      recordReviewLocal: (itemId: string, grade: ReviewGrade, isDaily?: boolean) => {
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
        const todayStr = new Date().toISOString().split('T')[0];
        const baseToday = state.lastLearnedDate === todayStr ? state.todayLearned : 0;
        const newTodayLearned = isDaily
          ? Math.min(state.todayGoal, baseToday + 1)
          : baseToday;
        const newTotal = isFirstReview ? state.totalWordsLearned + 1 : state.totalWordsLearned;
        const newOverallPercent = Math.min(100, Math.round((newTotal / 700) * 100));

        set({
          reviews: {
            ...state.reviews,
            [itemId]: updatedSRS,
          },
          todayLearned: newTodayLearned,
          lastLearnedDate: todayStr,
          totalWordsLearned: newTotal,
          overallProgressPercent: newOverallPercent,
        });
      },

      recordReview: async (itemId: string, grade: ReviewGrade, userId?: string, isDaily?: boolean) => {
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
        const todayStr = new Date().toISOString().split('T')[0];
        const baseToday = state.lastLearnedDate === todayStr ? state.todayLearned : 0;
        const newTodayLearned = isDaily
          ? Math.min(state.todayGoal, baseToday + 1)
          : baseToday;
        const newTotal = isFirstReview ? state.totalWordsLearned + 1 : state.totalWordsLearned;
        const newOverallPercent = Math.min(100, Math.round((newTotal / 700) * 100));

        set({
          reviews: {
            ...state.reviews,
            [itemId]: updatedSRS,
          },
          todayLearned: newTodayLearned,
          lastLearnedDate: todayStr,
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

      recordCollectionReview: async (deckId: string, itemId: string, grade: ReviewGrade, userId?: string) => {
        const state = get();
        const currentSRS = state.collectionReviews[itemId] || {
          repetitions: 0,
          interval_days: 1,
          ease_factor: 2.5,
          next_review_at: new Date().toISOString(),
          last_quality: 0,
        };

        const updatedSRS = calculateSM2(grade, currentSRS);
        const isFirstReview = !state.collectionReviews[itemId];
        const newTotal = isFirstReview ? state.totalWordsLearned + 1 : state.totalWordsLearned;
        const newOverallPercent = Math.min(100, Math.round((newTotal / 700) * 100));

        set({
          collectionReviews: {
            ...state.collectionReviews,
            [itemId]: updatedSRS,
          },
          totalWordsLearned: newTotal,
          overallProgressPercent: newOverallPercent,
        });

        // Tự động lưu lên bảng riêng 'collection_reviews' nếu người dùng đã tạo bảng trên database
        try {
          let uid = userId;
          if (!uid) {
            const { data: { session } } = await supabase.auth.getSession();
            uid = session?.user?.id;
          }

          if (uid) {
            const now = new Date().toISOString();
            const { data: existing, error: queryError } = await supabase
              .from('collection_reviews')
              .select('id')
              .eq('user_id', uid)
              .eq('deck_id', deckId)
              .eq('item_id', itemId)
              .maybeSingle();

            if (!queryError) {
              if (existing?.id) {
                await supabase
                  .from('collection_reviews')
                  .update({
                    repetitions: updatedSRS.repetitions,
                    interval_days: updatedSRS.interval_days,
                    ease_factor: updatedSRS.ease_factor,
                    next_review_at: updatedSRS.next_review_at,
                    last_reviewed_at: now,
                    last_quality: grade,
                    updated_at: now,
                  })
                  .eq('id', existing.id);
              } else {
                await supabase.from('collection_reviews').insert({
                  user_id: uid,
                  deck_id: deckId,
                  item_id: itemId,
                  repetitions: updatedSRS.repetitions,
                  interval_days: updatedSRS.interval_days,
                  ease_factor: updatedSRS.ease_factor,
                  next_review_at: updatedSRS.next_review_at,
                  last_reviewed_at: now,
                  last_quality: grade,
                  created_at: now,
                  updated_at: now,
                });
              }
            }
          }
        } catch (err) {
          // Bảng collection_reviews sẽ được tạo sau, tiến trình được bảo toàn ở client store
          console.info('Bảng collection_reviews chưa sẵn sàng trên database (đã lưu local):', err);
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
          collectionReviews:
            data.collectionReviews !== undefined
              ? { ...state.collectionReviews, ...data.collectionReviews }
              : state.collectionReviews,
          collectionProgress:
            data.collectionProgress !== undefined
              ? { ...state.collectionProgress, ...data.collectionProgress }
              : state.collectionProgress,
          dailyReviewProgress:
            data.dailyReviewProgress !== undefined
              ? { ...state.dailyReviewProgress, ...data.dailyReviewProgress }
              : state.dailyReviewProgress,
        }));
      },

      resetToGuest: () => {
        set({
          profile: mockProfile,
          todayLearned: 0,
          lastLearnedDate: new Date().toISOString().split('T')[0],
          todayGoal: 20,
          overallProgressPercent: 72,
          totalWordsLearned: 520,
          speakingTimeMinutes: 48,
          streakDays: 8,
          reviews: {},
          collectionReviews: {},
          collectionProgress: {},
          lessonProgress: {},
          dailyReviewProgress: {},
        });
      },
    }),
    {
      name: 'speakup-learning-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.checkAndResetNewDay?.();
        }
      },
    }
  )
);
