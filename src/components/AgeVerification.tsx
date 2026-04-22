import { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';

interface AgeVerificationProps {
  onVerified: () => void;
}

export default function AgeVerification({ onVerified }: AgeVerificationProps) {
  const [birthDate, setBirthDate] = useState({ month: '', day: '', year: '' });
  const [error, setError] = useState('');

  const handleVerify = () => {
    setError('');

    if (!birthDate.month || !birthDate.day || !birthDate.year) {
      setError('Please enter your complete date of birth');
      return;
    }

    const month = parseInt(birthDate.month);
    const day = parseInt(birthDate.day);
    const year = parseInt(birthDate.year);

    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > new Date().getFullYear()) {
      setError('Please enter a valid date');
      return;
    }

    const birthDateObj = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }

    if (age < 18) {
      setError('You must be 18 or older to use Hot Buddies');
      return;
    }

    onVerified();
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Age Verification</h1>
          <p className="text-gray-400 text-lg">
            Adonix is an adult platform. Please verify you are 18 or older to continue.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <label className="block text-sm font-medium text-gray-300 mb-4">Date of Birth</label>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <input
                type="number"
                placeholder="MM"
                min="1"
                max="12"
                value={birthDate.month}
                onChange={(e) => setBirthDate({ ...birthDate, month: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Month</p>
            </div>
            <div>
              <input
                type="number"
                placeholder="DD"
                min="1"
                max="31"
                value={birthDate.day}
                onChange={(e) => setBirthDate({ ...birthDate, day: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Day</p>
            </div>
            <div>
              <input
                type="number"
                placeholder="YYYY"
                min="1900"
                max={new Date().getFullYear()}
                value={birthDate.year}
                onChange={(e) => setBirthDate({ ...birthDate, year: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Year</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <button
            onClick={handleVerify}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-full font-semibold transition-all transform hover:scale-105"
          >
            Verify Age
          </button>

          <p className="text-xs text-gray-500 text-center mt-6">
            Your information is secure and will not be shared.
          </p>
        </div>
      </div>
    </div>
  );
}
