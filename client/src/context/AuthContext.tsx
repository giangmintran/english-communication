import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { useLearningStore } from '@/lib/store';
import { api } from '@/lib/api';

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
    const isSameUser = currentStore.profile?.id === currentUser.id;

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

      // 3. Query reviews to compute REAL statistics for the logged-in user
      const { data: userReviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', currentUser.id);

      const reviewsMap: Record<string, any> = {};
      const todayStr = new Date().toISOString().split('T')[0];

      if (userReviews && userReviews.length > 0) {
        userReviews.forEach((rev) => {
          reviewsMap[rev.item_id] = {
            repetitions: rev.repetitions,
            interval_days: rev.interval_days,
            ease_factor: rev.ease_factor,
            next_review_at: rev.next_review_at,
            last_quality: rev.last_quality,
          };
        });
      }

      // 3b. Query bảng riêng collection_reviews (khi người dùng đã tạo bảng trên DB)
      const collectionReviewsMap: Record<string, any> = {};
      try {
        const { data: colData, error: colError } = await supabase
          .from('collection_reviews')
          .select('*')
          .eq('user_id', currentUser.id);

        if (!colError && colData && colData.length > 0) {
          colData.forEach((rev) => {
            collectionReviewsMap[rev.item_id] = {
              repetitions: rev.repetitions,
              interval_days: rev.interval_days,
              ease_factor: rev.ease_factor,
              next_review_at: rev.next_review_at,
              last_quality: rev.last_quality,
            };
          });
        }
      } catch (_) {
        // Bảng collection_reviews sẽ được người dùng tạo sau
      }

      // Tổng hợp từ vựng đã học từ cả Daily và Collection (loại bỏ trùng ID nếu có)
      const allLearnedItemIds = new Set([
        ...Object.keys(reviewsMap),
        ...Object.keys(collectionReviewsMap),
      ]);
      const totalWordsLearned = allLearnedItemIds.size;
      const streakCount = dbProfile?.streak_count ?? 1;
      const dailyGoal = dbProfile?.daily_goal_words ?? 20;
      const progressPercent = totalWordsLearned > 0 ? Math.min(100, Math.round((totalWordsLearned / 700) * 100)) : 0;

      // Tính số từ đã học cho Daily Routine hôm nay (tách biệt hoàn toàn với Collections)
      const existingClientDailyProgress = useLearningStore.getState().getTodayReviewProgress(todayStr);
      let initialDailyLearned = 0;
      if (existingClientDailyProgress) {
        if (existingClientDailyProgress.results && Object.keys(existingClientDailyProgress.results).length > 0) {
          const uniqueWords = new Set(
            Object.values(existingClientDailyProgress.results).map((r: any) => r.question?.wordId || r.questionId).filter(Boolean)
          );
          initialDailyLearned = Math.min(dailyGoal, uniqueWords.size);
        } else if (existingClientDailyProgress.wordIds && existingClientDailyProgress.wordIds.length > 0) {
          initialDailyLearned = Math.min(dailyGoal, existingClientDailyProgress.wordIds.length);
        }
      }

      // 4. Update Zustand store with actual user data (Zero mock data)
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
        todayGoal: dailyGoal,
        todayLearned: initialDailyLearned,
        totalWordsLearned: totalWordsLearned,
        overallProgressPercent: progressPercent,
        reviews: reviewsMap,
        collectionReviews: collectionReviewsMap,
      });

      // 5. Upsert to profiles table if row doesn't exist yet
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

      // 6. Gộp tiến trình ôn tập 20 từ (Daily Review) giữa client (máy khách) và server
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const clientProgress = useLearningStore.getState().getTodayReviewProgress(todayStr);
        let activeDailyProgress = clientProgress;

        if (clientProgress && clientProgress.answeredCount > 0) {
          // Có tiến trình lưu ở máy khách -> Gọi merge lên server
          const merged = await api.progress.mergeDailyReview(clientProgress);
          if (merged) {
            activeDailyProgress = merged;
            await useLearningStore.getState().saveDailyReviewProgress(merged, currentUser.id);
          }
        } else {
          // Chưa có ở máy khách -> Lấy tiến trình trên server về máy khách
          const serverProgress = await api.progress.getDailyReview(todayStr);
          if (serverProgress) {
            activeDailyProgress = serverProgress;
            await useLearningStore.getState().saveDailyReviewProgress(serverProgress, currentUser.id);
          }
        }

        // Cập nhật lại todayLearned chính xác từ số từ thực tế của tiến trình Daily Routine
        if (activeDailyProgress) {
          if (activeDailyProgress.results && Object.keys(activeDailyProgress.results).length > 0) {
            const uniqueWords = new Set(
              Object.values(activeDailyProgress.results).map((r: any) => r.question?.wordId || r.questionId).filter(Boolean)
            );
            useLearningStore.getState().setTodayLearned(Math.min(dailyGoal, uniqueWords.size));
          } else if (activeDailyProgress.wordIds && activeDailyProgress.wordIds.length > 0) {
            useLearningStore.getState().setTodayLearned(Math.min(dailyGoal, activeDailyProgress.wordIds.length));
          }
        }
      } catch (reviewSyncErr) {
        console.warn('Lỗi đồng bộ tiến trình Daily Review:', reviewSyncErr);
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
