import { useAuth } from '../hooks/useAuth';
import PartnerProfileSetup from './PartnerProfileSetup';
import { Loader2 } from 'lucide-react';

export default function CompleteProfile() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  // DIRECT RENDER - No conditions
  return <PartnerProfileSetup onComplete={() => {
    window.location.href = '/partner-dashboard';
  }} />;
}