import { useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTrainer, setIsTrainer] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsTrainer(false);
        setIsPartner(false);
        setIsClient(false);
        setIsMember(false);
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setProfile(data);
      const userRole = data?.role;
      setRole(userRole);
      
      // Handle different role naming conventions
      setIsTrainer(userRole === 'trainer' || userRole === 'partner');
      setIsPartner(userRole === 'partner');
      setIsClient(userRole === 'client' || userRole === 'member');
      setIsMember(userRole === 'member');
      
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, role: 'member' | 'partner') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
          profile_complete: false,
        },
      },
    });
    if (error) throw error;
    
    // Also update profiles table
    if (data?.user) {
      await supabase
        .from('profiles')
        .update({
          role: role,
          profile_complete: false,
        })
        .eq('id', data.user.id);
    }
    
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return { 
    user, 
    profile, 
    loading, 
    isTrainer, 
    isPartner, 
    isClient, 
    isMember,
    role,
    signIn,
    signUp,
    signOut, 
    refreshProfile 
  };
}

const signUp = async (email: string, password: string, role: 'member' | 'partner', username: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role,
        username: username,
        profile_complete: false,
      },
    },
  });
  if (error) throw error;
  
  if (data?.user) {
    await supabase
      .from('profiles')
      .update({
        role: role,
        username: username,
        profile_complete: false,
      })
      .eq('id', data.user.id);
  }
  
  return data;
};