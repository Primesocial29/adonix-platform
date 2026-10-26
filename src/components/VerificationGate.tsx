import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import TermsContent from './TermsContent';
import { CheckCircle, ArrowRight, ShieldCheck, Phone, Calendar } from 'lucide-react';

type Step = 'terms' | 'age' | 'phone' | 'complete';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function calculateAge(month: number, day: number, year: number): number {
  const today = new Date();
  const birthDate = new Date(year, month - 1, day);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export default function VerificationGate() {
  const { user, refreshUser, signOut } = useAuth();
  const [step, setStep] = useState<Step>('terms');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Terms state
  const termsScrollRef = useRef<HTMLDivElement>(null);
  const [termsScrolled, setTermsScrolled] = useState(false);

  // Age state
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [underage, setUnderage] = useState(false);

  // Phone state
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.user_metadata?.terms_accepted && user.phone_confirmed_at) {
      setStep('complete');
    } else if (user.user_metadata?.terms_accepted && user.user_metadata?.dob_verified) {
      setStep('phone');
    } else if (user.user_metadata?.terms_accepted) {
      setStep('age');
    } else {
      setStep('terms');
    }
  }, [user]);

  if (!user || step === 'complete') return null;

  const handleTermsScroll = () => {
    if (!termsScrollRef.current) return;
    const el = termsScrollRef.current;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 12;
    if (atBottom) setTermsScrolled(true);
  };

  const acceptTerms = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { terms_accepted: true },
      });
      if (updateError) throw updateError;
      await refreshUser();
      setStep('age');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save agreement.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmAge = async () => {
    setError('');
    const m = parseInt(birthMonth);
    const d = parseInt(birthDay);
    const y = parseInt(birthYear);
    if (!m || !d || !y) {
      setError('Please select your full date of birth.');
      return;
    }
    const age = calculateAge(m, d, y);
    if (age < 18) {
      setUnderage(true);
      return;
    }
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { dob_verified: true },
      });
      if (updateError) throw updateError;
      await refreshUser();
      setStep('phone');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save age verification.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const sendOtp = async () => {
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit US phone number.');
      return;
    }
    const formatted = `+1${digits}`;
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ phone: formatted });
      if (updateError) throw updateError;
      setOtpSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification code.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    const digits = phone.replace(/\D/g, '');
    const formatted = `+1${digits}`;
    if (otp.replace(/\D/g, '').length !== 6) {
      setError('Please enter the 6-digit code we sent you.');
      return;
    }
    setSubmitting(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: otp.trim(),
        type: 'phone_change',
      });
      if (verifyError) throw verifyError;
      await refreshUser();
      setStep('complete');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed. Check your code and try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = step === 'terms' ? 0 : step === 'age' ? 1 : 2;

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl border border-white/10 my-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-6 h-6 text-red-500" />
            <h1 className="text-xl font-bold text-white">Verify your account</h1>
          </div>
          <div className="flex items-center gap-2">
            {['Terms', 'Age', 'Phone'].map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className={`h-2 flex-1 rounded-full ${i <= stepIndex ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-white/10'}`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Step {stepIndex + 1} of 3 — required before you can continue
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* STEP A: TERMS */}
          {step === 'terms' && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Terms of Service</h2>
              <p className="text-sm text-gray-400 mb-4">Scroll to the bottom to enable the agreement button.</p>
              <div
                ref={termsScrollRef}
                onScroll={handleTermsScroll}
                className="h-72 overflow-y-auto p-4 bg-black/40 rounded-xl border border-white/10 mb-4"
              >
                <TermsContent />
              </div>
              <button
                onClick={acceptTerms}
                disabled={!termsScrolled || submitting}
                className={`w-full py-3 rounded-xl font-semibold transition ${termsScrolled && !submitting ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:scale-[1.02] text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
              >
                {submitting ? 'Saving...' : 'I Agree'}
              </button>
            </div>
          )}

          {/* STEP B: AGE */}
          {step === 'age' && (
            <div>
              {underage ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">⛔</div>
                  <h2 className="text-2xl font-bold text-white mb-2">You must be 18 or older</h2>
                  <p className="text-gray-400 mb-6">Adonix Fit is only available to users 18 years of age or older.</p>
                  <button
                    onClick={() => signOut().then(() => { window.location.href = '/'; })}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white transition"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-5 h-5 text-red-500" />
                    <h2 className="text-lg font-semibold text-white">Confirm your date of birth</h2>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">You must be 18 or older to use Adonix Fit.</p>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="px-3 py-3 bg-black border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="">Month</option>
                      {MONTHS.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
                    </select>
                    <select
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className="px-3 py-3 bg-black border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (<option key={d} value={d}>{d}</option>))}
                    </select>
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="px-3 py-3 bg-black border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 90 }, (_, i) => new Date().getFullYear() - 18 - i).map((y) => (<option key={y} value={y}>{y}</option>))}
                    </select>
                  </div>
                  <button
                    onClick={confirmAge}
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:scale-[1.02] rounded-xl font-semibold text-white transition disabled:opacity-50"
                  >
                    {submitting ? 'Verifying...' : 'Continue'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP C: PHONE */}
          {step === 'phone' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-white">Verify your phone number</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {otpSent ? 'Enter the 6-digit code we sent to your phone.' : 'We\'ll send a one-time code to confirm your number.'}
              </p>

              {!otpSent ? (
                <>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none mb-4"
                  />
                  <button
                    onClick={sendOtp}
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:scale-[1.02] rounded-xl font-semibold text-white transition disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send code'}
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-xl text-white text-center text-2xl tracking-[0.5em] placeholder-gray-600 focus:border-red-500 focus:outline-none mb-4"
                  />
                  <button
                    onClick={verifyOtp}
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:scale-[1.02] rounded-xl font-semibold text-white transition disabled:opacity-50 mb-2"
                  >
                    {submitting ? 'Verifying...' : 'Verify code'}
                  </button>
                  <button
                    onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                    className="w-full py-2 text-sm text-gray-400 hover:text-white transition"
                  >
                    Use a different number
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center gap-2 text-xs text-gray-500">
          <CheckCircle className="w-4 h-4 text-gray-600" />
          <span>Your information is encrypted and securely stored.</span>
        </div>
      </div>
    </div>
  );
}
