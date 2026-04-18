import React, { useState } from 'react';
import { Shield, Zap, Target, ArrowRight } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30">
      <nav className="fixed w-full z-50 px-6 py-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <Zap className="text-white fill-current" />
          </div>
          <span className="text-2xl font-black tracking-tighter italic">ADONIX FIT</span>
        </div>
        <div className="flex items-center gap-8">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="text-sm font-medium hover:text-red-500 transition-colors"
          >
            SIGN IN
          </button>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-6 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-red-600 hover:text-white transition-all duration-300"
          >
            JOIN THE ELITE
          </button>
        </div>
      </nav>

      <main className="relative min-h-screen flex flex-col lg:flex-row">
        <div className="relative w-full lg:w-1/2 min-h-[50vh] lg:min-h-screen flex items-center justify-center overflow-hidden border-r border-white/5">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />

          <div className="relative z-10 p-12 max-w-xl">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-none mb-6">
              TRAIN <span className="text-red-600">BEYOND</span> LIMITS.
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-md">
              The premier fitness and wellness platform for those who demand excellence. No distractions. Just results.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="group flex items-center gap-2 px-8 py-4 bg-red-600 rounded-full font-bold hover:bg-red-700 transition-all"
              >
                EXPLORE CURATION <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative w-full lg:w-1/2 min-h-[50vh] flex items-center justify-center bg-zinc-950 p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-red-600/50 transition-colors group">
              <Shield className="w-10 h-10 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Verified Safety</h3>
              <p className="text-gray-500 text-sm">Public-only sessions with real-time location verification for your peace of mind.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-red-600/50 transition-colors group">
              <Target className="w-10 h-10 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Elite Partners</h3>
              <p className="text-gray-500 text-sm">Connect with curated wellness professionals dedicated to your specific goals.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-red-600/50 transition-colors group">
              <Zap className="w-10 h-10 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Instant Booking</h3>
              <p className="text-gray-500 text-sm">Seamless Stripe-integrated payments and scheduling within seconds.</p>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
        </div>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
