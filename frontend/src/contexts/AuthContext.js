import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profiles, setProfiles] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured, skip auth setup
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured - running in demo mode');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const handleSession = async (session) => {
      if (!mounted) return;

      setSession(session);

      if (!session?.user) {
        setProfiles(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        setProfiles(null);
      } else {
        setProfiles(data);
      }

      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      handleSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* ---------- AUTH ACTIONS ---------- */

  const signup = async ({ name, email, password, role = 'user', location, categories = [] }) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured. Please add your credentials.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
      },
    });

    if (error) throw error;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        location,
        categories,
        role,
        is_approved: true,  // Auto-approve all profiles including artists
        is_active: true,
      })
      .eq('id', data.user.id);

    if (profileError) throw profileError;
  };

  const login = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured. Please add your credentials.');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured. Please add your credentials.');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/login'
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setProfiles(null);
    setSession(null);
  };

  const updateProfile = async (updates) => {
    if (!profiles) throw new Error('Not authenticated');
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured. Please add your credentials.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profiles.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    setProfiles(data);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        profiles,
        session,
        isLoading,
        signup,
        login,
        loginWithGoogle,
        logout,
        updateProfile,
        isAuthenticated: !!profiles,
        isAdmin: profiles?.role === 'admin',
        isArtist: profiles?.role === 'artist',
        isLeadChitrakar: profiles?.role === 'lead_chitrakar',
        isKalakar: profiles?.role === 'kalakar',
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
