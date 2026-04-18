import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('credentials');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await signIn(email, password);
        onClose();
      } else {
        // Sign up with selected role
        const finalUsername = username || email.split('@')[0];
        const birthDate = new Date().toISOString();
        await signUp(email, password, selectedRole!, finalUsername, birthDate);
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('welcome');
    setSelectedRole(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-white/10">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            {step === 'welcome' ? 'Join Adonix' : (isLogin ? 'LOGIN' : 'CREATE ACCOUNT')}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {step === 'welcome' ? (
          <div className="p-6 space-y-4">
            <p className="text-center text-gray-400 mb-4">Choose your path:</p>
            
            {/* I Want to Sweat - Client/Member */}
            <button
              onClick={() => handleRoleSelect('member')}
              className="w-full p-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">🔥</span>
                <div>
                  <h3 className="text-xl font-bold text-white">I Want to Sweat</h3>
                  <p className="text-sm text-green-200">Find fitness partners and get moving</p>
                </div>
              </div>
            </button>
            
            {/* I Want to Make People Sweat - Partner/Trainer */}
            <button
              onClick={() => handleRoleSelect('partner')}
              className="w-full p-6 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">💪</span>
                <div>
                  <h3 className="text-xl font-bold text-white">I Want to Make People Sweat</h3>
                  <p className="text-sm text-orange-200">Become a partner and share your expertise</p>
                </div>
              </div>
            </button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-gray-900 text-gray-500">Already have an account?</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setIsLogin(true);
                setStep('credentials');
              }}
              className="w-full py-3 border border-white/20 rounded-xl text-white hover:bg-white/5 transition"
            >
              Login Instead
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-red-500 focus:outline-none"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-red-500 focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-red-500 focus:outline-none"
                required
              />
            </div>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg font-semibold hover:scale-105 transition"
            >
              {loading ? 'Loading...' : (isLogin ? 'LOGIN' : 'SIGN UP')}
            </button>
            
            <button
              type="button"
              onClick={handleBack}
              className="w-full text-center text-sm text-gray-400 hover:text-white"
            >
              ← Back to role selection
            </button>
          </form>
        )}
      </div>
    </div>
  );
}