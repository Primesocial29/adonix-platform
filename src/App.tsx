import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
import { useAuth } from './hooks/useAuth';

// Simple Modal Component for Terms/Privacy/Safety
function SimpleModal({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: string }) {
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

// Simple Role Selection Component
function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<'client' | 'partner' | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const handleRoleSelect = (role: 'client' | 'partner') => {
    setSelectedRole(role);
    // Clear any existing role first, then set new one
    localStorage.removeItem('userRole');
    localStorage.setItem('userRole', role);
    
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
                <button onClick={() => setShowTermsModal(true)} className="text-red-400 hover:text-red-300 transition-colors">
                  Terms of Service
                </button>
                <button onClick={() => setShowPrivacyModal(true)} className="text-red-400 hover:text-red-300 transition-colors">
                  Privacy Policy
                </button>
                <button onClick={() => setShowSafetyModal(true)} className="text-red-400 hover:text-red-300 transition-colors">
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

      {/* Modals */}
      <SimpleModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Service"
        content={termsContent}
      />

      <SimpleModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
        content={privacyContent}
      />

      <SimpleModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        title="Safety Guidelines"
        content={safetyContent}
      />
    </>
  );
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // LOGIN PAGE ROUTE
  if (currentRoute === '/login') {
    return <LoginPage />;
  }

  // ROLE SELECTION - Always show role selection on root and /setup
  // Don't auto-redirect based on saved role - let user choose
  if (currentRoute === '/setup' || currentRoute === '/' || currentRoute === '') {
    return <RoleSelection />;
  }

  // Client Dashboard
  if (currentRoute === '/client-dashboard') {
    return <ClientDashboard />;
  }

  // Browse Partners
  if (currentRoute === '/browse') {
    return <BrowsePartners />;
  }

  // My Requests
  if (currentRoute === '/my-requests') {
    window.location.href = '/client-dashboard';
    return null;
  }

  // Dashboard
  if (currentRoute === '/dashboard') {
    return <PublicHome />;
  }

  // Admin routes
  if (currentRoute === '/admin-view') {
    return <AdminDashboard />;
  }

  // Partner routes
  if (currentRoute === '/partner-setup') {
    return <PartnerProfileSetup onComplete={() => {
      window.location.href = '/partner-dashboard';
    }} />;
  }
  if (currentRoute === '/partner-dashboard') {
    return <PartnerDashboard />;
  }

  // Trainer routes
  if (currentRoute === '/trainer-dashboard') {
    return <TrainerDashboard />;
  }

  // CLIENT 4-STEP ONBOARDING
  if (currentRoute === '/client-setup') {
    return <ClientOnboarding onComplete={() => {
      window.location.href = '/client-dashboard';
    }} />;
  }

  // Complete profile route
  if (currentRoute === '/complete-profile') {
    window.location.href = '/setup';
    return null;
  }

  // Settings route
  if (currentRoute === '/settings') {
    return <Settings />;
  }

  // Legal pages
  if (currentRoute === '/terms') {
    return <TermsPage />;
  }
  if (currentRoute === '/privacy') {
    return <PrivacyPage />;
  }
  if (currentRoute === '/contact') {
    return <ContactPage />;
  }

  // Accessibility page
  if (currentRoute === '/accessibility') {
    return <AccessibilityPage />;
  }

  // Safety page
  if (currentRoute === '/safety') {
    return <SafetyPage />;
  }

  // Default
  return <RoleSelection />;
}

export default App;