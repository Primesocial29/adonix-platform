import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

// TEMPORARY - Direct import of the partner setup component
// We'll bypass the conditional logic entirely
export default function CompleteProfile() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  // DYNAMIC IMPORT to avoid any circular dependencies
  const PartnerProfileSetup = require('./PartnerProfileSetup').default;
  
  return <PartnerProfileSetup onComplete={() => {
    window.location.href = '/partner-dashboard';
  }} />;
}