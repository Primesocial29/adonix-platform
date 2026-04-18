import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import LiveCameraCapture from './LiveCameraCapture';
import { containsBlockedWords, getBlockedWordsInText } from '../lib/textSanitizer';
import { X } from 'lucide-react';

interface Partner {
  id: string;
  first_name: string;
  username: string;
  live_photo_url: string;
  bio: string;
  avg_rating: number;
  service_types: string[];
  custom_service_types: string[];
  service_rates: Record<string, { hourly: number; halfHour: number }>;
  service_areas_center_lat: number;
  service_areas_center_lng: number;
  availability: { day: string; times: string[] }[];
  _distance?: number;
}

interface CitySuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

const SERVICE_TYPES = [
  'Walking', 'Jogging', 'Running', 'Biking', 'Yoga', 'Weight Lifting',
  'HIIT', 'Calisthenics', 'Swimming', 'Boxing', 'Pilates', 'Stretching'
];

const FITNESS_GOALS = [
  'Lose weight', 'Build muscle', 'Improve endurance', 'Get toned',
  'Train for an event', 'Improve flexibility', 'Reduce stress',
  'General fitness', 'Low-impact fitness', 'Gentle movement', 'Just have fun'
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Blocked words for username
const BLOCKED_USERNAME_WORDS = [
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'dick', 'pussy', 
  'nigger', 'faggot', 'retard', 'whore', 'slut', 'cock', 'porn', 
  'sex', 'escort', 'dating', 'tinder', 'hookup', 'fuk', 'fck',
  'admin', 'root', 'support', 'moderator', 'adonix'
];

// Turnstile Site Key - only used in production
const TURNSTILE_SITE_KEY = '0x4AAAAAAC85hzmi4sizIJ-y';

// DISABLE TURNSTILE COMPLETELY FOR DEVELOPMENT
const ENABLE_TURNSTILE = false;

declare global {
  interface Window {
    turnstile: any;
  }
}

// Terms Modal Component with scroll-to-accept
function TermsModal({ isOpen, onClose, onAccept, title, content }: { 
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
                ? 'bg-red-600 hover:bg-red-700 text-white' 
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

export default function ClientOnboarding({ onComplete }: { onComplete?: () => void }) {
  const { user, refreshProfile, profile } = useAuth();
  const [step, setStep] = useState(2); // START AT STEP 2 (Photo & Bio) instead of 1
  const [loading, setLoading] = useState(false);
  
  // Step 2: Photo & Bio
  const [livePhotoUrl, setLivePhotoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [bioError, setBioError] = useState('');
  const [bioBlockedWords, setBioBlockedWords] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Step 3: Your Vibe
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [city, setCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const citySearchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [showCustomGoalInput, setShowCustomGoalInput] = useState(false);
  const [customGoalError, setCustomGoalError] = useState('');
  const [step3Error, setStep3Error] = useState('');
  
  // Step 4: Find Partners
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customService, setCustomService] = useState('');
  const [showCustomServiceInput, setShowCustomServiceInput] = useState(false);
  const [customServiceError, setCustomServiceError] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [searchRadius, setSearchRadius] = useState(10);
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const partnersPerPage = 6;
  
  // Validate username (letters + numbers only, no blocked words, length limits)
  const validateUsername = (username: string) => {
    // Check length FIRST
    if (username.length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters' };
    }
    if (username.length > 20) {
      return { isValid: false, error: 'Username cannot exceed 20 characters' };
    }
    
    // Check for letters and numbers only
    const validPattern = /^[a-zA-Z0-9]+$/;
    if (!validPattern.test(username)) {
      return { isValid: false, error: 'Username can only contain letters and numbers (no spaces, no special characters)' };
    }
    
    // Check for blocked words (case insensitive)
    const lowerUsername = username.toLowerCase();
    for (const blocked of BLOCKED_USERNAME_WORDS) {
      if (lowerUsername.includes(blocked)) {
        return { isValid: false, error: `Username contains blocked word: "${blocked}"` };
      }
    }
    
    return { isValid: true, error: null };
  };
  
  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  // Search city with OpenStreetMap
  const searchCity = async (query: string) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }
    
    setIsSearchingCity(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=us`
      );
      const data = await response.json();
      setCitySuggestions(data);
      setShowCitySuggestions(true);
    } catch (error) {
      console.error('Error searching city:', error);
      setCitySuggestions([]);
    } finally {
      setIsSearchingCity(false);
    }
  };
  
  const handleCityInputChange = (value: string) => {
    setCity(value);
    if (citySearchDebounce.current) clearTimeout(citySearchDebounce.current);
    citySearchDebounce.current = setTimeout(() => {
      searchCity(value);
    }, 500);
  };
  
  const selectCity = (suggestion: CitySuggestion) => {
    setCity(suggestion.display_name);
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };
  
  // Fetch and filter partners
  useEffect(() => {
    if (step === 4 && userLocation) {
      fetchAndFilterPartners();
    }
  }, [step, userLocation, selectedServices, searchRadius, selectedDays]);
  
  const fetchAndFilterPartners = async () => {
    if (!userLocation) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_partner', true)
        .eq('profile_complete', true);
      
      if (error) throw error;
      
      let filtered = (data || []).map((partner: any) => {
        if (partner.service_areas_center_lat && partner.service_areas_center_lng) {
          const dist = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            partner.service_areas_center_lat,
            partner.service_areas_center_lng
          );
          return { ...partner, _distance: dist };
        }
        return { ...partner, _distance: null };
      });
      
      filtered = filtered.filter(p => p._distance !== null && p._distance <= searchRadius);
      
      if (selectedServices.length > 0) {
        filtered = filtered.filter(partner => {
          const partnerServices = [...(partner.service_types || []), ...(partner.custom_service_types || [])];
          return selectedServices.some(s => partnerServices.includes(s));
        });
      }
      
      if (selectedDays.length > 0) {
        filtered = filtered.filter(partner => {
          const partnerDays = (partner.availability || []).filter(a => a.times.length > 0).map(a => a.day);
          return selectedDays.some(day => partnerDays.includes(day));
        });
      }
      
      filtered.sort((a, b) => (a._distance || 999) - (b._distance || 999));
      
      setAllPartners(filtered);
      setFilteredPartners(filtered);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching partners:', err);
    } finally {
      setSearching(false);
    }
  };
  
  const dataURLtoBlob = (dataURL: string): Blob => {
    const [header, data] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(data);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };
  
  const handleCameraCapture = async (blobOrDataURL: Blob | string) => {
    if (!user) {
      alert('Please sign up first.');
      return;
    }
    
    setUploadingPhoto(true);
    try {
      let jpegBlob: Blob;
      if (typeof blobOrDataURL === 'string') {
        jpegBlob = dataURLtoBlob(blobOrDataURL);
      } else {
        jpegBlob = blobOrDataURL;
      }
      const fileName = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, jpegBlob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      setLivePhotoUrl(url);
      await supabase.from('profiles').update({ live_photo_url: url }).eq('id', user.id);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      setShowCamera(false);
    }
  };
  
  const handleBioChange = (val: string) => {
    setBio(val);
    if (containsBlockedWords(val)) {
      const blocked = getBlockedWordsInText(val);
      setBioError(`Your bio contains blocked words: ${blocked.slice(0, 3).join(', ')}`);
      setBioBlockedWords(blocked);
    } else if (val.length < 20) {
      setBioError(`${20 - val.length} more characters needed`);
      setBioBlockedWords([]);
    } else if (val.length > 500) {
      setBioError('Bio must be 500 characters or fewer');
      setBioBlockedWords([]);
    } else {
      setBioError('');
      setBioBlockedWords([]);
    }
  };
  
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (error) => {
        let errorMsg = 'Unable to get your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += 'Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += 'Location unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg += 'Request timed out.';
            break;
        }
        setLocationError(errorMsg);
        setLocationLoading(false);
      }
    );
  };
  
  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };
  
  const addCustomGoal = () => {
    const trimmed = customGoal.trim();
    if (!trimmed) return;
    if (containsBlockedWords(trimmed)) {
      setCustomGoalError('This goal contains blocked words.');
      return;
    }
    if (selectedGoals.includes(trimmed) || FITNESS_GOALS.includes(trimmed)) {
      setCustomGoalError('This goal is already in the list.');
      return;
    }
    setSelectedGoals([...selectedGoals, trimmed]);
    setCustomGoal('');
    setShowCustomGoalInput(false);
    setCustomGoalError('');
  };
  
  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };
  
  const addCustomService = () => {
    const trimmed = customService.trim();
    if (!trimmed) return;
    if (containsBlockedWords(trimmed)) {
      setCustomServiceError('This activity contains blocked words.');
      return;
    }
    if (selectedServices.includes(trimmed) || SERVICE_TYPES.includes(trimmed)) {
      setCustomServiceError('This activity is already in the list.');
      return;
    }
    setSelectedServices([...selectedServices, trimmed]);
    setCustomService('');
    setShowCustomServiceInput(false);
    setCustomServiceError('');
  };
  
  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };
  
  const handleNext = async () => {
    if (step === 2) {
      if (!livePhotoUrl) {
        alert('Please capture a live photo.');
        return;
      }
      if (bio.length < 20) {
        setBioError('Bio must be at least 20 characters.');
        return;
      }
      if (bio.length > 500) {
        setBioError('Bio cannot exceed 500 characters.');
        return;
      }
      if (containsBlockedWords(bio)) {
        alert('Your bio contains blocked words. Please remove them before continuing.');
        return;
      }
      setBioError('');
      await supabase.from('profiles').update({ bio }).eq('id', user?.id);
      setStep(3);
    } else if (step === 3) {
      if (!username) {
        setStep3Error('Please enter a username.');
        return;
      }
      
      // Re-validate username one more time
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        setStep3Error(usernameValidation.error);
        return;
      }
      
      if (!city) {
        setStep3Error('Please enter your city.');
        return;
      }
      if (selectedGoals.length === 0) {
        setStep3Error('Please select at least one fitness goal.');
        return;
      }
      setStep3Error('');
      await supabase.from('profiles').update({ 
        username, 
        city, 
        fitness_goals: selectedGoals
      }).eq('id', user?.id);
      setStep(4);
    }
  };
  
  const handleBack = () => {
    if (step > 2) setStep(step - 1);
  };
  
  const handleComplete = async () => {
    await supabase.from('profiles').update({ profile_complete: true }).eq('id', user?.id);
    await refreshProfile();
    if (onComplete) onComplete();
    else window.location.href = '/browse';
  };
  
  const isStep2Complete = livePhotoUrl && bio.length >= 20 && bio.length <= 500 && !containsBlockedWords(bio);
  const isStep3Complete = username && !usernameError && username.length >= 3 && username.length <= 20 && city && selectedGoals.length > 0;
  
  const totalPages = Math.ceil(filteredPartners.length / partnersPerPage);
  const startIndex = (currentPage - 1) * partnersPerPage;
  const endIndex = startIndex + partnersPerPage;
  const currentPartners = filteredPartners.slice(startIndex, endIndex);
  
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
  
  const Step4Content = () => (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-semibold mb-4">Select Your Activities</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {SERVICE_TYPES.map(service => (
            <button
              key={service}
              onClick={() => toggleService(service)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedServices.includes(service)
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {service}
            </button>
          ))}
        </div>
        
        {!showCustomServiceInput ? (
          <button
            onClick={() => setShowCustomServiceInput(true)}
            className="text-sm text-red-400 hover:text-red-300"
          >
            + Add custom activity
          </button>
        ) : (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={customService}
              onChange={(e) => setCustomService(e.target.value)}
              placeholder="Enter your activity..."
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500"
            />
            <button onClick={addCustomService} className="px-4 py-2 bg-green-600 rounded-lg">Add</button>
            <button onClick={() => setShowCustomServiceInput(false)} className="px-4 py-2 bg-gray-600 rounded-lg">Cancel</button>
          </div>
        )}
        {customServiceError && <p className="text-red-400 text-sm mt-2">{customServiceError}</p>}
      </div>
      
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-semibold mb-4">What days work for you?</h2>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedDays.includes(day)
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-semibold mb-4">Search Area</h2>
        
        <button
          onClick={getCurrentLocation}
          disabled={locationLoading}
          className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-semibold hover:scale-105 transition disabled:opacity-50"
        >
          {locationLoading ? 'Getting Location...' : '📍 USE MY CURRENT LOCATION'}
        </button>
        
        {locationError && <p className="text-red-400 text-sm mb-4">{locationError}</p>}
        
        {userLocation && (
          <>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-400">How far are you willing to travel?</label>
                <span className="text-red-400 font-medium">{searchRadius} miles</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 mi</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25 mi</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-semibold mb-2">Partners Ready to Move</h2>
        <p className="text-sm text-gray-400 mb-6">
          Based on your vibe, free days, and location — here's who's ready to sweat with you. No awkward intros. Just good energy.
        </p>
        
        {!userLocation ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Use your current location to see partners near you.</p>
          </div>
        ) : searching ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : currentPartners.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No partners found. Try adjusting your activities, free days, or expanding your radius.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPartners.map((partner, idx) => {
                const partnerDays = (partner.availability || []).filter(a => a.times.length > 0).map(a => a.day.substring(0, 3));
                const daysDisplay = partnerDays.slice(0, 3).join(', ');
                const primaryService = [...(partner.service_types || []), ...(partner.custom_service_types || [])][0] || 'Fitness';
                const rate = partner.service_rates?.[primaryService]?.hourly || 75;
                
                return (
                  <div key={partner.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-red-500/50 transition group">
                    <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-red-500/20 mb-3">
                      {partner.live_photo_url ? (
                        <img src={partner.live_photo_url} alt={partner.first_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-center">🔥 {partner.first_name}</h3>
                    <div className="flex justify-center items-center gap-1 mt-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm">{partner.avg_rating || 'New'}</span>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      {partner._distance ? `${Math.round(partner._distance)} miles away` : 'Distance unknown'}
                    </p>
                    <p className="text-xs text-green-400 text-center mt-1">💰 Suggested ${rate}</p>
                    {daysDisplay && (
                      <p className="text-xs text-gray-400 text-center mt-1">🗓️ Free: {daysDisplay}{partnerDays.length > 3 ? '...' : ''}</p>
                    )}
                    <button className="w-full mt-3 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg text-sm font-medium hover:scale-105 transition">
                      View Profile
                    </button>
                  </div>
                );
              })}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
        
        {userLocation && !searching && currentPartners.length === 0 && (
          <p className="text-center text-gray-400 mt-4">
            Not seeing your match? Try adjusting your activities, free days, or expanding your search radius. The right partner is out there.
          </p>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
          <h3 className="font-semibold mb-3 text-red-400">⚡ BEFORE YOU GO</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• This is a social meetup platform — not a professional service.</li>
            <li>• Meet only at verified public locations. Private residences are strictly excluded.</li>
            <li>• GPS check-in required for every meetup.</li>
            <li>• Two-person only — no extra friends or spectators.</li>
            <li>• Suggested contributions are support for your partner's time, not wages for employment.</li>
          </ul>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5">
          <h3 className="font-semibold mb-3 text-blue-400">💰 FEE TRANSPARENCY</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>When you send a suggested contribution of $100.00:</p>
            <div className="pl-4 space-y-1">
              <p>• Platform Support (15%): -$15.00</p>
              <p>• Stripe Processing Fee (2.9% + $0.30): -$3.20</p>
              <div className="border-t border-blue-500/30 my-2"></div>
              <p className="font-semibold text-green-400">• Partner Receives: $81.80</p>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Adonix uses Stripe to process all payments securely. Stripe fees are deducted automatically.
              For payment issues, contact Stripe support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <img 
              src="/Screenshot_2026-04-03_221406.png" 
              alt="Adonix Logo" 
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold text-white">ADONIX</span>
            <span className="text-xs text-gray-400">Social Fitness, Elevated</span>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Step {step - 1} of 3</span>
            <span>{Math.round((step - 1) / 3 * 100)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-orange-600 transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>
        
        {step === 2 && (
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-center mb-6">Your Photo & Story</h2>
            
            <div className="text-center mb-8">
              <div className="w-32 h-32 rounded-full mx-auto overflow-hidden bg-red-500/20 border-4 border-red-500/30 mb-4">
                {livePhotoUrl ? (
                  <img src={livePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <button
                    onClick={() => setShowCamera(true)}
                    className="w-full h-full flex items-center justify-center text-3xl hover:bg-white/10 transition"
                  >
                    📷
                  </button>
                )}
              </div>
              {!livePhotoUrl && (
                <button
                  onClick={() => setShowCamera(true)}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg text-sm font-medium"
                >
                  Capture Live Photo
                </button>
              )}
              <p className="text-xs text-gray-500 mt-3">
                AUTHENTICITY CHECK: Live Camera Only. AI-generated faces or filters are prohibited and result in immediate suspension.
              </p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => handleBioChange(e.target.value)}
                placeholder="Tell partners about your fitness journey, what motivates you, and what you're looking for... (20-500 characters)"
                rows={5}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none resize-none"
              />
              <div className="flex justify-between mt-2">
                {bioError ? (
                  <p className="text-xs text-red-400">{bioError}</p>
                ) : (
                  <p className="text-xs text-gray-500">Minimum 20 characters</p>
                )}
                <p className={`text-xs ${bio.length > 500 ? 'text-red-400' : 'text-gray-500'}`}>{bio.length}/500</p>
              </div>
              {bioBlockedWords.length > 0 && (
                <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-xs text-red-400">Blocked content detected: {bioBlockedWords.slice(0, 3).join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {step === 3 && (
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-center mb-6">What's Your Vibe?</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Username <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    // Remove any spaces or special characters as they type
                    let newUsername = e.target.value.toLowerCase();
                    // Strip anything that's not a letter or number
                    newUsername = newUsername.replace(/[^a-zA-Z0-9]/g, '');
                    // Limit to 20 characters max
                    if (newUsername.length <= 20) {
                      setUsername(newUsername);
                      const validation = validateUsername(newUsername);
                      setUsernameError(validation.error);
                    }
                  }}
                  placeholder="username (letters and numbers only, 3-20 chars)"
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:border-red-500 focus:outline-none ${
                    usernameError ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
                <p className="text-xs text-gray-500 mt-1">Letters and numbers only. 3-20 characters. No blocked words.</p>
              </div>
              
              <div className="relative">
                <label className="block text-sm text-gray-400 mb-2">Your City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => handleCityInputChange(e.target.value)}
                  placeholder="Los Angeles, CA"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none"
                />
                {isSearchingCity && (
                  <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-lg">
                    <div className="px-4 py-2 text-sm text-gray-400">Searching...</div>
                  </div>
                )}
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {citySuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectCity(suggestion)}
                        className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm text-gray-300"
                      >
                        {suggestion.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-3">Why are you here? (Select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {FITNESS_GOALS.map(goal => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedGoals.includes(goal)
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
                
                {!showCustomGoalInput ? (
                  <button
                    onClick={() => setShowCustomGoalInput(true)}
                    className="mt-3 text-sm text-red-400 hover:text-red-300"
                  >
                    + Add my own vibe
                  </button>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      placeholder="Enter your goal..."
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500"
                    />
                    <button onClick={addCustomGoal} className="px-4 py-2 bg-green-600 rounded-lg">Add</button>
                    <button onClick={() => setShowCustomGoalInput(false)} className="px-4 py-2 bg-gray-600 rounded-lg">Cancel</button>
                  </div>
                )}
                {customGoalError && <p className="text-red-400 text-sm mt-2">{customGoalError}</p>}
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                <p className="text-xs text-blue-300 text-center">
                  ℹ️ Profile information is self-reported and not verified by Adonix.
                </p>
              </div>
              
              {step3Error && <p className="text-red-400 text-sm">{step3Error}</p>}
            </div>
          </div>
        )}
        
        {step === 4 && <Step4Content />}
        
        <div className="flex justify-between gap-4 mt-8">
          {step > 2 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={loading || (step === 2 && !isStep2Complete) || (step === 3 && !isStep3Complete)}
              className={`flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-semibold transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100`}
            >
              {loading ? 'Saving...' : 'Next'}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!userLocation}
              className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-semibold transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
      
      {showCamera && (
        <LiveCameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          aspectRatio="square"
        />
      )}
      
      <TermsModal
        isOpen={showTermsModal === 'terms'}
        onClose={() => setShowTermsModal(null)}
        onAccept={handleTermsAccept}
        title="Terms of Service"
        content={termsContent}
      />
      
      <TermsModal
        isOpen={showTermsModal === 'privacy'}
        onClose={() => setShowTermsModal(null)}
        onAccept={handlePrivacyAccept}
        title="Privacy Policy"
        content={privacyContent}
      />
    </div>
  );
}