import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

function ConfirmLeaveModal({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
        <div className="text-center mb-4">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-white">Leave this page?</h2>
          <p className="text-gray-400 mt-2">Any unsaved changes will be lost.</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl">Leave</button>
        </div>
      </div>
    </div>
  );
}

export default function PartnerSignup({ onSuccess }: { onSuccess: () => void }) {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const passwordMinLength = password.length >= 8;
  const passwordHasUpper = /[A-Z]/.test(password);
  const passwordHasLower = /[a-z]/.test(password);
  const passwordHasNumber = /[0-9]/.test(password);
  const passwordHasSpecial = /[!@#$%^&*]/.test(password);
  const isPasswordValid = passwordMinLength && passwordHasUpper && passwordHasLower && passwordHasNumber && passwordHasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!firstName.trim()) { setError('First name is required'); return; }
    if (!lastName.trim()) { setError('Last name is required'); return; }
    if (!email.trim()) { setError('Email is required'); return; }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) { setError('Please enter a valid 10-digit phone number'); return; }
    if (!isPasswordValid) { setError('Please enter a valid password'); return; }
    
    setLoading(true);
    try {
      const autoUsername = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Date.now()}`;
      await signUp(email, password, 'partner', autoUsername, null);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setShowConfirmModal(true);
  const confirmLeave = () => window.location.href = '/';

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
            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
          </div>

          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white">Create Your Account</h1>
              <p className="text-gray-400 mt-1">Join as a Partner</p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none" required />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none" required />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none" required />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <p className={`text-xs ${passwordMinLength ? 'text-green-400' : 'text-gray-500'}`}>✓ At least 8 characters</p>
                  <p className={`text-xs ${passwordHasUpper ? 'text-green-400' : 'text-gray-500'}`}>✓ At least 1 uppercase letter</p>
                  <p className={`text-xs ${passwordHasLower ? 'text-green-400' : 'text-gray-500'}`}>✓ At least 1 lowercase letter</p>
                  <p className={`text-xs ${passwordHasNumber ? 'text-green-400' : 'text-gray-500'}`}>✓ At least 1 number</p>
                  <p className={`text-xs ${passwordHasSpecial ? 'text-green-400' : 'text-gray-500'}`}>✓ At least 1 special character (!@#$%^&*)</p>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-semibold hover:scale-105 transition disabled:opacity-50">
                {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
              </button>
            </form>

            <div className="text-center mt-6">
              <button onClick={handleClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition">BACK</button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmLeaveModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmLeave} />
    </>
  );
}