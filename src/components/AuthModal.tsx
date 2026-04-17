import React, { useState, useEffect, useRef } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setHasScrolledToBottom(isAtBottom);
    }
  };

  const handleAgree = () => {
    setHasAgreed(true);
    if (onAgree) onAgree();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      setHasAgreed(false);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 text-gray-300 space-y-4 whitespace-pre-wrap font-sans text-sm leading-relaxed"
        >
          {content}
        </div>
        
        <div className="p-4 border-t border-white/10 bg-gray-900/50">
          {!hasScrolledToBottom && (
            <p className="text-center text-xs text-yellow-400 mb-3 animate-pulse">
              ⚠️ Please scroll to the bottom to verify you have read the {title} ⚠️
            </p>
          )}
          <button
            onClick={handleAgree}
            disabled={!hasScrolledToBottom || hasAgreed}
            className={`w-full px-4 py-3 rounded-lg font-bold transition-all ${
              hasScrolledToBottom && !hasAgreed
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : hasAgreed
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {hasAgreed ? '✓ Accepted' : (hasScrolledToBottom ? `Accept ${title}` : 'Scroll to bottom to enable')}
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Terms & Privacy Tracking
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | null>(null);

  // Age Verification Fields
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [ageVerifyConsent, setAgeVerifyConsent] = useState(false);

  if (!isOpen) return null;

  const validateUsername = (val: string) => {
    if (val.length < 3 || val.length > 20) return false;
    return /^[a-zA-Z0-9_.]+$/.test(val);
  };

  const calculateAge = (m: string, d: string, y: string) => {
    if (!m || !d || !y) return 0;
    const birth = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isLogin) {
      setLoading(true);
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

    // Sign Up Logic
    const age = calculateAge(birthMonth, birthDay, birthYear);
    if (age < 18) return setError('Strictly 18+. Underage accounts are prohibited per FL SB 1722.');
    if (!ageVerifyConsent) return setError('Consent to age verification is required.');
    if (!hasReadTerms || !hasReadPrivacy) return setError('Please read and accept both the Terms and Privacy Policy.');
    if (!usernameAvailable) return setError('Username is unavailable.');

    setLoading(true);
    const formattedBirthDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
    
    try {
      await signUp(email, password, selectedRole!, username.toLowerCase(), formattedBirthDate);
      onClose();
      window.location.href = selectedRole === 'partner' ? '/partner-setup' : '/client-setup';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const fullTermsContent = `ADONIX FIT - TERMS OF SERVICE
Effective: April 17, 2026 | Last updated: April 17, 2026

1. ACCEPTANCE OF TERMS
Strictly fitness/wellness. Not a dating or escort app. Immediate ban for romantic/sexual solicitation.

2. USA-ONLY & 18+ ELIGIBILITY
Available only in the USA/Territories. No VPNs. Strictly 18+. 
CRIMINAL HISTORY WARRANTY: By joining, you warrant you have NO felony convictions, NO convictions for violence, stalking, or sexual misconduct, and are NOT a registered sex offender.

[Sections 3-4: Biometrics & Usernames...]

5. PROHIBITED CONDUCT (ZERO-TOLERANCE)
Immediate Ban: Sexual assault, unwanted physical contact, stalking, "creep shots" (non-consensual photos), nudity, deepfakes, and external payment apps (Venmo/CashApp).

[Sections 6-34: Payments, GPS, Independent Contractor, Marketing, etc...]

35. TWO-PERSON ONLY SESSIONS
Sessions are strictly 1-on-1. No spectators, children, or pets (excluding ADA animals).

36. WAIVER OF JURY TRIAL
Arbitration in Orange County, FL only.

37. SAFE-MEETING PROTOCOLS
- "Right to Leave": Users may end any session instantly if they feel unsafe.
- "Public Only": No residences or private gyms. 3-strike enforcement.
- "Communication": Keep all chat in-app to protect personal contact data.

(Full 37-section text integrated into production build)`;

  const fullPrivacyContent = `ADONIX FIT - PRIVACY POLICY
Effective: April 17, 2026

1. DATA PROTECTION
We verify 18+ status; age data is deleted immediately after confirmation. GPS is used solely for session safety and the SOS feature.

2. FEMALE USER PROTECTION
Precise location is shared only during active sessions for safety verification. We do not sell or share your location data for marketing.

[Full Privacy text...]`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl max-w-md w-full p-8 relative overflow-y-auto max-h-[95vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">{isLogin ? 'Welcome Back' : 'Join Adonix Fit'}</h2>
          {error && <p className="mt-2 text-sm text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">{error}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Username Field */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">USERNAME</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">@</span>
                  <input
                    className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    placeholder="fit_pro"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Birth Date Selectors */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">MONTH</label>
                  <select className="w-full bg-gray-800 border border-white/10 rounded p-2 text-white text-sm" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">DAY</label>
                  <select className="w-full bg-gray-800 border border-white/10 rounded p-2 text-white text-sm" value={birthDay} onChange={(e) => setBirthDay(e.target.value)}>
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">YEAR</label>
                  <select className="w-full bg-gray-800 border border-white/10 rounded p-2 text-white text-sm" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
                    <option value="">Year</option>
                    {Array.from({ length: 100 }, (_, i) => <option key={i} value={2026-i}>{2026-i}</option>)}
                  </select>
                </div>
              </div>

              {/* Legal Checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" className="mt-1" checked={ageVerifyConsent} onChange={(e) => setAgeVerifyConsent(e.target.checked)} />
                  <span className="text-xs text-gray-400 group-hover:text-gray-200">I consent to age verification. My data will be deleted immediately after.</span>
                </label>
                
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setShowTermsModal('terms')} className={`text-xs text-left px-3 py-2 rounded border ${hasReadTerms ? 'border-green-500/50 text-green-400' : 'border-white/10 text-red-400'}`}>
                    {hasReadTerms ? '✓ Terms of Service Accepted' : 'Click to Read Terms of Service (Required)'}
                  </button>
                  <button type="button" onClick={() => setShowTermsModal('privacy')} className={`text-xs text-left px-3 py-2 rounded border ${hasReadPrivacy ? 'border-green-500/50 text-green-400' : 'border-white/10 text-red-400'}`}>
                    {hasReadPrivacy ? '✓ Privacy Policy Accepted' : 'Click to Read Privacy Policy (Required)'}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="space-y-3">
            <input className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all">
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-sm text-gray-400 hover:text-white">
          {isLogin ? "Need an account? Sign Up" : "Have an account? Sign In"}
        </button>
      </div>

      <TermsModal isOpen={showTermsModal === 'terms'} onClose={() => setShowTermsModal(null)} title="Terms of Service" content={fullTermsContent} onAgree={() => setHasReadTerms(true)} />
      <TermsModal isOpen={showTermsModal === 'privacy'} onClose={() => setShowTermsModal(null)} title="Privacy Policy" content={fullPrivacyContent} onAgree={() => setHasReadPrivacy(true)} />
    </div>
  );
}