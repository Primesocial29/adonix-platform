import { Home, Calendar, Users, UserCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="relative min-h-screen w-full bg-[#000000] text-white font-sans overflow-hidden flex flex-col">
      
      {/* 1. ELITE HEADER OVERLAY */}
      <header className="absolute top-0 left-0 w-full z-50 flex justify-between items-center px-10 py-8">
        {/* Left Side: Sign In Action */}
        <button 
          onClick={onSignIn}
          className="text-xs font-bold tracking-[0.3em] hover:text-[#DC143C] transition-all uppercase opacity-80"
        >
          Login / Setup
        </button>
        
        {/* Right Side: Adonix Logo */}
        <div className="flex items-center">
          <img 
            src="/adonixlogo.png" 
            alt="Adonix Logo" 
            className="h-12 md:h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(220,20,60,0.3)]"
          />
        </div>
      </header>

      {/* 2. MAIN SPLIT SECTION */}
      <main className="flex-grow flex flex-col md:flex-row w-full h-screen">
        
        {/* LEFT PANEL: Branding & CTA */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-10 md:px-24 z-20 bg-[#000000] relative">
          
          {/* THE CRIMSON HALO (Ambient Radial Glow) */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[150%] h-[150%] pointer-events-none opacity-20 z-0"
               style={{ backgroundImage: 'radial-gradient(circle at center, #DC143C 0%, transparent 65%)' }} />

          <div className="z-10">
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tighter uppercase leading-[0.85]">
              Authenticity<br/>Excellence.
            </h1>
            
            <p className="text-xl md:text-2xl font-light mb-12 leading-relaxed text-gray-400 max-w-md">
              Curated Meetups.<br />
              High-Standard<br />
              Community.
            </p>

            <button 
              onClick={onGetStarted}
              className="w-full md:w-80 py-5 rounded-full bg-gradient-to-r from-[#FF4500] to-[#DC143C] text-white font-bold text-lg uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(220,20,60,0.3)] hover:scale-105 transition-transform duration-500"
            >
              Explore Curation
            </button>
            <p className="text-[10px] text-gray-600 mt-6 tracking-[0.2em] uppercase">18+ Only • ID on File Members</p>
          </div>
        </div>

        {/* RIGHT PANEL: The Background Image */}
        <div className="w-full md:w-1/2 relative h-[50vh] md:h-auto overflow-hidden border-l border-white/5">
          <img 
            src="/girl_image_backgroundinterface.jpg" 
            alt="Adonix Member" 
            className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.35] contrast-125 scale-105"
          />
          
          {/* Right-Side Verification Overlay */}
          <div className="absolute top-1/2 right-12 -translate-y-1/2 text-right max-w-[280px] z-30">
            <p className="text-sm md:text-base font-light tracking-[0.15em] leading-loose opacity-60 border-r-4 border-[#DC143C] pr-6 py-2">
              Verified Public Meetups<br/>Real-World Connections.
            </p>
          </div>
          
          {/* Blending Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#000000] via-transparent to-transparent opacity-60 hidden md:block" />
        </div>
      </main>

      {/* 3. NAVIGATION BAR (Footer) */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#000000]/95 backdrop-blur-2xl border-t border-white/5 py-6 px-12 flex justify-around items-center z-50">
        <div className="flex flex-col items-center gap-2 cursor-pointer group">
          <Home className="w-6 h-6 text-[#DC143C]" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-[#DC143C] font-black">Home</span>
        </div>
        <div className="flex flex-col items-center gap-2 cursor-pointer text-gray-600 hover:text-white transition-all">
          <Calendar className="w-6 h-6" />
          <span className="text-[9px] uppercase tracking-[0.3em]">Meetups</span>
        </div>
        <div className="flex flex-col items-center gap-2 cursor-pointer text-gray-600 hover:text-white transition-all">
          <Users className="w-6 h-6" />
          <span className="text-[9px] uppercase tracking-[0.3em]">Partners</span>
        </div>
        <div className="flex flex-col items-center gap-2 cursor-pointer text-gray-600 hover:text-white transition-all">
          <UserCircle className="w-6 h-6" />
          <span className="text-[9px] uppercase tracking-[0.3em]">Profile</span>
        </div>
      </nav>

      {/* 4. FOOTER CREDITS */}
      <footer className="absolute bottom-24 w-full px-10 pointer-events-none opacity-20">
         <p className="text-[8px] text-center tracking-[0.1em] text-gray-500 uppercase">
           © 2026 Prime Social LLC • Adonix is a private social network
         </p>
      </footer>
    </div>
  );
}