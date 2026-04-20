import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  Plus, Trash2, MapPin, Clock, DollarSign, Camera,
  Loader2, Navigation, Search, ChevronDown, ChevronRight,
  Award, CheckCircle, X, ShieldCheck, Info, Eye, EyeOff
} from 'lucide-react';
import LiveCameraCapture from './LiveCameraCapture';
import LegalModal from './LegalModal';
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

const SERVICE_TYPES = [
  'Walking', 'Jogging', 'Running', 'Biking', 'Yoga', 'Weight Lifting',
  'HIIT', 'Calisthenics', 'Swimming', 'Boxing', 'Pilates', 'Stretching'
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
  const { user, refreshProfile, signUp } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(!user);

  // Account creation states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState('');

  const [showCamera, setShowCamera] = useState(false);
  const [livePhotoUrl, setLivePhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [bio, setBio] = useState('');
  const [bioError, setBioError] = useState('');
  const [bioBlockedWords, setBioBlockedWords] = useState<string[]>([]);

  const [certifications, setCertifications] = useState<string[]>([]);
  const [customCertInput, setCustomCertInput] = useState('');
  const [certError, setCertError] = useState('');

  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [customServiceTypes, setCustomServiceTypes] = useState<string[]>([]);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [customServiceError, setCustomServiceError] = useState('');
  const [serviceRates, setServiceRates] = useState<Record<string, ServiceRate>>({});
  const [serviceHalfHourEnabled, setServiceHalfHourEnabled] = useState<Record<string, boolean>>({});

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

  const [minAdvanceNotice, setMinAdvanceNotice] = useState(72);
  const [cancellationWindow, setCancellationWindow] = useState(24);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const allSelectedServices = [...serviceTypes, ...customServiceTypes];

  // Password strength checks
  const passwordMinLength = password.length >= 8;
  const passwordHasUpper = /[A-Z]/.test(password);
  const passwordHasLower = /[a-z]/.test(password);
  const passwordHasNumber = /[0-9]/.test(password);
  const passwordHasSpecial = /[!@#$%^&*]/.test(password);
  const isPasswordValid = passwordMinLength && passwordHasUpper && passwordHasLower && passwordHasNumber && passwordHasSpecial;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');
    
    if (!firstName.trim()) {
      setAccountError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setAccountError('Last name is required');
      return;
    }
    if (!email.trim()) {
      setAccountError('Email is required');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setAccountError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!isPasswordValid) {
      setAccountError('Please enter a valid password');
      return;
    }
    
    setCreatingAccount(true);
    try {
      const autoUsername = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Date.now()}`;
      await signUp(email, password, 'partner', autoUsername, null);
      // Instead of reloading, just hide the account form
      setShowAccountForm(false);
    } catch (err: any) {
      setAccountError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setCreatingAccount(false);
    }
  };

  // Watch for user becoming available after signup
  useEffect(() => {
    if (user && showAccountForm) {
      setShowAccountForm(false);
      setLoadingProfile(true);
    }
  }, [user, showAccountForm]);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          setLivePhotoUrl(data.live_photo_url);
          setBio(data.bio || '');
          setCertifications((data as any).certifications || []);
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
          setTravelRadius((data as any).travel_radius || 5);
          if (data.availability && (data.availability as any[]).length > 0) {
            const merged = DAYS_OF_WEEK.map(day => {
              const existing = (data.availability as { day: string; times: string[] }[]).find(a => a.day === day);
              return existing || { day, times: [] };
            });
            setAvailability(merged);
          }
          setMinAdvanceNotice(data.min_advance_notice || 72);
          setCancellationWindow(data.cancellation_window || 24);
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    load();
  }, [user]);

  const isPhotoComplete = () => !!livePhotoUrl;
  const isBioComplete = () => {
    if (bio.length < 20 || bio.length > 500) return false;
    if (containsBlockedWords(bio)) return false;
    return true;
  };
  const isServicesComplete = () => {
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
  const isServiceAreasComplete = () => serviceAreas.length > 0 && serviceAreas.every(a => a.lat && a.lng);
  const isAvailabilityComplete = () => availability.some(a => a.times.length > 0);
  const isTermsComplete = () => termsAccepted && privacyAccepted;

  const completedSections = [
    isPhotoComplete(),
    isBioComplete(),
    isServicesComplete(),
    isServiceAreasComplete(),
    isAvailabilityComplete(),
    isTermsComplete(),
  ];
  const progress = Math.round((completedSections.filter(Boolean).length / completedSections.length) * 100);
  const canSave = completedSections.every(Boolean);

  const handleClose = () => {
    setShowConfirmModal(true);
  };

  const handleBack = () => {
    setShowConfirmModal(true);
  };

  const confirmLeave = () => {
    window.location.href = '/';
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
    if (!user) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('You must be logged in to upload a photo.');
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
        .upload(fileName, jpegBlob, {
          upsert: true,
          contentType: 'image/jpeg',
        });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ live_photo_url: url }).eq('id', user.id);
      setLivePhotoUrl(url);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleBioChange = (val: string) => {
    setBio(val);
    if (containsBlockedWords(val)) {
      const blocked = getBlockedWordsInText(val);
      setBioError(`Your bio contains blocked words: ${blocked.slice(0, 3).join(', ')}. Please remove them.`);
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
        const response = await fetch(url, { 
          headers: { 'User-Agent': 'Adonix-Fit/1.0' } 
        });
        const data = await response.json();
        const filtered = data.filter((result: any) => {
          const name = result.display_name.toLowerCase();
          return !name.includes('hotel') && 
                 !name.includes('motel') && 
                 !name.includes('apartment') && 
                 !name.includes('residential') &&
                 !name.includes('house') &&
                 !name.includes('home');
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
        const response = await fetch(url, { 
          headers: { 'User-Agent': 'Adonix-Fit/1.0' } 
        });
        const data = await response.json();
        allResults = [...allResults, ...data];
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const unique = allResults.filter((item, index, self) => 
        index === self.findIndex(r => r.display_name === item.display_name)
      );
      
      const filtered = unique.filter((result: any) => {
        const name = result.display_name.toLowerCase();
        return !name.includes('hotel') && 
               !name.includes('motel') && 
               !name.includes('apartment') && 
               !name.includes('residential') &&
               !name.includes('house') &&
               !name.includes('home');
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

  const handleSave = async () => {
    if (!user) {
      alert('You must be logged in to save.');
      return;
    }
    
    if (!canSave) { 
      alert('Please complete all sections before saving.'); 
      return; 
    }
    
    if (containsBlockedWords(bio)) {
      alert('Your bio contains blocked words. Please remove them before saving.');
      return;
    }
    
    if (serviceAreas.some(a => !a.lat || !a.lng)) {
      alert('All meetup locations must be selected from the map search. Manual addresses without GPS coordinates are not allowed.');
      return;
    }
    
    setSaving(true);
    try {
      const updateData = {
        bio,
        certifications,
        service_types: serviceTypes,
        custom_service_types: customServiceTypes,
        service_rates: serviceRates,
        half_hour_enabled: false,
        service_areas: serviceAreas,
        service_areas_center_lat: serviceAreasCenterLat,
        service_areas_center_lng: serviceAreasCenterLng,
        travel_radius: travelRadius,
        availability,
        min_advance_notice: minAdvanceNotice,
        cancellation_window: cancellationWindow,
        is_partner: true,
        profile_complete: true,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      if (onComplete) onComplete();
      else window.location.href = '/partner-dashboard';
    } catch (err: any) {
      console.error('Save error:', err);
      alert(`Failed to save profile: ${err.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  // If showAccountForm is true, show account creation form
  if (showAccountForm) {
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

            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white">Create Your Account</h1>
                <p className="text-gray-400 mt-1">Join as a Partner</p>
              </div>

              {accountError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {accountError}
                </div>
              )}

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none pr-10"
                      placeholder="Create a password"
                      required
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
                </div>

                <button
                  type="submit"
                  disabled={creatingAccount}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-semibold hover:scale-105 transition disabled:opacity-50"
                >
                  {creatingAccount ? 'Creating Account...' : 'CREATE ACCOUNT'}
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition"
                >
                  BACK
                </button>
              </div>
            </div>
          </div>
        </div>

        <ConfirmLeaveModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmLeave}
        />
      </>
    );
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
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

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Close button - Top Right */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Partner Profile Setup</span>
              <span className="text-red-400 font-mono font-bold">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {['Photo', 'Bio', 'Services', 'Locations', 'Schedule', 'Terms'].map((s, i) => (
                <span
                  key={s}
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    completedSections[i] ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'
                  }`}
                >
                  {completedSections[i] ? '✓' : '○'} {s}
                </span>
              ))}
            </div>
          </div>

          {/* SECTION 1: PROFILE PHOTO */}
          <div className={`p-6 rounded-2xl border ${isPhotoComplete() ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'} mb-8`}>
            <div className="flex items-center gap-2 mb-4">
              {isPhotoComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
              <Camera className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-semibold">Profile Photo</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white/10 border-2 border-white/20 flex-shrink-0">
                {uploadingPhoto ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                  </div>
                ) : livePhotoUrl ? (
                  <img src={livePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Camera className="w-10 h-10" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <button
                  onClick={() => setShowCamera(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold flex items-center gap-2 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  {livePhotoUrl ? 'Retake Live Photo' : 'Take Live Photo'}
                </button>
                <div className="p-3 bg-red-900/40 border border-red-500/50 rounded-xl">
                  <p className="text-xs text-red-500 font-extrabold flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    AUTHENTICITY CHECK: Live Camera Only. Use of AI-generated faces or filters is strictly prohibited and results in immediate suspension.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: BIO */}
          <div className={`p-6 rounded-2xl border ${isBioComplete() ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'} mb-8`}>
            <div className="flex items-center gap-2 mb-4">
              {isBioComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
              <h2 className="text-base font-semibold">Your Bio</h2>
            </div>
            <textarea
              value={bio}
              onChange={(e) => handleBioChange(e.target.value)}
              placeholder="Share your fitness philosophy, what you enjoy, and what kinds of meetups you're looking for... (20–500 characters)"
              rows={5}
              className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none resize-none transition-colors"
            />
            <div className="flex justify-between items-center mt-2">
              {bioError ? (
                <p className="text-xs text-red-400">{bioError}</p>
              ) : bio.length >= 20 ? (
                <p className="text-xs text-green-400">Looks good!</p>
              ) : (
                <p className="text-xs text-gray-500">Minimum 20 characters</p>
              )}
              <span className={`text-xs font-mono ${bio.length > 500 ? 'text-red-400' : bio.length >= 20 ? 'text-green-400' : 'text-gray-500'}`}>
                {bio.length}/500
              </span>
            </div>
            {bioBlockedWords.length > 0 && (
              <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400">
                  Blocked content detected: {bioBlockedWords.slice(0, 3).join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* SECTION 3: CERTIFICATIONS */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-semibold">Self-Reported Credentials</h2>
              <span className="text-xs text-gray-500">(Optional)</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              All credentials are self-reported and not verified by Adonix Fit. Select all that apply.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_CERTIFICATIONS.map(cert => (
                <button
                  key={cert}
                  onClick={() => toggleCertification(cert)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    certifications.includes(cert)
                      ? 'bg-red-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {cert}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customCertInput}
                onChange={(e) => setCustomCertInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomCert()}
                placeholder="Add custom credential..."
                className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none text-sm"
              />
              <button onClick={addCustomCert} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {certError && <p className="text-xs text-red-400 mt-1">{certError}</p>}
            {certifications.filter(c => !PRESET_CERTIFICATIONS.includes(c)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {certifications.filter(c => !PRESET_CERTIFICATIONS.includes(c)).map(cert => (
                  <div key={cert} className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
                    <span className="text-sm">{cert}</span>
                    <button onClick={() => setCertifications(prev => prev.filter(c => c !== cert))} className="text-gray-400 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: SERVICES & RATES */}
          <div className={`p-6 rounded-2xl border ${isServicesComplete() ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'} mb-8`}>
            <div className="flex items-center gap-2 mb-2">
              {isServicesComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
              <DollarSign className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-semibold">Activities & Suggested Contributions</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Select your activities and set a suggested contribution per meetup. Min $50 · Max $500/hr.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {SERVICE_TYPES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleService(s)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    serviceTypes.includes(s)
                      ? 'bg-red-600 text-white shadow-lg scale-[1.02]'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {s} {serviceTypes.includes(s) && '✓'}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={customServiceInput}
                onChange={(e) => setCustomServiceInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomService()}
                placeholder="Add custom activity..."
                className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none text-sm"
              />
              <button onClick={addCustomService} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {customServiceError && <p className="text-xs text-red-400 mb-2">{customServiceError}</p>}
            {customServiceTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {customServiceTypes.map(s => (
                  <div key={s} className="flex items-center gap-1 bg-red-600/20 border border-red-500/30 rounded-full px-3 py-1">
                    <span className="text-sm text-red-300">{s}</span>
                    <button onClick={() => removeCustomService(s)} className="text-red-400 hover:text-red-300">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {allSelectedServices.length > 0 && (
              <div className="mt-6 space-y-4">
                <p className="text-sm font-medium text-white">Set suggested contributions per activity:</p>
                {allSelectedServices.map(service => {
                  const isHalfHourOn = serviceHalfHourEnabled[service] || false;
                  return (
                    <div key={service} className="p-4 bg-black rounded-xl border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-semibold text-white">{service}</p>
                        {customServiceTypes.includes(service) && (
                          <button onClick={() => removeCustomService(service)} className="text-gray-400 hover:text-red-400">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Hourly Suggested Contribution <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-red-500 font-bold">$</span>
                            <input
                              type="number"
                              value={serviceRates[service]?.hourly || ''}
                              onChange={(e) => updateServiceRate(service, 'hourly', e.target.value)}
                              placeholder="100"
                              min="50"
                              max="500"
                              step="1"
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white"
                            />
                            <span className="text-gray-400 text-sm">/ hr</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Min $50 · Max $500</p>
                        </div>

                        {isHalfHourOn && (
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Half-Hour Suggested Contribution <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-red-500 font-bold">$</span>
                              <input
                                type="number"
                                value={serviceRates[service]?.halfHour || ''}
                                onChange={(e) => updateServiceRate(service, 'halfHour', e.target.value)}
                                placeholder="60"
                                min="30"
                                max={serviceRates[service]?.hourly || 500}
                                step="1"
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white"
                              />
                              <span className="text-gray-400 text-sm">/ 30m</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Min $30 · Cannot exceed hourly rate</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 mt-2">
                          <div>
                            <p className="text-sm font-medium text-gray-300">Half-Hour Meetups</p>
                            <p className="text-xs text-gray-500 mt-0.5">Members can book 30-minute sessions</p>
                          </div>
                          <button
                            onClick={() => toggleServiceHalfHour(service)}
                            className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${isHalfHourOn ? 'bg-red-600' : 'bg-gray-600'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isHalfHourOn ? 'translate-x-6' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 5: SERVICE AREAS */}
          <div className={`p-6 rounded-2xl border ${isServiceAreasComplete() ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'} mb-8`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isServiceAreasComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
                <MapPin className="w-5 h-5 text-red-500" />
                <h2 className="text-base font-semibold">The "Don't Be Weird" Location Picker</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${serviceAreas.length >= MAX_LOCATIONS ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-400'}`}>
                  {serviceAreas.length}/{MAX_LOCATIONS}
                </span>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <ShieldCheck className="w-4 h-4" />
                  GPS Secured
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Search for a local gym or park near you. Our system automatically blocks residential addresses.
            </p>

            <div className="mb-4 p-4 bg-black rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400 font-medium">Travel Radius</label>
                <span className="text-red-400 font-bold text-sm">{travelRadius} mile{travelRadius !== 1 ? 's' : ''}</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={travelRadius}
                onChange={(e) => setTravelRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>1 mi</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25 mi</span>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={useCurrentLocation}
                disabled={isGettingLocation || isSearching}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium text-sm"
              >
                {isGettingLocation
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Locating...</>
                  : <><Navigation className="w-4 h-4" /> Search Near Me</>
                }
              </button>
            </div>

            <div className="relative mb-2">
              <div className="absolute left-4 top-3.5 pointer-events-none">
                {isSearching
                  ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  : <Search className="w-4 h-4 text-gray-400" />
                }
              </div>
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => searchAddress(e.target.value)}
                placeholder="Search: gyms, parks, fitness centers, stadiums..."
                className="w-full pl-11 pr-4 py-3 bg-black border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
              />
            </div>

            <p className="text-[10px] text-gray-600 mb-3 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-red-400" />
              Anti-creep filter active: Hotels, residential addresses, and private venues are automatically blocked.
            </p>

            {addressResults.length > 0 && (
              <div className="mb-4 bg-gray-900 border border-white/20 rounded-xl overflow-hidden">
                <p className="px-4 pt-3 pb-1 text-[10px] text-gray-500 uppercase tracking-wider">
                  Safe public venues — tap to add
                </p>
                {addressResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => initiateAddLocation(r)}
                    className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/5 last:border-0 transition-colors flex items-center gap-3"
                  >
                    <MapPin className="w-4 h-4 text-green-500 shrink-0" />
                    <p className="text-sm text-white truncate">{r.display_name}</p>
                  </button>
                ))}
              </div>
            )}

            {serviceAreas.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-2">Selected locations — tap X to remove:</p>
                <div className="flex flex-wrap gap-2">
                  {serviceAreas.map((area, i) => {
                    const shortName = area.name.split(',')[0];
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1.5"
                      >
                        <MapPin className="w-3 h-3 text-green-400 shrink-0" />
                        <span className="text-sm text-green-300 truncate">{shortName}</span>
                        <button
                          onClick={() => removeServiceArea(i)}
                          className="text-green-500 hover:text-red-400 transition-colors shrink-0 ml-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: AVAILABILITY */}
          <div className={`p-6 rounded-2xl border ${isAvailabilityComplete() ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'} mb-8`}>
            <div className="flex items-center gap-2 mb-4">
              {isAvailabilityComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
              <Clock className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-semibold">Availability Schedule</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Select days and 30-minute time slots when you're available for meetups (6 AM – 10 PM).
            </p>
            <div className="space-y-2">
              {DAYS_OF_WEEK.map(day => {
                const dayAvail = availability.find(a => a.day === day) || { day, times: [] };
                const isExpanded = expandedDays[day];
                return (
                  <div key={day} className="border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleDay(day)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4 text-gray-400" />
                          : <ChevronRight className="w-4 h-4 text-gray-400" />
                        }
                        <span className="font-medium">{day}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        dayAvail.times.length > 0
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {dayAvail.times.length > 0
                          ? `${dayAvail.times.length} slot${dayAvail.times.length > 1 ? 's' : ''}`
                          : 'No slots'}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="px-4 py-3 bg-black">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {generateTimeSlots(true).map(time => {
                            const active = dayAvail.times.includes(time);
                            return (
                              <button
                                key={time}
                                onClick={() => toggleTimeSlot(day, time)}
                                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  active
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                              >
                                {formatTimeLabel(time)}
                              </button>
                            );
                          })}
                        </div>
                        {dayAvail.times.length > 0 && (
                          <button
                            onClick={() => setAvailability(prev =>
                              prev.map(a => a.day === day ? { ...a, times: [] } : a)
                            )}
                            className="mt-3 text-xs text-red-400 hover:text-red-300"
                          >
                            Clear all slots for {day}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 7: MEETUP SETTINGS */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 mb-8">
            <h2 className="text-base font-semibold mb-4">Meetup Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Advance Notice Required</label>
                <select
                  value={minAdvanceNotice}
                  onChange={(e) => setMinAdvanceNotice(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none"
                >
                  <option value={72}>3 days (72 hours)</option>
                  <option value={96}>4 days (96 hours)</option>
                  <option value={120}>5 days (120 hours)</option>
                  <option value={144}>6 days (144 hours)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Cancellation Window</label>
                <select
                  value={cancellationWindow}
                  onChange={(e) => setCancellationWindow(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none"
                >
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 8: TERMS */}
          <div className={`p-6 rounded-2xl border ${isTermsComplete() ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'} mb-8`}>
            <div className="flex items-center gap-2 mb-4">
              {isTermsComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
              <h2 className="text-base font-semibold">Terms & Legal Acknowledgment</h2>
            </div>
            <div className="p-4 bg-black rounded-xl border border-white/10 mb-4 text-sm text-gray-300 space-y-2">
              <p className="font-medium">By joining as a Partner you acknowledge:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-gray-400">
                <li>You are an independent social participant, not an employee or contractor.</li>
                <li>Adonix Fit is a private social networking platform, not a professional services marketplace.</li>
                <li>Suggested contributions are voluntary social gifts, not professional service fees.</li>
                <li>All meetups must occur in verified public locations only.</li>
                <li>Platform Support (15%) is deducted for network facilitation.</li>
                <li>You are solely responsible for your safety, conduct, and compliance with local laws.</li>
              </ul>
            </div>
            
            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={termsAccepted}
                readOnly
                className="mt-0.5 w-5 h-5 accent-red-600 cursor-default shrink-0"
              />
              <span className="text-sm text-gray-300">
                I have read and agree to the{' '}
                <button
                  type="button"
                  onClick={() => setLegalModal('terms')}
                  className="text-red-400 underline hover:text-red-300 transition-colors"
                >
                  Terms of Service
                </button>
                . <span className="text-red-500">*</span>
              </span>
            </label>
            
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAccepted}
                readOnly
                className="mt-0.5 w-5 h-5 accent-red-600 cursor-default shrink-0"
              />
              <span className="text-sm text-gray-300">
                I have read and agree to the{' '}
                <button
                  type="button"
                  onClick={() => setLegalModal('privacy')}
                  className="text-red-400 underline hover:text-red-300 transition-colors"
                >
                  Privacy Policy
                </button>
                . <span className="text-red-500">*</span>
              </span>
            </label>
            
            <p className="text-xs text-yellow-400 mt-3">
              ⚠️ You must open and agree to BOTH the Terms of Service AND Privacy Policy to finalize your profile.
            </p>
          </div>

          {/* Buttons - Back and Finalize */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleBack}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition"
            >
              BACK
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !canSave}
              className={`flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-semibold transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100`}
            >
              {saving ? 'Saving...' : 'FINALIZE & SECURE PROFILE'}
            </button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>By finalizing, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCamera && (
        <LiveCameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          aspectRatio="square"
        />
      )}

      <SafetyConfirmationModal
        isOpen={showLocationConfirm}
        onClose={() => { setShowLocationConfirm(false); setPendingLocation(null); }}
        onConfirm={confirmAddLocation}
        locationName={pendingLocation?.display_name || ''}
      />

      {legalModal && (
        <LegalModal
          type={legalModal}
          onClose={() => setLegalModal(null)}
          onAccept={() => {
            if (legalModal === 'terms') {
              setTermsAccepted(true);
            } else if (legalModal === 'privacy') {
              setPrivacyAccepted(true);
            }
            setLegalModal(null);
          }}
        />
      )}

      <ConfirmLeaveModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmLeave}
      />
    </>
  );
}