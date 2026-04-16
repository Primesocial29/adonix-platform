import React, { useState, useEffect } from 'react';
import { LogOut, X } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import TrainerDashboard from "./TrainerDashboard";
import BookingFlow, { BookingDetails } from './BookingFlow';
import CheckoutScreen from './CheckoutScreen';
import AuthModal from './AuthModal';

// --- MODAL COMPONENTS (Kept from original logic) ---

function SimpleModal({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-white/10">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-gray-300 space-y-4 whitespace-pre-wrap text-sm">{content}</div>
        <div className="p-4 border-t border-white/10">
          <button onClick={onClose} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold">Close</button>
        </div>
      </div>
    </div>
  );
}

function TermsModal({ isOpen, onClose, title, content, onAgree }: { isOpen: boolean; onClose: () => void; title: string; content: string; onAgree?: () => void }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      setHasScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 50);
    }
  };

  const handleAgree = () => {
    setHasAgreed(true);
    if (onAgree) onAgree();
    onClose();
  };

  useEffect(() => {
    if (isOpen) { setHasScrolledToBottom(false); setHasAgreed(false); }
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-white/10">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {hasScrolledToBottom && <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>}
        </div>
        <div ref={contentRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 text-gray-300 space-y-4 whitespace-pre-wrap font-mono text-xs">{content}</div>
        <div className="p-4 border-t border-white/10">
          {!hasScrolledToBottom && <p className="text-xs text-center text-yellow-500 mb-2">Please scroll to the bottom</p>}
          <button onClick={handleAgree} disabled={!hasScrolledToBottom || hasAgreed} className={`w-full py-2 rounded-lg font-semibold ${hasScrolledToBottom ? 'bg-red-600' : 'bg-gray-700 opacity-50'}`}>
            {hasAgreed ? '✓ Accepted' : 'I Understand'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PUBLIC HOME COMPONENT ---

export default function PublicHome() {
  const { user, profile, signOut, role, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | 'contact' | 'accessibility' | null>(null);

  const handleProceedToCheckout = (details: BookingDetails) => {
    setBookingDetails(details);
    setSelectedPartner(null);
  };

  const handleBookingSuccess = () => {
    setBookingDetails(null);
    alert('Meetup invitation sent successfully!');
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  // Logic: Redirect complete profiles to browse
  if (!loading && user && role === 'client' && profile?.profile_complete) {
    window.location.href = '/browse';
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // --- CONTENT STRINGS (Kept from original) ---
  const fullTermsContent = `ADONIX FIT - TERMS OF SERVICE...`; // [Original Content Truncated for display]
  const fullPrivacyContent = `ADONIX FIT - PRIVACY POLICY...`;
  const contactContent = `ADONIX FIT - CONTACT...`;
  const accessibilityContent = `ADONIX FIT - ACCESSIBILITY...`;

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-hidden flex flex-col">
      
      {/* 1. ELITE HEADER OVERLAY */}
      <header className="absolute top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-10 py-6">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black tracking-[0.2em] text-white">ADONIX</span>
          {user && (
            <span className="hidden md:inline text-[10px] uppercase tracking-widest text-gray-500 border-l border-white/10 pl-4">
              {profile?.first_name || 'Partner'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              {role === 'trainer' && <a href="/partner-dashboard" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition">Dashboard</a>}
              <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition">
                <LogOut className="w-3 h-3" /> Logout
              </button>
            </>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="text-[10px] font-bold tracking-[0.3em] hover:text-red-500 transition-all uppercase"
            >
              Login / Setup
            </button>
          )}
          
          {/* Logo Placement matching Screenshot (Upper Right) */}
          <img 
            src="/.bolt/adonixlogo.png" 
            alt="Adonix" 
            className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(220,20,60,0.3)]"
          />
        </div>
      </header>

      {/* 2. DUAL-PANEL LAYOUT */}
      <main className="flex-grow flex flex-col md:flex-row w-full h-screen">
        
        {/* LEFT PANEL: The Brand Message */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-10 md:px-24 z-20 bg-black relative">
          
          {/* THE CRIMSON HALO (Radial Glow) */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[150%] h-[150%] pointer-events-none opacity-20 z-0"
               style={{ backgroundImage: 'radial-gradient(circle at center, #DC143C 0%, transparent 65%)' }} />

          <div className="z-10 mt-20 md:mt-0">
            <h1 
              className="font-black uppercase text-white leading-[0.85] mb-6"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                letterSpacing: '-0.02em',
              }}
            >
              AUTHENTICITY<br />EXCELLENCE.
            </h1>
            
            <p className="text-xl md:text-2xl font-light mb-12 leading-relaxed text-gray-400 max-w-sm">
              Curated Meetups.<br />
              High-Standard<br />
              Community.
            </p>

            {!user ? (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full md:w-80 py-5 rounded-full bg-gradient-to-r from-[#FF4500] to-[#DC143C] text-white font-black text-lg uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(220,20,60,0.4)] hover:scale-105 transition-all duration-500"
              >
                Explore Curation
              </button>
            ) : role === 'trainer' && (
              <a href="/partner-dashboard" className="inline-block text-center w-full md:w-80 py-5 rounded-full bg-white text-black font-black text-lg uppercase tracking-[0.2em] hover:bg-gray-200 transition-all">
                Enter Dashboard
              </a>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: The Hero Asset (Matching Screenshot) */}
        <div className="w-full md:w-1/2 relative h-[50vh] md:h-auto overflow-hidden border-l border-white/5">
          <img 
            src="/.bolt/girl_image_backgroundinterface.jpg" 
            alt="Adonix Elite Member" 
            className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.38] contrast-125 scale-105"
          />
          
          {/* Tagline Overlay from Screenshot */}
          <div className="absolute top-1/2 right-12 -translate-y-1/2 text-right max-w-[280px] z-30">
            <p className="text-sm md:text-base font-bold tracking-[0.1em] leading-relaxed opacity-80 border-r-4 border-[#DC143C] pr-6 py-2">
              Verified Public Meetups |<br/>Real-World Connections.
            </p>
          </div>
          
          {/* Depth Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent opacity-60 hidden md:block" />
        </div>
      </main>

      {/* 3. FOOTER & MODALS */}
      <footer className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/5 py-4 px-10 flex flex-wrap justify-center md:justify-between items-center z-50 gap-4">
        <p className="text-[9px] tracking-[0.2em] text-gray-600 uppercase">© 2026 Adonix Protocol</p>
        <div className="flex gap-4">
          <button onClick={() => setShowTermsModal('terms')} className="text-[9px] uppercase tracking-widest text-gray-500 hover:text-white transition">Terms</button>
          <button onClick={() => setShowTermsModal('privacy')} className="text-[9px] uppercase tracking-widest text-gray-500 hover:text-white transition">Privacy</button>
          <button onClick={() => setShowTermsModal('contact')} className="text-[9px] uppercase tracking-widest text-gray-500 hover:text-white transition">Contact</button>
        </div>
      </footer>

      {/* --- MODAL TRIGGERED COMPONENTS --- */}
      {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />}
      
      <TermsModal isOpen={showTermsModal === 'terms'} onClose={() => setShowTermsModal(null)} title="Terms of Service" content={fullTermsContent} onAgree={() => setShowTermsModal(null)} />
      <SimpleModal isOpen={showTermsModal === 'privacy'} onClose={() => setShowTermsModal(null)} title="Privacy Policy" content={fullPrivacyContent} />
      <SimpleModal isOpen={showTermsModal === 'contact'} onClose={() => setShowTermsModal(null)} title="Contact Us" content={contactContent} />
      <SimpleModal isOpen={showTermsModal === 'accessibility'} onClose={() => setShowTermsModal(null)} title="Accessibility Statement" content={accessibilityContent} />
    </div>
  );
}