import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import PublicHome from './components/PublicHome';
import AdminDashboard from './components/AdminDashboard';
import PartnerProfileSetup from './components/PartnerProfileSetup';
import ClientOnboarding from './components/ClientOnboarding';
import PartnerDashboard from './components/PartnerDashboard';
import ClientDashboard from './components/ClientDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import ContactPage from './components/ContactPage';
import Settings from './components/Settings';
import AccessibilityPage from './components/AccessibilityPage';
import BrowsePartners from './components/BrowsePartners';
import SafetyPage from './components/SafetyPage';
import CompleteProfile from './components/CompleteProfile';
import LoginPage from './components/LoginPage';
import { useAuth } from './hooks/useAuth';

// Terms Modal for CHECKBOXES - requires scroll-to-accept
function CheckboxTermsModal({ isOpen, onClose, onAccept, title, content }: { 
  isOpen: boolean; onClose: () => void; onAccept: () => void; title: string; content: string 
}) {
  const [canAccept, setCanAccept] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCanAccept(false);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, [isOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
    if (isAtBottom && !canAccept) {
      setCanAccept(true);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 text-gray-300 space-y-4"
        >
          <div className="whitespace-pre-wrap">{content}</div>
          <div className="h-10 text-center text-xs text-gray-500 pt-4">
            {!canAccept && "▼ Scroll to the bottom to accept ▼"}
          </div>
        </div>
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={onAccept}
            disabled={!canAccept}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
              canAccept 
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple Modal for FOOTER - view only, no agreement needed
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

// Confirm Leave Modal
function ConfirmLeaveModal({ isOpen, onClose, onConfirm, message }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; message: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
        <div className="text-center mb-4">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-white">Leave this page?</h2>
          <p className="text-gray-400 mt-2">{message}</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl">Leave</button>
        </div>
      </div>
    </div>
  );
}

// Partner Signup Screen - matches client setup exactly
function PartnerSignupScreen({ onSuccess }: { onSuccess: () => void }) {
  const { signUp, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [step1Error, setStep1Error] = useState('');
  const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | null>(null);
  
  // Account fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation errors
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Birth date
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [ageVerifyConsent, setAgeVerifyConsent] = useState(false);
  const [facialAgeConsent, setFacialAgeConsent] = useState(false);
  
  // Terms
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [gatekeeperAccepted, setGatekeeperAccepted] = useState(false);

  // Password strength
  const passwordMinLength = password.length >= 8;
  const passwordHasUpper = /[A-Z]/.test(password);
  const passwordHasLower = /[a-z]/.test(password);
  const passwordHasNumber = /[0-9]/.test(password);
  const passwordHasSpecial = /[!@#$%^&*]/.test(password);
  const isPasswordValid = passwordMinLength && passwordHasUpper && passwordHasLower && passwordHasNumber && passwordHasSpecial;

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

  const validateAge = () => {
    if (!birthMonth || !birthDay || !birthYear) {
      setBirthDateError('Please enter your full birth date.');
      return false;
    }
    const age = calculateAge(birthMonth, birthDay, birthYear);
    if (age === null || age < 18) {
      setBirthDateError('You must be at least 18 years old to use Adonix Fit.');
      return false;
    }
    setBirthDateError('');
    return true;
  };

  const validateForm = () => {
    let isValid = true;
    
    if (!firstName.trim()) { setFirstNameError('First name is required'); isValid = false; }
    else { setFirstNameError(''); }
    
    if (!lastName.trim()) { setLastNameError('Last name is required'); isValid = false; }
    else { setLastNameError(''); }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) { setEmailError('Please enter a valid email address'); isValid = false; }
    else { setEmailError(''); }
    
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone.trim() || phoneDigits.length !== 10) { setPhoneError('Please enter a valid 10-digit phone number'); isValid = false; }
    else { setPhoneError(''); }
    
    if (!isPasswordValid) { isValid = false; }
    
    if (!validateAge()) { isValid = false; }
    
    if (!ageVerifyConsent) { isValid = false; }
    if (!facialAgeConsent) { isValid = false; }
    if (!termsAccepted) { isValid = false; }
    if (!privacyAccepted) { isValid = false; }
    if (!gatekeeperAccepted) { isValid = false; }
    
    return isValid;
  };

  const handleFirstNameChange = (val: string) => {
    setFirstName(val);
    if (!val.trim()) setFirstNameError('First name is required');
    else setFirstNameError('');
  };

  const handleLastNameChange = (val: string) => {
    setLastName(val);
    if (!val.trim()) setLastNameError('Last name is required');
    else setLastNameError('');
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim() || !emailRegex.test(val)) setEmailError('Please enter a valid email address');
    else setEmailError('');
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    let formatted = '';
    if (digits.length >= 1) formatted = '(' + digits.substring(0, 3);
    if (digits.length >= 4) formatted += ') ' + digits.substring(3, 6);
    if (digits.length >= 7) formatted += '-' + digits.substring(6, 10);
    setPhone(formatted);
    
    if (digits.length === 10 && digits[0] >= '2') setPhoneError('');
    else if (digits.length > 0 && digits.length !== 10) setPhoneError('Please enter a valid 10-digit phone number');
    else if (digits.length === 10 && digits[0] < '2') setPhoneError('Please enter a valid US phone number');
    else setPhoneError('');
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (!val) setPasswordError('');
    else if (!passwordMinLength) setPasswordError('Password must be at least 8 characters');
    else if (!passwordHasUpper) setPasswordError('Password must contain at least 1 uppercase letter');
    else if (!passwordHasLower) setPasswordError('Password must contain at least 1 lowercase letter');
    else if (!passwordHasNumber) setPasswordError('Password must contain at least 1 number');
    else if (!passwordHasSpecial) setPasswordError('Password must contain at least 1 special character (!@#$%^&*)');
    else setPasswordError('');
  };

  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setShowTermsModal(null);
  };

  const handlePrivacyAccept = () => {
    setPrivacyAccepted(true);
    setShowTermsModal(null);
  };

  const handleClose = () => setShowConfirmModal(true);
  const confirmLeave = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error('');
    
    if (!validateForm()) {
      setStep1Error('Please fill in all required fields and check all boxes.');
      return;
    }
    
    setLoading(true);
    try {
      const autoUsername = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Date.now()}`;
      const formattedBirthDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
      await signUp(email, password, 'partner', autoUsername, formattedBirthDate);
      onSuccess();
    } catch (err: any) {
      setStep1Error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress
  const sections = [
    !!firstName && !firstNameError,
    !!lastName && !lastNameError,
    !!email && !emailError,
    !!phone && !phoneError,
    isPasswordValid,
    !!birthMonth && !!birthDay && !!birthYear && ageVerifyConsent && facialAgeConsent,
    termsAccepted && privacyAccepted && gatekeeperAccepted,
  ];
  const progress = Math.round((sections.filter(Boolean).length / sections.length) * 100);

  const termsContent = `ADONIX - SOCIAL NETWORKING AGREEMENT

1. This is a social fitness network, not a professional service marketplace.

2. Partners are independent social participants, not employees or contractors of Adonix.

3. Suggested contributions are voluntary social gifts, not professional service fees.

4. All meetups must occur at verified public locations. No private residences, hotels, or Airbnbs.

5. You are responsible for your own safety and well-being during meetups.

6. Adonix is not liable for any injuries, damages, or incidents that occur during meetups.

7. Platform Support (15%) + processing fees are deducted from each suggested contribution.

8. Violation of these terms may result in permanent account suspension.`;

  const privacyContent = `ADONIX - PRIVACY POLICY

Information We Collect:
- Name, email, phone number, age, city, photos, and location data
- Meetup history and preferences

How We Use Your Information:
- To facilitate meetups and verify identities
- To improve our platform and match you with partners

Data Sharing:
- We do not sell your personal data
- Payment information is processed securely through Stripe

Location Data:
- Used only during active meetups for GPS check-in verification

Data Retention:
- You may request deletion of your account and data at any time

California Residents:
- You have the right to opt out of data sharing under CPRA`;

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <img src="/adonixlogo.png" alt="Adonix Logo" className="h-10 w-auto" />
              <span className="text-xl font-bold text-white">ADONIX</span>
              <span className="text-xs text-gray-400">Social Fitness, Elevated</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-end mb-4">
            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="text-5xl mb-3">💰</div>
            <h1 className="text-3xl font-bold text-white">I want to make people sweat</h1>
            <p className="text-lg text-gray-300 mt-1">Join as a Partner</p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Account Setup</span>
              <span className="text-red-400 font-mono font-bold">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            {step1Error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {step1Error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => handleFirstNameChange(e.target.value)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none ${
                      firstNameError ? 'border-red-500' : 'border-white/20 focus:border-red-500'
                    }`}
                  />
                  {firstNameError && <p className="text-red-400 text-xs mt-1">{firstNameError}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => handleLastNameChange(e.target.value)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none ${
                      lastNameError ? 'border-red-500' : 'border-white/20 focus:border-red-500'
                    }`}
                  />
                  {lastNameError && <p className="text-red-400 text-xs mt-1">{lastNameError}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none ${
                    emailError ? 'border-red-500' : 'border-white/20 focus:border-red-500'
                  }`}
                />
                {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(555) 123-4567"
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none ${
                    phoneError ? 'border-red-500' : 'border-white/20 focus:border-red-500'
                  }`}
                />
                {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none pr-10 ${
                      passwordError ? 'border-red-500' : 'border-white/20 focus:border-red-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <p className={`text-xs ${passwordMinLength ? 'text-green-400' : 'text-gray-500'}`}>
                    {passwordMinLength ? '✓' : '○'} At least 8 characters
                  </p>
                  <p className={`text-xs ${passwordHasUpper ? 'text-green-400' : 'text-gray-500'}`}>
                    {passwordHasUpper ? '✓' : '○'} At least 1 uppercase letter
                  </p>
                  <p className={`text-xs ${passwordHasLower ? 'text-green-400' : 'text-gray-500'}`}>
                    {passwordHasLower ? '✓' : '○'} At least 1 lowercase letter
                  </p>
                  <p className={`text-xs ${passwordHasNumber ? 'text-green-400' : 'text-gray-500'}`}>
                    {passwordHasNumber ? '✓' : '○'} At least 1 number
                  </p>
                  <p className={`text-xs ${passwordHasSpecial ? 'text-green-400' : 'text-gray-500'}`}>
                    {passwordHasSpecial ? '✓' : '○'} At least 1 special character (!@#$%^&*)
                  </p>
                </div>
                {passwordError && <p className="text-red-400 text-xs mt-1">{passwordError}</p>}
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Birth Date <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={birthMonth}
                    onChange={(e) => { setBirthMonth(e.target.value); setBirthDateError(''); }}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={birthDay}
                    onChange={(e) => { setBirthDay(e.target.value); setBirthDateError(''); }}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <select
                    value={birthYear}
                    onChange={(e) => { setBirthYear(e.target.value); setBirthDateError(''); }}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 107 }, (_, i) => 2026 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                {birthDateError && <p className="text-red-400 text-xs mt-1">{birthDateError}</p>}
                <p className="text-xs text-gray-500 mt-2">
                  Used only to verify you are 18+. Deleted immediately after confirmation.
                </p>

                <div className="flex items-start gap-2 mt-3">
                  <input
                    type="checkbox"
                    id="ageVerifyConsent"
                    checked={ageVerifyConsent}
                    onChange={(e) => setAgeVerifyConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-red-500"
                  />
                  <label htmlFor="ageVerifyConsent" className="text-xs text-gray-400">
                    I consent to age verification using my birth date. This data is used only to confirm I am 18+ and is not retained. <span className="text-red-500">*</span>
                  </label>
                </div>

                <div className="flex items-start gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="facialAgeConsent"
                    checked={facialAgeConsent}
                    onChange={(e) => setFacialAgeConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-red-500"
                  />
                  <label htmlFor="facialAgeConsent" className="text-xs text-gray-400">
                    I consent to facial age estimation (optional). My image will be used only for age verification and deleted immediately. <span className="text-red-500">*</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-xs text-yellow-300 font-semibold mb-2">⚠️ IMPORTANT INFORMATION</p>
                <ul className="space-y-1 text-xs text-yellow-200/80">
                  <li>• Adonix is a social fitness network, not a professional service.</li>
                  <li>• You are joining to meet fitness partners in public locations only.</li>
                  <li>• No professional fitness services are provided or implied.</li>
                  <li>• Private residences, hotels, and Airbnbs are strictly prohibited.</li>
                  <li>• Harassment, solicitation, or unsafe behavior = permanent ban.</li>
                </ul>
              </div>
              
              <div className="mt-6 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    readOnly
                    className="mt-1 w-5 h-5 accent-red-600 cursor-default shrink-0"
                  />
                  <span className="text-sm text-gray-300">
                    I have read and agree to the{' '}
                    <button 
                      onClick={() => setShowTermsModal('terms')} 
                      className="text-red-400 underline hover:text-red-300 transition-colors"
                    >
                      Terms of Service
                    </button>. <span className="text-red-500">*</span>
                  </span>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    readOnly
                    className="mt-1 w-5 h-5 accent-red-600 cursor-default shrink-0"
                  />
                  <span className="text-sm text-gray-300">
                    I have read and agree to the{' '}
                    <button 
                      onClick={() => setShowTermsModal('privacy')} 
                      className="text-red-400 underline hover:text-red-300 transition-colors"
                    >
                      Privacy Policy
                    </button>. <span className="text-red-500">*</span>
                  </span>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gatekeeperAccepted}
                    onChange={(e) => setGatekeeperAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-red-600"
                  />
                  <span className="text-sm text-gray-300">
                    I understand that Adonix is a social fitness platform — not a personal training service, dating app, or escort service. <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={handleClose}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition"
            >
              BACK
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-semibold transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
            </button>
          </div>
        </div>
      </div>

      {/* Checkbox Modals - require scroll to accept */}
      {showTermsModal === 'terms' && (
        <CheckboxTermsModal
          isOpen={true}
          onClose={() => setShowTermsModal(null)}
          onAccept={handleTermsAccept}
          title="Terms of Service"
          content={termsContent}
        />
      )}
      
      {showTermsModal === 'privacy' && (
        <CheckboxTermsModal
          isOpen={true}
          onClose={() => setShowTermsModal(null)}
          onAccept={handlePrivacyAccept}
          title="Privacy Policy"
          content={privacyContent}
        />
      )}

      <ConfirmLeaveModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmLeave}
        message="Any unsaved changes will be lost. You will be signed out."
      />
    </>
  );
}

// Partner Flow Wrapper
function PartnerFlow() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <PartnerSignupScreen onSuccess={() => window.location.reload()} />;
  }
  
  return <PartnerProfileSetup onComplete={() => window.location.href = '/partner-dashboard'} />;
}

// Role Selection Component with Footer
function RoleSelection() {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const handleRoleSelect = (role: 'client' | 'partner') => {
    if (role === 'client') {
      window.location.href = '/client-setup';
    } else {
      window.location.href = '/partner-setup';
    }
  };

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
      <div className="min-h-screen bg-black text-white flex flex-col">
        <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <img 
                src="/adonixlogo.png" 
                alt="Adonix Logo" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-white">ADONIX</span>
              <span className="text-xs text-gray-400">Social Fitness, Elevated</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🔥</div>
            <h1 className="text-3xl font-bold text-white">Welcome to Adonix Fit</h1>
            <p className="text-lg text-gray-300 mt-1">Choose your path</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => handleRoleSelect('client')}
              className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-red-500/50 transition-all group hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">💸</div>
                <h2 className="text-2xl font-bold text-white mb-2">I WANT TO SWEAT</h2>
                <p className="text-gray-400 mb-4">You will pay for sessions</p>
                <div className="text-sm text-gray-500">Find fitness partners near you</div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('partner')}
              className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-red-500/50 transition-all group hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">💰</div>
                <h2 className="text-2xl font-bold text-white mb-2">I WANT TO MAKE PEOPLE SWEAT</h2>
                <p className="text-gray-400 mb-4">You will get paid for sessions</p>
                <div className="text-sm text-gray-500">Become a partner and earn</div>
              </div>
            </button>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-400 mb-3">Already have an account?</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition-all transform hover:scale-105"
            >
              SIGN IN
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/80 backdrop-blur-sm mt-8">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-xs text-gray-500">
                © 2026 ADONIX. All rights reserved.
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-xs">
                <button onClick={() => setShowTermsModal(true)} className="text-red-400 hover:text-red-300 transition-colors">
                  Terms of Service
                </button>
                <button onClick={() => setShowPrivacyModal(true)} className="text-red-400 hover:text-red-300 transition-colors">
                  Privacy Policy
                </button>
                <button onClick={() => setShowSafetyModal(true)} className="text-red-400 hover:text-red-300 transition-colors">
                  Safety Guidelines
                </button>
              </div>
            </div>
            <div className="text-center text-xs text-gray-600 mt-4">
              Adonix is a social fitness network — not a professional service. Meet only at verified public locations. GPS check-in required.
            </div>
          </div>
        </footer>
      </div>

      {/* Footer Modals - view only, no agreement needed */}
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
    </>
  );
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentRoute === '/login') {
    return <LoginPage />;
  }

  if (currentRoute === '/setup' || currentRoute === '/' || currentRoute === '') {
    return <RoleSelection />;
  }

  if (currentRoute === '/partner-setup') {
    return <PartnerFlow />;
  }

  if (currentRoute === '/client-dashboard') {
    return <ClientDashboard />;
  }

  if (currentRoute === '/browse') {
    return <BrowsePartners />;
  }

  if (currentRoute === '/my-requests') {
    window.location.href = '/client-dashboard';
    return null;
  }

  if (currentRoute === '/dashboard') {
    return <PublicHome />;
  }

  if (currentRoute === '/admin-view') {
    return <AdminDashboard />;
  }

  if (currentRoute === '/partner-dashboard') {
    return <PartnerDashboard />;
  }

  if (currentRoute === '/trainer-dashboard') {
    return <TrainerDashboard />;
  }

  if (currentRoute === '/client-setup') {
    return <ClientOnboarding onComplete={() => {
      window.location.href = '/client-dashboard';
    }} />;
  }

  if (currentRoute === '/complete-profile') {
    window.location.href = '/setup';
    return null;
  }

  if (currentRoute === '/settings') {
    return <Settings />;
  }

  if (currentRoute === '/terms') {
    return <TermsPage />;
  }
  if (currentRoute === '/privacy') {
    return <PrivacyPage />;
  }
  if (currentRoute === '/contact') {
    return <ContactPage />;
  }

  if (currentRoute === '/accessibility') {
    return <AccessibilityPage />;
  }

  if (currentRoute === '/safety') {
    return <SafetyPage />;
  }

  return <RoleSelection />;
}

export default App;