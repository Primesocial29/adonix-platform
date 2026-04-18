import { useAuth } from '../hooks/useAuth';
import PartnerProfileSetup from './PartnerProfileSetup';
import ClientOnboarding from './ClientOnboarding';
import { Loader2 } from 'lucide-react';

export default function CompleteProfile() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  // Route to correct onboarding based on user role
  if (user?.role === 'partner') {
    return <PartnerProfileSetup onComplete={() => {
      window.location.href = '/partner-dashboard';
    }} />;
  }

  if (user?.role === 'member') {
    return <ClientOnboarding onComplete={() => {
      window.location.href = '/client-dashboard';
    }} />;
  }

  // Fallback - no user, go home
  window.location.href = '/';
  return null;
}