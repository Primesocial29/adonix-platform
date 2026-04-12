import { useState } from 'react';
import { Dumbbell, Users, Camera, Shield } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-red-500" strokeWidth={2.5} />
            <span className="text-2xl font-bold tracking-tight">Hot Buddies</span>
          </div>
          <button
            onClick={onSignIn}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all"
          >
            Sign In
          </button>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                Fitness Partner
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              Connect with verified fitness enthusiasts who match your energy, goals, and vibe.
              Train together. Push harder. Achieve more.
            </p>
            <button
              onClick={onGetStarted}
              className="px-12 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-2xl"
            >
              Get Started
            </button>
            <p className="text-sm text-gray-500 mt-4">18+ Only • ID on File Members</p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-black to-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard
              icon={<Camera className="w-12 h-12" />}
              title="Live Verification"
              description="All members verify with live camera photos. No catfishing, just real people."
            />
            <FeatureCard
              icon={<Shield className="w-12 h-12" />}
              title="Age Verified"
              description="Secure 18+ age verification ensures a safe, adult community."
            />
            <FeatureCard
              icon={<Users className="w-12 h-12" />}
              title="Real Connections"
              description="Match with fitness partners who share your goals and lifestyle."
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Level Up?</h2>
          <p className="text-xl text-gray-400 mb-10">
            Join the most exclusive fitness partner marketplace.
          </p>
          <button
            onClick={onGetStarted}
            className="px-12 py-4 bg-white text-black hover:bg-gray-200 rounded-full text-lg font-semibold transition-all transform hover:scale-105"
          >
            Create Your Profile
          </button>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          © 2024 Hot Buddies. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/50 transition-all">
      <div className="text-red-500 mb-4">{icon}</div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
