import { useState, useEffect } from 'react';
import { Dumbbell, LogOut } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import TrainerDashboard from "./TrainerDashboard";
import BookingFlow, { BookingDetails } from './BookingFlow';
import CheckoutScreen from './CheckoutScreen';
import AuthModal from './AuthModal';
import MyBookings from './MyBookings';

// Terms Modal Component (reused from AuthModal)
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

// Import X icon for the modal
import { X } from 'lucide-react';

export default function PublicHome() {
  const { user, profile, signOut, role, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | 'contact' | 'accessibility' | null>(null);

  const handleBookTrainer = (trainer: Profile) => {
    setSelectedPartner(trainer);
  };

  const handleProceedToCheckout = (details: BookingDetails) => {
    setBookingDetails(details);
    setSelectedPartner(null);
  };

  const handleBookingSuccess = () => {
    setBookingDetails(null);
    alert('Booking created successfully!');
  };

  const handleLogout = async () => {
    await signOut();
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

  // Full Terms of Service Content (matching your TermsPage.tsx)
  const fullTermsContent = `ADONIX FIT - TERMS OF SERVICE
Effective: April 9, 2026 | Last updated: April 9, 2026

1. Acceptance of Terms
By accessing Adonix (also referred to as Adonix Fit) (the "App"), you agree to these Terms. The App is operated by Prime Social LLC ("Company", "we", "us").

Adonix Fit is strictly a fitness and wellness platform. It is not a dating app, escort service, or platform for romantic or sexual encounters. Any user attempting to use the App for such purposes will be permanently banned.

2. USA-Only Service & 18+ Eligibility
Location: Available only within the United States of America, including its territories and possessions. VPN use to bypass this restriction is prohibited.
Human-Only: Use of Artificial Intelligence (AI) to act as a user, generate fake personas, or automate chat is strictly prohibited.
Age: You must be at least 18 years old. Underage accounts are deleted within 24 hours.
Age Verification Methods: We use commercially reasonable age verification methods including birth date collection, the right to request government-issued identification, and the right to use facial age estimation technology.

3. Biometric Information (Illinois BIPA)
If facial age estimation is used, we obtain separate written consent. Biometric data is used only for age verification and is deleted immediately.

4. Username Policy
Usernames must be 3-20 characters (letters, numbers, underscore, period only).

5. Prohibited Conduct (Zero-Tolerance)
Immediate permanent ban for: nudity/explicit content, cross-promotion of social media, screenshots without permission, AI impersonation, AI-generated profile content, deepfakes, harassment, impersonation, automated tools, and external payment apps.

6. Chat & Security Monitoring
We monitor communications for safety. Do not share personal contact info or discuss payments outside the App.

7. Payment System & Multi-Vendor Fee Disclosure
All transactions must be processed via Stripe. ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE.

8. Location Tracking, QR-Code & Signal Disclaimer
GPS is mandatory to verify both parties are within 0.75 miles of the agreed location.

9. Public Locations Only
Public venues only (parks, gyms, studios). Private residences are prohibited.

10. In-Person Safety & Assumption of Risk
YOU VOLUNTARILY ASSUME ALL RISKS OF INJURY OR DEATH. We do NOT conduct background checks.

11. Wellness & Medical Disclaimer
Adonix is a general wellness platform. Consult a physician before beginning any exercise program.

12. Independent Contractor Status
Partners are Independent Contractors, not employees.

13. Artificial Intelligence Use
We may use AI for matching, content moderation, and recommendations.

14. User Content and License
You grant us a license to use content you upload.

15. DMCA / Copyright Compliance
Send notices to primesocial@primesocial.xyz.

16. Data Rights & Privacy
You have rights to access, delete, correct, and opt-out.

17. Use of Information for Marketing
We may use your data for marketing. You may opt out.

18. No Refunds (Reiterated)
ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE.

19. Indemnification
You agree to indemnify Prime Social LLC.

20. Limitation of Liability
Our total liability shall not exceed $100.

21. Dispute Resolution – Binding Arbitration & Class Action Waiver
All disputes resolved through binding arbitration. You waive class action rights.

22. Force Majeure
We are not liable for delays outside our control.

23. Beta Testing Terms
Beta testers must keep information confidential.

24. Referral Program Terms
Referral rewards are non-cash credits.

25. Gift Card / Credit Terms
Credits expire 12 months after issuance.

26. Accessibility Statement
We strive to make the App accessible.

27. Severability
If any provision is unenforceable, the rest remain.

28. Entire Agreement
These Terms constitute the entire agreement.

29. Consent to Electronic Signatures
By clicking 'I agree,' you consent to electronic signatures.

30. Right to Change Terms
We may update these Terms.

31. Termination
We may terminate your account at any time.

32. Contact Information
Email: primesocial@primesocial.xyz

33. Other State Laws (All 50 States + Territories)
We comply with all applicable state laws.

34. No Personal Liability
Recourse limited to Company assets. No personal liability for members or managers.

35. Two-Person Only Sessions
Sessions limited to client and partner only. No friends, family, or spectators.

36. Waiver of Jury Trial
You waive any right to a trial by jury.

37. No Third-Party Beneficiaries
These Terms are for you and Prime Social LLC only.

By creating an account, you agree to these Terms.`;

  const fullPrivacyContent = `ADONIX FIT - PRIVACY POLICY
Effective: April 9, 2026 | Last updated: April 9, 2026

1. Information We Collect: Identifiers, demographic info, fitness info, user content, payment info (via Stripe), location data, and biometric data (with consent).

2. Location Data: GPS used to verify both parties within 0.75 miles. Not sold, used only for session verification and SOS.

3. Age Verification & Biometric Data: Birth date collected to verify age 18+ and deleted immediately. Facial age estimation requires separate consent.

4. How We Use Your Information: To operate the App, verify age, process payments, enforce Terms, protect safety, and prevent fraud.

5. Sharing of Information: We do not sell your data. Shared with other users, Stripe, emergency services, law enforcement, AI providers, and marketing partners (opt-out available).

6. Data Retention: Age verification data deleted immediately. Account data: until deletion + 30 days.

7. Security: We use reasonable security measures but cannot guarantee 100% security.

8. Children's Privacy: Strictly 18+. Underage accounts deleted within 24 hours.

9. Your Rights: You have rights to know, delete, portability, correct, opt-out, and appeal.

10. State-Specific Rights: California (CCPA/CPRA), Colorado, Connecticut, Virginia, Utah, Washington, Nevada, Illinois, Florida, Texas residents have additional rights.

11. Artificial Intelligence Use: We use AI for matching and content moderation.

12. Marketing & Remarketing Pixels: We use pixels for targeted ads. You may opt out.

13. Cookies: We use cookies for authentication and preferences.

14. Data Broker Registration: We are not a data broker.

15. International Data Transfers: USA only.

16. Third-Party Links: Not responsible for third-party content.

17. No Medical Advice: Consult a physician before exercise.

18. No Verification of Users: We do not conduct background checks.

19. No Guaranteed Results: Results vary by individual.

20. Consent to Electronic Signatures: By creating an account, you consent.

21. Changes to This Policy: We may update this policy.

22. Contact Us: primesocial@primesocial.xyz

By using Adonix Fit, you agree to this Privacy Policy.`;

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 w-full border-b border-white/10 bg-black/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/Screenshot_2026-04-03_221406.png" alt="Adonix Fit" className="h-8 w-auto" />
            <span className="text-2xl font-bold tracking-tight">Adonix Fit</span>
          </div>
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <span className="text-gray-300 text-sm">
                  Welcome, {profile?.first_name || (role === 'trainer' ? 'Trainer' : 'Fitness Enthusiast')}!
                </span>
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
                className="text-gray-400 hover:text-white transition-colors"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-20 max-w-7xl mx-auto px-6 py-12">
        {/* ========== CLIENT VIEW ========== */}
        {role === 'client' && (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Browse Fitness Partners</h1>
              <p className="text-gray-400 text-lg">Find your perfect workout buddy</p>
            </div>
            <TrainerDashboard onBookTrainer={handleBookTrainer} />
            <MyBookings />
          </>
        )}

        {/* ========== TRAINER VIEW ========== */}
        {role === 'trainer' && (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Trainer Dashboard</h1>
              <p className="text-gray-400 text-lg">Manage your sessions, clients, and earnings</p>
            </div>
            <TrainerDashboard />
          </>
        )}
      </div>

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

      <footer className="mt-12 pt-8 pb-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500">
              © 2026 Adonix Fit. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
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
              <span className="text-gray-600 hidden sm:inline">|</span>
              <span className="text-gray-600">Adonix Fit – Safe fitness connections</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TermsModal
        isOpen={showTermsModal === 'terms'}
        onClose={() => setShowTermsModal(null)}
        title="Terms of Service"
        content={fullTermsContent}
        onAgree={() => setShowTermsModal(null)}
      />

      <TermsModal
        isOpen={showTermsModal === 'privacy'}
        onClose={() => setShowTermsModal(null)}
        title="Privacy Policy"
        content={fullPrivacyContent}
        onAgree={() => setShowTermsModal(null)}
      />

      <TermsModal
        isOpen={showTermsModal === 'contact'}
        onClose={() => setShowTermsModal(null)}
        title="Contact Us"
        content="For questions, support, or inquiries, please email us at: primesocial@primesocial.xyz"
        onAgree={() => setShowTermsModal(null)}
      />

      <TermsModal
        isOpen={showTermsModal === 'accessibility'}
        onClose={() => setShowTermsModal(null)}
        title="Accessibility Statement"
        content="Adonix Fit is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone. If you have difficulty accessing any feature, please contact us at primesocial@primesocial.xyz."
        onAgree={() => setShowTermsModal(null)}
      />
    </div>
  );
}