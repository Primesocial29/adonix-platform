import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import PartnerProfileSetup from './PartnerProfileSetup';
import ClientProfileSetup from './ClientProfileSetup';
import { Loader2 } from 'lucide-react';

export default function CompleteProfile() {
  const { user, profile, loading } = useAuth();

  console.log('CompleteProfile - user:', user?.id);
  console.log('CompleteProfile - profile:', profile);
  console.log('CompleteProfile - loading:', loading);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/';
    }
  }, [user, loading]);

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

  // FORCE PARTNER MODE - SHOW PARTNER SETUP
  // This bypasses all role checks
  return (
    <PartnerProfileSetup
      onComplete={() => {
        console.log('Setup complete, redirecting to partner dashboard');
        window.location.href = '/partner-dashboard';
      }}
    />
  );
}