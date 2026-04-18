import React, { useState, useEffect } from 'react';
import { LogOut, X } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import TrainerDashboard from "./TrainerDashboard";
import BookingFlow, { BookingDetails } from './BookingFlow';
import CheckoutScreen from './CheckoutScreen';
import AuthModal from './AuthModal';
import MyBookings from './MyBookings';

// Simple View-Only Modal (no scroll requirement, just a close button)
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
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Terms Modal Component with scroll-to-bottom requirement (for legal agreement)
function TermsModal({ isOpen, onClose, title, content, onAgree }: { isOpen: boolean; onClose: () => void; title: string; content: string; onAgree?: () => void }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setHasScrolledToBottom(isAtBottom);
    }
  };

  const handleAgree = () => {
    setHasAgreed(true);
    if (onAgree) {
      onAgree();
    }
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      setHasAgreed(false);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-white/10">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {hasScrolledToBottom && (
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
        
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 text-gray-300 space-y-4 whitespace-pre-wrap font-mono text-sm"
        >
          {content}
        </div>
        
        <div className="p-4 border-t border-white/10">
          {!hasScrolledToBottom && (
            <div className="text-center mb-3">
              <p className="text-xs text-yellow-400 animate-pulse">
                ⚠️ Please scroll to the bottom to read the complete {title} before closing ⚠️
              </p>
            </div>
          )}
          <button
            onClick={handleAgree}
            disabled={!hasScrolledToBottom || hasAgreed}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
              hasScrolledToBottom && !hasAgreed
                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                : hasAgreed
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            {hasAgreed ? '✓ Closed' : (hasScrolledToBottom ? 'I have read and understand' : 'Scroll to bottom to close')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicHome() {
  const { user, profile, signOut, role, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | 'contact' | 'accessibility' | null>(null);

  const handleBookTrainer = (partner: Profile) => {
    setSelectedPartner(partner);
  };

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

  // Client notifications for booking status changes
  useEffect(() => {
    if (!user || role !== 'client') return;

    const fetchClientBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, partner_id')
        .eq('client_id', user.id)
        .in('status', ['confirmed', 'declined']);

      if (error) {
        console.error('Error fetching client bookings:', error);
        return;
      }

      const stored = localStorage.getItem('notifiedBookingIds');
      const notifiedIds = stored ? JSON.parse(stored) : [];

      const newBookings = data?.filter(booking => !notifiedIds.includes(booking.id));

      if (newBookings && newBookings.length > 0) {
        const partnerIds = newBookings.map(b => b.partner_id);
        const { data: partners } = await supabase
          .from('profiles')
          .select('id, first_name')
          .in('id', partnerIds);

        const partnerMap = new Map(partners?.map(p => [p.id, p.first_name]));
        const messages = newBookings.map(b => {
          const partnerName = partnerMap.get(b.partner_id) || 'a partner';
          return `Your booking request has been ${b.status} by ${partnerName}.`;
        }).join('\n');

        alert(messages);

        const updatedIds = [...notifiedIds, ...newBookings.map(b => b.id)];
        localStorage.setItem('notifiedBookingIds', JSON.stringify(updatedIds));
      }
    };

    fetchClientBookings();
  }, [user, role]);

  // ============================================================
  // TEMPORARILY DISABLED - These redirects are commented out for testing
  // ============================================================
  
  /*
  // Redirect to browse if client is logged in (they should see browse page, not homepage)
  if (!loading && user && role === 'client' && profile?.profile_complete) {
    window.location.href = '/browse';
    return null;
  }
  */

  // Don't render anything while loading
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  /*
  // If no profile_complete, show setup prompt
  if (user && profile && !profile.profile_complete) {
    const setupUrl = role === 'trainer' ? '/partner-setup' : '/client-setup';
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
          <p className="text-gray-400 mb-6">You need to complete your profile before continuing.</p>
          <button
            onClick={() => window.location.href = setupUrl}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-semibold hover:scale-105 transition"
          >
            Complete Profile →
          </button>
        </div>
      </div>
    );
  }
  */

  const fullTermsContent = `ADONIX FIT - TERMS OF SERVICE
Effective: April 17, 2026 | Prime Social LLC

1. ACCEPTANCE
Adonix Fit is a fitness platform operated by Prime Social LLC. It is NOT for dating or escort services. Solicitation results in a permanent ban.

2. ELIGIBILITY & SAFETY WARRANTY
You must be 18+. You REPRESENT AND WARRANT that you have NO felony convictions, NO history of sexual misconduct or violence, and are NOT a registered sex offender. Providing false information constitutes a material breach of these Terms.

3. BIPA COMPLIANCE
Facial estimation data is deleted immediately after verification. Separate written consent required before any biometric data is collected.

4. USERNAMES
3-20 characters; no offensive or impersonating handles.

5. ZERO-TOLERANCE
Immediate permanent ban for: Harassment, Stalking, Non-Consensual Photos, Nudity, AI Impersonation, Cross-Promotion, or External Payments (Venmo, CashApp, PayPal, Zelle, etc.).

6. MONITORING
Prime Social LLC monitors in-app chat for safety and fraud prevention. By using Adonix Fit, you consent to this monitoring.

7. PAYMENTS
Stripe is the exclusive payment provider. ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE. External payment apps are a material breach.

8. GPS & SOS DISCLAIMER
GPS is mandatory for session verification. The SOS feature is a "best effort" tool only and is NOT a replacement for calling 911 directly.

9. PUBLIC ONLY
Meetings in private residences, hotels, or any non-public location are a material breach. Three-strike policy: (1) warning, (2) 7-day suspension, (3) permanent ban.

10. ASSUMPTION OF RISK
YOU VOLUNTARILY ASSUME ALL RISKS OF PHYSICAL ACTIVITY. PRIME SOCIAL LLC DOES NOT VERIFY CRIMINAL HISTORIES. PHYSICAL ACTIVITIES INVOLVE INHERENT RISKS OF SERIOUS INJURY, INCLUDING PARALYSIS OR DEATH.

11. MEDICAL DISCLAIMER
Consult a physician before use. Adonix Fit is a general wellness platform — not a medical device.

12. INDEPENDENT CONTRACTOR STATUS
Partners are Independent Contractors, not employees, agents, or franchisees of Prime Social LLC.

13. CONDUCT STANDARDS & RIGHT TO LEAVE
The "Right to Leave" is absolute — users may end sessions at any time they feel unsafe with no penalty. All communication must remain within the App.

14. TWO-PERSON LIMIT
Sessions limited to two (2) participants only. No spectators, guests, or pets (except ADA service animals).

15. AI USE
AI is used for content moderation and partner matching. Human review available upon request within 30 days.

16. CONTENT LICENSE
You grant Prime Social LLC a license to use your uploaded human-generated content to operate the App.

17. DMCA
Report copyright issues to primesocial@primesocial.xyz.

18. PRIVACY
Data handled per CCPA/SB 1722 and all applicable US state privacy laws.

19. INDEMNIFICATION
You agree to defend and indemnify Prime Social LLC against all claims arising from your conduct or use of the App.

20. LIMITATION OF LIABILITY
TOTAL AGGREGATE LIABILITY OF PRIME SOCIAL LLC SHALL NOT EXCEED $100. NO INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.

21. ARBITRATION & CLASS ACTION WAIVER
Binding arbitration in Orange County, FL. CLASS ACTION WAIVER INCLUDED — YOU WAIVE THE RIGHT TO BRING OR PARTICIPATE IN ANY CLASS ACTION AGAINST PRIME SOCIAL LLC.

22. FORCE MAJEURE
Prime Social LLC is not liable for acts of God, server failures, cyberattacks, or causes outside our reasonable control.

23. NO PERSONAL LIABILITY
Recourse is limited to Company assets only. No member, manager, or employee of Prime Social LLC has personal liability.

24. JURY WAIVER
YOU WAIVE THE RIGHT TO A TRIAL BY JURY IN ANY DISPUTE ARISING FROM THESE TERMS.

25. TERMINATION
Prime Social LLC may terminate accounts for any policy violation at any time, with or without notice.

26. CONTACT
primesocial@primesocial.xyz | Prime Social LLC | Orange County, Florida`;

  const fullPrivacyContent = `ADONIX FIT - PRIVACY POLICY
Effective: April 17, 2026 | Prime Social LLC

1. DATA COLLECTION
Prime Social LLC collects identifiers (email, username, IP address, device ID) and fitness data. Age verification data is deleted immediately after 18+ confirmation and is not retained for any other purpose.

2. LOCATION DATA
GPS is used only for session check-in verification and the SOS emergency safety feature. Location data is not retained after the session ends and is never sold to third parties.

3. BIOMETRICS
Per BIPA, facial estimation data is processed and purged instantly. Separate written consent is required. We do not sell, share, or trade biometric data.

4. AI MODERATION
AI scans user-generated content for safety violations. Human review of any AI decision is available upon request to primesocial@primesocial.xyz.

5. NO SALE OF DATA
Prime Social LLC does not sell personal data to third parties.

6. RETENTION
Account records are purged within 30 days after account deletion. Age verification data is deleted immediately.

7. YOUR RIGHTS
Per CCPA/CPRA, Florida SB 1722, and all applicable US state privacy laws, you have the right to access, correct, delete, and port your data. Email primesocial@primesocial.xyz. We respond within 45 days.`;

  const contactContent = `ADONIX FIT - CONTACT INFORMATION

Prime Social LLC

Email: primesocial@primesocial.xyz

Jurisdiction: Orange County, Florida

For support inquiries, please email us with your account email and a description of the issue.

For legal inquiries, privacy requests, DMCA notices, or arbitration opt-outs, please use the same email address.

Response Time: We will respond to all inquiries within 2-3 business days. For privacy requests, we respond within 45 days as required by law.`;

  const accessibilityContent = `ADONIX FIT - ACCESSIBILITY STATEMENT

Our Commitment
Adonix Fit is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying relevant accessibility standards.

Conformance Status
We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. These guidelines explain how to make web content more accessible for people with disabilities.

Accessibility Features
• High contrast color scheme for better readability
• Keyboard navigable interface
• Screen reader compatible text
• Resizable text (up to 200% without loss of content)
• Alternative text for images

Feedback and Support
We welcome your feedback on the accessibility of Adonix Fit. If you encounter any accessibility barriers or have suggestions for improvement, please contact us at:

Email: primesocial@primesocial.xyz

Limitations and Alternatives
Despite our best efforts to ensure accessibility, some pages or features may not be fully accessible. If you need assistance accessing any content, please contact us and we will provide an alternative.

We are actively working to improve accessibility. If you experience any issues, please contact us immediately.`;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar - ADONIX top left in CAPS, LOGIN/SETUP top right */}
      <nav className="fixed top-0 w-full z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <h1 className="text-4xl md:text-4xl font-bold tracking-wide text-white uppercase">
            ADONIX
          </h1>
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <span className="text-gray-300 text-sm">
                  Welcome, {profile?.first_name || (role === 'trainer' ? 'Partner' : 'Fitness Enthusiast')}!
                </span>
                {role === 'client' && (
                  <a href="/browse" className="text-gray-400 hover:text-white transition-colors">
                    Browse Partners
                  </a>
                )}
                {role === 'trainer' && (
                  <a href="/partner-dashboard" className="text-gray-400 hover:text-white transition-colors">
                    Partner Dashboard
                  </a>
                )}
                <a href="/settings" className="text-gray-400 hover:text-white transition-colors">
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-gray-400 hover:text-white transition-colors text-large tracking-wide font-medium"
              >
                LOGIN/SETUP
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* White line directly below the navbar */}
      <div className="fixed top-[72px] w-full z-40">
        <div className="w-full h-px bg-white/30"></div>
      </div>

      {/* Hero Section - Pure Black Background */}
      <div className="relative min-h-screen flex">
        {/* Left Side - Solid Black Background */}
        <div className="relative w-3/5 bg-black flex flex-col justify-center">
          <div className="relative z-10 px-8">
            
            {/* ========================================================= */}
            {/* PNG LOGO - MOVED HIGHER (more negative margin = higher) */}
            {/* ========================================================= */}
            <div style={{ 
              marginBottom: '120px',    // Changed from -160px to -220px (moved HIGHER)
              marginLeft: '-17px'
            }}>
              <img 
                src="/adonixlogo.png" 
                alt="Adonix Logo" 
                style={{
                  width: '190px',
                  height: 'auto',
                  maxWidth: 'none',
                  background: 'transparent'
                }}
                onError={(e) => {
                  console.error('Logo failed to load');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            
            {/* Text lines */}
            <div className="mb-10" style={{ 
              marginTop: '-68px',
              marginLeft: '0px'
            }}>
              <p className="text-gray-200 tracking-wider font-bold" style={{ fontSize: '18px', marginBottom: '8px' }}>AUTHENTICITY EXCELLENCE</p>
              <p className="text-gray-200 tracking-wider font-bold" style={{ fontSize: '18px', marginBottom: '8px' }}>Curated Meetups.</p>
              <p className="text-gray-200 tracking-wider font-bold" style={{ fontSize: '18px' }}>High-Standard Community</p>
            </div>
            {/* ========================================================= */}
            
            {/* Right Side Text */}
            <div className="absolute left-0 z-20" style={{ 
              top: '-10px',
              left: '250px'
            }}>
              <div className="text-left">
                <p className="text-1.75xl md:text-5xl font-bold text-white leading-tight whitespace-nowrap">
                  Verified Public
                </p>
                <p className="text-1.75xl md:text-5xl font-bold text-red-500 leading-tight mt-1">
                  Meetups<span className="text-white"></span>
                </p>
                <p className="text-1.75xl md:text-4xl font-bold text-white leading-tight mt-1">
                  Real-World Connections.
                </p>
              </div>
            </div>
            
            {/* CTA Button */}
            {/* CTA BUTTON - Wide, Tall, Gradient */}
<button
  onClick={() => setShowAuthModal(true)}
  className="px-12 py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 rounded-lg font-bold text-white text-xl transition-all duration-300 whitespace-nowrap"
>
  EXPLORE CURATION
</button>
          </div>
        </div>
        
        {/* Right Side - Girl Image */}
        <div className="relative w-2/5 flex items-center justify-center">
          <div style={{ 
            width: '880px',
            height: '880px',
            position: 'relative',
            top: '-40'
          }}>
            <img 
              src="/girl_image_backgroundinterface.jpg" 
              alt="Female runner"
              className="w-full h-full object-cover"
              style={{
                filter: 'grayscale(100%) brightness(70%)'
              }}
            />
          </div>
          
          {/* Black gradient overlay on the right panel edge for blending */}
          <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Footer - At the bottom */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500">
              © 2026 ADONIX. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500">
              <button onClick={() => setShowTermsModal('terms')} className="hover:text-white transition-colors">
                Terms of Service
              </button>
              <button onClick={() => setShowTermsModal('privacy')} className="hover:text-white transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => setShowTermsModal('contact')} className="hover:text-white transition-colors">
                Contact
              </button>
              <button onClick={() => setShowTermsModal('accessibility')} className="hover:text-white transition-colors">
                Accessibility
              </button>
              <a href="/safety" className="hover:text-white transition-colors">
                Safety Guidelines
              </a>
            </div>
          </div>
          <div className="text-center text-xs text-gray-600 mt-4">
            Adonix is a social fitness network — not a professional service. Meet only at verified public locations. GPS check-in required.
          </div>
        </div>
      </footer>

      {selectedPartner && (
        <BookingFlow
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          onProceedToCheckout={handleProceedToCheckout}
        />
      )}

      {bookingDetails && (
        <CheckoutScreen
          bookingDetails={bookingDetails}
          onClose={() => setBookingDetails(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {showAuthModal && (
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}

      {/* Terms Modal - requires scrolling to bottom (for legal agreement) */}
      <TermsModal
        isOpen={showTermsModal === 'terms'}
        onClose={() => setShowTermsModal(null)}
        title="Terms of Service"
        content={fullTermsContent}
        onAgree={() => setShowTermsModal(null)}
      />

      {/* Simple Modals - no scroll requirement (view only) */}
      <SimpleModal
        isOpen={showTermsModal === 'privacy'}
        onClose={() => setShowTermsModal(null)}
        title="Privacy Policy"
        content={fullPrivacyContent}
      />

      <SimpleModal
        isOpen={showTermsModal === 'contact'}
        onClose={() => setShowTermsModal(null)}
        title="Contact Us"
        content={contactContent}
      />

      <SimpleModal
        isOpen={showTermsModal === 'accessibility'}
        onClose={() => setShowTermsModal(null)}
        title="Accessibility Statement"
        content={accessibilityContent}
      />
    </div>
  );
}