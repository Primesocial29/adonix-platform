import React, { useState, useEffect } from 'react';
import { LogOut, X } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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

  // Redirect to browse if client is logged in (they should see browse page, not homepage)
  if (!loading && user && role === 'client' && profile?.profile_complete) {
    window.location.href = '/browse';
    return null;
  }

  // Don't render anything while loading
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

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

  // Full Terms of Service Content (short version for modal)
  const fullTermsContent = `ADONIX FIT - TERMS OF SERVICE
Effective: April 9, 2026 | Last updated: April 9, 2026

1. Acceptance of Terms
By accessing Adonix (Adonix Fit), you agree to these Terms. Adonix Fit is strictly a fitness and wellness platform. It is not a dating app or escort service.

2. USA-Only Service & 18+ Eligibility
Available only within the USA. You must be at least 18 years old.

3. Biometric Information (Illinois BIPA)
If facial age estimation is used, we obtain separate written consent.

4. Username Policy
Usernames must be 3-20 characters (letters, numbers, underscore, period only).

5. Prohibited Conduct (Zero-Tolerance)
Immediate permanent ban for nudity, cross-promotion, external payments, AI impersonation, harassment.

6. Chat & Security Monitoring
We monitor communications for safety.

7. Payment System
ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE.

8. Location Tracking
GPS is mandatory to verify both parties are within 0.75 miles.

9. Public Locations Only
Public venues only. Private residences prohibited.

10. In-Person Safety & Assumption of Risk
YOU VOLUNTARILY ASSUME ALL RISKS OF INJURY OR DEATH.

11. Wellness & Medical Disclaimer
Consult a physician before beginning any exercise program.

12. Independent Contractor Status
Partners are Independent Contractors.

13. Artificial Intelligence Use
We may use AI for matching and content moderation.

14. User Content and License
You grant us a license to use content you upload.

15. DMCA / Copyright Compliance
Send notices to primesocial@primesocial.xyz.

16. Data Rights & Privacy
You have rights to access, delete, correct, and opt-out.

17. Use of Information for Marketing
You may opt out of marketing.

18. No Refunds (Reiterated)
ALL PAYMENTS ARE FINAL.

19. Indemnification
You agree to indemnify Prime Social LLC.

20. Limitation of Liability
Our total liability shall not exceed $100.

21. Dispute Resolution – Binding Arbitration
All disputes resolved through binding arbitration. You waive class action rights.

22. Force Majeure
We are not liable for delays outside our control.

34. No Personal Liability
Recourse limited to Company assets.

35. Two-Person Only Sessions
Sessions limited to client and partner only.

36. Waiver of Jury Trial
You waive any right to a trial by jury.

37. No Third-Party Beneficiaries
These Terms are for you and Prime Social LLC only.

By creating an account, you agree to these Terms.`;

  const fullPrivacyContent = `ADONIX FIT - PRIVACY POLICY
Effective: April 9, 2026 | Last updated: April 9, 2026

1. Information We Collect: Email, username, age (deleted immediately), city, fitness goals, photos, bio, chat messages, location data, and biometric data (with consent).

2. Location Data: GPS used to verify both parties within 0.75 miles. Not sold.

3. Age Verification & Biometric Data: Birth date collected to verify age 18+ and deleted immediately.

4. How We Use Your Information: To operate the App, verify age, process payments, enforce Terms, protect safety.

5. Sharing of Information: We do not sell your data.

6. Data Retention: Age verification data deleted immediately. Account data: until deletion + 30 days.

7. Security: We use reasonable security measures.

8. Children's Privacy: Strictly 18+.

9. Your Rights: You have rights to know, delete, correct, and opt-out.

10. State-Specific Rights: California, Colorado, Virginia, Utah, Washington, Nevada, Illinois, Florida, Texas residents have additional rights.

By using Adonix Fit, you agree to this Privacy Policy.`;

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
          <h1 className="text-3xl md:text-4xl font-bold tracking-wide text-white uppercase">
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
                className="text-gray-400 hover:text-white transition-colors text-sm tracking-wide font-medium"
              >
                LOGIN/SETUP
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Logo centered left, girl on right */}
      <div className="relative min-h-screen flex items-center">
        {/* Girl Image - Right side */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("/girl_image_backgroundinterface.jpg")',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPositionX: '100%',
            backgroundPositionY: 'center',
            right: 0,
            left: 'auto',
            width: '35%',
          }}
        />
        
        {/* Black gradient overlay on the left */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="max-w-2xl">
            {/* Logo - h-80 (320px), centered left */}
            <div className="mb-8 flex justify-start">
              <img 
                src="/adonixlogo.png" 
                alt="Adonix Logo" 
                className="h-80 w-auto object-contain" 
                style={{ background: 'transparent' }}
                onError={(e) => {
                  console.error('Logo failed to load');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            
            {/* Subheadline - Left aligned */}
            <div className="mb-8">
              <p className="text-3xl md:text-4xl font-light text-white leading-tight">
                Verified Public
              </p>
              <p className="text-3xl md:text-4xl font-light text-red-500 leading-tight mt-1">
                Meetups<span className="text-white">|</span>
              </p>
              <p className="text-2xl md:text-3xl font-light text-white leading-tight mt-4">
                Real-World Connections.
              </p>
            </div>
            
            {/* Text lines - Left aligned */}
            <div className="space-y-1 mb-10">
              <p className="text-sm text-gray-400 tracking-wider">AUTHENTICITY EXCELLENCE</p>
              <p className="text-sm text-gray-400 tracking-wider">Curated Meetups.</p>
              <p className="text-sm text-gray-400 tracking-wider">High-Standard Community</p>
            </div>
            
            {/* CTA Button - Left aligned */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-10 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-red-500/30"
            >
              EXPLORE CURATION
            </button>
          </div>
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