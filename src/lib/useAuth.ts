import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  username: string;
  avatar_url: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setState({ user: null, profile: null, isAdmin: false, loading: false });
      }
    });

    // 监听 Auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          loadProfile(session.user);
        } else {
          setState({ user: null, profile: null, isAdmin: false, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(user: User) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, role')
      .eq('id', user.id)
      .single();

    const profile: UserProfile | null = data
      ? { username: data.username ?? '', avatar_url: data.avatar_url ?? null, role: data.role ?? 'user' }
      : null;

    setState({
      user,
      profile,
      isAdmin: profile?.role === 'admin',
      loading: false,
    });
  }

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, profile: null, isAdmin: false, loading: false });
  }, []);

  return { ...state, signIn, signUp, signOut };
}


