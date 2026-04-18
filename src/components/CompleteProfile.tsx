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

  // If user is a partner → show partner setup
  if (user?.role === 'partner') {
    return <PartnerProfileSetup onComplete={() => {
      window.location.href = '/partner-dashboard';
    }} />;
  }

  // If user is a client/member → show client onboarding (4-step flow)
  if (user?.role === 'member' || user?.role === 'client') {
    return <ClientOnboarding onComplete={() => {
      window.location.href = '/client-dashboard';
    }} />;
  }

  // No valid user or role → go home
  console.warn('CompleteProfile: No valid user role', user);
  window.location.href = '/';
  return null;
}