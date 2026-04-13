import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PartnerProfileSetup from './PartnerProfileSetup';
import ClientProfileSetup from './ClientProfileSetup';
import { Loader2 } from 'lucide-react';

export default function CompleteProfile() {
  const { user, profile, loading } = useAuth();

  // FORCE PARTNER MODE FOR TESTING - REMOVE AFTER FIX
  const FORCE_PARTNER_MODE = true;

  // DEBUG LOGS
  console.log('=== CompleteProfile Debug ===');
  console.log('user:', user?.id);
  console.log('loading:', loading);
  console.log('profile:', profile);
  console.log('FORCE_PARTNER_MODE:', FORCE_PARTNER_MODE);

  useEffect(() => {
    console.log('useEffect 1 - checking user redirect');
    if (!loading && !user) {
      console.log('No user found, redirecting to /');
      window.location.href = '/';
    }
  }, [user, loading]);

  useEffect(() => {
    console.log('useEffect 2 - checking profile complete');
    if (!loading && profile?.profile_complete && !FORCE_PARTNER_MODE) {
      console.log('Profile complete, redirecting based on role');
      if (profile.is_partner || profile.role === 'trainer') {
        console.log('Redirecting to /partner-dashboard');
        window.location.href = '/partner-dashboard';
      } else {
        console.log('Redirecting to /browse');
        window.location.href = '/browse';
      }
    }
  }, [loading, profile]);

  if (loading) {
    console.log('Loading state - showing spinner');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user) {
    console.log('No user - returning null');
    return null;
  }

  // FORCE PARTNER PROFILE SETUP
  if (FORCE_PARTNER_MODE) {
    console.log('FORCE_PARTNER_MODE is true - showing PartnerProfileSetup');
    return (
      <PartnerProfileSetup
        onComplete={() => {
          console.log('Partner profile setup complete, redirecting to /partner-dashboard');
          window.location.href = '/partner-dashboard';
        }}
      />
    );
  }

  if (profile?.is_partner || profile?.role === 'trainer') {
    console.log('User is partner - showing PartnerProfileSetup');
    return (
      <PartnerProfileSetup
        onComplete={() => {
          console.log('Partner profile setup complete, redirecting to /partner-dashboard');
          window.location.href = '/partner-dashboard';
        }}
      />
    );
  }

  console.log('User is client - showing ClientProfileSetup');
  return (
    <ClientProfileSetup
      onComplete={() => {
        console.log('Client profile setup complete, redirecting to /browse');
        window.location.href = '/browse';
      }}
    />
  );
}