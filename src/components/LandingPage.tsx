import { Camera, Shield, Users } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Fixed Header */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-5">
        <div />
        <div className="flex items-center gap-6">
          <button
            onClick={onSignIn}
            className="text-sm font-medium tracking-widest uppercase text-gray-300 hover:text-white transition-colors duration-300"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="text-sm font-medium tracking-widest uppercase px-6 py-2.5 border border-white/30 hover:border-white hover:bg-white hover:text-black transition-all duration-300"
          >
            Join
          </button>
        </div>
        {/* Logo upper-right */}
        <div className="absolute top-4 right-8">
          <img
            src="/.bolt/adonixlogo.png"
            alt="Adonix"
            className="h-10 w-auto object-contain"
          />
        </div>
      </nav>

      {/* Split-Panel Hero */}
      <div className="flex min-h-screen">
        {/* Left Panel */}
        <div className="relative flex-1 flex flex-col justify-center px-16 py-24 bg-black overflow-hidden">
          {/* Crimson Halo Radial Glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '50%',
              left: '40%',
              transform: 'translate(-50%, -50%)',
              width: '700px',
              height: '700px',
              background: 'radial-gradient(ellipse at center, rgba(180,0,0,0.22) 0%, rgba(120,0,0,0.10) 40%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: '50%',
              left: '40%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(ellipse at center, rgba(220,20,20,0.12) 0%, transparent 65%)',
              borderRadius: '50%',
            }}
          />

          <div className="relative z-10 max-w-xl">
            {/* Eyebrow */}
            <p className="text-xs font-medium tracking-[0.35em] uppercase text-red-500 mb-8">
              Premium Social Fitness
            </p>

            {/* Main Headline */}
            <h1
              className="text-white leading-none mb-8"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(3rem, 5.5vw, 5.5rem)',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                lineHeight: 1.08,
              }}
            >
              AUTHENTICITY
              <br />
              <span
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontStyle: 'italic',
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                EXCELLENCE
              </span>
            </h1>

            <div className="w-16 h-px bg-red-600 mb-8" />

            <p className="text-gray-400 text-base leading-relaxed mb-12 max-w-sm">
              Connect with verified fitness professionals who match your energy, goals, and ambition.
            </p>

            <button
              onClick={onGetStarted}
              className="group inline-flex items-center gap-4 px-10 py-4 bg-white text-black text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:bg-red-600 hover:text-white"
            >
              Get Started
              <span className="w-6 h-px bg-current transition-all duration-300 group-hover:w-10" />
            </button>

            <p className="text-xs text-gray-600 mt-5 tracking-wider uppercase">18+ Only &bull; ID Verified Members</p>
          </div>

          {/* Feature pills */}
          <div className="relative z-10 flex gap-6 mt-16">
            {[
              { icon: <Camera className="w-4 h-4" />, label: 'Live Verified' },
              { icon: <Shield className="w-4 h-4" />, label: 'Age Verified' },
              { icon: <Users className="w-4 h-4" />, label: 'Real Connections' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-gray-500 tracking-wider uppercase">
                <span className="text-red-600">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — hero image */}
        <div className="relative w-[42%] flex-shrink-0 overflow-hidden">
          <img
            src="/.bolt/girl_image_backgroundinterface.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: 'grayscale(100%) brightness(0.45)',
            }}
          />
          {/* Subtle left-edge fade into black */}
          <div
            className="absolute inset-y-0 left-0 w-32 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, #000000, transparent)',
            }}
          />
          {/* Bottom fade */}
          <div
            className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, #000000, transparent)',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <p className="text-xs text-gray-700">
            &copy; 2026 Prime Social LLC. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-6 text-xs text-gray-600">
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/safety" className="hover:text-white transition-colors">Safety</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
