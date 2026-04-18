import { useAuth } from '../hooks/useAuth';
import PartnerProfileSetup from './PartnerProfileSetup';
import ClientOnboarding from './ClientOnboarding';
import { Loader2 } from 'lucide-react';

export default function CompleteProfile() {
  const { user, loading, profile } = useAuth();

  // DEBUG - log to console
  console.log('CompleteProfile - loading:', loading);
  console.log('CompleteProfile - user:', user);
  console.log('CompleteProfile - user?.role:', user?.role);
  console.log('CompleteProfile - profile:', profile);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  // DEBUG - show debug info on screen
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-md mx-auto bg-white/10 rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
        <pre className="text-xs bg-black/50 p-4 rounded-lg overflow-auto">
          {JSON.stringify({ 
            hasUser: !!user, 
            userId: user?.id,
            role: user?.role,
            hasProfile: !!profile,
            profileComplete: profile?.profile_complete
          }, null, 2)}
        </pre>
        <div className="mt-6 space-y-3">
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-2 bg-gray-600 rounded-lg"
          >
            Go Home
          </button>
          <button 
            onClick={async () => {
              const { supabase } = await import('../lib/supabase');
              await supabase.auth.signOut();
              localStorage.clear();
              window.location.href = '/';
            }}
            className="w-full py-2 bg-red-600 rounded-lg"
          >
            Sign Out & Reset
          </button>
        </div>
      </div>
    </div>
  );
}