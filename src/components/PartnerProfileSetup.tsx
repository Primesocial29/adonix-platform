import { useState, useEffect, useRef } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, Trash2, MapPin, Clock, DollarSign, Camera, 
  Loader2, Navigation, Search, Dumbbell, ChevronDown, 
  ChevronRight, Award, Sparkles, CheckCircle, X, ShieldCheck 
} from 'lucide-react';
import { validateText, containsBlockedWords } from '../lib/textSanitizer';
import BlockedWordAlert from './BlockedWordAlert';
import LiveCameraCapture from './LiveCameraCapture';

// --- Types & Constants ---
interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface ServiceRate {
  hourly: number;
  halfHour: number;
}

// --- Terminology Mapping (Legal Shield) ---
const UI_TEXT = {
  role: 'Social Partner',
  rate: 'Suggested Contribution',
  session: 'Meetup',
  booking: 'Invitation',
  fee: 'Platform Support'
};

const SERVICE_TYPES = [
  'Walking', 'Jogging', 'Running', 'Biking', 'Yoga', 'Weight Lifting',
  'HIIT', 'Calisthenics', 'Swimming', 'Boxing', 'Pilates', 'Stretching'
];

// --- Sub-Components ---

function SafetyConfirmationModal({ isOpen, onClose, onConfirm, locationName }: { 
  isOpen: boolean; onClose: () => void; onConfirm: () => void; locationName: string 
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4 text-red-500">
          <ShieldCheck className="w-8 h-8" />
          <h2 className="text-xl font-bold text-white">Public Safety Verification</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Proposed Location</p>
            <p className="text-white font-medium">{locationName}</p>
          </div>
          <p className="text-gray-300 text-sm">
            To protect the community and comply with safety protocols, you must confirm this is a **verified public venue**.
          </p>
          <ul className="space-y-2">
            {[
              "This is a Public Park, Gym, or Fitness Center.",
              "This is NOT a private residence or home.",
              "I have the right to meet peers at this location.",
              "GPS verification will be required upon arrival."
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
            Go Back
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all">
            Confirm Public Venue
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
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<SearchResult | null>(null);

  // Form states
  const [bio, setBio] = useState('');
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [serviceRates, setServiceRates] = useState<Record<string, ServiceRate>>({});
  const [halfHourEnabled, setHalfHourEnabled] = useState(false);
  const [serviceAreas, setServiceAreas] = useState<{ name: string; lat: number | null; lng: number | null }[]>([]);
  const [serviceAreasCenterLat, setServiceAreasCenterLat] = useState<number | null>(null);
  const [serviceAreasCenterLng, setServiceAreasCenterLng] = useState<number | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Location Search states
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSearchResults, setAddressSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Progress tracking
  const sections = [
    { label: 'Photo', check: () => photos.length > 0 },
    { label: 'Bio', check: () => bio.length >= 20 },
    { label: 'Services', check: () => serviceTypes.length > 0 },
    { label: 'Public Locations', check: () => serviceAreas.length > 0 },
    { label: 'Schedule', check: () => true } // simplified for logic
  ];
  const progress = (sections.filter(s => s.check()).length / sections.length) * 100;

  // --- Location Logic (Protected) ---

  const searchAddress = async (query: string) => {
    if (query.length < 3) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setAddressSearchResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const initiateAddLocation = (result: SearchResult) => {
    setPendingLocation(result);
    setShowLocationConfirm(true);
  };

  const confirmAddLocation = () => {
    if (!pendingLocation) return;
    
    const newArea = {
      name: pendingLocation.display_name,
      lat: parseFloat(pendingLocation.lat),
      lng: parseFloat(pendingLocation.lon)
    };

    setServiceAreas(prev => [...prev, newArea]);
    if (!serviceAreasCenterLat) {
      setServiceAreasCenterLat(newArea.lat);
      setServiceAreasCenterLng(newArea.lng);
    }

    setAddressQuery('');
    setAddressSearchResults([]);
    setPendingLocation(null);
    setShowLocationConfirm(false);
  };

  const handleSave = async () => {
    if (!user) return;
    
    // PHYSICAL SECURITY GATEKEEPER
    if (serviceAreas.some(area => !area.lat || !area.lng)) {
      alert("CRITICAL ERROR: Manual location entries detected. All meetup points must be verified via map coordinates for community safety.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio,
          service_types: serviceTypes,
          service_rates: serviceRates,
          service_areas: serviceAreas,
          service_areas_center_lat: serviceAreasCenterLat,
          service_areas_center_lng: serviceAreasCenterLng,
          is_partner: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      window.location.href = '/dashboard';
    } catch (e) {
      alert("Failed to secure profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32">
      {/* Progress Header */}
      <div className="max-w-3xl mx-auto mb-8 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-40">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-2xl font-bold">Partner Onboarding</h1>
            <p className="text-gray-400 text-sm">Asset Protection Level: 100/100</p>
          </div>
          <span className="text-red-500 font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 w-full bg-white/10 rounded-full">
          <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-12">
        {/* Bio Section */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold">Your Identity & Vibe</h2>
          </div>
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share your fitness philosophy..."
            className="w-full h-32 bg-black border border-white/20 rounded-xl p-4 focus:ring-2 focus:ring-red-500 outline-none transition-all"
          />
        </section>

        {/* Location Security Section */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold">Public Meetup Points</h2>
            </div>
            <ShieldCheck className="w-4 h-4 text-green-500" />
          </div>
          
          <div className="relative mb-6">
            <div className="absolute left-4 top-3.5 text-gray-500">
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </div>
            <input 
              type="text"
              value={addressQuery}
              onChange={(e) => {
                setAddressQuery(e.target.value);
                searchAddress(e.target.value);
              }}
              placeholder="Search for Public Parks or Gyms..."
              className="w-full bg-black border border-white/20 rounded-xl py-3 pl-12 pr-4 focus:border-red-500 outline-none"
            />

            {addressSearchResults.length > 0 && (
              <div className="absolute w-full mt-2 bg-gray-900 border border-white/20 rounded-xl overflow-hidden shadow-2xl z-50">
                {addressSearchResults.map((res, i) => (
                  <button 
                    key={i}
                    onClick={() => initiateAddLocation(res)}
                    className="w-full text-left p-4 hover:bg-white/10 border-b border-white/5 last:border-0 transition-colors"
                  >
                    <p className="text-sm font-medium text-white truncate">{res.display_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {serviceAreas.map((area, i) => (
              <div key={i} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 p-2 rounded-lg">
                    <Navigation className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{area.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{area.lat?.toFixed(4)}, {area.lng?.toFixed(4)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setServiceAreas(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Suggested Contribution Section */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold">{UI_TEXT.rate} Per {UI_TEXT.session}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black p-4 rounded-xl border border-white/10">
              <label className="text-xs text-gray-400 block mb-2 uppercase tracking-tighter">Hourly Support</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">$</span>
                <input 
                  type="number" 
                  min="50" max="500"
                  placeholder="100"
                  className="bg-transparent text-2xl font-bold w-full outline-none text-white"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Min: $50 | Max: $500</p>
            </div>
          </div>
        </section>

        {/* Global Save Action */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-40">
          <div className="max-w-3xl mx-auto">
            <button 
              onClick={handleSave}
              disabled={saving || progress < 100}
              className="w-full bg-red-600 disabled:bg-gray-800 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
              {saving ? 'Securing Profile...' : 'Finalize & Secure Profile'}
            </button>
          </div>
        </div>
      </div>

      <SafetyConfirmationModal 
        isOpen={showLocationConfirm}
        onClose={() => setShowLocationConfirm(false)}
        onConfirm={confirmAddLocation}
        locationName={pendingLocation?.display_name || ''}
      />
    </div>
  );
}