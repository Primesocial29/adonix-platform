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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
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
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            role: 'member',
            is_partner: false,
            profile_complete: false,
            first_name: 'New User'
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        setProfile(newProfile);
        setRole('member');
        setIsPartner(false);
        setIsTrainer(false);
        setIsClient(true);
        setIsMember(true);
      } else {
        setProfile(data);
        const userRole = data?.role;
        setRole(userRole);
        setIsTrainer(userRole === 'trainer' || userRole === 'partner');
        setIsPartner(userRole === 'partner' || data?.is_partner === true);
        setIsClient(userRole === 'client' || userRole === 'member');
        setIsMember(userRole === 'member');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // NO REDIRECT - let the component handle navigation
    return data;
  };

  const signUp = async (email: string, password: string, role: 'member' | 'partner', username: string, birthDate: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, username, birth_date: birthDate, profile_complete: false },
      },
    });
    if (error) throw error;
    
    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        role: role === 'partner' ? 'trainer' : 'member',
        is_partner: role === 'partner',
        profile_complete: false,
        first_name: username,
      });
      
      // NO REDIRECT - let the ClientOnboarding component handle step changes
    }
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return { 
    user, profile, loading, isTrainer, isPartner, isClient, isMember, role,
    signIn, signUp, signOut, refreshProfile 
  };
}