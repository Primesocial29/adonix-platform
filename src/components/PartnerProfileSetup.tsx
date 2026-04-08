import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { X, AlertCircle, Camera, Calendar, Dumbbell } from 'lucide-react';

interface PartnerProfileSetupProps {
  onClose: () => void;
  onComplete: () => void;
}

// Blocked words list (profanity, social media, contact info)
const BLOCKED_WORDS = [
  'instagram', 'insta', 'ig', 'facebook', 'fb', 'twitter', 'x.com', 'tiktok', 'snapchat', 'youtube', 'twitch',
  'whatsapp', 'telegram', 'signal', 'wechat', 'kik', 'discord', 'onlyfans',
  '@gmail', '@yahoo', '@hotmail', '@outlook', '@aol', '@icloud', 'email', 'e-mail',
  'call me', 'text me', 'phone', 'number', 'whatsapp',
  'fuck', 'shit', 'bitch', 'cunt', 'damn', 'asshole', 'dick', 'pussy',
];

const SOCIAL_MEDIA_PATTERNS = [
  /@[\w]+/i,
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
    services: [] as string[],
    hourly_rate: '',
    live_photo_url: '',
    availability: [] as string[],
    vibe: '',
  });
  const [bioError, setBioError] = useState('');

  const handleBioChange = (value: string) => {
    const check = BLOCKED_WORD_CHECK(value);
    if (!check.isValid && value.length > 0) {
      setBioError(`⚠️ "${check.foundWord}" is not allowed. No social media, contact info, or inappropriate language.`);
    } else {
      setBioError('');
    }
    
    if (value.length <= 500) {
      setFormData({ ...formData, bio: value });
    }
  };

  const handleSubmit = async () => {
    if (formData.bio.length < 20) {
      setBioError('Bio must be at least 20 characters');
      return;
    }
    
    if (formData.bio.length > 500) {
      setBioError('Bio cannot exceed 500 characters');
      return;
    }
    
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

    if (formData.services.length === 0) {
      setError('Please select at least one service');
      return;
    }

    if (!formData.vibe) {
      setError('Please select your training vibe');
      return;
    }
    
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
          services: formData.services,
          hourly_rate: parseFloat(formData.hourly_rate),
          live_photo_url: formData.live_photo_url,
          availability: formData.availability,
          vibe: formData.vibe,
          role: 'partner',
          profile_complete: true,
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;
      
      onComplete();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (item: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(item)
        ? prev.specialties.filter(s => s !== item)
        : [...prev.specialties, item]
    }));
  };

  const toggleService = (item: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(item)
        ? prev.services.filter(s => s !== item)
        : [...prev.services, item]
    }));
  };

  const toggleAvailability = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }));
  };

  const specialtyOptions = [
    'Weight Loss', 'Muscle Building', 'Cardio', 'Yoga', 'Pilates', 
    'Nutrition Coaching', 'Senior Fitness', 'Posture Correction', 
    'Injury Recovery', 'Sports Performance', 'Group Classes', 'Personal Training'
  ];

  const serviceOptions = [
    '1-on-1 Training', 'Partner Training', 'Group Sessions', 
    'Outdoor Bootcamp', 'Virtual Coaching', 'Nutrition Planning',
    'Flexibility Training', 'Sports Specific', 'Rehab Training'
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const vibeOptions = [
    { value: 'energetic', label: '🔥 High Energy', desc: 'Push your limits' },
    { value: 'chill', label: '🧘 Chill & Balanced', desc: 'Feel good while moving' },
    { value: 'flirty', label: '😏 Playful & Fun', desc: 'Good vibes only' },
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
          
          {/* Profile Photo */}
          <div>
            <label className="block font-semibold mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4" /> Profile Photo
            </label>
            <input
              type="url"
              value={formData.live_photo_url}
              onChange={(e) => setFormData({ ...formData, live_photo_url: e.target.value })}
              placeholder="https://example.com/your-photo.jpg"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none transition"
            />
            <p className="text-gray-500 text-xs mt-1">A clear photo helps you get more bookings</p>
          </div>

          {/* Bio Field */}
          <div>
            <label className="block font-semibold mb-2">
              Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleBioChange(e.target.value)}
              placeholder="Why should someone choose you? Don't be boring. Don't be obvious. Just be memorable... (20-500 chars)"
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none transition"
            />
            <div className="flex justify-end mt-1">
              <span className={`text-sm ${formData.bio.length < 20 || formData.bio.length > 500 ? 'text-red-400' : 'text-gray-400'}`}>
                {formData.bio.length}/500
              </span>
            </div>
            {bioError && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {bioError}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-2">
              ⚡ No contact info or social handles — keep the mystery.
            </p>
          </div>

          {/* Vibe Selector */}
          <div>
            <label className="block font-semibold mb-2 flex items-center gap-2">
              <Dumbbell className="w-4 h-4" /> Training Vibe <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {vibeOptions.map((vibe) => (
                <button
                  key={vibe.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, vibe: vibe.value })}
                  className={`p-3 rounded-xl border transition ${
                    formData.vibe === vibe.value
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="font-semibold text-sm">{vibe.label}</div>
                  <div className="text-xs text-gray-400">{vibe.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Specialties */}
          <div>
            <label className="block font-semibold mb-2 flex items-center gap-2">
              <Dumbbell className="w-4 h-4" /> Specialties <span className="text-red-500">*</span>
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

          {/* Services Offered */}
          <div>
            <label className="block font-semibold mb-2 flex items-center gap-2">
              <Dumbbell className="w-4 h-4" /> Services Offered <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    formData.services.includes(service)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-gray-300'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Calendar */}
          <div>
            <label className="block font-semibold mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Availability
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleAvailability(day)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    formData.availability.includes(day)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-gray-300'
                  }`}
                >
                  {day.substring(0, 3)}
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