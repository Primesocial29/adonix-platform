import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import PublicHome from './components/PublicHome';
import AdminDashboard from './components/AdminDashboard';
import PartnerProfileSetup from './components/PartnerProfileSetup';
import ClientOnboarding from './components/ClientOnboarding';
import PartnerDashboard from './components/PartnerDashboard';
import ClientDashboard from './components/ClientDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import ContactPage from './components/ContactPage';
import Settings from './components/Settings';
import AccessibilityPage from './components/AccessibilityPage';
import BrowsePartners from './components/BrowsePartners';
import SafetyPage from './components/SafetyPage';
import CompleteProfile from './components/CompleteProfile';
import LoginPage from './components/LoginPage';
import LandingPageNew from './components/LandingPageNew';
import { useAuth } from './hooks/useAuth';

// Terms Modal for CHECKBOXES - requires scroll-to-accept
function CheckboxTermsModal({ isOpen, onClose, onAccept, title, content }: { 
  isOpen: boolean; onClose: () => void; onAccept: () => void; title: string; content: string 
}) {
  const [canAccept, setCanAccept] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCanAccept(false);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, [isOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
    if (isAtBottom && !canAccept) {
      setCanAccept(true);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 text-gray-300 space-y-4"
        >
          <div className="whitespace-pre-wrap">{content}</div>
          <div className="h-10 text-center text-xs text-gray-500 pt-4">
            {!canAccept && "▼ Scroll to the bottom to accept ▼"}
          </div>
        </div>
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={onAccept}
            disabled={!canAccept}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
              canAccept 
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple Modal for FOOTER - view only, no agreement needed
function FooterInfoModal({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: string }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-white/10">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 text-gray-300 space-y-4 whitespace-pre-wrap text-sm">
          {content}
        </div>
        
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Confirm Leave Modal
function ConfirmLeaveModal({ isOpen, onClose, onConfirm, message }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; message: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
        <div className="text-center mb-4">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-white">Leave this page?</h2>
          <p className="text-gray-400 mt-2">{message}</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl">Leave</button>
        </div>
      </div>
    </div>
  );
}

// Role Selection Component (Original Landing Page)
function RoleSelection() {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const handleRoleSelect = (role: 'client' | 'partner') => {
    if (role === 'client') {
      window.location.href = '/client-setup';
    } else {
      window.location.href = '/partner-setup';
    }
  };

  const termsContent = `ADONIX FIT - TERMS OF SERVICE
Effective: April 17, 2026 | Prime Social LLC

1. ACCEPTANCE
Adonix Fit is a fitness platform operated by Prime Social LLC. It is NOT for dating or escort services. Solicitation results in a permanent ban.

2. ELIGIBILITY & SAFETY WARRANTY
You must be 18+. You REPRESENT AND WARRANT that you have NO felony convictions, NO history of sexual misconduct or violence, and are NOT a registered sex offender.

3. BIPA COMPLIANCE
Facial estimation data is deleted immediately after verification. Separate written consent required.

4. ZERO-TOLERANCE
Immediate permanent ban for: Harassment, Stalking, Non-Consensual Photos, Nudity, AI Impersonation, External Payments.

5. PUBLIC ONLY
Meetings in private residences, hotels, or any non-public location are a material breach.

6. ASSUMPTION OF RISK
YOU VOLUNTARILY ASSUME ALL RISKS OF PHYSICAL ACTIVITY.

7. LIMITATION OF LIABILITY
TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED $100.

8. ARBITRATION & CLASS ACTION WAIVER
Binding arbitration in Orange County, FL. CLASS ACTION WAIVER INCLUDED.

9. CONTACT
primesocial@primesocial.xyz | Prime Social LLC | Orange County, Florida`;

  const privacyContent = `ADONIX FIT - PRIVACY POLICY
Effective: April 17, 2026 | Prime Social LLC

1. DATA COLLECTION
Prime Social LLC collects identifiers (email, username, IP address, device ID) and fitness data. Age verification data is deleted immediately after 18+ confirmation.

2. LOCATION DATA
GPS is used only for session check-in verification and SOS feature. Location data is not retained after the session ends.

3. BIOMETRICS
Per BIPA, facial estimation data is processed and purged instantly. Separate written consent required.

4. AI MODERATION
AI scans user-generated content for safety violations. Human review available upon request.

5. NO SALE OF DATA
Prime Social LLC does not sell personal data to third parties.

6. YOUR RIGHTS
Per CCPA/CPRA, Florida SB 1722, you have the right to access, correct, delete, and port your data.

7. CONTACT
primesocial@primesocial.xyz`;

  const safetyContent = `ADONIX FIT - SAFETY GUIDELINES

1. Public Locations Only - All meetups must occur at verified public gyms, parks, or recreation centers.

2. Trust Your Instincts - If something feels off, don't go.

3. GPS Check-In Required - You must verify your location within 0.75 miles of the agreed venue.

4. Two-Person Only - No extra friends, family, or spectators permitted.

5. Report Concerns Immediately - We review all reports within 24 hours.

Zero-Tolerance Policy: Private location requests, harassment, or unsafe behavior = permanent ban.`;

  return (
    <>
      <div className="min-h-screen bg-black text-white flex flex-col">
        <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <img 
                src="/adonixlogo.png" 
                alt="Adonix Logo" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-white">ADONIX</span>
              <span className="text-xs text-gray-400">Social Fitness, Elevated</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🔥</div>
            <h1 className="text-3xl font-bold text-white">Welcome to Adonix Fit</h1>
            <p className="text-lg text-gray-300 mt-1">Choose your path</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => handleRoleSelect('client')}
              className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-red-500/50 transition-all group hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">💸</div>
                <h2 className="text-2xl font-bold text-white mb-2">I WANT TO SWEAT</h2>
                <p className="text-gray-400 mb-4">You will pay for sessions</p>
                <div className="text-sm text-gray-500">Find fitness partners near you</div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('partner')}
              className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-red-500/50 transition-all group hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">💰</div>
                <h2 className="text-2xl font-bold text-white mb-2">I WANT TO MAKE PEOPLE SWEAT</h2>
                <p className="text-gray-400 mb-4">You will get paid for sessions</p>
                <div className="text-sm text-gray-500">Become a partner and earn</div>
              </div>
            </button>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-400 mb-3">Already have an account?</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition-all transform hover:scale-105"
            >
              SIGN IN
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/80 backdrop-blur-sm mt-8">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-xs text-gray-500">
                © 2026 ADONIX. All rights reserved.
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-xs">
                <button onClick={() => setShowTermsModal(true)} className="text-orange-400 hover:text-orange-300 transition-colors">
                  Terms of Service
                </button>
                <button onClick={() => setShowPrivacyModal(true)} className="text-orange-400 hover:text-orange-300 transition-colors">
                  Privacy Policy
                </button>
                <button onClick={() => setShowSafetyModal(true)} className="text-orange-400 hover:text-orange-300 transition-colors">
                  Safety Guidelines
                </button>
              </div>
            </div>
            <div className="text-center text-xs text-gray-600 mt-4">
              Adonix is a social fitness network — not a professional service. Meet only at verified public locations. GPS check-in required.
            </div>
          </div>
        </footer>
      </div>

      {/* Footer Modals - view only, no agreement needed */}
      <FooterInfoModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Service"
        content={termsContent}
      />

      <FooterInfoModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
        content={privacyContent}
      />

      <FooterInfoModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        title="Safety Guidelines"
        content={safetyContent}
      />
    </>
  );
}

function App() {
  const { user } = useAuth();
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentRoute === '/login') {
    return <LoginPage />;
  }

  // NEW LANDING PAGE AT ROOT - REPLACES ORIGINAL
  if (currentRoute === '/' || currentRoute === '') {
    return <LandingPageNew />;
  }

  // Original landing page is now at /choose-role
  if (currentRoute === '/choose-role') {
    return <RoleSelection />;
  }

  // PARTNER SETUP - Direct to the 6-step flow (no old signup screen)
  if (currentRoute === '/partner-setup') {
    return <PartnerProfileSetup />;
  }

  if (currentRoute === '/client-dashboard') {
    return <ClientDashboard />;
  }

  if (currentRoute === '/browse') {
    return <BrowsePartners />;
  }

  if (currentRoute === '/my-requests') {
    window.location.href = '/client-dashboard';
    return null;
  }

  if (currentRoute === '/dashboard') {
    return <PublicHome />;
  }

  if (currentRoute === '/admin-view') {
    return <AdminDashboard />;
  }

  if (currentRoute === '/partner-dashboard') {
    return <PartnerDashboard />;
  }

  if (currentRoute === '/trainer-dashboard') {
    return <TrainerDashboard />;
  }

  if (currentRoute === '/client-setup') {
    return <ClientOnboarding onComplete={() => {
      window.location.href = '/client-dashboard';
    }} />;
  }

  if (currentRoute === '/complete-profile') {
    window.location.href = '/setup';
    return null;
  }

  if (currentRoute === '/settings') {
    return <Settings />;
  }

  if (currentRoute === '/terms') {
    return <TermsPage />;
  }
  if (currentRoute === '/privacy') {
    return <PrivacyPage />;
  }
  if (currentRoute === '/contact') {
    return <ContactPage />;
  }

  if (currentRoute === '/accessibility') {
    return <AccessibilityPage />;
  }

  if (currentRoute === '/safety') {
    return <SafetyPage />;
  }

  // Fallback - show new landing page
  return <LandingPageNew />;
}

export default App;