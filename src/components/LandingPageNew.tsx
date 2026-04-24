import React, { useState } from 'react';
import { X } from 'lucide-react';
import AuthModal from './AuthModal';

// Footer Info Modal
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

const LandingPageNew = () => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
      <div className="flex flex-col min-h-screen bg-black text-white font-sans overflow-x-hidden">
        
        {/* HEADER - SAME AS OTHER PAGES */}
        <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/adonixlogo.png" 
                  alt="Adonix Logo" 
                  className="h-10 w-auto"
                />
                <span className="text-xl font-bold text-white">ADONIX</span>
                <span className="text-xs text-gray-400">Social Fitness, Elevated</span>
              </div>
              {/* LOGIN/SETUP BUTTON IN HEADER - OPENS AUTH MODAL */}
              <div 
                onClick={() => setShowAuthModal(true)}
                className="text-xs tracking-widest text-white font-medium hover:text-orange-400 cursor-pointer transition-colors"
              >
                LOGIN/SETUP
              </div>
            </div>
          </div>
        </div>

        {/* FULL WIDTH LINE AT THE TOP (below header) */}
        <div className="w-full h-px bg-white/10"></div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col relative">
          
          {/* GIRL IMAGE */}
          <div className="absolute right-[-45px] top-0 h-full w-[80%] flex items-center justify-end z-0">
            <img 
              src="/girl4.png" 
              alt="Social Fitness Member" 
              className="w-[100%] h-auto object-contain brightness-110 contrast-125"
            />
          </div>

          {/* TEXT CONTENT */}
          <div className="relative z-10 flex flex-col justify-center min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-8 md:px-12 lg:px-16 w-full">
              
              {/* LOGO (keeping your existing logo) */}
              <div className="mb-6">
                <img 
                  src="/adonixlogo.png" 
                  alt="Adonix Logo" 
                  className="w-[53%] md:w-80 h-auto"
                />
              </div>

              {/* ADONIX TEXT */}
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                ADONIX
              </h1>
              
              {/* SOCIAL FITNESS */}
              <p className="text-sm tracking-[0.2em] text-white font-bold uppercase mt-1">
                SOCIAL FITNESS · ELEVATED
              </p>
              
              {/* DESCRIPTION - CENTERED */}
              <p className="text-[9px] tracking-[0.15em] text-white font-bold uppercase mt-4 text-center mx-auto">
                A PRIVATE, CURATED FITNESS ENVIRONMENT DESIGNED FOR THOSE WHO DEMAND ELITE STANDARDS
              </p>
              
              {/* QUOTE TEXT */}
              <div className="mt-6 bg-black/15 p-6 rounded-lg w-full">
                <p className="text-white text-[16px] italic font-bold text-center leading-snug">
                  The new standard for social fitness.
                </p>
                <p className="text-white text-[16px] italic font-bold text-center leading-snug mt-1">
                  Designed for those who are as engaging in
                </p>
                <p className="text-white text-[16px] italic font-bold text-center leading-snug mt-1">
                  person as they are driven in the moment.
                </p>
              </div>

              {/* EXPLORE CURATION BUTTON - OPENS AUTH MODAL */}
              <div className="mt-20 flex justify-center">
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="px-10 py-3 text-base bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold tracking-wide transition-all transform hover:scale-105 active:scale-95"
                >
                  EXPLORE CURATION
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="border-t border-white/10 bg-black/80 w-full px-8 md:px-12 lg:px-16 py-4 relative z-10">
          <div className="max-w-7xl mx-auto">
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
            <div className="text-center text-xs text-gray-600 mt-2">
              Adonix is a social fitness network — not a professional service. Meet only at verified public locations. GPS check-in required.
            </div>
          </div>
        </footer>

        {/* Modals */}
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
      </div>

      {/* AUTH MODAL - Role Selection (I WANT TO SWEAT / I WANT TO MAKE PEOPLE SWEAT) */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default LandingPageNew;