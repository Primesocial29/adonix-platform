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
  
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | null>(null);

  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [ageVerifyConsent, setAgeVerifyConsent] = useState(false);

  if (!isOpen) return null;

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

    const age = calculateAge(birthMonth, birthDay, birthYear);
    if (age < 18) return setError('Strictly 18+. Underage accounts are prohibited per FL SB 1722.');
    if (!ageVerifyConsent) return setError('Consent to age verification is required.');
    if (!hasReadTerms || !hasReadPrivacy) return setError('Please read and accept both the Terms and Privacy Policy.');

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
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">USERNAME</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">@</span>
                  <input
                    className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    placeholder="fit_pro"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <select className="bg-gray-800 border border-white/10 rounded p-2 text-white text-sm" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
                <select className="bg-gray-800 border border-white/10 rounded p-2 text-white text-sm" value={birthDay} onChange={(e) => setBirthDay(e.target.value)}>
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
                <select className="bg-gray-800 border border-white/10 rounded p-2 text-white text-sm" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
                  <option value="">Year</option>
                  {Array.from({ length: 100 }, (_, i) => <option key={i} value={2026-i}>{2026-i}</option>)}
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" className="mt-1" checked={ageVerifyConsent} onChange={(e) => setAgeVerifyConsent(e.target.checked)} />
                  <span className="text-xs text-gray-400">I consent to age verification per Section 2 of the Terms.</span>
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