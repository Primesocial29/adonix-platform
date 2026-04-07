import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AgeVerification from './AgeVerification';
import CameraCapture from './CameraCapture';
import { AlertCircle } from 'lucide-react';

type OnboardingStep = 'auth' | 'age-verify' | 'photo' | 'profile';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { signUp, signIn, user } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('auth');
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: '',
    age: '',
    gender: '',
    fitnessLevel: '',
    bio: '',
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setStep('age-verify');
      } else {
        await signIn(email, password);
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAgeVerified = () => {
    setStep('photo');
  };

  const handlePhotoCapture = (dataUrl: string) => {
    setPhotoDataUrl(dataUrl);
    setStep('profile');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) throw new Error('No user found');

      let photoUrl = null;

      if (photoDataUrl) {
        const base64Data = photoDataUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        const fileName = `${user.id}-${Date.now()}.jpg`;
        const { error: uploadError, data } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, blob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        photoUrl = urlData.publicUrl;
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        display_name: profileData.displayName,
        age: parseInt(profileData.age),
        gender: profileData.gender,
        fitness_level: profileData.fitnessLevel,
        bio: profileData.bio,
        photo_url: photoUrl,
        age_verified: true,
        onboarding_completed: true,
      });

      if (profileError) throw profileError;

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'age-verify') {
    return <AgeVerification onVerified={handleAgeVerified} />;
  }

  if (step === 'photo') {
    return <CameraCapture onCapture={handlePhotoCapture} onSkip={() => setStep('profile')} />;
  }

  if (step === 'profile') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Complete Your Profile</h1>
            <p className="text-gray-400 text-lg">Tell us about yourself and your fitness goals</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
              <input
                type="text"
                required
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
              <input
                type="number"
                required
                min="18"
                max="120"
                value={profileData.age}
                onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
              <select
                required
                value={profileData.gender}
                onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Fitness Level</label>
              <select
                required
                value={profileData.fitnessLevel}
                onChange={(e) => setProfileData({ ...profileData, fitnessLevel: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
              >
                <option value="">Select fitness level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="athlete">Athlete</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
              <textarea
                rows={4}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell potential fitness partners about your goals, interests, and what you're looking for..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold transition-all transform hover:scale-105"
            >
              {loading ? 'Creating Profile...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="text-gray-400">
            {isSignUp ? 'Join the fitness partner marketplace' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold transition-all transform hover:scale-105"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-gray-400 hover:text-white transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
