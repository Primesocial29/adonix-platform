import React, { useState, useEffect } from 'react';
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
                ⚠️ Please scroll to the bottom to read the complete {title} before agreeing ⚠️
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
            {hasAgreed ? '✓ Agreed' : (hasScrolledToBottom ? 'I have read and understand' : 'Scroll to bottom to agree')}
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedGatekeeper, setAcceptedGatekeeper] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | null>(null);
  
  // Birth date dropdowns
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthDateError, setBirthDateError] = useState('');

  if (!isOpen) return null;

  const validateUsername = (value: string) => {
    if (!value) return '';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username cannot exceed 20 characters';
    if (!/^[a-zA-Z0-9_.]+$/.test(value)) return 'Use only letters, numbers, underscore (_), and period (.)';
    return '';
  };

  // Calculate age from dropdowns
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

  // Validate age from dropdowns
  const validateAgeFromDropdowns = () => {
    if (!birthMonth || !birthDay || !birthYear) {
      return { isValid: false, error: 'Please enter your full birth date.' };
    }
    
    const age = calculateAge(birthMonth, birthDay, birthYear);
    if (age === null || age < 18) {
      return { isValid: false, error: 'You must be at least 18 years old to use Adonix Fit.' };
    }
    
    return { isValid: true, error: null };
  };

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
      setFirstName('');
      setLastName('');
      setPhone('');
      setUsername('');
      setBirthMonth('');
      setBirthDay('');
      setBirthYear('');
      setAcceptedTerms(false);
      setAcceptedPrivacy(false);
      setAcceptedGatekeeper(false);
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
    setFirstName('');
    setLastName('');
    setPhone('');
    setUsername('');
    setBirthMonth('');
    setBirthDay('');
    setBirthYear('');
    setAcceptedTerms(false);
    setAcceptedPrivacy(false);
    setAcceptedGatekeeper(false);
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

    // Sign up validation
    if (!firstName) {
      setError('Please enter your first name.');
      setLoading(false);
      return;
    }
    if (!lastName) {
      setError('Please enter your last name.');
      setLoading(false);
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (!phone || phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      setLoading(false);
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }
    
    // Validate birth date from dropdowns
    const ageValidation = validateAgeFromDropdowns();
    if (!ageValidation.isValid) {
      setError(ageValidation.error);
      setLoading(false);
      return;
    }
    
    if (!acceptedTerms) {
      setError('You must agree to the Terms of Service.');
      setLoading(false);
      return;
    }
    if (!acceptedPrivacy) {
      setError('You must agree to the Privacy Policy.');
      setLoading(false);
      return;
    }
    if (!acceptedGatekeeper) {
      setError('You must acknowledge the social fitness platform agreement.');
      setLoading(false);
      return;
    }
    if (!selectedRole) {
      setError('Please select a role.');
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

    const formattedBirthDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;

    try {
      await signUp(email, password, selectedRole, username.toLowerCase(), formattedBirthDate);
      onClose();
      
      setTimeout(() => {
        if (selectedRole === 'partner') {
          window.location.replace('/partner-setup');
        } else {
          window.location.replace('/client-setup');
        }
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    let formatted = '';
    if (digits.length >= 1) formatted = '(' + digits.substring(0, 3);
    if (digits.length >= 4) formatted += ') ' + digits.substring(3, 6);
    if (digits.length >= 7) formatted += '-' + digits.substring(6, 10);
    setPhone(formatted);
  };

  // Password strength checks
  const passwordMinLength = password.length >= 8;
  const passwordHasUpper = /[A-Z]/.test(password);
  const passwordHasLower = /[a-z]/.test(password);
  const passwordHasNumber = /[0-9]/.test(password);
  const passwordHasSpecial = /[!@#$%^&*]/.test(password);

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
              <div className="text-5xl mb-3">🔥</div>
              <h2 className="text-3xl font-bold text-white mb-2">I Want to Sweat</h2>
              <p className="text-lg text-gray-300">Join the social fitness network</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* I Want to Sweat button - REDIRECTS DIRECTLY TO /client-setup */}
              <button
                onClick={() => {
                  onClose();
                  window.location.href = '/client-setup';
                }}
                className="group p-6 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-red-500 hover:bg-red-500/10 transition-all text-center w-full"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🔥</div>
                <div className="font-bold text-xl text-white mb-2">I Want to Sweat</div>
                <div className="text-sm font-medium text-gray-300 bg-white/10 py-1 px-2 rounded-full inline-block">
                  💸 I will pay for sessions
                </div>
              </button>

              {/* I Make People Sweat button - REDIRECTS DIRECTLY TO /partner-setup */}
              <button
                onClick={() => {
                  onClose();
                  window.location.href = '/partner-setup';
                }}
                className="group p-6 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-red-500 hover:bg-red-500/10 transition-all text-center w-full"
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

        <TermsModal
          isOpen={showTermsModal === 'terms'}
          onClose={() => setShowTermsModal(null)}
          title="Terms of Service"
          content={fullTermsContent}
          onAgree={() => {}}
        />
        
        <TermsModal
          isOpen={showTermsModal === 'privacy'}
          onClose={() => setShowTermsModal(null)}
          title="Privacy Policy"
          content={fullPrivacyContent}
          onAgree={() => {}}
        />
      </>
    );
  }

  // ========== CREDENTIALS STEP (Sign Up Form) - NOT USED ANYMORE ==========
  // This section is kept but won't be reached because buttons now redirect directly
  return null;
}