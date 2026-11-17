'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useLearningStore } from '@/lib/store';
import { mockProfile } from '@/data/mockData';

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

  // Immediately apply user info to Zustand store so UI renders instantly
  const applyUserMetadata = useCallback((currentUser: User) => {
    const meta = currentUser.user_metadata || {};
    const displayName =
      meta.full_name ||
      meta.name ||
      currentUser.email?.split('@')[0] ||
      'Learner';
    const avatarUrl =
      meta.avatar_url ||
      meta.picture ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

    useLearningStore.getState().updateProfile({
      id: currentUser.id,
      display_name: displayName,
      avatar_url: avatarUrl,
    });
  }, []);

  // Helper to synchronize user metadata with DB profiles & local store
  const syncUserProfile = useCallback(async (currentUser: User) => {
    // 1. Immediately apply metadata from Google token
    applyUserMetadata(currentUser);

    const supabase = createClient();
    if (!supabase) return;

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
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

      useLearningStore.getState().updateProfile({
        id: currentUser.id,
        display_name: displayName,
        avatar_url: avatarUrl,
        streak_count: dbProfile?.streak_count ?? 1,
        daily_goal_words: dbProfile?.daily_goal_words ?? 10,
        current_level: dbProfile?.current_level ?? 'A2',
      });

      // 3. Upsert if row doesn't exist yet
      if (!dbProfile && !fetchError) {
        await supabase.from('profiles').upsert({
          id: currentUser.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          streak_count: 1,
          daily_goal_words: 10,
          current_level: 'A2',
        });
      }
    } catch (err) {
      console.warn('Profile sync warning:', err);
    }
  }, [applyUserMetadata]);

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

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
    const supabase = createClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Check URL parameters for errors
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const authError = urlParams.get('auth_error');
      if (authError) {
        console.error('OAuth Callback error:', authError);
      }
    }

    // 1. Initial check
    refreshUser();

    // 2. Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await syncUserProfile(currentUser);
      } else if (event === 'SIGNED_OUT') {
        useLearningStore.getState().updateProfile(mockProfile);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser, syncUserProfile]);

  const signInWithGoogle = async (customRedirectTo?: string) => {
    const supabase = createClient();
    if (!supabase) {
      alert('Vui lòng kiểm tra biến môi trường Supabase (.env.local)');
      return;
    }

    const callbackOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUrl = customRedirectTo || `${callbackOrigin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
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
    const supabase = createClient();
    setIsLoading(true);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      setUser(null);
      setSession(null);
      useLearningStore.getState().updateProfile(mockProfile);
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
