import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PartnerProfileSetup from './PartnerProfileSetup';
import ClientProfileSetup from './ClientProfileSetup';
import { Loader2 } from 'lucide-react';

export default function CompleteProfile() {
  const { user, profile, loading } = useAuth();

  // FORCE PARTNER MODE FOR TESTING - REMOVE AFTER FIX
  const FORCE_PARTNER_MODE = true;

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/';
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && profile?.profile_complete && !FORCE_PARTNER_MODE) {
      if (profile.is_partner || profile.role === 'trainer') {
        window.location.href = '/partner-dashboard';
      } else {
        window.location.href = '/browse';
      }
    }
  }, [loading, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // FORCE PARTNER PROFILE SETUP
  if (FORCE_PARTNER_MODE) {
    return (
      <PartnerProfileSetup
        onComplete={() => {
          window.location.href = '/partner-dashboard';
        }}
      />
    );
  }

  if (profile?.is_partner || profile?.role === 'trainer') {
    return (
      <PartnerProfileSetup
        onComplete={() => {
          window.location.href = '/partner-dashboard';
        }}
      />
    );
  }

  return (
    <ClientProfileSetup
      onComplete={() => {
        window.location.href = '/browse';
      }}
    />
  );
}