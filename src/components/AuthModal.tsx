import { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UserRole = 'member' | 'partner' | null;
type Step = 'welcome' | 'credentials';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isOver18, setIsOver18] = useState(false);

  if (!isOpen) return null;

  // Username validation
  const validateUsername = (value: string) => {
    if (!value) return '';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username cannot exceed 20 characters';
    if (!/^[a-zA-Z0-9_.]+$/.test(value)) return 'Use only letters, numbers, underscore (_), and period (.)';
    return '';
  };

  // Check username availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!username || username.length < 3 || validateUsername(username)) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.toLowerCase())
          .maybeSingle();

        if (error) throw error;
        setUsernameAvailable(!data);
        setUsernameError('');
      } catch (err) {
        console.error('Error checking username:', err);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeout = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  const handleRoleSelect = (role: 'member' | 'partner') => {
    setSelectedRole(role);
    setStep('credentials');
  };

  const handleBack = () => {
    if (isLogin) {
      setIsLogin(false);
      setStep('welcome');
      setError('');
      setEmail('');
      setPassword('');
      setUsername('');
    } else {
      setStep('welcome');
      setSelectedRole(null);
      setError('');
    }
  };

  const handleSignInClick = () => {
    setIsLogin(true);
    setStep('credentials');
    setError('');
    setSelectedRole(null);
  };

  const handleSignUpClick = () => {
    setIsLogin(false);
    setStep('welcome');
    setError('');
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setUsername('');
    setAcceptedTerms(false);
    setIsOver18(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      try {
        await signIn(email, password);
        onClose();
        window.location.href = '/dashboard';
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Sign-up validations
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
      setError('Something went wrong. Please go back and select a role.');
      setLoading(false);
      return;
    }
    if (!username) {
      setError('Please choose a username.');
      setLoading(false);
      return;
    }
    
    const usernameValidationError = validateUsername(username);
    if (usernameValidationError) {
      setError(usernameValidationError);
      setLoading(false);
      return;
    }
    
    if (!usernameAvailable) {
      setError('This username is already taken. Please choose another.');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, selectedRole, username.toLowerCase());
      onClose();
      
      if (selectedRole === 'partner') {
        window.location.href = '/partner-setup';
      } else {
        window.location.href = '/client-setup';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  // ========== WELCOME STEP ==========
  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl max-w-lg w-full p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Let's get real.</h2>
            <p className="text-xl text-gray-300">What brings that body here?</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleRoleSelect('member')}
              className="group p-6 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-red-500 hover:bg-red-500/10 transition-all text-center"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🔥</div>
              <div className="font-bold text-xl text-white mb-2">I Want to Sweat</div>
              <div className="text-sm font-medium text-gray-300 bg-white/10 py-1 px-2 rounded-full inline-block">
                💸 I will pay for sessions
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('partner')}
              className="group p-6 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-red-500 hover:bg-red-500/10 transition-all text-center"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💰</div>
              <div className="font-bold text-xl text-white mb-2">I Make People Sweat</div>
              <div className="text-sm font-medium text-gray-300 bg-white/10 py-1 px-2 rounded-full inline-block">
                💵 I will earn money
              </div>
            </button>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={handleSignInClick}
              className="text-base font-semibold text-gray-300 hover:text-white transition-colors bg-white/5 px-6 py-2 rounded-full hover:bg-white/10"
            >
              Already have an account? <span className="text-red-500">Sign in →</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== CREDENTIALS STEP ==========
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <button
          onClick={handleBack}
          className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="text-center mb-6">
          {!isLogin && (
            <>
              <div className="text-4xl mb-2">{selectedRole === 'partner' ? '💰' : '🔥'}</div>
              <h2 className="text-2xl font-bold text-white">
                {selectedRole === 'partner' ? 'I Make People Sweat' : 'I Want to Sweat'}
              </h2>
              <p className="text-sm font-medium text-gray-300 mt-2 bg-white/10 py-1 px-3 rounded-full inline-block">
                {selectedRole === 'partner' ? '💵 You will earn money' : '💸 You will pay for sessions'}
              </p>
            </>
          )}
          {isLogin && (
            <>
              <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
              <p className="text-sm text-gray-400 mt-1">Sign in to continue</p>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username field - only for sign-up */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className={`w-full pl-7 pr-10 py-3 bg-white/5 border rounded-xl focus:outline-none text-white placeholder-gray-500 ${
                    usernameAvailable === true
                      ? 'border-green-500 focus:border-green-500'
                      : usernameAvailable === false
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-white/10 focus:border-red-500'
                  }`}
                  placeholder="jess_fit"
                />
                {checkingUsername && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                  </div>
                )}
                {usernameAvailable === true && !checkingUsername && username.length >= 3 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                )}
                {usernameAvailable === false && !checkingUsername && username.length >= 3 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                3-20 characters • letters, numbers, underscore (_), period (.) only
              </p>
              {usernameAvailable === false && (
                <p className="text-xs text-red-400 mt-1">Username already taken</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>

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
            disabled={loading || (!isLogin && (!isOver18 || !acceptedTerms || !usernameAvailable))}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 rounded-xl font-semibold transition-all transform hover:scale-105 text-white"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          {isLogin && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleSignUpClick}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Don't have an account? <span className="text-red-500">Sign up</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}