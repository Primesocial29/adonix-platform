import React from 'react';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  const handleRoleSelect = (role: 'member' | 'partner') => {
    onClose();
    if (role === 'partner') {
      window.location.href = '/partner-setup';
    } else {
      window.location.href = '/client-setup';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl max-w-lg w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔥</div>
          <h2 className="text-3xl font-bold text-white mb-2">Join Adonix Fit</h2>
          <p className="text-lg text-gray-300">Choose your path</p>
        </div>
        <div className="flex flex-col gap-4">
          <button onClick={() => handleRoleSelect('member')} className="group p-6 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-red-500 hover:bg-red-500/10 transition-all text-center w-full">
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💸</div>
            <div className="font-bold text-xl text-white mb-2">I WANT TO SWEAT</div>
            <div className="text-sm font-medium text-gray-300 bg-white/10 py-1 px-2 rounded-full inline-block">I will pay for sessions</div>
          </button>
          <button onClick={() => handleRoleSelect('partner')} className="group p-6 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-red-500 hover:bg-red-500/10 transition-all text-center w-full">
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💰</div>
            <div className="font-bold text-xl text-white mb-2">I WANT TO MAKE PEOPLE SWEAT</div>
            <div className="text-sm font-medium text-gray-300 bg-white/10 py-1 px-2 rounded-full inline-block">I will earn money</div>
          </button>
        </div>
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">Already have an account? <button onClick={() => window.location.href = '/login'} className="text-red-500 hover:text-red-400">Sign in</button></p>
        </div>
      </div>
    </div>
  );
}