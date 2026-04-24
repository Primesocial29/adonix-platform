import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  Plus, Trash2, MapPin, Clock, DollarSign, Camera,
  Loader2, Navigation, Search, ChevronDown, ChevronRight,
  Award, CheckCircle, X, ShieldCheck, Info, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import LiveCameraCapture from './LiveCameraCapture';
import { containsBlockedWords, getBlockedWordsInText } from '../lib/textSanitizer';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface ServiceRate {
  hourly: number;
  halfHour: number | null;
}

interface CitySuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

const SERVICE_TYPES = [
  'Walking', 'Jogging', 'Running', 'Biking', 'Yoga', 'Weight Lifting',
  'HIIT', 'Calisthenics', 'Swimming', 'Pilates', 'Stretching'
];

const PRESET_CERTIFICATIONS = [
  'CPR Self-Reported',
  'First Aid Self-Reported',
  'Self-Reported Personal Fitness Partner (CPT)',
  'Self-Reported Nutrition Coach',
  'Self-Reported Yoga Instructor',
  'Self-Reported Pilates Instructor',
  'Self-Reported Group Fitness Instructor',
  'Self-Reported Strength & Conditioning Specialist',
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const generateTimeSlots = (includeHalfHour: boolean): string[] => {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    if (includeHalfHour && h < 22) slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

function formatTimeLabel(time: string): string {
  const [hour, minute] = time.split(':');
  const h = parseInt(hour);
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${minute} ${period}`;
}

// Footer Modal Component - view only, no agreement needed
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

// Confirm Leave Modal Component
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
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition"
          >
            Leave
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">
          ↳ Stay on page &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ↳ Close & lose progress
        </p>
      </div>
    </div>
  );
}

function SafetyConfirmationModal({ isOpen, onClose, onConfirm, locationName }: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; locationName: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-7 h-7 text-green-500" />
          <h2 className="text-xl font-bold text-white">Confirm Public Venue</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Selected Location</p>
            <p className="text-white font-medium text-sm">{locationName}</p>
          </div>
          <p className="text-gray-300 text-sm">
            By adding this location you confirm it is a verified public venue where meetups are permitted.
          </p>
          <ul className="space-y-2">
            {[
              'This is a public park, gym, or fitness center.',
              'This is NOT a private residence or hotel.',
              'GPS check-in will be required upon arrival.',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
            Go Back
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all">
            Confirm Public Venue
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PartnerProfileSetup({ onComplete }: { onComplete?: () => void }) {
  const { user, refreshProfile, signOut, signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  
  // ========== STEP 1: ACCOUNT SETUP ==========
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [ageVerifyConsent, setAgeVerifyConsent] = useState(false);
  const [facialAgeConsent, setFacialAgeConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [gatekeeperAccepted, setGatekeeperAccepted] = useState(false);
  const [step1Error, setStep1Error] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ========== STEP 2: PROFILE ==========
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [city, setCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const citySearchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [customCertInput, setCustomCertInput] = useState('');
  const [certError, setCertError] = useState('');
  const [step2Error, setStep2Error] = useState('');
  
  // ========== STEP 3: PHOTOS ==========
  const [showCamera, setShowCamera] = useState(false);
  const [livePhotoUrl, setLivePhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');
  const [photoAccepted, setPhotoAccepted] = useState(false);
  const MAX_PHOTOS = 6;
  const [step3Error, setStep3Error] = useState('');
  
  // ========== STEP 4: SERVICES & RATES ==========
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [customServiceTypes, setCustomServiceTypes] = useState<string[]>([]);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [customServiceError, setCustomServiceError] = useState('');
  const [serviceRates, setServiceRates] = useState<Record<string, ServiceRate>>({});
  const [serviceHalfHourEnabled, setServiceHalfHourEnabled] = useState<Record<string, boolean>>({});
  const [step4Error, setStep4Error] = useState('');
  
  // ========== STEP 5: LOCATIONS & SCHEDULE ==========
  const [serviceAreas, setServiceAreas] = useState<{ name: string; lat: number | null; lng: number | null }[]>([]);
  const [serviceAreasCenterLat, setServiceAreasCenterLat] = useState<number | null>(null);
  const [serviceAreasCenterLng, setServiceAreasCenterLng] = useState<number | null>(null);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<SearchResult | null>(null);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [travelRadius, setTravelRadius] = useState(5);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [availability, setAvailability] = useState<{ day: string; times: string[] }[]>(
    DAYS_OF_WEEK.map(d => ({ day: d, times: [] }))
  );
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [step5Error, setStep5Error] = useState('');
  
  // ========== STEP 6: MEETUP SETTINGS ==========
  const [minAdvanceNotice, setMinAdvanceNotice] = useState(72);
  const [cancellationWindow, setCancellationWindow] = useState(24);
  const [step6Error, setStep6Error] = useState('');

  const allSelectedServices = [...serviceTypes, ...customServiceTypes];

  // Password strength checks
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

  const validateUsername = (value: string) => {
    if (!value) return '';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username cannot exceed 20 characters';
    if (!/^[a-zA-Z0-9_.]+$/.test(value)) return 'Use only letters, numbers, underscore (_), and period (.)';
    return '';
  };

  // Check username availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!username || username.length < 3 || validateUsername(username)) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.toLowerCase())
          .maybeSingle();
        if (error) throw error;
        setUsernameAvailable(!data);
      } catch (err) {
        console.error('Error checking username:', err);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };
    const timeout = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  // Search city
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

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          setLivePhotoUrl(data.live_photo_url);
          setAllPhotos(data.photos || (data.live_photo_url ? [data.live_photo_url] : []));
          setBio(data.bio || '');
          setCertifications(data.certifications || []);
          setServiceTypes(data.service_types || []);
          setCustomServiceTypes(data.custom_service_types || []);
          if (data.service_rates) {
            const rates = data.service_rates as Record<string, ServiceRate>;
            setServiceRates(rates);
            const halfHourSettings: Record<string, boolean> = {};
            Object.keys(rates).forEach(service => {
              halfHourSettings[service] = !!(rates[service]?.halfHour && rates[service].halfHour > 0);
            });
            setServiceHalfHourEnabled(halfHourSettings);
          }
          setServiceAreas(data.service_areas || []);
          setServiceAreasCenterLat(data.service_areas_center_lat);
          setServiceAreasCenterLng(data.service_areas_center_lng);
          setTravelRadius(data.travel_radius || 5);
          if (data.availability && data.availability.length > 0) {
            const merged = DAYS_OF_WEEK.map(day => {
              const existing = data.availability.find((a: any) => a.day === day);
              return existing || { day, times: [] };
            });
            setAvailability(merged);
          }
          setMinAdvanceNotice(data.min_advance_notice || 72);
          setCancellationWindow(data.cancellation_window || 24);
          setUsername(data.username || '');
          setCity(data.city || '');
        }
      } catch (err) {
        console.error('Load error:', err);
      }
    };
    loadProfile();
  }, [user]);

  const dataURLtoBlob = (dataURL: string): Blob => {
    const [header, data] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(data);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const handleCameraCapture = async (blobOrDataURL: Blob | string) => {
    setUploadingPhoto(true);
    try {
      let jpegBlob: Blob;
      if (typeof blobOrDataURL === 'string') {
        jpegBlob = dataURLtoBlob(blobOrDataURL);
      } else {
        jpegBlob = blobOrDataURL;
      }
      const previewUrl = URL.createObjectURL(jpegBlob);
      setTempPhotoUrl(previewUrl);
      setPhotoAccepted(false);
      setShowCamera(false);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Failed to capture photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAcceptPhoto = async () => {
    if (!tempPhotoUrl) return;
    if (!user) {
      alert('Please complete step 1 first.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const response = await fetch(tempPhotoUrl);
      const blob = await response.blob();
      const timestamp = Date.now();
      const fileName = `${user.id}/photo_${timestamp}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newPhotoUrl = `${urlData.publicUrl}?t=${timestamp}`;
      
      const updatedPhotos = [newPhotoUrl, ...allPhotos];
      await supabase.from('profiles').update({ photos: updatedPhotos, live_photo_url: newPhotoUrl }).eq('id', user.id);
      setAllPhotos(updatedPhotos);
      setLivePhotoUrl(newPhotoUrl);
      setPhotoAccepted(true);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRetakePhoto = () => {
    setTempPhotoUrl('');
    setPhotoAccepted(false);
    setShowCamera(true);
  };

  const handleAddPhoto = async () => {
    if (allPhotos.length >= MAX_PHOTOS) {
      alert(`Maximum ${MAX_PHOTOS} photos allowed. Delete one first.`);
      return;
    }
    setShowCamera(true);
  };

  const handleSetPrimaryPhoto = async (index: number) => {
    if (index === 0) return;
    const newOrder = [allPhotos[index], ...allPhotos.filter((_, i) => i !== index)];
    await supabase.from('profiles').update({ photos: newOrder, live_photo_url: newOrder[0] }).eq('id', user?.id);
    setAllPhotos(newOrder);
    setLivePhotoUrl(newOrder[0]);
    alert('Profile photo updated!');
  };

  const handleDeletePhoto = async (index: number) => {
    if (allPhotos.length === 1) {
      alert('You must keep at least one photo.');
      return;
    }
    const confirmed = window.confirm('Delete this photo? This cannot be undone.');
    if (!confirmed) return;
    const newPhotos = allPhotos.filter((_, i) => i !== index);
    await supabase.from('profiles').update({ photos: newPhotos }).eq('id', user?.id);
    setAllPhotos(newPhotos);
    if (index === 0 && newPhotos[0]) {
      await supabase.from('profiles').update({ live_photo_url: newPhotos[0] }).eq('id', user?.id);
      setLivePhotoUrl(newPhotos[0]);
    }
  };

  const handleFirstNameChange = (val: string) => {
    setFirstName(val);
    if (containsBlockedWords(val)) {
      setFirstNameError('First name contains blocked words.');
    } else if (!val.trim()) {
      setFirstNameError('First name is required');
    } else {
      setFirstNameError('');
    }
  };

  const handleLastNameChange = (val: string) => {
    setLastName(val);
    if (containsBlockedWords(val)) {
      setLastNameError('Last name contains blocked words.');
    } else if (!val.trim()) {
      setLastNameError('Last name is required');
    } else {
      setLastNameError('');
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      setEmailError('Please enter a valid email address.');
    } else {
      setEmailError('');
    }
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    let formatted = '';
    if (digits.length >= 1) formatted = '(' + digits.substring(0, 3);
    if (digits.length >= 4) formatted += ') ' + digits.substring(3, 6);
    if (digits.length >= 7) formatted += '-' + digits.substring(6, 10);
    setPhone(formatted);
    
    if (digits.length === 10 && digits[0] >= '2') {
      setPhoneError('');
    } else if (digits.length > 0 && digits.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number.');
    } else if (digits.length === 10 && digits[0] < '2') {
      setPhoneError('Please enter a valid US phone number.');
    } else {
      setPhoneError('');
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (!val) {
      setPasswordError('');
    } else if (!passwordMinLength) {
      setPasswordError('Password must be at least 8 characters');
    } else if (!passwordHasUpper) {
      setPasswordError('Password must contain at least 1 uppercase letter');
    } else if (!passwordHasLower) {
      setPasswordError('Password must contain at least 1 lowercase letter');
    } else if (!passwordHasNumber) {
      setPasswordError('Password must contain at least 1 number');
    } else if (!passwordHasSpecial) {
      setPasswordError('Password must contain at least 1 special character (!@#$%^&*)');
    } else {
      setPasswordError('');
    }
  };

  const toggleCertification = (cert: string) => {
    setCertifications(prev => prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]);
  };

  const addCustomCert = () => {
    const val = customCertInput.trim();
    if (!val) return;
    if (containsBlockedWords(val)) {
      setCertError('This credential contains blocked words.');
      return;
    }
    if (certifications.includes(val)) {
      setCertError('Already added.');
      return;
    }
    setCertifications(prev => [...prev, val]);
    setCustomCertInput('');
    setCertError('');
  };

  const toggleService = (s: string) => {
    setServiceTypes(prev => {
      if (prev.includes(s)) {
        const updated = { ...serviceRates };
        const halfHourUpdated = { ...serviceHalfHourEnabled };
        delete updated[s];
        delete halfHourUpdated[s];
        setServiceRates(updated);
        setServiceHalfHourEnabled(halfHourUpdated);
        return prev.filter(x => x !== s);
      }
      return [...prev, s];
    });
  };

  const addCustomService = () => {
    const val = customServiceInput.trim();
    if (!val) return;
    if (containsBlockedWords(val)) {
      setCustomServiceError('Activity name contains blocked words.');
      return;
    }
    if ([...SERVICE_TYPES, ...customServiceTypes].some(s => s.toLowerCase() === val.toLowerCase())) {
      setCustomServiceError('Activity already exists.');
      return;
    }
    setCustomServiceTypes(prev => [...prev, val]);
    setCustomServiceInput('');
    setCustomServiceError('');
  };

  const removeCustomService = (s: string) => {
    setCustomServiceTypes(prev => prev.filter(x => x !== s));
    const updated = { ...serviceRates };
    const halfHourUpdated = { ...serviceHalfHourEnabled };
    delete updated[s];
    delete halfHourUpdated[s];
    setServiceRates(updated);
    setServiceHalfHourEnabled(halfHourUpdated);
  };

  const updateServiceRate = (service: string, field: 'hourly' | 'halfHour', val: string) => {
    const num = parseInt(val) || 0;
    setServiceRates(prev => ({
      ...prev,
      [service]: { 
        ...(prev[service] || { hourly: 0, halfHour: null }), 
        [field]: field === 'halfHour' ? num : num,
        halfHour: field === 'halfHour' ? num : (prev[service]?.halfHour || null)
      }
    }));
  };

  const toggleServiceHalfHour = (service: string) => {
    const newValue = !serviceHalfHourEnabled[service];
    setServiceHalfHourEnabled(prev => ({ ...prev, [service]: newValue }));
    if (!newValue) {
      setServiceRates(prev => ({
        ...prev,
        [service]: { ...(prev[service] || { hourly: 0 }), halfHour: null }
      }));
    }
  };

  const searchAddress = (query: string) => {
    setAddressQuery(query);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (query.length < 3) { setAddressResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' gym fitness park')}&limit=10`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Adonix-Fit/1.0' } });
        const data = await response.json();
        const filtered = data.filter((result: any) => {
          const name = result.display_name.toLowerCase();
          return !name.includes('hotel') && !name.includes('motel') && !name.includes('apartment') && 
                 !name.includes('residential') && !name.includes('house') && !name.includes('home');
        });
        setAddressResults(filtered.slice(0, 10));
      } catch (error) {
        console.error('Search error:', error);
        setAddressResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const searchNearMe = async (lat: number, lng: number) => {
    setIsSearching(true);
    setAddressResults([]);
    try {
      const radiusDegrees = travelRadius * 0.0145;
      const bbox = `${lng - radiusDegrees},${lat - radiusDegrees},${lng + radiusDegrees},${lat + radiusDegrees}`;
      const searchTerms = ['gym', 'fitness', 'park', 'recreation', 'sports', 'yoga', 'pilates', 'crossfit'];
      let allResults: any[] = [];
      for (const term of searchTerms) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${term}&limit=10&bounded=1&viewbox=${bbox}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Adonix-Fit/1.0' } });
        const data = await response.json();
        allResults = [...allResults, ...data];
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      const unique = allResults.filter((item, index, self) => index === self.findIndex(r => r.display_name === item.display_name));
      const filtered = unique.filter((result: any) => {
        const name = result.display_name.toLowerCase();
        return !name.includes('hotel') && !name.includes('motel') && !name.includes('apartment') && 
               !name.includes('residential') && !name.includes('house') && !name.includes('home');
      });
      setAddressResults(filtered.slice(0, 20));
      if (filtered.length === 0) {
        alert(`No gyms or parks found within ${travelRadius} miles. Try increasing your radius or searching for a specific gym name.`);
      }
    } catch (error) {
      console.error('Error finding nearby places:', error);
      alert('Unable to find nearby locations. Please try searching manually.');
    } finally {
      setIsSearching(false);
    }
  };

  const MAX_LOCATIONS = 10;

  const initiateAddLocation = (result: SearchResult) => {
    if (serviceAreas.length >= MAX_LOCATIONS) {
      alert(`Maximum ${MAX_LOCATIONS} locations allowed. Remove one before adding another.`);
      return;
    }
    const alreadyAdded = serviceAreas.some(a => a.name === result.display_name);
    if (alreadyAdded) {
      alert('This location has already been added.');
      return;
    }
    setPendingLocation(result);
    setAddressResults([]);
    setShowLocationConfirm(true);
  };

  const confirmAddLocation = () => {
    if (!pendingLocation) return;
    const lat = parseFloat(pendingLocation.lat);
    const lng = parseFloat(pendingLocation.lon);
    const newArea = { name: pendingLocation.display_name, lat, lng };
    setServiceAreas(prev => [...prev, newArea]);
    if (!serviceAreasCenterLat) {
      setServiceAreasCenterLat(lat);
      setServiceAreasCenterLng(lng);
    }
    setAddressQuery('');
    setPendingLocation(null);
    setShowLocationConfirm(false);
  };

  const removeServiceArea = (index: number) => {
    setServiceAreas(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setServiceAreasCenterLat(null);
        setServiceAreasCenterLng(null);
      } else if (index === 0 && updated.length > 0) {
        setServiceAreasCenterLat(updated[0].lat);
        setServiceAreasCenterLng(updated[0].lng);
      }
      return updated;
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    setIsGettingLocation(true);
    setAddressResults([]);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setIsGettingLocation(false);
      await searchNearMe(lat, lng);
    }, () => {
      alert('Unable to get location. Please enable location permissions.');
      setIsGettingLocation(false);
    });
  };

  const toggleDay = (day: string) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const toggleTimeSlot = (day: string, time: string) => {
    setAvailability(prev => prev.map(a => {
      if (a.day !== day) return a;
      const times = a.times.includes(time) ? a.times.filter(t => t !== time) : [...a.times, time].sort();
      return { ...a, times };
    }));
  };

  const isStep1Complete = () => {
    return firstName && !firstNameError && lastName && !lastNameError && email && !emailError && 
           phone && !phoneError && isPasswordValid && termsAccepted && privacyAccepted && 
           gatekeeperAccepted && birthMonth && birthDay && birthYear && ageVerifyConsent && facialAgeConsent;
  };

  const isStep2Complete = () => {
    return username && usernameAvailable === true && city;
  };

  const isStep3Complete = () => {
    return allPhotos.length > 0 && photoConfirmed;
  };

  const isStep4Complete = () => {
    if (allSelectedServices.length === 0) return false;
    return allSelectedServices.every(service => {
      const r = serviceRates[service];
      if (!r || !r.hourly || r.hourly < 50 || r.hourly > 500) return false;
      if (serviceHalfHourEnabled[service]) {
        if (!r.halfHour || r.halfHour < 30 || r.halfHour > r.hourly) return false;
      }
      return true;
    });
  };

  const isStep5Complete = () => {
    return serviceAreas.length > 0 && availability.some(a => a.times.length > 0);
  };

  const isStep6Complete = () => {
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!isStep1Complete()) {
        setStep1Error('Please fill in all required fields and check all boxes.');
        return;
      }
      setStep1Error('');
      setLoading(true);
      try {
        const autoUsername = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Date.now()}`;
        const formattedBirthDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
        await signUp(email, password, 'partner', autoUsername, formattedBirthDate);
        setCurrentStep(2);
      } catch (err: any) {
        setStep1Error(err.message || 'Failed to create account');
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 2) {
      if (!isStep2Complete()) {
        setStep2Error('Please complete all required fields.');
        return;
      }
      setStep2Error('');
      if (user) {
        await supabase.from('profiles').update({ username: username.toLowerCase(), city, certifications }).eq('id', user.id);
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!isStep3Complete()) {
        setStep3Error('You must take and confirm at least one live photo.');
        return;
      }
      setStep3Error('');
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!isStep4Complete()) {
        setStep4Error('Please select at least one activity and set valid rates.');
        return;
      }
      setStep4Error('');
      if (user) {
        await supabase.from('profiles').update({
          service_types: serviceTypes,
          custom_service_types: customServiceTypes,
          service_rates: serviceRates
        }).eq('id', user.id);
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      if (!isStep5Complete()) {
        setStep5Error('Please add at least one location and select availability slots.');
        return;
      }
      setStep5Error('');
      if (user) {
        await supabase.from('profiles').update({
          service_areas: serviceAreas,
          service_areas_center_lat: serviceAreasCenterLat,
          service_areas_center_lng: serviceAreasCenterLng,
          travel_radius: travelRadius,
          availability
        }).eq('id', user.id);
      }
      setCurrentStep(6);
    } else if (currentStep === 6) {
      if (!isStep6Complete()) return;
      setStep6Error('');
      setSaving(true);
      try {
        await supabase.from('profiles').update({
          min_advance_notice: minAdvanceNotice,
          cancellation_window: cancellationWindow,
          is_partner: true,
          profile_complete: true
        }).eq('id', user?.id);
        await refreshProfile();
        if (onComplete) onComplete();
        else window.location.href = '/partner-dashboard';
      } catch (err: any) {
        alert(`Failed to save: ${err.message}`);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleClose = () => {
    setShowConfirmModal(true);
  };

  const confirmLeave = async () => {
    await signOut();
    window.location.href = '/';
  };

  const totalSteps = 6;
  const stepProgress = (currentStep / totalSteps) * 100;

  const footerTermsContent = `ADONIX FIT - TERMS OF SERVICE
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

  const footerPrivacyContent = `ADONIX FIT - PRIVACY POLICY
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

  const footerSafetyContent = `ADONIX FIT - SAFETY GUIDELINES

1. Public Locations Only - All meetups must occur at verified public gyms, parks, or recreation centers.

2. Trust Your Instincts - If something feels off, don't go.

3. GPS Check-In Required - You must verify your location within 0.75 miles of the agreed venue.

4. Two-Person Only - No extra friends, family, or spectators permitted.

5. Report Concerns Immediately - We review all reports within 24 hours.

Zero-Tolerance Policy: Private location requests, harassment, or unsafe behavior = permanent ban.`;

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        {/* Header - Same as client setup */}
        <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/adonixlogo.png" alt="Adonix Logo" className="h-10 w-auto" />
                <span className="text-xl font-bold text-white">ADONIX</span>
                <span className="text-xs text-gray-400">Social Fitness, Elevated</span>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span className="text-red-400 font-mono font-bold">{Math.round(stepProgress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-500 rounded-full" style={{ width: `${stepProgress}%` }} />
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {['Account', 'Profile', 'Photos', 'Services', 'Locations', 'Settings'].map((s, i) => (
                <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full ${currentStep > i + 1 ? 'bg-green-500/20 text-green-400' : currentStep === i + 1 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-500'}`}>
                  {currentStep > i + 1 ? '✓' : currentStep === i + 1 ? '●' : '○'} {s}
                </span>
              ))}
            </div>
          </div>

          {/* STEP 1: CREATE ACCOUNT */}
          {currentStep === 1 && (
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-center mb-6">Create Your Account</h2>
              
              {step1Error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {step1Error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">First Name <span className="text-red-500">*</span></label>
                    <input type="text" value={firstName} onChange={(e) => handleFirstNameChange(e.target.value)} className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none ${firstNameError ? 'border-red-500' : 'border-white/20 focus:border-red-500'}`} />
                    {firstNameError && <p className="text-red-400 text-xs mt-1">{firstNameError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input type="text" value={lastName} onChange={(e) => handleLastNameChange(e.target.value)} className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none ${lastNameError ? 'border-red-500' : 'border-white/20 focus:border-red-500'}`} />
                    {lastNameError && <p className="text-red-400 text-xs mt-1">{lastNameError}</p>}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" value={email} onChange={(e) => handleEmailChange(e.target.value)} className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none ${emailError ? 'border-red-500' : 'border-white/20 focus:border-red-500'}`} placeholder="you@example.com" />
                  {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone Number <span className="text-red-500">*</span></label>
                  <input type="tel" value={phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="(555) 123-4567" className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none ${phoneError ? 'border-red-500' : 'border-white/20 focus:border-red-500'}`} />
                  {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => handlePasswordChange(e.target.value)} className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none pr-10 ${passwordError ? 'border-red-500' : 'border-white/20 focus:border-red-500'}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className={`text-xs ${passwordMinLength ? 'text-green-400' : 'text-gray-500'}`}>{passwordMinLength ? '✓' : '○'} At least 8 characters</p>
                    <p className={`text-xs ${passwordHasUpper ? 'text-green-400' : 'text-gray-500'}`}>{passwordHasUpper ? '✓' : '○'} At least 1 uppercase letter</p>
                    <p className={`text-xs ${passwordHasLower ? 'text-green-400' : 'text-gray-500'}`}>{passwordHasLower ? '✓' : '○'} At least 1 lowercase letter</p>
                    <p className={`text-xs ${passwordHasNumber ? 'text-green-400' : 'text-gray-500'}`}>{passwordHasNumber ? '✓' : '○'} At least 1 number</p>
                    <p className={`text-xs ${passwordHasSpecial ? 'text-green-400' : 'text-gray-500'}`}>{passwordHasSpecial ? '✓' : '○'} At least 1 special character (!@#$%^&*)</p>
                  </div>
                  {passwordError && <p className="text-red-400 text-xs mt-1">{passwordError}</p>}
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Birth Date <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={birthMonth} onChange={(e) => { setBirthMonth(e.target.value); setBirthDateError(''); }} className="px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:border-red-500 focus:outline-none">
                      <option value="">Month</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (<option key={month} value={month}>{month}</option>))}
                    </select>
                    <select value={birthDay} onChange={(e) => { setBirthDay(e.target.value); setBirthDateError(''); }} className="px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:border-red-500 focus:outline-none">
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (<option key={day} value={day}>{day}</option>))}
                    </select>
                    <select value={birthYear} onChange={(e) => { setBirthYear(e.target.value); setBirthDateError(''); }} className="px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:border-red-500 focus:outline-none">
                      <option value="">Year</option>
                      {Array.from({ length: 107 }, (_, i) => 2026 - i).map(year => (<option key={year} value={year}>{year}</option>))}
                    </select>
                  </div>
                  {birthDateError && <p className="text-red-400 text-xs mt-1">{birthDateError}</p>}
                  <p className="text-xs text-gray-500 mt-2">Used only to verify you are 18+. Deleted immediately after confirmation.</p>
                  
                  <div className="flex items-start gap-2 mt-3">
                    <input type="checkbox" id="ageVerifyConsent" checked={ageVerifyConsent} onChange={(e) => setAgeVerifyConsent(e.target.checked)} className="mt-1 w-5 h-5 accent-red-600" />
                    <label htmlFor="ageVerifyConsent" className="text-xs text-gray-400">I consent to age verification using my birth date. This data is used only to confirm I am 18+ and is not retained. <span className="text-red-500">*</span></label>
                  </div>
                  
                  <div className="flex items-start gap-2 mt-2">
                    <input type="checkbox" id="facialAgeConsent" checked={facialAgeConsent} onChange={(e) => setFacialAgeConsent(e.target.checked)} className="mt-1 w-5 h-5 accent-red-600" />
                    <label htmlFor="facialAgeConsent" className="text-xs text-gray-400">I consent to facial age estimation. My image will be used only for age verification and deleted immediately. <span className="text-red-500">*</span></label>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <p className="text-xs text-yellow-300 font-semibold mb-2">⚠️ IMPORTANT INFORMATION</p>
                  <ul className="space-y-1 text-xs text-yellow-200/80">
                    <li>• Adonix is a social fitness network, not a professional service.</li>
                    <li>• You are joining to meet fitness partners in public locations only.</li>
                    <li>• No professional fitness services are provided or implied.</li>
                    <li>• Private residences, hotels, and Airbnbs are strictly prohibited.</li>
                    <li>• Harassment, solicitation, or unsafe behavior = permanent ban.</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={termsAccepted} onChange={() => setTermsAccepted(!termsAccepted)} className="mt-1 w-5 h-5 accent-red-600" />
                    <span className="text-sm text-gray-300">I have read and agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-red-400 underline">Terms of Service</button>. <span className="text-red-500">*</span></span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={privacyAccepted} onChange={() => setPrivacyAccepted(!privacyAccepted)} className="mt-1 w-5 h-5 accent-red-600" />
                    <span className="text-sm text-gray-300">I have read and agree to the <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-red-400 underline">Privacy Policy</button>. <span className="text-red-500">*</span></span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={gatekeeperAccepted} onChange={(e) => setGatekeeperAccepted(e.target.checked)} className="mt-1 w-5 h-5 accent-red-600" />
                    <span className="text-sm text-gray-300">I understand that Adonix is a social fitness platform — not a personal training service, dating app, or escort service. <span className="text-red-500">*</span></span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-center mt-8">
                <button onClick={handleNext} disabled={loading} className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50">
                  {loading ? 'Creating Account...' : 'CREATE ACCOUNT →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: YOUR PROFILE */}
          {currentStep === 2 && (
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-center mb-6">Your Profile</h2>
              
              {step2Error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {step2Error}
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Username <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="username" className={`w-full pl-7 pr-10 py-3 bg-white/10 border rounded-xl text-white focus:outline-none ${usernameAvailable === true ? 'border-green-500' : usernameAvailable === false ? 'border-red-500' : 'border-white/20 focus:border-red-500'}`} />
                    {checkingUsername && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div></div>}
                    {usernameAvailable === true && !checkingUsername && username.length >= 3 && <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle className="w-5 h-5 text-green-500" /></div>}
                    {usernameAvailable === false && !checkingUsername && username.length >= 3 && <div className="absolute right-3 top-1/2 -translate-y-1/2"><AlertCircle className="w-5 h-5 text-red-500" /></div>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Letters and numbers only. 3-20 characters. No blocked words.</p>
                  {usernameAvailable === false && <p className="text-red-400 text-xs mt-1">Username already taken</p>}
                </div>
                
                <div className="relative">
                  <label className="block text-sm text-gray-400 mb-1">Your City <span className="text-red-500">*</span></label>
                  <input type="text" value={city} onChange={(e) => handleCityInputChange(e.target.value)} placeholder="Los Angeles, CA" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none" />
                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {citySuggestions.map((suggestion, idx) => (<button key={idx} onClick={() => selectCity(suggestion)} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm text-gray-300">{suggestion.display_name}</button>))}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-red-500" />
                    <h3 className="text-base font-semibold">Self-Reported Credentials</h3>
                    <span className="text-xs text-gray-500">(Optional)</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">All credentials are self-reported and not verified by Adonix Fit. Select all that apply.</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESET_CERTIFICATIONS.map(cert => (<button key={cert} onClick={() => toggleCertification(cert)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${certifications.includes(cert) ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>{cert}</button>))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={customCertInput} onChange={(e) => setCustomCertInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomCert()} placeholder="Add custom credential..." className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none text-sm" />
                    <button onClick={addCustomCert} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                  {certError && <p className="text-xs text-red-400 mt-1">{certError}</p>}
                </div>
              </div>
              
              <div className="flex justify-between gap-4 mt-8">
                <button onClick={handleBack} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition">← BACK</button>
                <button onClick={handleNext} className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition hover:scale-105">NEXT →</button>
              </div>
            </div>
          )}

          {/* STEP 3: PHOTOS */}
          {currentStep === 3 && (
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-center mb-6">Show the world who's about to make them sweat.</h2>
              <p className="text-center text-gray-400 mb-6">You need at least 1 live photo. You can add up to 6 total. Your first photo automatically becomes your profile picture.</p>
              
              {step3Error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {step3Error}
                </div>
              )}
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {allPhotos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <div className={`w-24 h-24 rounded-xl overflow-hidden border-2 ${idx === 0 ? 'border-red-500 ring-2 ring-red-500/50' : 'border-white/20'}`}>
                      <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                    {idx === 0 && <div className="absolute -top-2 -left-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">MAIN</div>}
                    <div className="absolute bottom-1 right-1 flex gap-1">
                      {idx !== 0 && (<button onClick={() => handleSetPrimaryPhoto(idx)} className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-red-600">Set Primary</button>)}
                      <button onClick={() => handleDeletePhoto(idx)} className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-red-700">✕</button>
                    </div>
                  </div>
                ))}
                {allPhotos.length < MAX_PHOTOS && (
                  <button onClick={handleAddPhoto} className="w-24 h-24 rounded-xl border-2 border-dashed border-white/30 bg-white/5 hover:bg-white/10 transition flex flex-col items-center justify-center gap-1">
                    <Camera className="w-6 h-6 text-gray-400" />
                    <span className="text-[10px] text-gray-400">Add Photo</span>
                  </button>
                )}
              </div>
              
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <p className="font-semibold text-white mb-1">🎯 You. Right Now. No Filters.</p>
                <p className="text-sm text-gray-300 mb-3">Adonix is about real people showing up as themselves. That means live photos only — taken inside the app, in this moment.</p>
                <p className="text-sm text-gray-300 mb-2">What we're looking for:</p>
                <ul className="text-sm text-gray-300 space-y-1 ml-4">
                  <li>• <span className="text-white">You.</span> (authentic, confident, ready to move)</li>
                  <li>• <span className="text-white">Real.</span> (sweat, smile, or serious game face — just be you)</li>
                  <li>• <span className="text-white">Appropriate.</span> (active wear that makes you feel powerful)</li>
                </ul>
                <p className="text-sm text-gray-300 mt-3 italic">✨ Your energy is your best accessory.</p>
                
                <label className="flex items-start gap-3 mt-4 cursor-pointer">
                  <input type="checkbox" checked={photoConfirmed} onChange={(e) => setPhotoConfirmed(e.target.checked)} className="mt-1 w-5 h-5 accent-purple-600" />
                  <span className="text-sm text-gray-300">I confirm this is a live photo of me, taken right now, and follows community guidelines. <span className="text-red-500">*</span></span>
                </label>
              </div>
              
              <div className="mt-4 p-3 bg-red-900/40 border border-red-500/50 rounded-xl">
                <p className="text-xs text-red-500 font-extrabold flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  AUTHENTICITY CHECK: Live Camera Only. Use of AI-generated faces or filters is strictly prohibited and results in immediate suspension.
                </p>
              </div>
              
              <div className="flex justify-between gap-4 mt-8">
                <button onClick={handleBack} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition">← BACK</button>
                <button onClick={handleNext} className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition hover:scale-105">NEXT →</button>
              </div>
            </div>
          )}

          {/* STEP 4: ACTIVITIES & RATES */}
          {currentStep === 4 && (
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-center mb-6">Activities & Suggested Contributions</h2>
              <p className="text-center text-gray-400 mb-6">💰 Cha-ching! Set your suggested contribution per meetup. Min $50 · Max $500/hr. (You're worth it, trust us.)</p>
              
              {step4Error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {step4Error}
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mb-6">
                {SERVICE_TYPES.map(s => (<button key={s} onClick={() => toggleService(s)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${serviceTypes.includes(s) ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}>{s} {serviceTypes.includes(s) && '✓'}</button>))}
              </div>
              
              <div className="flex gap-2 mb-4">
                <input type="text" value={customServiceInput} onChange={(e) => setCustomServiceInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomService()} placeholder="Add custom activity..." className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none text-sm" />
                <button onClick={addCustomService} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
              {customServiceError && <p className="text-xs text-red-400 mb-2">{customServiceError}</p>}
              
              <p className="text-xs text-gray-400 mb-4">💡 Pro tip: Enable half-hour rates for each activity if you want to offer shorter sessions. This is what your clients will see, so they know exactly what you offer and how long. No surprises. Just sweat.</p>
              
              {allSelectedServices.length > 0 && (
                <div className="space-y-4">
                  {allSelectedServices.map(service => {
                    const isHalfHourOn = serviceHalfHourEnabled[service] || false;
                    const rate = serviceRates[service];
                    const hourlyError = rate?.hourly && (rate.hourly < 50 || rate.hourly > 500);
                    return (
                      <div key={service} className="p-4 bg-black rounded-xl border border-white/10">
                        <div className="flex justify-between items-center mb-3"><p className="font-semibold text-white">{service}</p>{customServiceTypes.includes(service) && (<button onClick={() => removeCustomService(service)} className="text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></button>)}</div>
                        <div className="space-y-3">
                          <div><label className="block text-xs text-gray-400 mb-1">Hourly Suggested Contribution <span className="text-red-500">*</span></label><div className="flex items-center gap-2"><span className="text-red-500 font-bold">$</span><input type="number" value={rate?.hourly || ''} onChange={(e) => updateServiceRate(service, 'hourly', e.target.value)} placeholder="0.00" min="50" max="500" step="1" className={`flex-1 px-3 py-2 bg-white/5 border rounded-lg focus:outline-none text-white ${hourlyError ? 'border-red-500' : 'border-white/10'}`} /><span className="text-gray-400 text-sm">/ hr</span></div><p className="text-xs text-gray-500 mt-1">Min $50 · Max $500</p>{hourlyError && <p className="text-xs text-red-400 mt-1">Hourly rate must be between $50 and $500</p>}</div>
                          {isHalfHourOn && (<div><label className="block text-xs text-gray-400 mb-1">Half-Hour Suggested Contribution <span className="text-red-500">*</span></label><div className="flex items-center gap-2"><span className="text-red-500 font-bold">$</span><input type="number" value={rate?.halfHour || ''} onChange={(e) => updateServiceRate(service, 'halfHour', e.target.value)} placeholder="0.00" min="30" max={rate?.hourly || 500} step="1" className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none text-white" /><span className="text-gray-400 text-sm">/ 30m</span></div><p className="text-xs text-gray-500 mt-1">Min $30 · Cannot exceed hourly rate</p></div>)}
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"><div><p className="text-sm font-medium text-gray-300">Half-Hour Meetups</p><p className="text-xs text-gray-500 mt-0.5">Members can book 30-minute sessions</p></div><button onClick={() => toggleServiceHalfHour(service)} className={`relative w-12 h-6 rounded-full transition-colors ${isHalfHourOn ? 'bg-red-600' : 'bg-gray-600'}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isHalfHourOn ? 'translate-x-6' : ''}`} /></button></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="flex justify-between gap-4 mt-8">
                <button onClick={handleBack} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition">← BACK</button>
                <button onClick={handleNext} className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition hover:scale-105">NEXT →</button>
              </div>
            </div>
          )}

          {/* STEP 5: LOCATIONS & SCHEDULE */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-center mb-6">The "Don't Be Weird" Location Picker</h2>
                <p className="text-center text-gray-400 mb-6">📍 Look, we're not trying to cramp your style. But safety first. That's why we only allow verified public venues — gyms, parks, recreation centers. No private residences, hotels, or Airbnbs.</p>
                
                <div className="mb-4 p-4 bg-black/50 rounded-xl border border-white/10">
                  <p className="text-sm text-yellow-400 mb-2">🏋️‍♂️ If you select a gym, make sure:</p>
                  <ul className="text-xs text-gray-300 space-y-1 ml-4">
                    <li>• You have a valid membership</li>
                    <li>• Your gym allows guests</li>
                    <li>• You follow their rules and terms of service</li>
                  </ul>
                  <p className="text-xs text-red-400 mt-3">⚠️ Adonix is not responsible for gym policies, memberships, or any issues that arise from using their facilities. We don't work with gyms or any company that offers fitness services. You're on your own there — but we know you've got this.</p>
                </div>
                
                {step5Error && (<div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">{step5Error}</div>)}
                
                <div className="mb-4"><label className="text-xs text-gray-400 font-medium">Travel Radius</label><div className="flex items-center justify-between mb-1"><span className="text-red-400 font-bold text-sm">{travelRadius} mile{travelRadius !== 1 ? 's' : ''}</span></div><input type="range" min="1" max="25" step="1" value={travelRadius} onChange={(e) => setTravelRadius(parseInt(e.target.value))} className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500" /></div>
                
                <div className="flex gap-2 mb-4"><button onClick={useCurrentLocation} disabled={isGettingLocation || isSearching} className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 font-medium text-sm">{isGettingLocation ? <><Loader2 className="w-4 h-4 animate-spin" /> Locating...</> : <><Navigation className="w-4 h-4" /> Search Near Me</>}</button></div>
                
                <div className="relative mb-4"><div className="absolute left-4 top-3.5">{isSearching ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Search className="w-4 h-4 text-gray-400" />}</div><input type="text" value={addressQuery} onChange={(e) => searchAddress(e.target.value)} placeholder="Search: gyms, parks, fitness centers, stadiums..." className="w-full pl-11 pr-4 py-3 bg-black border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none" /></div>
                
                {addressResults.length > 0 && (<div className="mb-4 bg-gray-900 border border-white/20 rounded-xl overflow-hidden"><p className="px-4 pt-3 pb-1 text-[10px] text-gray-500 uppercase tracking-wider">Safe public venues — tap to add</p>{addressResults.map((r, i) => (<button key={i} onClick={() => initiateAddLocation(r)} className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/5 last:border-0 transition-colors flex items-center gap-3"><MapPin className="w-4 h-4 text-green-500 shrink-0" /><p className="text-sm text-white truncate">{r.display_name}</p></button>))}</div>)}
                
                {serviceAreas.length > 0 && (<div><p className="text-xs text-gray-500 mb-2">Selected locations — tap X to remove:</p><div className="flex flex-wrap gap-2">{serviceAreas.map((area, i) => (<div key={i} className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1.5"><MapPin className="w-3 h-3 text-green-400" /><span className="text-sm text-green-300 truncate">{area.name.split(',')[0]}</span><button onClick={() => removeServiceArea(i)} className="text-green-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button></div>))}</div></div>)}
              </div>
              
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-center mb-6">Availability Schedule</h2>
                <p className="text-center text-gray-400 mb-6">🕐 Select days and time slots when you're available for meetups. (6 AM – 10 PM, 30-minute increments)</p>
                
                <div className="space-y-2">
                  {DAYS_OF_WEEK.map(day => {
                    const dayAvail = availability.find(a => a.day === day) || { day, times: [] };
                    const isExpanded = expandedDays[day];
                    return (<div key={day} className="border border-white/10 rounded-xl overflow-hidden"><button onClick={() => toggleDay(day)} className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10"><div className="flex items-center gap-3">{isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}<span className="font-medium">{day}</span></div><span className={`text-xs px-2 py-0.5 rounded-full ${dayAvail.times.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{dayAvail.times.length > 0 ? `${dayAvail.times.length} slot${dayAvail.times.length > 1 ? 's' : ''}` : 'No slots'}</span></button>{isExpanded && (<div className="px-4 py-3 bg-black"><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">{generateTimeSlots(true).map(time => (<button key={time} onClick={() => toggleTimeSlot(day, time)} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${dayAvail.times.includes(time) ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{formatTimeLabel(time)}</button>))}</div>{dayAvail.times.length > 0 && (<button onClick={() => setAvailability(prev => prev.map(a => a.day === day ? { ...a, times: [] } : a))} className="mt-3 text-xs text-red-400 hover:text-red-300">Clear all slots for {day}</button>)}</div>)}</div>);
                  })}
                </div>
              </div>
              
              <div className="flex justify-between gap-4">
                <button onClick={handleBack} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition">← BACK</button>
                <button onClick={handleNext} className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition hover:scale-105">NEXT →</button>
              </div>
            </div>
          )}

          {/* STEP 6: MEETUP SETTINGS */}
          {currentStep === 6 && (
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-center mb-6">Meetup Settings</h2>
              <p className="text-center text-gray-400 mb-6">⚙️ Configure how members can book time with you.</p>
              
              {step6Error && (<div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">{step6Error}</div>)}
              
              <div className="space-y-6">
                <div><label className="block text-sm text-gray-300 mb-2">📅 Advance Notice Required</label><p className="text-xs text-gray-500 mb-2">How far in advance must members book a session?</p><select value={minAdvanceNotice} onChange={(e) => setMinAdvanceNotice(parseInt(e.target.value))} className="w-full px-4 py-3 bg-black border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none"><option value={72}>3 days (72 hours)</option><option value={96}>4 days (96 hours)</option><option value={120}>5 days (120 hours)</option><option value={144}>6 days (144 hours)</option></select></div>
                
                <div><label className="block text-sm text-gray-300 mb-2">❌ Cancellation Window</label><p className="text-xs text-gray-500 mb-2">How many hours before a session can members cancel without penalty?</p><select value={cancellationWindow} onChange={(e) => setCancellationWindow(parseInt(e.target.value))} className="w-full px-4 py-3 bg-black border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none"><option value={24}>24 hours</option><option value={48}>48 hours</option></select></div>
                
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"><p className="text-xs text-blue-300 text-center">💡 Tip: Setting longer notice periods helps you manage your schedule better. Your time is valuable — protect it.</p></div>
                
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"><p className="text-xs text-yellow-300 text-center">⚠️ Please review all sections before finalizing.</p></div>
              </div>
              
              <div className="flex justify-between gap-4 mt-8">
                <button onClick={handleBack} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition">← BACK</button>
                <button onClick={handleNext} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition hover:scale-105 disabled:opacity-50">{saving ? 'FINALIZING...' : 'FINALIZE →'}</button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER - Centered */}
        <footer className="border-t border-white/10 bg-black/80 w-full px-8 md:px-12 lg:px-16 py-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex flex-wrap justify-center gap-6 text-xs mb-3">
              <button onClick={() => setShowTermsModal(true)} className="text-orange-400 hover:text-orange-300 transition-colors">Terms of Service</button>
              <button onClick={() => setShowPrivacyModal(true)} className="text-orange-400 hover:text-orange-300 transition-colors">Privacy Policy</button>
              <button onClick={() => setShowSafetyModal(true)} className="text-orange-400 hover:text-orange-300 transition-colors">Safety Guidelines</button>
            </div>
            <div className="text-xs text-gray-500">© 2026 ADONIX. All rights reserved.</div>
            <div className="text-center text-xs text-gray-600 mt-2">Adonix is a social fitness network — not a professional service. Meet only at verified public locations. GPS check-in required.</div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      {showCamera && (<LiveCameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} aspectRatio="square" />)}
      
      <SafetyConfirmationModal isOpen={showLocationConfirm} onClose={() => { setShowLocationConfirm(false); setPendingLocation(null); }} onConfirm={confirmAddLocation} locationName={pendingLocation?.display_name || ''} />
      
      <ConfirmLeaveModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmLeave} />
      
      <FooterInfoModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="Terms of Service" content={footerTermsContent} />
      <FooterInfoModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="Privacy Policy" content={footerPrivacyContent} />
      <FooterInfoModal isOpen={showSafetyModal} onClose={() => setShowSafetyModal(false)} title="Safety Guidelines" content={footerSafetyContent} />
    </>
  );
}