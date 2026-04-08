import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { X, AlertCircle } from 'lucide-react';

interface PartnerProfileSetupProps {
  onClose: () => void;
  onComplete: () => void;
}

// Blocked words list (profanity, social media, contact info)
const BLOCKED_WORDS = [
  // Social media platforms
  'instagram', 'insta', 'ig', 'facebook', 'fb', 'twitter', 'x.com', 'tiktok', 'snapchat', 'youtube', 'twitch',
  // Contact methods  
  'whatsapp', 'telegram', 'signal', 'wechat', 'kik', 'discord', 'onlyfans',
  // Email patterns
  '@gmail', '@yahoo', '@hotmail', '@outlook', '@aol', '@icloud', 'email', 'e-mail',
  // Phone patterns  
  'call me', 'text me', 'phone', 'number', 'whatsapp',
  // Profanity (add more as needed)
  'fuck', 'shit', 'bitch', 'cunt', 'damn', 'asshole', 'dick', 'pussy',
];

// Social media handle patterns (regex)
const SOCIAL_MEDIA_PATTERNS = [
  /@[\w]+/i,  // @username
  /instagram\.com\/[\w]+/i,
  /facebook\.com\/[\w]+/i,
  /twitter\.com\/[\w]+/i,
  /tiktok\.com\/@[\w]+/i,
];

const BLOCKED_WORD_CHECK = (text: string): { isValid: boolean; foundWord: string } => {
  const lowerText = text.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return { isValid: false, foundWord: word };
    }
  }
  for (const pattern of SOCIAL_MEDIA_PATTERNS) {
    if (pattern.test(text)) {
      return { isValid: false, foundWord: 'social media handle or contact info' };
    }
  }
  return { isValid: true, foundWord: '' };
};

export default function PartnerProfileSetup({ onClose, onComplete }: PartnerProfileSetupProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    specialties: [] as string[],
    hourly_rate: '',
    live_photo_url: '',
  });
  const [bioError, setBioError] = useState('');

  const handleBioChange = (value: string) => {
    // Check blocked words
    const check = BLOCKED_WORD_CHECK(value);
    if (!check.isValid && value.length > 0) {
      setBioError(`⚠️ "${check.foundWord}" is not allowed in your bio. No social media handles, contact info, or inappropriate language.`);
    } else {
      setBioError('');
    }
    
    // Enforce max 500 characters, show counter
    if (value.length <= 500) {
      setFormData({ ...formData, bio: value });
    }
  };

  const handleSubmit = async () => {
    // Validate bio minimum
    if (formData.bio.length < 20) {
      setBioError('Bio must be at least 20 characters');
      return;
    }
    
    // Validate bio maximum
    if (formData.bio.length > 500) {
      setBioError('Bio cannot exceed 500 characters');
      return;
    }
    
    // Validate bio blocked words one more time
    const check = BLOCKED_WORD_CHECK(formData.bio);
    if (!check.isValid) {
      setBioError(`"${check.foundWord}" is not allowed in your bio`);
      return;
    }
    
    if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) {
      setError('Please enter a valid hourly rate');
      return;
    }
    
    if (formData.specialties.length === 0) {
      setError('Please select at least one specialty');
      return;
    }

    // Show confirmation modal instead of window.confirm
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setLoading(true);
    setError('');
    setShowConfirmModal(false);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          bio: formData.bio,
          specialties: formData.specialties,
          hourly_rate: parseFloat(formData.hourly_rate),
          live_photo_url: formData.live_photo_url,
          role: 'partner',
          profile_complete: true,
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;
      
      // Close modal and go back to main profile
      onComplete();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const specialtyOptions = [
    'Weight Loss', 'Muscle Building', 'Cardio', 'Yoga', 'Pilates', 
    'Nutrition Coaching', 'Senior Fitness', 'Posture Correction', 
    'Injury Recovery', 'Sports Performance', 'Group Classes', 'Personal Training'
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Partner Profile Setup</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6 space-y-6">
          {/* Bio Field */}
          <div>
            <label className="block font-semibold mb-2">
              Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleBioChange(e.target.value)}
              placeholder="Tell potential clients about your fitness philosophy, experience, and what makes you unique..."
              rows={5}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none transition"
            />
            <div className="flex justify-between mt-1 text-sm">
              <span className={formData.bio.length < 20 ? 'text-red-400' : 'text-gray-400'}>
                {formData.bio.length}/20 minimum characters
              </span>
              <span className={formData.bio.length > 500 ? 'text-red-400' : 'text-gray-400'}>
                {formData.bio.length}/500 maximum characters
              </span>
            </div>
            {bioError && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {bioError}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-2">
              ✅ No social media handles, contact info, or inappropriate language allowed
            </p>
          </div>

          {/* Specialties Field */}
          <div>
            <label className="block font-semibold mb-2">
              Specialties <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {specialtyOptions.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => toggleSpecialty(specialty)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    formData.specialties.includes(specialty)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-gray-300'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="block font-semibold mb-2">
              Hourly Rate ($/hour) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              placeholder="e.g., 50"
              min="0"
              step="5"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none transition"
            />
          </div>

          {/* Profile Photo */}
          <div>
            <label className="block font-semibold mb-2">Profile Photo URL (optional)</label>
            <input
              type="url"
              value={formData.live_photo_url}
              onChange={(e) => setFormData({ ...formData, live_photo_url: e.target.value })}
              placeholder="https://example.com/your-photo.jpg"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none transition"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-2">Confirm Profile Submission</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to save your partner profile? You can edit this information later from your profile settings.
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
    </div>
  );
}