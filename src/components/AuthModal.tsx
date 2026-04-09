import { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UserRole = 'member' | 'partner' | null;
type Step = 'welcome' | 'credentials';

// Terms Modal Component with scroll-to-bottom requirement
function TermsModal({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: string }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
      setHasScrolledToBottom(isAtBottom);
      setScrollPosition(scrollTop);
      setScrollHeight(scrollHeight);
    }
  };

  // Reset scroll state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => {}}>
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {/* Only show X button if scrolled to bottom */}
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
          <p>{content}</p>
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
            onClick={onClose}
            disabled={!hasScrolledToBottom}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
              hasScrolledToBottom
                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            {hasScrolledToBottom ? 'I have read and understand' : 'Scroll to bottom to close'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | null>(null);
  
  // Birth date fields (replacing isOver18)
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [ageVerifyConsent, setAgeVerifyConsent] = useState(false);

  if (!isOpen) return null;

  // Username validation
  const validateUsername = (value: string) => {
    if (!value) return '';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username cannot exceed 20 characters';
    if (!/^[a-zA-Z0-9_.]+$/.test(value)) return 'Use only letters, numbers, underscore (_), and period (.)';
    return '';
  };

  // Check username availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!username || username.length < 3 || validateUsername(username)) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.toLowerCase())
          .maybeSingle();

        if (error) throw error;
        setUsernameAvailable(!data);
        setUsernameError('');
      } catch (err) {
        console.error('Error checking username:', err);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeout = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  const handleRoleSelect = (role: 'member' | 'partner') => {
    setSelectedRole(role);
    setStep('credentials');
  };

  const handleBack = () => {
    if (isLogin) {
      setIsLogin(false);
      setStep('welcome');
      setError('');
      setEmail('');
      setPassword('');
      setUsername('');
      setBirthMonth('');
      setBirthDay('');
      setBirthYear('');
      setAgeVerifyConsent(false);
    } else {
      setStep('welcome');
      setSelectedRole(null);
      setError('');
    }
  };

  const handleSignInClick = () => {
    setIsLogin(true);
    setStep('credentials');
    setError('');
    setSelectedRole(null);
  };

  const handleSignUpClick = () => {
    setIsLogin(false);
    setStep('welcome');
    setError('');
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setUsername('');
    setAcceptedTerms(false);
    setBirthMonth('');
    setBirthDay('');
    setBirthYear('');
    setAgeVerifyConsent(false);
  };

  // Calculate age from birth date
  const calculateAge = (month: string, day: string, year: string): number | null => {
    if (!month || !day || !year) return null;
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      try {
        await signIn(email, password);
        onClose();
        window.location.href = '/dashboard';
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Sign-up validations
    
    // Birth date validation
    if (!birthMonth || !birthDay || !birthYear) {
      setError('Please enter your full birth date.');
      setLoading(false);
      return;
    }
    
    const age = calculateAge(birthMonth, birthDay, birthYear);
    if (age === null || age < 18) {
      setError('You must be at least 18 years old to use Adonix Fit.');
      setLoading(false);
      return;
    }
    
    if (!ageVerifyConsent) {
      setError('You must consent to age verification to create an account.');
      setLoading(false);
      return;
    }
    
    if (!acceptedTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to create an account.');
      setLoading(false);
      return;
    }
    if (!selectedRole) {
      setError('Something went wrong. Please go back and select a role.');
      setLoading(false);
      return;
    }
    if (!username) {
      setError('Please choose a username.');
      setLoading(false);
      return;
    }
    
    const usernameValidationError = validateUsername(username);
    if (usernameValidationError) {
      setError(usernameValidationError);
      setLoading(false);
      return;
    }
    
    if (!usernameAvailable) {
      setError('This username is already taken. Please choose another.');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, selectedRole, username.toLowerCase());
      onClose();
      
      if (selectedRole === 'partner') {
        window.location.href = '/partner-setup';
      } else {
        window.location.href = '/client-setup';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  // Full Terms of Service Content
  const fullTermsContent = `ADONIX FIT - TERMS OF SERVICE
Last updated: April 9, 2026

1. Acceptance of Terms
By accessing Adonix (Adonix Fit), you agree to these Terms. The App is operated by Prime Social LLC.

2. USA-Only Service & 18+ Eligibility
Location: Available only within the United States of America, including its territories. VPN use to bypass this is prohibited.
Human-Only: Use of AI to act as a user or generate fake personas is strictly prohibited.
Age: You must be at least 18 years old. Underage accounts are deleted within 24 hours.
Age Verification: We collect birth date at account creation to verify age. Data is deleted immediately after verification.
Florida SB 1722, Texas AGE APT Act, Utah App Store Act, Louisiana Act 172, California CAADCA compliance included.

3. Biometric Information (Illinois BIPA)
If facial age estimation is used, we obtain separate written consent. Biometric data is used only for age verification and is deleted immediately. We do not sell, share, or trade biometric data.

4. Username Policy
Usernames must be 3-20 characters (letters, numbers, underscore, period only). Offensive names will be removed.

5. Prohibited Conduct (Zero-Tolerance)
Immediate permanent ban for: nudity/explicit content, cross-promotion of social media, screenshots without permission, AI impersonation, AI-generated profile content, deepfakes, harassment, impersonation, automated tools, external payment apps (Venmo, PayPal, CashApp, Zelle, etc.).

6. Chat & Security Monitoring
We monitor communications for safety. Do not share personal contact info or discuss payments outside the App.

7. Payment System & Multi-Vendor Fee Disclosure
All transactions must be processed via Stripe. External payment apps are prohibited. ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE. Payment is authorized but not captured until QR scan or no-show occurs.

8. Location Tracking, QR-Code & Signal Disclaimer
GPS is mandatory to verify both parties are within 0.75 miles of the agreed location. We are not liable for signal failures.

9. Public Locations Only
Public venues only (parks, gyms, studios). Private residences are prohibited. Three-strike policy: warning → 7-day suspension → permanent ban.

10. In-Person Safety & Assumption of Risk
YOU VOLUNTARILY ASSUME ALL RISKS OF INJURY OR DEATH. We do NOT conduct background checks. We do NOT verify certifications. You release us from liability for any harm, including assault, theft, or criminal acts.

11. Wellness & Medical Disclaimer
Adonix is a general wellness platform. Consult a physician before beginning any exercise program.

12. Independent Contractor Status
Partners are Independent Contractors, not employees.

13. Artificial Intelligence Use
We may use AI for matching, content moderation, and recommendations. No liability for AI output. You may opt out of automated decisions.

14. User Content and License
You grant us a license to use content you upload for operating the App. Content must be of a real human (no AI-generated images).

15. DMCA / Copyright Compliance
Send copyright infringement notices to primesocial@primesocial.xyz.

16. Data Rights & Privacy
You have rights to access, delete, correct, and opt-out. Email primesocial@primesocial.xyz.

17. Use of Information for Marketing
We may use your data for internal marketing and remarketing pixels. You may opt out.

18. No Refunds (Reiterated)
ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE. No exceptions.

19. Indemnification
You agree to indemnify Prime Social LLC from claims arising from your use of the App.

20. Limitation of Liability
Our total liability shall not exceed $100.

21. Dispute Resolution – Binding Arbitration & Class Action Waiver
All disputes resolved through binding arbitration in Orange County, Florida. You waive class action rights. You may opt out within 30 days.

22. Force Majeure
We are not liable for delays caused by events outside our control.

23. Beta Testing Terms
Beta testers must keep non-public information confidential.

24. Referral Program Terms
Referral rewards are non-cash credits that expire after 90 days.

25. Gift Card / Credit Terms
Credits expire 12 months after issuance.

26. Accessibility Statement
We strive to make the App accessible to all users.

27. Severability
If any provision is unenforceable, the rest remain in effect.

28. Entire Agreement
These Terms constitute the entire agreement.

29. Consent to Electronic Signatures
By clicking 'I agree,' you consent to electronic signatures.

30. Right to Change Terms
We may update these Terms. Continued use constitutes acceptance.

31. Termination
We may terminate your account at any time.

32. Contact Information
Email: primesocial@primesocial.xyz | Orange County, Florida

33. Other State Laws (All 50 States + Territories)
We comply with all applicable state privacy laws including CCPA/CPRA, VCDPA, ColoPA, CTDPA, UCPA, and others.

By creating an account, you agree to these Terms of Service, including arbitration, class action waiver, assumption of risk, and no refund policy.`;

  // Full Privacy Policy Content
  const fullPrivacyContent = `ADONIX FIT - PRIVACY POLICY
Effective: April 9, 2026 | Last updated: April 9, 2026

1. Information We Collect
Identifiers: Email address, username, IP address, device ID
Demographic information: Age (for verification only, deleted immediately), city
Fitness information: Fitness goals, workout preferences, exercise history
User content: Profile photos, bio, fitness goals, chat messages
Payment information: Processed by Stripe; we do not store full payment details
Location data: Precise GPS location (see Section 2)
Biometric data: Facial age estimation data (see Section 3) — only with separate written consent

2. Location Data
We collect GPS to verify both parties are within 0.75 miles (1207 meters) of the agreed location. Signal failures are not our liability. Location data is not sold and is used only for session verification and SOS features.

3. Age Verification & Biometric Data
Birth date is collected to verify age 18+ and deleted immediately. Facial age estimation requires separate written consent and is deleted immediately after verification. We comply with Illinois BIPA.

4. How We Use Your Information
To operate the App, verify age, communicate, process payments, enforce Terms, protect safety, comply with laws, personalize recommendations, and prevent fraud.

5. Sharing of Information
We do not sell your data. We share with other users (profile info), Stripe (payments), emergency services (SOS), law enforcement (legal obligations), AI providers (moderation), and marketing partners (remarketing pixels - you may opt out).

6. Data Retention and Deletion
Age verification data: deleted immediately. Account data: until deletion + 30 days. Chat messages: until deletion + 30 days. Location data: not retained. Payment info: not stored by us.

7. Security & Data Breach Notification
We use reasonable security measures but cannot guarantee 100% security. We will notify you of data breaches as required by state laws (California, Florida, Texas, New York, and others).

8. Children's Privacy
Strictly 18+. Underage accounts deleted within 24 hours. COPPA compliant.

9. Your Rights (All US States & Territories)
You have rights to know, delete, portability, correct, opt-out of sale/sharing, opt-out of automated decisions, and appeal. Email primesocial@primesocial.xyz. Response within 45 days.

10. State-Specific Privacy Rights
California (CCPA/CPRA): Right to know, delete, opt-out, non-discrimination, Shine the Light.
Colorado, Connecticut, Virginia, Utah, Oregon, Montana, Texas, Indiana, Iowa, Tennessee, New Hampshire, New Jersey, Delaware, Kentucky, Maryland, Minnesota, Nebraska: Same rights as Section 9.
Washington (My Health My Data Act): Right to withdraw consent for health data.
Nevada (SB 370): Right to opt out of sale.
Illinois (BIPA): Separate consent for facial age estimation.
Florida (SB 1722): Age verification compliance.
Texas (AGE APT Act, TDPSA): Age ratings and verification.

11. Artificial Intelligence Use
We use AI for partner matching, content moderation, and recommendations. You may opt out of automated decisions. No liability for AI output.

12. Marketing & Remarketing Pixels
We use pixels (Facebook, Google, TikTok) for targeted ads. You may opt out via email, App Settings, or device settings.

13. Cookies and Tracking Technologies
We use cookies for authentication, preferences, analytics, and advertising. Do Not Track (DNT) signals are not currently responded to.

14. Data Broker Registration
We are not a data broker.

15. International Data Transfers
USA only. Data stored in the USA.

16. Third-Party Links
We are not responsible for third-party content or privacy practices.

17. No Medical Advice
Adonix is a general wellness platform. Consult a physician before beginning any exercise program.

18. No Verification of Users
We do not conduct criminal background checks. Partners' certifications are self-reported. You are responsible for your own safety.

19. No Guaranteed Results
We do not guarantee fitness results.

20. Consent to Electronic Signatures & Records
By creating an account, you consent to electronic signatures and records.

21. Changes to This Policy
We may update this policy. Notice will be provided by email or in-app.

22. Contact Us
Email: primesocial@primesocial.xyz
Entity: Prime Social LLC
Jurisdiction: Orange County, Florida
Data Protection Officer available at same email for California residents.

By using Adonix Fit, you acknowledge that you have read, understood, and agree to this Privacy Policy.`;

  // ========== WELCOME STEP ==========
  if (step === 'welcome') {
    return (
      <>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl max-w-lg w-full p-8 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Let's get real.</h2>
              <p className="text-xl text-gray-300">What brings that body here?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleRoleSelect('member')}
                className="group p-6 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-red-500 hover:bg-red-500/10 transition-all text-center"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🔥</div>
                <div className="font-bold text-xl text-white mb-2">I Want to Sweat</div>
                <div className="text-sm font-medium text-gray-300 bg-white/10 py-1 px-2 rounded-full inline-block">
                  💸 I will pay for sessions
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('partner')}
                className="group p-6 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-red-500 hover:bg-red-500/10 transition-all text-center"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💰</div>
                <div className="font-bold text-xl text-white mb-2">I Make People Sweat</div>
                <div className="text-sm font-medium text-gray-300 bg-white/10 py-1 px-2 rounded-full inline-block">
                  💵 I will earn money
                </div>
              </button>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={handleSignInClick}
                className="text-base font-semibold text-gray-300 hover:text-white transition-colors bg-white/5 px-6 py-2 rounded-full hover:bg-white/10"
              >
                Already have an account? <span className="text-red-500">Sign in →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Terms Modal - Welcome Step */}
        <TermsModal
          isOpen={showTermsModal === 'terms'}
          onClose={() => setShowTermsModal(null)}
          title="Terms of Service"
          content={fullTermsContent}
        />
        
        <TermsModal
          isOpen={showTermsModal === 'privacy'}
          onClose={() => setShowTermsModal(null)}
          title="Privacy Policy"
          content={fullPrivacyContent}
        />
      </>
    );
  }

  // ========== CREDENTIALS STEP ==========
  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl max-w-md w-full p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={handleBack}
            className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="text-center mb-6">
            {!isLogin && (
              <>
                <div className="text-4xl mb-2">{selectedRole === 'partner' ? '💰' : '🔥'}</div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedRole === 'partner' ? 'I Make People Sweat' : 'I Want to Sweat'}
                </h2>
                <p className="text-sm font-medium text-gray-300 mt-2 bg-white/10 py-1 px-3 rounded-full inline-block">
                  {selectedRole === 'partner' ? '💵 You will earn money' : '💸 You will pay for sessions'}
                </p>
              </>
            )}
            {isLogin && (
              <>
                <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                <p className="text-sm text-gray-400 mt-1">Sign in to continue</p>
              </>
            )}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field - only for sign-up */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className={`w-full pl-7 pr-10 py-3 bg-white/5 border rounded-xl focus:outline-none text-white placeholder-gray-500 ${
                      usernameAvailable === true
                        ? 'border-green-500 focus:border-green-500'
                        : usernameAvailable === false
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/10 focus:border-red-500'
                    }`}
                    placeholder="jess_fit"
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                    </div>
                  )}
                  {usernameAvailable === true && !checkingUsername && username.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                  {usernameAvailable === false && !checkingUsername && username.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  3-20 characters • letters, numbers, underscore (_), period (.) only
                </p>
                {usernameAvailable === false && (
                  <p className="text-xs text-red-400 mt-1">Username already taken</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-white">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>

            {/* Birth Date Fields - replaces 18+ checkbox */}
            {!isLogin && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white">
                  Birth Date <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Month Dropdown */}
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Month</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>

                  {/* Day Dropdown */}
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>

                  {/* Year Dropdown */}
                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 107 }, (_, i) => 2026 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Disclosure text */}
                <p className="text-xs text-gray-500">
                  Used only to verify you are 18+. Deleted immediately after confirmation.
                </p>

                {/* Age verification consent checkbox */}
                <div className="flex items-start gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="ageVerifyConsent"
                    checked={ageVerifyConsent}
                    onChange={(e) => setAgeVerifyConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-red-500"
                  />
                  <label htmlFor="ageVerifyConsent" className="text-xs text-gray-400">
                    I consent to age verification using my birth date. This data is used only to confirm I am 18+ and is not retained.
                  </label>
                </div>
              </div>
            )}

            {/* Terms & Conditions - MODAL BUTTONS instead of external links */}
            {!isLogin && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-red-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-300">
                    I have read and agree to the{' '}
                    <button 
                      type="button"
                      onClick={() => setShowTermsModal('terms')} 
                      className="text-red-500 hover:underline"
                    >
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button 
                      type="button"
                      onClick={() => setShowTermsModal('privacy')} 
                      className="text-red-500 hover:underline"
                    >
                      Privacy Policy
                    </button>.
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && (!birthMonth || !birthDay || !birthYear || !ageVerifyConsent || !acceptedTerms || !usernameAvailable))}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 rounded-xl font-semibold transition-all transform hover:scale-105 text-white"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>

            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSignUpClick}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Don't have an account? <span className="text-red-500">Sign up</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Terms Modal - Credentials Step */}
      <TermsModal
        isOpen={showTermsModal === 'terms'}
        onClose={() => setShowTermsModal(null)}
        title="Terms of Service"
        content={fullTermsContent}
      />
      
      <TermsModal
        isOpen={showTermsModal === 'privacy'}
        onClose={() => setShowTermsModal(null)}
        title="Privacy Policy"
        content={fullPrivacyContent}
      />
    </>
  );
}