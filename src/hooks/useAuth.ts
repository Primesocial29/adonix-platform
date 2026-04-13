import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import PartnerProfileSetup from './PartnerProfileSetup';
import { Loader2 } from 'lucide-react';

export default function CompleteProfile() {
  const { user, loading } = useAuth();

  console.log('CompleteProfile - user:', user?.id);
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

  // DIRECT - ALWAYS SHOW PARTNER PROFILE SETUP
  return (
    <PartnerProfileSetup
      onComplete={() => {
        window.location.href = '/partner-dashboard';
      }}
    />
  );
}