import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UserRole = 'member' | 'partner' | null;

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isOver18, setIsOver18] = useState(false);
  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Sign‑up validations
    if (!isLogin) {
      if (!isOver18) {
        setError('You must be 18 years or older to create an account.');
        setLoading(false);
        return;
      }
      if (!acceptedTerms) {
        setError('You must agree to the Terms of Service and Privacy Policy to create an account.');
        setLoading(false);
        return;
      }
      if (!selectedRole) {
        setError('Please select whether you want to hire a partner or offer services.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        await signIn(email, password);
        onClose(); // Close modal after login
      } else {
        // Sign up the user with role in metadata
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: selectedRole,
              tos_accepted_at: new Date().toISOString(),
              is_over_18: true,
              tos_version: '1.0',
              profile_complete: false,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Also update the profiles table
        if (data?.user) {
          await supabase
            .from('profiles')
            .update({
              role: selectedRole,
              tos_accepted_at: new Date().toISOString(),
              is_over_18: true,
              tos_version: '1.0',
              profile_complete: false,
            })
            .eq('id', data.user.id);
        }

        // Close modal
        onClose();
        
        // Redirect based on role
        if (selectedRole === 'partner') {
          window.location.href = '/partner-profile-setup';
        } else {
          window.location.href = '/client-profile-setup';
        }
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold mb-2 text-white">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-gray-400 mb-6">
          {isLogin ? 'Sign in to continue' : 'Join Adonix Fit today'}
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none transition-colors text-white placeholder-gray-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none transition-colors text-white placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>

          {/* Role Selection - only for sign-up */}
          {!isLogin && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">
                I want to:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('member')}
                  className={`p-3 rounded-xl border transition-all ${
                    selectedRole === 'member'
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="block font-semibold text-white">Hire a Partner</span>
                  <span className="text-xs text-gray-400">Find fitness pros to train with</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('partner')}
                  className={`p-3 rounded-xl border transition-all ${
                    selectedRole === 'partner'
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="block font-semibold text-white">Offer Services</span>
                  <span className="text-xs text-gray-400">Become a partner and earn</span>
                </button>
              </div>
            </div>
          )}

          {/* Age gate + Terms & Privacy checkboxes – only for sign‑up */}
          {!isLogin && (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="ageGate"
                  checked={isOver18}
                  onChange={(e) => setIsOver18(e.target.checked)}
                  className="mt-1 w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-red-500"
                />
                <label htmlFor="ageGate" className="text-sm text-gray-300">
                  I am 18 years or older
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-red-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-300">
                  I have read and agree to the{' '}
                  <a href="/terms" target="_blank" className="text-red-500 hover:underline">Terms of Service</a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" className="text-red-500 hover:underline">Privacy Policy</a>.
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!isLogin && (!isOver18 || !acceptedTerms || !selectedRole))}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 rounded-xl font-semibold transition-all transform hover:scale-105 text-white"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-400 hover:text-white text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}