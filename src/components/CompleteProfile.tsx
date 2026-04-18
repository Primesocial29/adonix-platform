import { useAuth } from '../hooks/useAuth';
import PartnerProfileSetup from './PartnerProfileSetup';
import ClientOnboarding from './ClientOnboarding';
import { Loader2 } from 'lucide-react';

export default function CompleteProfile() {
  const { user, loading, profile } = useAuth();

  // Debug logging
  console.log('===== COMPLETE PROFILE DEBUG =====');
  console.log('loading:', loading);
  console.log('user:', user);
  console.log('user?.role:', user?.role);
  console.log('profile:', profile);
  console.log('profile?.role:', profile?.role);
  console.log('==================================');

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  // Show debug info on screen temporarily
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-lg mx-auto bg-white/10 rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Debug Info</h1>
        
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-400">loading:</span> {String(loading)}</p>
          <p><span className="text-gray-400">user exists:</span> {user ? 'YES' : 'NO'}</p>
          <p><span className="text-gray-400">user.id:</span> {user?.id || 'null'}</p>
          <p><span className="text-gray-400">user.role:</span> {user?.role || 'null'}</p>
          <p><span className="text-gray-400">profile.role:</span> {profile?.role || 'null'}</p>
          <p><span className="text-gray-400">profile.profile_complete:</span> {profile?.profile_complete ? 'true' : 'false'}</p>
        </div>

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