import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Camera, CheckCircle, X, AlertCircle, Sparkles } from 'lucide-react';
import { validateText, containsBlockedWords } from '../lib/textSanitizer';
import BlockedWordAlert from './BlockedWordAlert';
import LiveCameraCapture from './LiveCameraCapture';

interface ClientProfileSetupProps {
  onComplete: () => void;
  onClose?: () => void;
}

// Terms Modal Component
function TermsModal({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: string }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-gray-300 space-y-4">
          <p>{content}</p>
        </div>
        <div className="p-4 border-t border-white/10">
          <button onClick={onClose} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientProfileSetup({ onComplete, onClose }: ClientProfileSetupProps) {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Form fields
  const [photo, setPhoto] = useState<string>('');
  const [bio, setBio] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState('');
  const [age, setAge] = useState('');
  
  // Terms acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');
  
  // Validation states
  const [bioError, setBioError] = useState<string | null>(null);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  
  // Check if all required fields are complete
  const isProfileComplete = () => {
    return photo && 
           bio.trim().length >= 20 && 
           bio.trim().length <= 500 && 
           fitnessGoals.trim().length >= 10 && 
           age && 
           parseInt(age) >= 18 && 
           termsAccepted;
  };

  const handleSave = async () => {
    setBioError(null);
    setBlockedWords([]);
    setTermsError('');
    
    if (!user || !user.id) {
      alert('You must be logged in to save your profile.');
      return;
    }
    
    if (!termsAccepted) {
      setTermsError('You must agree to the Terms of Service and Privacy Policy before continuing.');
      return;
    }
    
    if (!photo) {
      alert('Please add a profile photo.');
      return;
    }
    
    if (!age || parseInt(age) < 18) {
      alert('You must be at least 18 years old to use Adonix Fit.');
      return;
    }
    
    if (bio.length < 20) {
      setBioError('Bio must be at least 20 characters');
      return;
    }
    
    if (bio.length > 500) {
      setBioError('Bio cannot exceed 500 characters');
      return;
    }
    
    if (fitnessGoals.length < 10) {
      alert('Please tell us more about your fitness goals (minimum 10 characters).');
      return;
    }
    
    const bioValidation = await validateText(bio, 'bio');
    if (!bioValidation.isValid) {
      setBlockedWords(bioValidation.blockedWords);
      setBioError(bioValidation.error);
      return;
    }
    
    const goalsValidation = await validateText(fitnessGoals, 'fitness goals');
    if (!goalsValidation.isValid) {
      alert(`Your fitness goals contain blocked words: ${goalsValidation.blockedWords.join(', ')}`);
      return;
    }
    
    setShowConfirmModal(true);
  };
  
  const confirmSave = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    
    try {
      const updateData = {
        photos: [photo],
        bio: bio,
        fitness_goals: fitnessGoals,
        age: parseInt(age),
        role: 'member',
        profile_complete: true,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id);
      
      if (error) throw error;
      
      await refreshProfile();
      alert('Profile saved successfully!');
      onComplete();
      
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fitnessGoalOptions = [
    'Lose weight', 'Build muscle', 'Improve endurance', 'Get toned',
    'Train for an event', 'Improve flexibility', 'Reduce stress',
    'General fitness', 'Rehab/Recovery', 'Just have fun'
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
          
          <div className="p-6 space-y-6">
            
            {/* Error Alerts */}
            {bioError && (
              <BlockedWordAlert 
                blockedWords={blockedWords} 
                onClose={() => {
                  setBioError(null);
                  setBlockedWords([]);
                }}
              />
            )}
            
            {/* ========== PROFILE PHOTO ========== */}
            <div className="p-4 rounded-xl bg-white/5">
              <label className="block font-semibold mb-3 text-white">Profile Photo <span className="text-red-500">*</span></label>
              
              <div className="flex flex-col items-center gap-4">
                {photo ? (
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-white/5 ring-4 ring-red-500/30 shadow-xl">
                      <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => setShowCamera(true)}
                      className="absolute bottom-0 right-0 p-2 bg-red-600 rounded-full hover:bg-red-700 transition-all"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCamera(true)}
                    className="w-32 h-32 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-red-500 hover:bg-white/10 transition-all"
                  >
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-xs text-gray-400">Add Photo</span>
                  </button>
                )}
                
                <p className="text-xs text-gray-500 text-center">
                  A clear photo of your face. No sunglasses, no group shots, no filters that hide your face.
                </p>
              </div>
            </div>
            
            {/* ========== AGE ========== */}
            <div className="p-4 rounded-xl bg-white/5">
              <label className="block font-semibold mb-2 text-white">Age <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="18+ only"
                min="18"
                max="100"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white"
              />
              <p className="text-xs text-gray-500 mt-1">You must be at least 18 years old to use Adonix Fit.</p>
            </div>
            
            {/* ========== BIO ========== */}
            <div className="p-4 rounded-xl bg-white/5">
              <label className="block font-semibold mb-2 text-white">Bio <span className="text-red-500">*</span></label>
              <textarea
                value={bio}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setBio(e.target.value);
                  }
                }}
                placeholder="Tell partners about your fitness journey, what motivates you, and what you're looking for... (20-500 chars)"
                rows={4}
                maxLength={500}
                className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:border-red-500 focus:outline-none text-white placeholder-gray-500 ${
                  bioError ? 'border-red-500' : 'border-white/10'
                }`}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  ⚡ This ain't Tinder. No contact info, no offensive words, no funny business — just fitness.
                </p>
                <p className={`text-xs ${bio.length >= 20 && bio.length <= 500 ? 'text-green-400' : 'text-red-400'}`}>
                  {bio.length}/500
                </p>
              </div>
            </div>
            
            {/* ========== FITNESS GOALS ========== */}
            <div className="p-4 rounded-xl bg-white/5">
              <label className="block font-semibold mb-2 text-white">Fitness Goals <span className="text-red-500">*</span></label>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {fitnessGoalOptions.map(goal => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setFitnessGoals(goal)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      fitnessGoals === goal
                        ? 'bg-red-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
              
              <textarea
                value={fitnessGoals}
                onChange={(e) => setFitnessGoals(e.target.value)}
                placeholder="Or write your own goals... (minimum 10 characters)"
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tell partners what you want to achieve. Be specific — it helps them help you.
              </p>
            </div>
            
            {/* ========== TERMS & CONDITIONS ========== */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="termsAccept"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <label htmlFor="termsAccept" className="text-sm text-gray-300">
                  I confirm I am at least 18 years old and agree to the{' '}
                  <button onClick={() => setShowTermsModal('terms')} className="text-red-500 hover:underline">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button onClick={() => setShowTermsModal('privacy')} className="text-red-500 hover:underline">
                    Privacy Policy
                  </button>.
                </label>
              </div>
              {termsError && <p className="text-red-400 text-sm mt-2">{termsError}</p>}
            </div>
            
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !isProfileComplete()}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
                saving || !isProfileComplete()
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-red-600 to-orange-600 hover:scale-105'
              }`}
            >
              {saving ? 'Saving...' : 'Complete Profile'}
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              {!photo && "📸 Add a photo • "}
              {!age && "🎂 Add your age • "}
              {bio.length < 20 && "📝 Complete your bio • "}
              {!fitnessGoals && "🎯 Tell us your goals • "}
              {!termsAccepted && "📜 Accept Terms"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Live Camera Modal */}
      {showCamera && (
        <LiveCameraCapture
          onCapture={(photoBlob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              setPhoto(reader.result as string);
            };
            reader.readAsDataURL(photoBlob);
          }}
          onClose={() => setShowCamera(false)}
          aspectRatio="square"
          isEditMode={!!photo}
          onReplaceConfirm={async () => true}
        />
      )}
      
      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal === 'terms'}
        onClose={() => setShowTermsModal(null)}
        title="Terms of Service"
        content="By using Adonix Fit, you agree to the following: You are at least 18 years old. Adonix Fit connects clients with fitness partners. Partners are independent contractors. Adonix Fit is not responsible for any injuries, damages, or incidents that occur during sessions. All sessions take place in public locations. You agree to the cancellation and no-show policy: cancellations within the partner's specified window (24-48 hours) result in no charge. No-shows or failure to scan the QR code result in full forfeiture of session payment. Adonix Fit reserves the right to suspend or ban users who violate these terms. Disputes will be resolved through arbitration."
      />
      
      <TermsModal
        isOpen={showTermsModal === 'privacy'}
        onClose={() => setShowTermsModal(null)}
        title="Privacy Policy"
        content="Adonix Fit respects your privacy. We collect your name, email, age, photos, and location data to facilitate fitness sessions. Location data is only used during active sessions to verify attendance. We do not sell your personal data. Photos are used for profile identification. You may request deletion of your account and data at any time. Payment information is processed securely through Stripe and is not stored on our servers."
      />
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Confirm Profile</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to save your profile? You can edit this information later from your settings.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}