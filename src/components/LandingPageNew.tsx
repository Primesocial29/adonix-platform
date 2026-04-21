import React, { useState } from 'react';

// Footer Info Modal (same as your existing one)
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

const LandingPage = () => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

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
    <div className="flex flex-row min-h-screen bg-black text-white font-sans">
      
      {/* LEFT COLUMN (50%) - Content + Footer at bottom */}
      <div className="w-1/2 flex flex-col relative">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-8 md:px-12 lg:px-16 py-8">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="/adonixlogo.png" 
              alt="Adonix Logo" 
              className="h-12 w-auto"
            />
          </div>

          {/* Main Content */}
          <div className="max-w-md space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              ADONIX
            </h1>
            
            <p className="text-sm tracking-[0.2em] text-gray-400 uppercase">
              SOCIAL FITNESS · ELEVATED
            </p>
            
            <div className="space-y-2">
              <p className="text-gray-300 text-lg leading-relaxed">
                A PRIVATE, CURATED FITNESS ENVIRONMENT
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                DESIGNED FOR THOSE WHO DEMAND ELITE STANDARDS
              </p>
            </div>
            
            <div className="pt-4 space-y-2">
              <p className="text-gray-400 italic leading-relaxed">
                "The new standard for social fitness.
              </p>
              <p className="text-gray-400 italic leading-relaxed">
                Designed for those who are as engaging in person as they are driven in the moment."
              </p>
            </div>

            {/* EXPLORE CURATION Button */}
            <div className="pt-6">
              <button 
                onClick={() => window.location.href = '/choose-role'}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold tracking-wide transition-all transform hover:scale-105 active:scale-95"
              >
                EXPLORE CURATION
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER - at bottom of left column */}
        <footer className="border-t border-white/10 bg-black/80 px-8 md:px-12 lg:px-16 py-4">
          <div className="max-w-md">
            <div className="flex flex-wrap justify-start gap-4 text-xs">
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
            <div className="text-left text-xs text-gray-600 mt-2">
              <p>© 2026 ADONIX. All rights reserved.</p>
              <p className="mt-1">Adonix is a social fitness network — not a professional service. Meet only at verified public locations. GPS check-in required.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* RIGHT COLUMN (50%) - Girl Image + Login/Setup */}
      <div className="w-1/2 relative overflow-hidden bg-zinc-900">
        {/* Girl Image */}
        <img 
          src="/girl_image_backgroundinterface.png" 
          alt="Social Fitness Member" 
          className="w-full h-full object-cover grayscale brightness-110 contrast-125"
        />
        
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        
        {/* LOGIN/SETUP - Top Right */}
        <div 
          onClick={() => window.location.href = '/login'}
          className="absolute top-6 right-6 text-xs tracking-widest text-gray-300 font-medium hover:text-orange-400 cursor-pointer transition-colors z-10"
        >
          LOGIN / SETUP
        </div>
      </div>

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
  );
};

export default LandingPage;