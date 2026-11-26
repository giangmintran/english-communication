import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { useLearningStore } from '@/lib/store';
import { getLocalDateStr } from '@/lib/srs';
import { api } from '@/lib/api';
import type { DailyReviewProgress } from '@/types/quiz';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Immediately apply user info to Zustand store so UI renders instantly without mock data
  const applyUserMetadata = useCallback((currentUser: User) => {
    const meta = currentUser.user_metadata || {};
    const currentStore = useLearningStore.getState();
    const isSameUser = Boolean(
      (currentStore.userId && currentStore.userId === currentUser.id) ||
      (currentStore.profile?.id && currentStore.profile.id === currentUser.id && currentStore.profile.id !== 'usr-mock-1')
    );

    if (!isSameUser) {
      // Đăng nhập tài khoản khác hoặc lần đầu đăng nhập: Dọn sạch hoàn toàn cache của tài khoản cũ
      useLearningStore.getState().clearUserData(currentUser.id);
    }

    const displayName =
      (isSameUser && currentStore.profile.display_name ? currentStore.profile.display_name : null) ||
      meta.full_name ||
      meta.name ||
      currentUser.email?.split('@')[0] ||
      'Learner';
    const avatarUrl =
      (isSameUser && currentStore.profile.avatar_url ? currentStore.profile.avatar_url : null) ||
      meta.avatar_url ||
      meta.picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&bold=true`;

    useLearningStore.getState().setUserData({
      profile: {
        id: currentUser.id,
        display_name: displayName,
        avatar_url: avatarUrl,
        streak_count: isSameUser ? currentStore.profile.streak_count : 1,
        daily_goal_words: isSameUser ? currentStore.profile.daily_goal_words : 10,
        current_level: isSameUser ? currentStore.profile.current_level : 'A2',
        last_active_date: isSameUser ? currentStore.profile.last_active_date : new Date().toISOString(),
        created_at: isSameUser ? currentStore.profile.created_at : new Date().toISOString(),
      },
      streakDays: isSameUser ? currentStore.streakDays : 1,
      todayGoal: isSameUser ? currentStore.todayGoal : 10,
      todayLearned: isSameUser ? currentStore.todayLearned : 0,
      totalWordsLearned: isSameUser ? currentStore.totalWordsLearned : 0,
      overallProgressPercent: isSameUser ? currentStore.overallProgressPercent : 0,
      speakingTimeMinutes: isSameUser ? currentStore.speakingTimeMinutes : 0,
      reviews: isSameUser ? currentStore.reviews : {},
      collectionReviews: isSameUser ? currentStore.collectionReviews : {},
      collectionProgress: isSameUser ? currentStore.collectionProgress : {},
      dailyReviewProgress: isSameUser ? currentStore.dailyReviewProgress : {},
    });
  }, []);

  const isSyncingRef = useRef(false);

  // Helper to synchronize user metadata with DB profiles & local store
  const syncUserProfile = useCallback(async (currentUser: User) => {
    // 1. Immediately apply metadata from token to flush out any mock data
    applyUserMetadata(currentUser);

    // Tránh gọi trùng lặp nhiều request đồng thời
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      // 2. Query public.profiles
      const { data: dbProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      const meta = currentUser.user_metadata || {};
      const displayName =
        dbProfile?.display_name ||
        meta.full_name ||
        meta.name ||
        currentUser.email?.split('@')[0] ||
        'Learner';
      const avatarUrl =
        dbProfile?.avatar_url ||
        meta.avatar_url ||
        meta.picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&bold=true`;

      // 3. Query tiến trình học thực tế từ bảng collection_reviews (tách riêng col-daily cho Daily SRS và các bộ sưu tập)
      const reviewsMap: Record<string, any> = {};
      const collectionReviewsMap: Record<string, any> = {};
      const collectionProgressMap: Record<string, any> = {};
      const todayStr = getLocalDateStr();

      try {
        const { data: colData, error: colError } = await supabase
          .from('collection_reviews')
          .select('*')
          .eq('user_id', currentUser.id);

        if (!colError && colData && colData.length > 0) {
          colData.forEach((rev) => {
            const key = rev.phrase_id || rev.item_id;
            const colId = rev.collection_id || rev.deck_id;

            // Tách riêng dữ liệu SRS của Daily Routine (col-daily) vào reviewsMap
            if (colId === 'col-daily') {
              if (key) {
                reviewsMap[key] = {
                  repetitions: rev.repetitions ?? 0,
                  interval_days: rev.interval_days ?? 1,
                  ease_factor: rev.ease_factor ?? 2.5,
                  next_review_at: rev.next_review_at,
                  last_quality: rev.last_quality ?? 0,
                };
              }
              return;
            }

            if (key) {
              const itemSRS = {
                repetitions: rev.repetitions,
                interval_days: rev.interval_days,
                ease_factor: rev.ease_factor,
                next_review_at: rev.next_review_at,
                last_quality: rev.last_quality,
                is_mastered: Boolean(rev.is_mastered || rev.repetitions >= 3 || rev.interval_days >= 7),
              };
              collectionReviewsMap[key] = itemSRS;
              if (colId) {
                if (!collectionProgressMap[colId]) {
                  collectionProgressMap[colId] = {
                    collection_id: colId,
                    learned_count: 0,
                    mastered_count: 0,
                    total_phrases: 20,
                    progress_percent: 0,
                    last_studied_at: rev.last_reviewed_at || new Date().toISOString(),
                    phrase_states: {},
                  };
                }
                collectionProgressMap[colId].phrase_states[key] = itemSRS;
              }
            }
          });
        }
      } catch (_) {
        // Bảng collection_reviews
      }

      // Cập nhật learned_count và progress_percent cho từng collection
      Object.keys(collectionProgressMap).forEach((cId) => {
        const cp = collectionProgressMap[cId];
        const states = cp.phrase_states || {};
        const learned = Object.keys(states).length;
        const mastered = Object.values(states).filter((s: any) => s.is_mastered).length;
        const total = Math.max(cp.total_phrases || 20, learned);
        cp.learned_count = learned;
        cp.mastered_count = mastered;
        cp.progress_percent = total > 0 ? Math.min(100, Math.round((mastered / total) * 100)) : 0;
      });

      // 4. Tải toàn bộ lịch sử ôn tập (Daily Routine) của riêng currentUser từ Supabase
      const userDailyProgressMap: Record<string, DailyReviewProgress> = {};
      let activeDailyProgress: DailyReviewProgress | null = null;

      try {
        const { data: allDbDaily } = await supabase
          .from('daily_reviews')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('review_date', { ascending: false })
          .limit(60);

        if (allDbDaily && allDbDaily.length > 0) {
          allDbDaily.forEach((dbDaily) => {
            const mappedProgress: DailyReviewProgress = {
              date: dbDaily.review_date,
              deckId: dbDaily.deck_id || 'daily',
              wordIds: dbDaily.word_ids || [],
              currentIndex: dbDaily.current_index || 0,
              totalQuestions: dbDaily.total_questions || 60,
              answeredCount: dbDaily.answered_count || 0,
              correctCount: dbDaily.correct_count || 0,
              isCompleted: Boolean(dbDaily.is_completed),
              results: dbDaily.results || {},
              lastUpdated: dbDaily.updated_at,
            };
            userDailyProgressMap[dbDaily.review_date] = mappedProgress;
            if (dbDaily.review_date === todayStr && (dbDaily.answered_count > 0 || dbDaily.is_completed)) {
              activeDailyProgress = mappedProgress;
            }
          });
        }
      } catch (_) {}

      // Nếu cùng một user và client đã có tiến trình hôm nay mới hơn hoặc nhiều câu hơn server, giữ lại tiến trình đó
      const storeState = useLearningStore.getState();
      const isSameUser = storeState.userId === currentUser.id;
      if (isSameUser) {
        const localToday = storeState.getTodayReviewProgress(todayStr);
        const serverDaily = activeDailyProgress as DailyReviewProgress | null;
        const serverAnswered = serverDaily?.answeredCount || 0;
        const localUpdatedAt = localToday?.lastUpdated ? new Date(localToday.lastUpdated).getTime() : 0;
        const serverUpdatedAt = serverDaily?.lastUpdated
          ? new Date(serverDaily.lastUpdated).getTime()
          : 0;
        const isLocalNewer =
          Boolean(localToday) &&
          (localToday!.answeredCount > serverAnswered ||
            (localToday!.answeredCount === serverAnswered && localUpdatedAt > serverUpdatedAt));

        if (isLocalNewer && localToday) {
          activeDailyProgress = localToday;
          userDailyProgressMap[todayStr] = localToday;
        }
      }

      // Hợp nhất reviewsMap từ server với local reviews nếu cùng 1 user (tránh mất đánh giá local chưa kịp sync)
      const mergedReviewsMap: Record<string, any> = { ...reviewsMap };
      if (isSameUser && storeState.reviews) {
        Object.entries(storeState.reviews).forEach(([wordId, localRev]) => {
          const serverRev = mergedReviewsMap[wordId];
          if (!serverRev) {
            mergedReviewsMap[wordId] = localRev;
          } else {
            const localNext = localRev?.next_review_at ? new Date(localRev.next_review_at).getTime() : 0;
            const serverNext = serverRev?.next_review_at ? new Date(serverRev.next_review_at).getTime() : 0;
            if (localNext > serverNext) {
              mergedReviewsMap[wordId] = localRev;
            }
          }
        });
      }

      // Tính số từ vựng duy nhất đã học hôm nay của Daily Routine
      let initialDailyLearned = 0;
      if (activeDailyProgress) {
        if (activeDailyProgress.results && Object.keys(activeDailyProgress.results).length > 0) {
          const uniqueWords = new Set(
            Object.values(activeDailyProgress.results).map((r: any) => r.question?.wordId || r.questionId).filter(Boolean)
          );
          initialDailyLearned = uniqueWords.size;
        } else if (activeDailyProgress.isCompleted && activeDailyProgress.wordIds && activeDailyProgress.wordIds.length > 0) {
          initialDailyLearned = activeDailyProgress.wordIds.length;
        } else if (activeDailyProgress.wordIds && activeDailyProgress.wordIds.length > 0 && activeDailyProgress.answeredCount > 0) {
          initialDailyLearned = Math.min(
            activeDailyProgress.wordIds.length,
            Math.ceil(activeDailyProgress.answeredCount / 3)
          );
        }
      }

      // Tổng hợp từ vựng đã học (tổng từ Collection + Daily SRS)
      const dailyLearnedTotal = Math.max(Object.keys(mergedReviewsMap).length, initialDailyLearned);
      const totalWordsLearned = Object.keys(collectionReviewsMap).length + dailyLearnedTotal;
      const streakCount = dbProfile?.streak_count ?? 1;
      const dailyGoal = dbProfile?.daily_goal_words ?? 20;
      const progressPercent = totalWordsLearned > 0 ? Math.min(100, Math.round((totalWordsLearned / 700) * 100)) : 0;

      // Nếu bài học hôm nay đã xong, giữ nguyên số lượng từ của bài học hôm nay
      const isTodayCompleted = Boolean(
        activeDailyProgress?.isCompleted ||
        (activeDailyProgress?.totalQuestions && activeDailyProgress?.answeredCount >= activeDailyProgress?.totalQuestions && activeDailyProgress?.answeredCount > 0)
      );

      const resolvedTodayGoal = Math.max(
        dailyGoal,
        activeDailyProgress?.wordIds?.length || 0
      );

      // 5. Cập nhật Zustand store của tài khoản này
      useLearningStore.getState().setUserData({
        profile: {
          id: currentUser.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          streak_count: streakCount,
          daily_goal_words: dailyGoal,
          current_level: dbProfile?.current_level ?? 'A2',
          last_active_date: dbProfile?.last_active_date ?? new Date().toISOString(),
          created_at: dbProfile?.created_at ?? new Date().toISOString(),
        },
        streakDays: streakCount,
        todayGoal: resolvedTodayGoal,
        todayLearned: Math.min(resolvedTodayGoal, initialDailyLearned),
        totalWordsLearned: totalWordsLearned,
        overallProgressPercent: progressPercent,
        reviews: mergedReviewsMap,
        collectionReviews: collectionReviewsMap,
        collectionProgress: collectionProgressMap,
        dailyReviewProgress: userDailyProgressMap,
      });

      // 6. Upsert to profiles table if row doesn't exist yet
      if (!dbProfile && !fetchError) {
        await supabase.from('profiles').upsert({
          id: currentUser.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          streak_count: 1,
          daily_goal_words: 10,
          current_level: 'A2',
          last_active_date: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Profile sync warning:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [applyUserMetadata]);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
        await syncUserProfile(currentUser);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [syncUserProfile]);

  useEffect(() => {
    // 1. Initial check khi app khởi động
    refreshUser();

    // 2. Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      // Chỉ gọi sync toàn bộ profile & reviews khi người dùng thực sự đăng nhập mới (SIGNED_IN)
      // hoặc cập nhật tài khoản (USER_UPDATED).
      // KHÔNG gọi lại 3-4 API này khi đổi tab / focus tab chỉ phát sinh TOKEN_REFRESHED hoặc INITIAL_SESSION.
      if (currentUser && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        await syncUserProfile(currentUser);
      } else if (event === 'SIGNED_OUT') {
        clearAuthStorage();
        useLearningStore.getState().resetToGuest();
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser, syncUserProfile]);

  const clearAuthStorage = () => {
    if (typeof window === 'undefined') return;

    const purge = (storage: Storage) => {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (
            key &&
            (key.startsWith('sb-') ||
              key.includes('auth-token') ||
              key.includes('supabase') ||
              key.includes('oauth'))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => storage.removeItem(k));
      } catch (e) {
        console.warn('Error purging storage:', e);
      }
    };

    purge(window.localStorage);
    purge(window.sessionStorage);
  };

  const signInWithGoogle = async (customRedirectTo?: string) => {
    const callbackOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUrl = customRedirectTo || `${callbackOrigin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.error('Google Sign-in error:', error.message);
      alert(`Đăng nhập thất bại: ${error.message}`);
      throw error;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.warn('Global sign-out error:', err);
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (localErr) {
        console.warn('Local sign-out error:', localErr);
      }
    } finally {
      // Xoá triệt để mọi key token auth của Supabase khỏi localStorage và sessionStorage
      clearAuthStorage();
      setUser(null);
      setSession(null);
      useLearningStore.getState().resetToGuest();
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithGoogle,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
