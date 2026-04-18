import { useAuth } from '../hooks/useAuth';
import PartnerProfileSetup from './PartnerProfileSetup';
import ClientOnboarding from './ClientOnboarding';  // ← Make sure this is correct
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

  // Partner route
  if (user?.role === 'partner') {
    return <PartnerProfileSetup onComplete={() => {
      window.location.href = '/partner-dashboard';
    }} />;
  }

  // Client route - uses the 4-step ClientOnboarding
  if (user?.role === 'member') {
    return <ClientOnboarding onComplete={() => {
      window.location.href = '/client-dashboard';
    }} />;
  }

  // No valid role - go home
  window.location.href = '/';
  return null;
}