import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Trash2, MapPin, Clock, DollarSign, Camera,
  Loader2, Navigation, Search, ChevronDown, ChevronRight,
  Award, CheckCircle, X, ShieldCheck, Info
} from 'lucide-react';
import LiveCameraCapture from './LiveCameraCapture';
import LegalModal from './LegalModal';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface ServiceRate {
  hourly: number;
  halfHour: number;
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
  const { user, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [showCamera, setShowCamera] = useState(false);
  const [livePhotoUrl, setLivePhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [bio, setBio] = useState('');
  const [bioError, setBioError] = useState('');

  const [certifications, setCertifications] = useState<string[]>([]);
  const [customCertInput, setCustomCertInput] = useState('');
  const [certError, setCertError] = useState('');

  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [customServiceTypes, setCustomServiceTypes] = useState<string[]>([]);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [customServiceError, setCustomServiceError] = useState('');
  const [serviceRates, setServiceRates] = useState<Record<string, ServiceRate>>({});
  const [halfHourEnabled, setHalfHourEnabled] = useState(false);

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
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const allSelectedServices = [...serviceTypes, ...customServiceTypes];

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) {
        setLivePhotoUrl(data.live_photo_url);
        setBio(data.bio || '');
        setCertifications((data as any).certifications || []);
        setServiceTypes(data.service_types || []);
        setCustomServiceTypes(data.custom_service_types || []);
        if (data.service_rates) {
          setServiceRates(data.service_rates as Record<string, ServiceRate>);
        }
        setHalfHourEnabled(data.half_hour_enabled || false);
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
      setLoadingProfile(false);
    };
    load();
  }, [user]);

  const isPhotoComplete = () => !!livePhotoUrl;
  const isBioComplete = () => bio.length >= 20 && bio.length <= 500;
  const isServicesComplete = () => {
    if (allSelectedServices.length === 0) return false;
    return allSelectedServices.every(s => {
      const r = serviceRates[s];
      if (!r || !r.hourly || r.hourly < 50 || r.hourly > 500) return false;
      if (halfHourEnabled && (!r.halfHour || r.halfHour < 30 || r.halfHour > r.hourly)) return false;
      return true;
    });
  };
  const isServiceAreasComplete = () => serviceAreas.length > 0 && serviceAreas.every(a => a.lat && a.lng);
  const isAvailabilityComplete = () => availability.some(a => a.times.length > 0);
  const isTermsComplete = () => termsAccepted;

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
      alert('Failed to upload photo. Ensure your Supabase "avatars" bucket exists and policies allow INSERT.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleBioChange = (val: string) => {
    setBio(val);
    if (val.length < 20) setBioError(`${20 - val.length} more characters needed`);
    else if (val.length > 500) setBioError('Bio must be 500 characters or fewer');
    else setBioError('');
  };

  const toggleCertification = (cert: string) => {
    setCertifications(prev => prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]);
  };

  const addCustomCert = () => {
    const val = customCertInput.trim();
    if (!val) return;
    if (certifications.includes(val)) { setCertError('Already added.'); return; }
    setCertifications(prev => [...prev, val]);
    setCustomCertInput('');
    setCertError('');
  };

  const toggleService = (s: string) => {
    setServiceTypes(prev => {
      if (prev.includes(s)) {
        const updated = { ...serviceRates };
        delete updated[s];
        setServiceRates(updated);
        return prev.filter(x => x !== s);
      }
      return [...prev, s];
    });
  };

  const addCustomService = () => {
    const val = customServiceInput.trim();
    if (!val) return;
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
    delete updated[s];
    setServiceRates(updated);
  };

  const updateServiceRate = (service: string, field: 'hourly' | 'halfHour', val: string) => {
    const num = parseInt(val) || 0;
    setServiceRates(prev => ({
      ...prev,
      [service]: { ...(prev[service] || { hourly: 0, halfHour: 0 }), [field]: num }
    }));
  };

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBscFCnb9sLo37TmcHhDZ842Fcc7wx6h5k';

  const searchAddress = (query: string) => {
    setAddressQuery(query);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (query.length < 3) { setAddressResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&keyword=gym|park|fitness|recreation|stadium&key=${GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.predictions && data.predictions.length > 0) {
          const detailPromises = data.predictions.slice(0, 6).map(async (prediction: { place_id: string; description: string }) => {
            const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=name,vicinity,geometry&key=${GOOGLE_MAPS_API_KEY}`;
            const detailRes = await fetch(detailUrl);
            const detailData = await detailRes.json();
            if (detailData.result) {
              return {
                display_name: prediction.description,
                lat: detailData.result.geometry.location.lat.toString(),
                lon: detailData.result.geometry.location.lng.toString(),
              };
            }
            return null;
          });
          const results = (await Promise.all(detailPromises)).filter(Boolean) as SearchResult[];
          setAddressResults(results);
        } else {
          setAddressResults([]);
        }
      } catch { setAddressResults([]); }
      finally { setIsSearching(false); }
    }, 500);
  };

  const searchNearMe = async (lat: number, lng: number) => {
    setIsSearching(true);
    setAddressResults([]);
    try {
      const radius = travelRadius * 1609.34;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=gym&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const formatted = data.results.map((place: { name: string; vicinity: string; geometry: { location: { lat: number; lng: number } } }) => ({
          display_name: place.name + ', ' + place.vicinity,
          lat: place.geometry.location.lat.toString(),
          lon: place.geometry.location.lng.toString(),
        }));
        setAddressResults(formatted);
      } else {
        alert('No gyms or parks found nearby. Try increasing the radius or searching manually.');
      }
    } catch (error) {
      console.error('Google Places error:', error);
      alert('Unable to find nearby locations. Please try searching manually.');
    } finally {
      setIsSearching(false);
    }
  };

  const initiateAddLocation = (result: SearchResult) => {
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
    if (!user) return;
    if (!canSave) { alert('Please complete all sections before saving.'); return; }
    if (serviceAreas.some(a => !a.lat || !a.lng)) {
      alert('All meetup locations must be selected from the map search. Manual entries without GPS coordinates are not allowed.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        bio,
        certifications,
        service_types: serviceTypes,
        custom_service_types: customServiceTypes,
        service_rates: serviceRates,
        half_hour_enabled: halfHourEnabled,
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
      }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      if (onComplete) onComplete();
      else window.location.href = '/dashboard';
    } catch {
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sampleService = allSelectedServices[0];
  const sampleRate = sampleService ? (serviceRates[sampleService]?.hourly || 100) : 100;
  const platformFee = sampleRate * 0.15;
  const stripeFixed = 0.30;
  const stripePercent = sampleRate * 0.029;
  const partnerEarnings = sampleRate - platformFee - stripeFixed - stripePercent;

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-40">
      <div className="sticky top-0 bg-black/90 backdrop-blur-md z-40 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h1 className="text-xl font-bold">Partner Profile Setup</h1>
              <p className="text-xs text-gray-400">Private Social Network · Asset Protection Model</p>
            </div>
            <span className="text-red-500 font-mono font-bold">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
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
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* ===== SECTION 1: PROFILE PHOTO ===== */}
        <div className={`p-6 rounded-2xl border ${isPhotoComplete() ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
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

        {/* ===== SECTION 2: BIO ===== */}
        <div className={`p-6 rounded-2xl border ${isBioComplete() ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
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
              <p className="text-xs text-yellow-400">{bioError}</p>
            ) : bio.length >= 20 ? (
              <p className="text-xs text-green-400">Looks good!</p>
            ) : (
              <p className="text-xs text-gray-500">Minimum 20 characters</p>
            )}
            <span className={`text-xs font-mono ${bio.length > 500 ? 'text-red-400' : bio.length >= 20 ? 'text-green-400' : 'text-gray-500'}`}>
              {bio.length}/500
            </span>
          </div>
          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-xs text-blue-300">
              No explicit content, solicitation, personal contact info, or pricing in your bio.
            </p>
          </div>
        </div>

        {/* ===== SECTION 3: CERTIFICATIONS ===== */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
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

        {/* ===== SECTION 4: SERVICES & RATES ===== */}
        <div className={`p-6 rounded-2xl border ${isServicesComplete() ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
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
              {allSelectedServices.map(service => (
                <div key={service} className="p-4 bg-black rounded-xl border border-white/10">
                  <p className="font-semibold text-white mb-3">{service}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {halfHourEnabled && (
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
                        <p className="text-xs text-gray-500 mt-1">Min $30 · Cannot exceed hourly suggested contribution</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between p-4 bg-black rounded-xl border border-white/10">
            <div>
              <p className="text-sm font-medium text-gray-300">Half-Hour Meetups</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {halfHourEnabled
                  ? 'Members can invite to meet for 30 or 60-minute sessions.'
                  : 'Members can only invite to meet for 60-minute sessions. Toggle ON to offer half-hour options.'}
              </p>
            </div>
            <button
              onClick={() => setHalfHourEnabled(!halfHourEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${halfHourEnabled ? 'bg-red-600' : 'bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${halfHourEnabled ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {allSelectedServices.length > 0 && sampleService && serviceRates[sampleService]?.hourly > 0 && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-sm font-semibold text-blue-300 mb-3">
                Example Earnings (${sampleRate} suggested contribution)
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Your suggested contribution:</span>
                  <span>${sampleRate}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform Support (15%):</span>
                  <span className="text-red-400">-${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Processing fee (2.9% + $0.30):</span>
                  <span className="text-red-400">-${(stripeFixed + stripePercent).toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 my-1" />
                <div className="flex justify-between font-bold">
                  <span className="text-white">You earn:</span>
                  <span className="text-green-400">${partnerEarnings.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Fees per meetup. You keep 100% of voluntary tips.</p>
            </div>
          )}

          {!isServicesComplete() && allSelectedServices.length > 0 && (
            <p className="text-xs text-red-400 mt-3">
              Set valid suggested contributions for all selected activities to continue.
            </p>
          )}
        </div>

        {/* ===== SECTION 5: SERVICE AREAS (GPS) ===== */}
        <div className={`p-6 rounded-2xl border ${isServiceAreasComplete() ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isServiceAreasComplete() && <CheckCircle className="w-5 h-5 text-green-500" />}
              <MapPin className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-semibold">The "Don't Be Weird" Location Picker</h2>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-400">
              <ShieldCheck className="w-4 h-4" />
              GPS Secured
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            We love a good home workout, but Adonix is for the great outdoors and public floors. Search for a local gym or park near you. Our system automatically blocks residential addresses — if you try to invite someone to your living room, the "Submit" button will ghost you. Safety first, gains second!
          </p>

          {/* Radius Slider */}
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
              style={{ minHeight: '44px' }}
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
              style={{ minHeight: '44px' }}
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
              style={{ minHeight: '44px', fontSize: '16px' }}
            />
          </div>

          <p className="text-[10px] text-gray-600 mb-3 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-red-400" />
            Anti-creep filter active: Hotels, residential addresses, and private venues are automatically blocked.
          </p>

          {addressResults.length > 0 && (
            <div className="mb-4 bg-gray-900 border border-white/20 rounded-xl overflow-hidden shadow-2xl">
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

          {addressQuery.length >= 3 && addressResults.length === 0 && !isSearching && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-xs text-yellow-300">
                No safe public venues found matching your search. Try "gym", "park", or "fitness center" near your city.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {serviceAreas.map((area, i) => (
              <div key={i} className="flex items-center justify-between bg-black p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-green-500/20 p-2 rounded-lg shrink-0">
                    <Navigation className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{area.name}</p>
                    {area.lat && area.lng && (
                      <p className="text-[10px] text-gray-500 font-mono">
                        {area.lat.toFixed(4)}, {area.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setServiceAreas(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-gray-500 hover:text-red-400 transition-colors ml-2 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SECTION 6: AVAILABILITY ===== */}
        <div className={`p-6 rounded-2xl border ${isAvailabilityComplete() ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
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
                        {generateTimeSlots(halfHourEnabled).map(time => {
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

        {/* ===== SECTION 7: MEETUP SETTINGS ===== */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
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

        {/* ===== SECTION 8: TERMS ===== */}
        <div className={`p-6 rounded-2xl border ${isTermsComplete() ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
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
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-red-600 cursor-pointer shrink-0"
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
              {' '}and{' '}
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="text-red-400 underline hover:text-red-300 transition-colors"
              >
                Privacy Policy
              </button>.
              I understand this is a private social network, not a professional services platform.
            </span>
          </label>
        </div>

      </div>

      {/* ===== FIXED SAVE BUTTON ===== */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-40">
        <div className="max-w-3xl mx-auto">
          {!canSave && (
            <p className="text-xs text-center text-gray-500 mb-2">
              Complete all sections to enable save ({completedSections.filter(Boolean).length}/6 complete)
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 shadow-xl"
          >
            {saving
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Securing Profile...</>
              : <><ShieldCheck className="w-5 h-5" /> Finalize & Secure Profile</>
            }
          </button>
        </div>
      </div>

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
        />
      )}
    </div>
  );
}
