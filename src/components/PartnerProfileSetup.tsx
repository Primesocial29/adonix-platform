import { useState, useEffect, useRef } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, MapPin, Clock, DollarSign, Camera, Loader2, Navigation, Search, Dumbbell, ChevronDown, ChevronRight, Award, Sparkles, CheckCircle, X } from 'lucide-react';
import { validateText, containsBlockedWords } from '../lib/textSanitizer';
import BlockedWordAlert from './BlockedWordAlert';
import LiveCameraCapture from './LiveCameraCapture';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

const SERVICE_TYPES = [
  'Walking', 'Jogging', 'Running', 'Biking', 'Yoga', 'Weight Lifting',
  'HIIT', 'Calisthenics', 'Swimming', 'Boxing', 'Pilates', 'Stretching'
];

const COMMON_CERTIFICATIONS = [
  'CPR Certified', 'First Aid Certified', 'Certified Personal Trainer (CPT)',
  'Nutrition Coach', 'Yoga Instructor', 'Pilates Instructor', 'Group Fitness Instructor',
  'Strength & Conditioning Specialist', 'Corrective Exercise Specialist'
];

interface ServiceRate {
  hourly: number;
  halfHour: number;
}

// Terms Modal Component
function TermsModal({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: string }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none">
            <p>{content}</p>
          </div>
        </div>
        <div className="p-4 border-t">
          <button onClick={onClose} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Confirmation Modal Component
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// Location Confirmation Modal for manual entry
function LocationConfirmModal({ isOpen, onClose, onConfirm, locationName }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; locationName: string }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Confirm Location</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="mb-6">
          <p className="text-gray-700 mb-3">You are adding:</p>
          <p className="text-sm font-medium text-gray-900 bg-gray-100 p-2 rounded-lg mb-4">{locationName}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Please confirm:</p>
            <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
              <li>This is a PUBLIC gym, fitness center, or park</li>
              <li>This is NOT a private residence or home</li>
              <li>This is a safe, public location for meetings</li>
              <li>You have permission to meet clients here</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500">By confirming, you agree this is a public location suitable for client meetings.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Confirm & Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PartnerProfileSetup({ onComplete }: { onComplete?: () => void }) {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLocationConfirmModal, setShowLocationConfirmModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<string>('');
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Form fields
  const [bio, setBio] = useState('');
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [serviceRates, setServiceRates] = useState<Record<string, ServiceRate>>({});
  const [customServiceTypes, setCustomServiceTypes] = useState<string[]>([]);
  const [newCustomService, setNewCustomService] = useState('');
  const [customServiceError, setCustomServiceError] = useState('');
  const [halfHourEnabled, setHalfHourEnabled] = useState(false);
  const [serviceAreas, setServiceAreas] = useState<{ name: string; lat: number | null; lng: number | null }[]>([]);
  const [newArea, setNewArea] = useState('');
  // NEW: Store the primary location for distance searching
  const [serviceAreasCenterLat, setServiceAreasCenterLat] = useState<number | null>(null);
  const [serviceAreasCenterLng, setServiceAreasCenterLng] = useState<number | null>(null);
  const [availability, setAvailability] = useState<{day: string; times: string[]}[]>([
    { day: 'Monday', times: [] },
    { day: 'Tuesday', times: [] },
    { day: 'Wednesday', times: [] },
    { day: 'Thursday', times: [] },
    { day: 'Friday', times: [] },
    { day: 'Saturday', times: [] },
    { day: 'Sunday', times: [] },
  ]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  
  const [minAdvanceNotice, setMinAdvanceNotice] = useState(72);
  const [cancellationWindow, setCancellationWindow] = useState(24);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');
  const [certificationError, setCertificationError] = useState('');
  
  // Terms acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');
  
  // Enhanced Service Areas search
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSearchResults, setAddressSearchResults] = useState<SearchResult[]>([]);
  const [isAddressSearching, setIsAddressSearching] = useState(false);
  const [showAddressResults, setShowAddressResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<SearchResult | null>(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [nearbyPlaces, setNearbyPlaces] = useState<SearchResult[]>([]);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Validation states
  const [bioError, setBioError] = useState<string | null>(null);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  
  // Time slots (30-minute intervals)
  const timeSlots = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const period = hour >= 12 ? 'PM' : 'AM';
      const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const timeDisplay = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
      timeSlots.push({ value: timeValue, display: timeDisplay });
    }
  }

  // Helper functions for completion tracking
  const isProfilePhotoComplete = () => photos.length > 0;
  const isBioComplete = () => bio.trim().length >= 20 && bio.trim().length <= 500;
  const isServicesComplete = () => {
    const allServices = [...serviceTypes, ...customServiceTypes];
    if (allServices.length === 0) return false;
    // Check if all selected services have rates
    for (const service of allServices) {
      const rate = serviceRates[service];
      if (!rate || !rate.hourly || rate.hourly < 50 || rate.hourly > 500) return false;
      if (halfHourEnabled && (!rate.halfHour || rate.halfHour < 30 || rate.halfHour > rate.hourly)) return false;
    }
    return true;
  };
  const isServiceAreasComplete = () => serviceAreas.length > 0;
  const isAvailabilityComplete = () => availability.some(day => day.times.length > 0);
  const isBookingSettingsComplete = () => minAdvanceNotice !== 0;

  const getCompletedCount = () => {
    let count = 0;
    if (isProfilePhotoComplete()) count++;
    if (isBioComplete()) count++;
    if (isServicesComplete()) count++;
    if (isServiceAreasComplete()) count++;
    if (isAvailabilityComplete()) count++;
    if (isBookingSettingsComplete()) count++;
    return count;
  };

  const completedCount = getCompletedCount();
  const totalSections = 6;
  const progressPercentage = (completedCount / totalSections) * 100;

  // Calculate earnings for preview
  const calculateEarningsPreview = (hourlyRate: number) => {
    const platformFeePercent = 0.15; // 15% as per Terms of Service
    const platformFee = hourlyRate * platformFeePercent;
    const stripeFeeAmount = (hourlyRate * 0.029) + 0.30;
    const partnerEarnings = hourlyRate - platformFee - stripeFeeAmount;
    return { platformFee, stripeFeeAmount, partnerEarnings: Math.max(0, partnerEarnings) };
  };

  // Get a sample rate for earnings preview
  const getSampleRate = () => {
    const allServices = [...serviceTypes, ...customServiceTypes];
    if (allServices.length > 0 && serviceRates[allServices[0]]?.hourly) {
      return serviceRates[allServices[0]].hourly;
    }
    return 100;
  };

  // Check if user is loaded
  useEffect(() => {
    if (!user) {
      console.log('Waiting for user to load...');
    } else {
      console.log('User loaded:', user.id);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const toggleDay = (day: string) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setProfile(data);
        setBio(data.bio || '');
        setServiceTypes(data.service_types || []);
        setServiceRates(data.service_rates || {});
        setCustomServiceTypes(data.custom_service_types || []);
        setHalfHourEnabled(data.half_hour_enabled || false);
        setMinAdvanceNotice(data.min_advance_notice ?? 72);
        setCancellationWindow(data.cancellation_window ?? 24);
        setCertifications(data.certifications || []);
        // NEW: Load center coordinates
        setServiceAreasCenterLat(data.service_areas_center_lat || null);
        setServiceAreasCenterLng(data.service_areas_center_lng || null);
        let parsedAreas: { name: string; lat: number | null; lng: number | null }[] = [];
        if (data.service_areas) {
          const raw = Array.isArray(data.service_areas) ? data.service_areas : [];
          parsedAreas = raw.map((item: any) => ({
            name: item.name || '',
            lat: item.lat !== undefined ? item.lat : null,
            lng: item.lng !== undefined ? item.lng : null,
          }));
        }
        setServiceAreas(parsedAreas);
        setPhotos(data.photos || []);
        if (data.availability && Array.isArray(data.availability) && data.availability.length === 7) {
          setAvailability(data.availability);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceType = (type: string) => {
    setServiceTypes(prev => {
      const newTypes = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
      return newTypes;
    });
  };

  const updateServiceRate = (type: string, field: 'hourly' | 'halfHour', value: string) => {
    let num = parseInt(value);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > 500) num = 500;
    
    if (field === 'hourly' && num < 50) {
      alert('Hourly rate must be at least $50.');
      return;
    }
    if (field === 'hourly' && num > 500) {
      alert('Hourly rate cannot exceed $500.');
      return;
    }
    
    if (field === 'halfHour') {
      if (num < 30) {
        alert('Half‑hour rate must be at least $30.');
        return;
      }
      if (num > 250) {
        alert('Half‑hour rate cannot exceed $250.');
        return;
      }
      const hourly = serviceRates[type]?.hourly || 0;
      if (num > hourly) {
        alert('Half‑hour rate cannot exceed hourly rate.');
        return;
      }
    }
    
    setServiceRates(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: num }
    }));
  };

  const addCustomServiceType = () => {
    const trimmed = newCustomService.trim();
    if (!trimmed) return;
    if (containsBlockedWords(trimmed)) {
      setCustomServiceError('This service type contains blocked words.');
      return;
    }
    if (serviceTypes.includes(trimmed) || customServiceTypes.includes(trimmed)) {
      setCustomServiceError('Service type already added.');
      return;
    }
    setCustomServiceTypes([...customServiceTypes, trimmed]);
    setNewCustomService('');
    setCustomServiceError('');
  };

  const removeCustomServiceType = (type: string) => {
    setCustomServiceTypes(customServiceTypes.filter(t => t !== type));
    const newRates = { ...serviceRates };
    delete newRates[type];
    setServiceRates(newRates);
  };

  const addCertification = () => {
    const trimmed = newCertification.trim();
    if (!trimmed) return;
    if (containsBlockedWords(trimmed)) {
      setCertificationError('This certification contains blocked words.');
      return;
    }
    if (certifications.includes(trimmed)) {
      setCertificationError('Certification already added.');
      return;
    }
    setCertifications([...certifications, trimmed]);
    setNewCertification('');
    setCertificationError('');
  };

  const removeCertification = (cert: string) => {
    setCertifications(certifications.filter(c => c !== cert));
  };

  const addServiceArea = (area: { name: string; lat?: number; lng?: number }) => {
    if (!area.name.trim()) return;
    const newAreaObj = {
      name: area.name.trim(),
      lat: area.lat ?? null,
      lng: area.lng ?? null,
    };
    if (!serviceAreas.some(a => a.name === newAreaObj.name)) {
      const updatedAreas = [...serviceAreas, newAreaObj];
      setServiceAreas(updatedAreas);

      // If no center set yet and this area has coordinates, set it as center
      if (!serviceAreasCenterLat && !serviceAreasCenterLng && newAreaObj.lat && newAreaObj.lng) {
        setServiceAreasCenterLat(newAreaObj.lat);
        setServiceAreasCenterLng(newAreaObj.lng);
      }
    }
    setAddressQuery('');
    setAddressSearchResults([]);
    setShowAddressResults(false);
    setNewArea('');
  };

  const handleManualAddClick = () => {
    if (!newArea.trim()) {
      alert('Please enter a location name first.');
      return;
    }
    setPendingLocation(newArea.trim());
    setShowLocationConfirmModal(true);
  };

  const confirmManualAdd = () => {
    addServiceArea({ name: pendingLocation });
    setShowLocationConfirmModal(false);
    setPendingLocation('');
  };

  const cancelManualAdd = () => {
    setShowLocationConfirmModal(false);
    setPendingLocation('');
    setNewArea('');
  };

  const removeServiceArea = (index: number) => {
    const isRemovingFirst = (index === 0 && serviceAreas.length > 0);
    const wasCenter = isRemovingFirst && 
      serviceAreas[0]?.lat === serviceAreasCenterLat && 
      serviceAreas[0]?.lng === serviceAreasCenterLng;
    
    setServiceAreas(serviceAreas.filter((_, i) => i !== index));
    
    // NEW: If we removed the center location, update to the new first location (if any)
    if (wasCenter && serviceAreas.length > 1) {
      const newFirst = serviceAreas[1];
      if (newFirst?.lat && newFirst?.lng) {
        setServiceAreasCenterLat(newFirst.lat);
        setServiceAreasCenterLng(newFirst.lng);
      } else {
        setServiceAreasCenterLat(null);
        setServiceAreasCenterLng(null);
      }
    } else if (serviceAreas.length === 1) {
      setServiceAreasCenterLat(null);
      setServiceAreasCenterLng(null);
    }
  };

  const toggleTimeSlot = (day: string, timeValue: string) => {
    setAvailability(prev => prev.map(daySchedule => {
      if (daySchedule.day === day) {
        let times = daySchedule.times;
        if (times.includes(timeValue)) {
          times = times.filter(t => t !== timeValue);
        } else {
          if (!halfHourEnabled) {
            if (!timeValue.endsWith(':00')) {
              alert('Half‑hour sessions are not enabled. Enable half‑hour sessions in the Services section first.');
              return daySchedule;
            }
          }
          times = [...times, timeValue];
        }
        return { ...daySchedule, times };
      }
      return daySchedule;
    }));
  };

  const searchAddress = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAddressSearchResults([]);
      setShowAddressResults(false);
      return;
    }
    setIsAddressSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'AdonixFit/1.0' } }
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setAddressSearchResults(data);
      setShowAddressResults(true);
    } catch (err) {
      console.error('Address search error:', err);
      setAddressSearchResults([]);
      setShowAddressResults(false);
    } finally {
      setIsAddressSearching(false);
    }
  };

  const findNearbyPlaces = async (lat: number, lng: number) => {
    setIsSearchingNearby(true);
    setNearbyPlaces([]);
    try {
      const radiusInDegrees = searchRadius / 69;
      const bbox = `${lng - radiusInDegrees},${lat - radiusInDegrees},${lng + radiusInDegrees},${lat + radiusInDegrees}`;
      
      const searchTerms = ['gym', 'fitness center', 'park', 'recreation center', 'yoga studio', 'sports complex', 'fitness', 'exercise'];
      let allResults: SearchResult[] = [];
      
      for (const term of searchTerms) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${term}&bounded=1&limit=30&viewbox=${bbox}&addressdetails=1`;
          const response = await fetch(url, { 
            headers: { 'User-Agent': 'AdonixFit/1.0' },
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            const data = await response.json();
            allResults = [...allResults, ...data];
          }
        } catch (err) {
          console.error(`Error searching for ${term}:`, err);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const unique = allResults.filter((item, index, self) =>
        index === self.findIndex(r => 
          r.display_name === item.display_name || 
          (r.lat === item.lat && r.lon === item.lon)
        )
      );
      
      const filtered = unique.filter(place => {
        const placeLat = parseFloat(place.lat);
        const placeLon = parseFloat(place.lon);
        const distance = Math.sqrt(
          Math.pow((placeLat - lat) * 69, 2) + 
          Math.pow((placeLon - lng) * 54.6, 2)
        );
        return distance <= searchRadius;
      });
      
      setNearbyPlaces(filtered.slice(0, 20));
      
      if (filtered.length === 0) {
        alert(`No gyms or parks found within ${searchRadius} miles. Try increasing the search radius or manually add a location.`);
      }
    } catch (err) {
      console.error('Nearby search error:', err);
      alert('Unable to find nearby places. Please try again or manually add a location.');
    } finally {
      setIsSearchingNearby(false);
    }
  };

  const handleAddressSelect = (result: SearchResult) => {
    setSelectedAddress(result);
    setAddressQuery(result.display_name);
    setShowAddressResults(false);
    findNearbyPlaces(parseFloat(result.lat), parseFloat(result.lon));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const reverseResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'User-Agent': 'AdonixFit/1.0' } }
          );
          const reverseData = await reverseResponse.json();
          const locationResult: SearchResult = {
            display_name: reverseData.display_name || `${latitude}, ${longitude}`,
            lat: latitude.toString(),
            lon: longitude.toString()
          };
          setSelectedAddress(locationResult);
          setAddressQuery(reverseData.display_name);
          await findNearbyPlaces(latitude, longitude);
          alert(`Location found! Showing ${searchRadius} mile radius.`);
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          const locationResult: SearchResult = {
            display_name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude.toString(),
            lon: longitude.toString()
          };
          setSelectedAddress(locationResult);
          setAddressQuery(`Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
          await findNearbyPlaces(latitude, longitude);
        }
        setIsGettingLocation(false);
      },
      (error) => {
        console.error(error);
        let errorMessage = 'Unable to get your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
        }
        alert(errorMessage);
        setIsGettingLocation(false);
      }
    );
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (addressQuery.length >= 3 && !selectedAddress) {
        searchAddress(addressQuery);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [addressQuery]);

  const handleSave = async () => {
    setBioError(null);
    setBlockedWords([]);
    setTermsError('');
    
    // Check if user exists
    if (!user || !user.id) {
      alert('You must be logged in to save your profile. Please refresh the page and try again.');
      return;
    }
    
    if (!termsAccepted) {
      setTermsError('You must agree to the Terms of Service and Privacy Policy before saving your profile.');
      return;
    }
    
    if (completedCount !== 6) {
      alert(`Please complete all required sections before saving. ${completedCount} of ${totalSections} completed.`);
      return;
    }
    
    if (bio) {
      if (bio.length < 20) {
        setBioError('Bio must be at least 20 characters');
        return;
      }
      if (bio.length > 500) {
        setBioError('Bio cannot exceed 500 characters');
        return;
      }
      const bioValidation = await validateText(bio, 'profile bio');
      if (!bioValidation.isValid) {
        setBlockedWords(bioValidation.blockedWords);
        setBioError(bioValidation.error || 'Your bio contains blocked words');
        return;
      }
    }
    
    // Validate all selected services have rates
    const allServices = [...serviceTypes, ...customServiceTypes];
    for (const service of allServices) {
      const rate = serviceRates[service];
      if (!rate || !rate.hourly || rate.hourly < 50 || rate.hourly > 500) {
        alert(`Please set a valid hourly rate for "${service}" ($50-$500).`);
        return;
      }
      if (halfHourEnabled && (!rate.halfHour || rate.halfHour < 30 || rate.halfHour > rate.hourly)) {
        alert(`Please set a valid half-hour rate for "${service}" (minimum $30, cannot exceed hourly rate).`);
        return;
      }
    }
    
    setShowConfirmModal(true);
  };
  
  const confirmSave = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    try {
      // Check if user exists
      if (!user || !user.id) {
        alert('You must be logged in to save your profile. Please refresh the page and try again.');
        setSaving(false);
        return;
      }
      
      const serviceAreasJson = serviceAreas.map(area => ({
        name: area.name,
        lat: area.lat,
        lng: area.lng,
      }));
      
      const availabilityJson = availability.map(day => ({
        day: day.day,
        times: day.times,
      }));
      
      const allServiceTypes = [...serviceTypes, ...customServiceTypes];
      const filteredRates: Record<string, ServiceRate> = {};
      for (const type of allServiceTypes) {
        if (serviceRates[type]) {
          filteredRates[type] = {
            hourly: Math.floor(serviceRates[type].hourly),
            halfHour: Math.floor(serviceRates[type].halfHour)
          };
        }
      }
      
      const updateData = {
        bio: bio,
        service_types: serviceTypes,
        custom_service_types: customServiceTypes,
        service_rates: filteredRates,
        half_hour_enabled: halfHourEnabled,
        service_areas: serviceAreasJson,
        availability: availabilityJson,
        photos: photos,
        min_advance_notice: minAdvanceNotice,
        cancellation_window: cancellationWindow,
        certifications: certifications,
        is_partner: true,
        updated_at: new Date().toISOString(),
        // NEW: Save the primary location for distance searching
        service_areas_center_lat: serviceAreasCenterLat,
        service_areas_center_lng: serviceAreasCenterLng,
      };
      
      console.log('Saving profile data for user:', user.id);
      console.log('Update data:', updateData);
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      await refreshProfile();
      alert('Profile saved successfully!');
      
      // Force redirect to dashboard
      window.location.href = '/dashboard';
      
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const allSelectedServices = [...serviceTypes, ...customServiceTypes];
  const sampleRate = getSampleRate();
  const earningsPreview = calculateEarningsPreview(sampleRate);

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 pb-20">
        {/* Sticky Progress Bar */}
        <div ref={progressBarRef} className="sticky top-0 z-10 bg-gradient-to-br from-gray-900 to-black pt-2 pb-4">
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>{completedCount} of {totalSections} completed</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            {completedCount === totalSections ? "✓ All sections complete! Ready to save." : `Complete all ${totalSections} sections to save your profile`}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8">
          
          {bioError && (
            <BlockedWordAlert 
              blockedWords={blockedWords} 
              onClose={() => {
                setBioError(null);
                setBlockedWords([]);
              }}
            />
          )}
          
          {/* ========== SECTION 1: PROFILE PHOTO ========== */}
          <div className="mb-8 p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 mb-3">
              {isProfilePhotoComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
              <label className="text-base font-medium text-white">Your Profile Photo (Required)</label>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              {photos.length > 0 ? (
                <div className="relative group">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-white/5 ring-4 ring-red-500/30 shadow-xl">
                    <img 
                      src={photos[0]} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <button
                    onClick={() => setShowCamera(true)}
                    className="absolute bottom-0 right-0 p-2.5 bg-red-600 rounded-full hover:bg-red-700 transition-all transform hover:scale-110 shadow-lg"
                    title="Edit Photo"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-2">Click the camera icon to update your photo</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowCamera(true)}
                  className="w-40 h-40 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-red-500 hover:bg-white/10 transition-all group"
                >
                  <Camera className="w-10 h-10 text-gray-400 group-hover:text-red-500 transition-colors" />
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Take Live Photo</span>
                </button>
              )}
              
              <div className="text-center space-y-1 mt-2">
                <p className="text-sm text-gray-300">A clear photo of you — your face visible, and only you in the frame.</p>
                <p className="text-xs text-gray-500">No logos, other people, or group shots. Live camera only — no gallery uploads.</p>
                <p className="text-xs text-gray-500">Appropriate attire required. No nude or partially nude photos.</p>
                <p className="text-xs text-green-400 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Real faces build real trust. You can update it anytime with a new live photo.
                </p>
              </div>
              
              {/* AI-generated photo notice */}
              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg w-full">
                <p className="text-xs text-yellow-400 text-center">
                  ⚠️ Real human photo only. AI-generated, deepfake, or synthetic images are prohibited and will result in account termination.
                </p>
              </div>
              
              {!isProfilePhotoComplete() && (
                <p className="text-xs text-red-400 text-center animate-pulse">⚠️ Required: Take a live photo of yourself</p>
              )}
            </div>
          </div>
          
          {/* ========== SECTION 2: BIO ========== */}
          <div className="mb-8 p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 mb-3">
              {isBioComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
              <label className="text-base font-medium text-white">Bio</label>
            </div>
            
            <textarea
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setBio(e.target.value);
                }
              }}
              placeholder="Why should someone choose you? Don't be boring. Don't be obvious. Just be memorable... (20-500 chars)"
              rows={4}
              maxLength={500}
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:border-red-500 focus:outline-none transition-colors text-white placeholder-gray-500 text-base ${
                bioError ? 'border-red-500' : 'border-white/10'
              }`}
            />
            
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                ⚡ This ain't Tinder. No contact info, no offensive words, no funny business — just fitness.
              </p>
              <p className={`text-xs ${bio.trim().length >= 20 && bio.trim().length <= 500 ? 'text-green-400' : 'text-red-400'}`}>
                {bio.trim().length}/500
              </p>
            </div>
            
            {!isBioComplete() && (
              <p className="text-xs text-red-400 mt-2">⚠️ Required: Tell us about yourself (minimum 20 characters, maximum 500)</p>
            )}
          </div>
          
          {/* ========== SECTION 3: CERTIFICATIONS ========== */}
          <div className="mb-8 p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-white" />
              <label className="text-base font-medium text-white">Certifications (Optional)</label>
            </div>
            
            <p className="text-xs text-gray-500 mb-3">Add certifications that build trust with clients.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_CERTIFICATIONS.map(cert => (
                <button
                  key={cert}
                  onClick={() => {
                    if (!certifications.includes(cert)) {
                      setCertifications([...certifications, cert]);
                    }
                  }}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs transition-colors"
                >
                  + {cert}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="Custom certification"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white"
              />
              <button
                onClick={addCertification}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            {certificationError && <p className="text-red-400 text-sm mb-2">{certificationError}</p>}
            <div className="flex flex-wrap gap-2">
              {certifications.map(cert => (
                <div key={cert} className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                  <span className="text-sm text-white">{cert}</span>
                  <button onClick={() => removeCertification(cert)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* ========== SECTION 4: SERVICES & RATES ========== */}
          <div className="mb-8 p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 mb-3">
              {isServicesComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
              <label className="text-base font-medium text-white">Services & Rates</label>
            </div>
            
            <p className="text-xs text-gray-500 mb-3">Select the activities you offer and set your rates (whole dollars only). Minimum hourly rate $50, maximum $500.</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {SERVICE_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => toggleServiceType(type)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    serviceTypes.includes(type)
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCustomService}
                onChange={(e) => setNewCustomService(e.target.value)}
                placeholder="Add custom service (e.g., Kickboxing)"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
              />
              <button
                onClick={addCustomServiceType}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {customServiceError && <p className="text-red-400 text-sm mb-2">{customServiceError}</p>}
            
            {customServiceTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {customServiceTypes.map(type => (
                  <div key={type} className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                    <span className="text-sm text-white">{type}</span>
                    <button onClick={() => removeCustomServiceType(type)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Rate Inputs for Selected Services */}
            {allSelectedServices.length > 0 && (
              <div className="mt-4 space-y-4">
                <p className="text-sm font-medium text-white">Set your rates for each service:</p>
                {allSelectedServices.map(service => (
                  <div key={service} className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="font-semibold text-white mb-3">{service}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">
                          Hourly Rate <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-red-500 font-bold">$</span>
                          <input
                            type="number"
                            value={serviceRates[service]?.hourly || ''}
                            onChange={(e) => updateServiceRate(service, 'hourly', e.target.value)}
                            placeholder="50"
                            min="50"
                            max="500"
                            step="1"
                            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white"
                          />
                          <span className="text-gray-400 text-sm">/ hour</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Minimum $50, maximum $500</p>
                      </div>
                      
                      {halfHourEnabled && (
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">
                            Half-Hour Rate <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-red-500 font-bold">$</span>
                            <input
                              type="number"
                              value={serviceRates[service]?.halfHour || ''}
                              onChange={(e) => updateServiceRate(service, 'halfHour', e.target.value)}
                              placeholder="30"
                              min="30"
                              max={serviceRates[service]?.hourly || 500}
                              step="1"
                              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white"
                            />
                            <span className="text-gray-400 text-sm">/ 30 min</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Minimum $30, cannot exceed hourly rate</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between gap-3 mb-4 p-3 bg-white/5 rounded-xl mt-4">
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-300">Half‑Hour Sessions</label>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${halfHourEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {halfHourEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {halfHourEnabled 
                    ? '✅ Enabled: Clients can book both 30-minute and 60-minute sessions.' 
                    : '⭕ Disabled: Clients can only book 60-minute sessions. Toggle ON to offer half-hour options.'}
                </p>
              </div>
              <button
                onClick={() => setHalfHourEnabled(!halfHourEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${
                  halfHourEnabled ? 'bg-red-600' : 'bg-gray-600'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${halfHourEnabled ? 'transform translate-x-6' : ''}`} />
              </button>
            </div>
            
            {/* Earnings Breakdown Preview */}
            {allSelectedServices.length > 0 && serviceRates[allSelectedServices[0]]?.hourly && (
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="text-sm font-semibold text-blue-300 mb-2">💰 Example Earnings Breakdown (based on ${sampleRate}/hour session)</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Your rate:</span>
                    <span className="text-white">${sampleRate}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Adonix fee (15%):</span>
                    <span className="text-red-400">-${earningsPreview.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Stripe fee (2.9% + $0.30):</span>
                    <span className="text-red-400">-${earningsPreview.stripeFeeAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 my-2"></div>
                  <div className="flex justify-between font-bold">
                    <span className="text-white">You earn:</span>
                    <span className="text-green-400">${earningsPreview.partnerEarnings.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Fees are calculated per session. You keep 100% of tips.</p>
              </div>
            )}
            
            {!isServicesComplete() && (
              <p className="text-xs text-red-400 mt-2">⚠️ Required: Select at least one service and set rates for each</p>
            )}
          </div>
          
          {/* ========== SECTION 5: SERVICE AREAS ========== */}
          <div className="mb-8 p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 mb-3">
              {isServiceAreasComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
              <label className="text-base font-medium text-white">Service Areas</label>
            </div>
            
            <p className="text-xs text-gray-500 mb-3">
              Adonix Fit requires meetings in public, safe locations. Add gyms, parks, and public spaces where you're available to meet clients.
            </p>

            {/* Current Location Button */}
            <div className="mb-4">
              <button
                onClick={useCurrentLocation}
                disabled={isGettingLocation}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Getting your location...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    <span>Use My Current Location</span>
                  </>
                )}
              </button>
            </div>

            {/* Search Radius Slider */}
            <div className="mb-4 p-3 bg-white/5 rounded-xl">
              <label className="block text-sm text-gray-300 mb-2">
                Search Radius: <span className="text-green-400 font-bold">{searchRadius} miles</span>
              </label>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(searchRadius / 25) * 100}%, #4a4a4a ${(searchRadius / 25) * 100}%, #4a4a4a 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25 mi</span>
              </div>
            </div>

            {/* Address Search Input */}
            <div className="relative mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={addressQuery}
                    onChange={(e) => {
                      setAddressQuery(e.target.value);
                      setSelectedAddress(null);
                    }}
                    placeholder="Search for a city, address, or zip code..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              {showAddressResults && addressSearchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-zinc-800 border border-white/10 rounded-lg max-h-60 overflow-y-auto">
                  {addressSearchResults.map((result) => (
                    <button
                      key={result.display_name}
                      onClick={() => handleAddressSelect(result)}
                      className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm text-gray-300"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Find Gyms & Parks Button - Only shows after location is selected */}
            {selectedAddress && (
              <div className="mb-4">
                <button
                  onClick={() => findNearbyPlaces(parseFloat(selectedAddress.lat), parseFloat(selectedAddress.lon))}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  disabled={isSearchingNearby}
                >
                  {isSearchingNearby ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Searching for gyms and parks...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Find Gyms & Parks Near This Location</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Nearby Places Results */}
            {nearbyPlaces.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  Found {nearbyPlaces.length} gyms and parks nearby:
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {nearbyPlaces.map((place, idx) => (
                    <button
                      key={idx}
                      onClick={() => addServiceArea({ 
                        name: place.display_name, 
                        lat: parseFloat(place.lat), 
                        lng: parseFloat(place.lon) 
                      })}
                      className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <p className="text-sm text-white">{place.display_name}</p>
                      <p className="text-xs text-gray-400 mt-1">Click to add to your service areas</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Entry Section - Only shown if they can't find a gym/park */}
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-xs text-yellow-400 mb-2 flex items-center gap-1">
                <span>⚠️</span> Can't find the gym or park you're looking for?
              </p>
              <p className="text-xs text-gray-400 mb-3">
                If your preferred meeting location isn't listed above, you can add it manually. Please ensure it's a public gym, fitness center, or park.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="Enter gym name or park address..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualAddClick()}
                />
                <button
                  onClick={handleManualAddClick}
                  className="px-4 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5 text-white" />
                  <span className="text-white text-sm">Add</span>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                📍 Please enter a valid gym name or public park address
              </p>
            </div>

            {/* Selected Service Areas List */}
            {serviceAreas.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-300 mb-2">
                  Your Service Areas ({serviceAreas.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {serviceAreas.map((area, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                      <span className="text-sm text-white">{area.name}</span>
                      <button onClick={() => removeServiceArea(index)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!isServiceAreasComplete() && (
              <p className="text-xs text-red-400 mt-2">⚠️ Required: Add at least one service area (gym, park, or public space)</p>
            )}
          </div>
          
          {/* ========== SECTION 6: AVAILABILITY ========== */}
          <div className="mb-8 p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 mb-3">
              {isAvailabilityComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
              <label className="text-base font-medium text-white">Availability</label>
            </div>
            
            <p className="text-xs text-gray-500 mb-3">
              Select the days and times you're available for sessions.
              {!halfHourEnabled && " Only full‑hour slots (e.g., 9:00 AM, 10:00 AM) are available."}
              {halfHourEnabled && " Half‑hour slots (e.g., 9:30 AM) are now available."}
            </p>
            
            <div className="space-y-2">
              {availability.map((daySchedule) => (
                <div key={daySchedule.day} className="border border-white/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleDay(daySchedule.day)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5"
                  >
                    <span className="font-semibold text-white">{daySchedule.day}</span>
                    {expandedDays[daySchedule.day] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  {expandedDays[daySchedule.day] && (
                    <div className="p-4 pt-0 border-t border-white/10">
                      <div className="grid grid-cols-4 gap-2">
                        {timeSlots.map((slot) => {
                          if (!halfHourEnabled && !slot.value.endsWith(':00')) {
                            return null;
                          }
                          return (
                            <button
                              key={slot.value}
                              onClick={() => toggleTimeSlot(daySchedule.day, slot.value)}
                              className={`px-2 py-1 text-xs rounded-lg ${
                                daySchedule.times.includes(slot.value)
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              {slot.display}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {!isAvailabilityComplete() && (
              <p className="text-xs text-red-400 mt-2">⚠️ Required: Select at least one time slot</p>
            )}
          </div>
          
          {/* ========== SECTION 7: BOOKING SETTINGS ========== */}
          <div className="mb-8 p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 mb-3">
              {isBookingSettingsComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
              <label className="text-base font-medium text-white">Booking Settings</label>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">When should someone be able to book you?</label>
                <p className="text-xs text-gray-400 mb-2">Give yourself a little breathing room. You pick the window — 3 to 6 days.</p>
                <div className="flex gap-3 mb-2">
                  {[3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setMinAdvanceNotice(days * 24)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        minAdvanceNotice === days * 24
                          ? 'bg-red-600 text-white ring-2 ring-red-400'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
                <p className="text-xs text-green-400">✨ Same-day requests? Not here. You deserve time to prep.</p>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">You get to decide. Pick either 24 or 48 hours — that's the window they have to cancel without being charged.</label>
                <div className="flex gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setCancellationWindow(24)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                      cancellationWindow === 24
                        ? 'bg-red-600 text-white ring-2 ring-red-400'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    24 hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancellationWindow(48)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                      cancellationWindow === 48
                        ? 'bg-red-600 text-white ring-2 ring-red-400'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    2 days (48 hours)
                  </button>
                </div>
                <p className="text-xs text-gray-500">Cancel within the time you set = no charge. Cancel after = full session price.</p>
              </div>
            </div>
          </div>
          
          {/* Terms & Conditions Acceptance */}
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="termsAccept"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <label htmlFor="termsAccept" className="text-sm text-gray-300">
                I agree to the <button onClick={() => setShowTermsModal('terms')} className="text-red-500 hover:underline">Terms of Service</button> and <button onClick={() => setShowTermsModal('privacy')} className="text-red-500 hover:underline">Privacy Policy</button>.
              </label>
            </div>
            {termsError && <p className="text-red-400 text-sm mt-2">{termsError}</p>}
          </div>
          
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || completedCount !== 6 || !termsAccepted}
            className={`w-full py-4 rounded-xl font-semibold text-white ${
              saving || completedCount !== 6 || !termsAccepted
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-red-600 to-orange-600 hover:scale-105 transition-all'
            }`}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
      
      {/* Live Camera Modal */}
      {showCamera && (
        <LiveCameraCapture
          onCapture={(photoBlob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              setPhotos([base64String]);
            };
            reader.readAsDataURL(photoBlob);
          }}
          onClose={() => setShowCamera(false)}
          aspectRatio="square"
          isEditMode={photos.length > 0}
          onReplaceConfirm={async () => {
            return new Promise((resolve) => {
              const confirmed = window.confirm('Are you sure you want to replace your current profile photo?');
              resolve(confirmed);
            });
          }}
        />
      )}
      
      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal === 'terms'}
        onClose={() => setShowTermsModal(null)}
        title="Terms of Service"
        content="By using Adonix Fit, you agree to our terms. This platform connects fitness partners with clients. Partners are independent contractors. Adonix Fit is not responsible for any injuries or damages. You must maintain appropriate behavior and attire. Violation of terms may result in account termination."
      />
      
      <TermsModal
        isOpen={showTermsModal === 'privacy'}
        onClose={() => setShowTermsModal(null)}
        title="Privacy Policy"
        content="We respect your privacy. Your personal information is used only for account management and booking purposes. We do not sell your data. Location data is used to match you with nearby clients. Photos are used for profile identification. You can request data deletion at any time."
      />
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSave}
        title="Confirm Profile Submission"
        message="Are you sure you want to save your partner profile? You can edit this information later from your profile settings."
      />
      
      {/* Location Confirmation Modal for Manual Entry */}
      <LocationConfirmModal
        isOpen={showLocationConfirmModal}
        onClose={cancelManualAdd}
        onConfirm={confirmManualAdd}
        locationName={pendingLocation}
      />
    </>
  );
}