import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell, Users, Sparkles } from 'lucide-react';

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<'client' | 'partner' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleContinue = async () => {
    if (!selectedRole) {
      setError('Please select an option to continue.');
      return;
    }
    if (!user) {
      setError('User not found. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');

    const isPartner = selectedRole === 'partner';

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_partner: isPartner })
      .eq('id', user.id);

    if (updateError) {
      setError('Failed to save your preference. Please try again.');
      setLoading(false);
      return;
    }

    if (isPartner) {
      window.location.href = '/partner-setup';
    } else {
      window.location.href = '/profile';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-orange-500/20 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome to Adonix</h1>
          <p className="text-gray-300 text-lg">Tell us how you'd like to use the app</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-6 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          {/* Partner option on top */}
          <button
            onClick={() => setSelectedRole('partner')}
            className={`w-full p-6 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${
              selectedRole === 'partner'
                ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="p-2 bg-orange-500/20 rounded-xl">
              <Dumbbell className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="font-bold text-xl">I want to offer my services</div>
              <div className="text-gray-300 mt-1">
                Become a partner, set your own rates, and earn money helping others reach their fitness goals.
              </div>
            </div>
          </button>

          {/* Client option */}
          <button
            onClick={() => setSelectedRole('client')}
            className={`w-full p-6 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${
              selectedRole === 'client'
                ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="font-bold text-xl">I want to find a fitness partner</div>
              <div className="text-gray-300 mt-1">
                Browse trusted partners, invite to meet, and work out together – in a safe, GPS‑verified environment.
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedRole || loading}
          className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.02]"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>

        <p className="text-center text-gray-500 text-sm mt-6">
          You can change this later in your account settings.
        </p>
      </div>
    </div>
  );
}