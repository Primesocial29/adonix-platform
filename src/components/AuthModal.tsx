import React from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithApple } = useAuth();
  if (!isOpen) return null;

  // Apple auth is implemented but intentionally hidden until ready to launch.
  const showAppleAuth = false;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl max-w-lg w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔥</div>
          <h2 className="text-3xl font-bold text-white mb-2">Join Adonix Fit</h2>
          <p className="text-lg text-gray-300">Sign in to get started</p>
        </div>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => signInWithGoogle()}
            className="w-full py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-semibold flex items-center justify-center gap-3 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          {showAppleAuth && (
            <button
              onClick={() => signInWithApple()}
              className="w-full py-3 bg-black border border-white/20 hover:bg-gray-900 text-white rounded-xl font-semibold flex items-center justify-center gap-3 transition"
            >
              Apple
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center mt-6">
          After signing in, you'll verify your age and phone number before continuing.
        </p>
      </div>
    </div>
  );
}
