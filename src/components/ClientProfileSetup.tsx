import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Camera, X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { validateText, containsBlockedWords } from '../lib/textSanitizer';
import BlockedWordAlert from './BlockedWordAlert';
import LiveCameraCapture from './LiveCameraCapture';
import { Navigation } from 'lucide-react';

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
  const [photo, setPhoto] = useState('');
  const [bio, setBio] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [city, setCity] = useState('');
  
  // Terms acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [gatekeeperAccepted, setGatekeeperAccepted] = useState(false);
  const [gatekeeperError, setGatekeeperError] = useState('');
  
  // Validation states
  const [bioError, setBioError] = useState<string | null>(null);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [customGoalError, setCustomGoalError] = useState('');
  
  const fitnessGoalOptions = [
    'Lose weight', 'Build muscle', 'Improve endurance', 'Get toned',
    'Train for an event', 'Improve flexibility', 'Reduce stress',
    'General fitness', 'Rehab/Recovery', 'Just have fun'
  ];
  
  // Check if all required fields are complete
  const isProfileComplete = () => {
    return photo &&
           bio.trim().length >= 20 &&
           bio.trim().length <= 500 &&
           fitnessGoals.length > 0 &&
           city.trim().length >= 2 &&
           termsAccepted &&
           gatekeeperAccepted;
  };

  const addCustomGoal = () => {
    const trimmed = customGoal.trim();
    if (!trimmed) return;
    
    if (containsBlockedWords(trimmed)) {
      setCustomGoalError('This goal contains blocked words.');
      return;
    }
    
    if (fitnessGoals.includes(trimmed) || fitnessGoalOptions.includes(trimmed)) {
      setCustomGoalError('This goal is already in your list.');
      return;
    }
    
    setFitnessGoals([...fitnessGoals, trimmed]);
    setCustomGoal('');
    setCustomGoalError('');
  };

  const removeGoal = (goal: string) => {
    setFitnessGoals(fitnessGoals.filter(g => g !== goal));
  };

  const toggleGoal = (goal: string) => {
    if (fitnessGoals.includes(goal)) {
      setFitnessGoals(fitnessGoals.filter(g => g !== goal));
    } else {
      setFitnessGoals([...fitnessGoals, goal]);
    }
  };

  const handleSave = async () => {
    setBioError(null);
    setBlockedWords([]);
    setTermsError('');
    
    if (!user || !user.id) {
      alert('You must be logged in to save your profile.');
      return;
    }
    
    if (!gatekeeperAccepted) {
      setGatekeeperError('You must confirm you understand this is a social fitness platform before continuing.');
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
    
    if (!city || city.trim().length < 2) {
      alert('Please enter your city.');
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
    
    if (fitnessGoals.length === 0) {
      alert('Please select at least one fitness goal.');
      return;
    }
    
    const bioValidation = await validateText(bio, 'bio');
    if (!bioValidation.isValid) {
      setBlockedWords(bioValidation.blockedWords);
      setBioError(bioValidation.error);
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
        city: city.trim(),
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
                
                {/* AI-generated photo notice */}
                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg w-full">
                  <p className="text-xs text-yellow-400 text-center">
                    ⚠️ Real human photo only. AI-generated, deepfake, or synthetic images are prohibited and will result in account termination.
                  </p>
                </div>
              </div>
            </div>

            {/* ========== CITY ========== */}
<div className="p-4 rounded-xl bg-white/5">
  <label className="block font-semibold mb-2 text-white">Your Location <span className="text-red-500">*</span></label>
  
  {/* Current Location Button */}
  <button
    onClick={() => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse geocode to get city name from coordinates
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const data = await response.json();
            const cityName = data.address?.city || data.address?.town || data.address?.village || 'Your City';
            setCity(cityName);
            alert(`Location detected: ${cityName}`);
          } catch (err) {
            setCity('Unknown Location');
            alert('Location detected, but could not determine city name.');
          }
        },
        (error) => {
          let errorMsg = 'Unable to get your location. ';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMsg += 'Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg += 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMsg += 'Location request timed out.';
              break;
          }
          alert(errorMsg);
        }
      );
    }}
    className="w-full mb-3 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
  >
    <Navigation className="w-4 h-4" />
    Use My Current Location
  </button>
  
  {/* OR Divider */}
  <div className="flex items-center gap-2 mb-3">
    <div className="flex-1 h-px bg-white/20"></div>
    <span className="text-xs text-gray-500">OR</span>
    <div className="flex-1 h-px bg-white/20"></div>
  </div>
  
  <input
    type="text"
    value={city}
    onChange={(e) => setCity(e.target.value)}
    placeholder="e.g., Los Angeles, Miami, New York"
    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white"
  />
  <p className="text-xs text-gray-500 mt-1">Your city helps us find partners near you.</p>
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
              
              <div className="flex flex-wrap gap-2 mb-4">
                {fitnessGoalOptions.map(goal => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      fitnessGoals.includes(goal)
                        ? 'bg-red-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
              
              {/* Custom Goal Input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomGoal()}
                  placeholder="Add your own goal..."
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-500 text-sm"
                />
                <button
                  onClick={addCustomGoal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
              {customGoalError && <p className="text-red-400 text-xs mb-2">{customGoalError}</p>}
              
              {/* Selected Goals List */}
              {fitnessGoals.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {fitnessGoals.map(goal => (
                    <div key={goal} className="flex items-center gap-2 bg-red-500/20 rounded-full px-3 py-1">
                      <span className="text-sm text-white">{goal}</span>
                      <button onClick={() => removeGoal(goal)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                Select your goals or add your own. Be specific — it helps partners help you.
              </p>
            </div>
            
            {/* ========== GATEKEEPER ACKNOWLEDGMENT ========== */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="gatekeeperAccept"
                  checked={gatekeeperAccepted}
                  onChange={(e) => setGatekeeperAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <label htmlFor="gatekeeperAccept" className="text-sm text-gray-300">
                  I understand that <span className="text-white font-semibold">Adonix Fit is a social fitness platform</span> — not a personal training service, dating app, or escort service. I am joining to connect with other fitness enthusiasts for voluntary social fitness activities in public locations. No professional fitness services are provided or implied.
                </label>
              </div>
              {gatekeeperError && <p className="text-red-400 text-sm mt-2">{gatekeeperError}</p>}
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
              {!city && "📍 Add your city • "}
              {bio.length < 20 && "📝 Complete your bio • "}
              {fitnessGoals.length === 0 && "🎯 Select or add a goal • "}
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
        content="Adonix Fit respects your privacy. We collect your name, email, age, city, photos, and location data to facilitate fitness sessions. Location data is only used during active sessions to verify attendance. We do not sell your personal data. Photos are used for profile identification. You may request deletion of your account and data at any time. Payment information is processed securely through Stripe and is not stored on our servers."
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