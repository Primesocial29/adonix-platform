import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { Search, MapPin, DollarSign, Dumbbell, Star, ChevronLeft, ChevronRight, ChevronDown, X, Plus, AlertCircle, Navigation, Home } from 'lucide-react';
import PartnerProfileView from './PartnerProfileView';

interface BrowsePartnersProps {
  onSelectPartner?: (partner: Profile) => void;
  presetCity?: string; // NEW: city from previous screen
}

// Base service type options
const BASE_SERVICE_OPTIONS = [
  'Walking', 'Jogging', 'Running', 'Biking', 'Yoga', 'Weight Lifting',
  'HIIT', 'Calisthenics', 'Swimming', 'Boxing', 'Pilates', 'Stretching'
];

// Distance options (in miles) - 1 to 25 miles
const DISTANCE_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 25];

// Blocked words for custom services
const BLOCKED_WORDS = [
  'offensive', 'profanity', 'hate', 'adult', 'explicit', 'scam', 'illegal',
  'violence', 'abuse', 'spam', 'nude', 'porn', 'gambling', 'drugs', 'crypto',
  'bitcoin', 'darkweb', 'escort', 'sexual', 'xxx', 'fuck', 'shit', 'bitch',
  'asshole', 'naked', 'whore', 'sex', 'anal', 'orgy', 'incest', 'pedo',
  'molest', 'trafficking', 'weapon', 'murder', 'heroin', 'cocaine', 'meth'
];

export default function BrowsePartners({ onSelectPartner, presetCity = '' }: BrowsePartnersProps) {
  const [partners, setPartners] = useState<Profile[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customServices, setCustomServices] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customServiceName, setCustomServiceName] = useState('');
  const [customError, setCustomError] = useState('');
  const [distance, setDistance] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [presetCityLocation, setPresetCityLocation] = useState<{ lat: number; lng: number; city: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationMode, setLocationMode] = useState<'preset' | 'current' | 'none'>('none');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // All services (base + custom)
  const allServiceOptions = [...BASE_SERVICE_OPTIONS, ...customServices];
  const MAX_CUSTOM_SERVICES = 2;

  // Helper function to calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Geocode city name to coordinates
  const geocodeCity = async (city: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Using OpenStreetMap Nominatim (free, no API key needed)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Load preset city from previous screen
  useEffect(() => {
    const loadPresetCity = async () => {
      if (presetCity && presetCity.trim() !== '') {
        setLocationLoading(true);
        const coords = await geocodeCity(presetCity);
        if (coords) {
          setPresetCityLocation({
            lat: coords.lat,
            lng: coords.lng,
            city: presetCity
          });
          setLocationMode('preset');
          setLocationError(null);
        } else {
          setLocationError(`Could not find "${presetCity}". Try using current location.`);
          setLocationMode('none');
        }
        setLocationLoading(false);
      } else {
        // If no preset city, try current location
        getCurrentLocation();
      }
    };
    
    loadPresetCity();
  }, [presetCity]);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationMode('current');
          setLocationError(null);
          setLocationLoading(false);
          
          // Also try to get city name from coordinates (reverse geocode)
          reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Location permission denied:', error);
          let errorMsg = 'Unable to get your location. ';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMsg += 'Please enable location access to find partners near you.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg += 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMsg += 'Location request timed out.';
              break;
            default:
              errorMsg += 'Using distance filter may not work.';
          }
          setLocationError(errorMsg);
          setLocationLoading(false);
          setLocationMode('none');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      setLocationMode('none');
    }
  };

  // Reverse geocode to get city name from coordinates (for display)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await response.json();
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || 'your area';
        // Just for display, we keep using coordinates for actual distance
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Switch to current location
  const switchToCurrentLocation = () => {
    getCurrentLocation();
    setDistance(10); // Reset to default radius
    setCurrentPage(1);
  };

  // Switch back to preset city
  const switchToPresetCity = () => {
    if (presetCityLocation) {
      setLocationMode('preset');
      setCurrentPage(1);
    }
  };

  // Fetch all partners on mount
  useEffect(() => {
    fetchPartners();
  }, []);

  // Apply filters whenever filters change
  useEffect(() => {
    applyFilters();
  }, [partners, searchTerm, selectedServices, distance, locationMode, userLocation, presetCityLocation, customServices]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'trainer');

      if (error) throw error;
      
      setPartners(data || []);
      setFilteredPartners(data || []);
    } catch (err) {
      console.error('Error fetching partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
    setCurrentPage(1);
  };

  // Check if a service name contains blocked words
  const containsBlockedWord = (name: string): boolean => {
    const lowerName = name.toLowerCase().trim();
    return BLOCKED_WORDS.some(word => lowerName.includes(word.toLowerCase()));
  };

  // Add custom service
  const addCustomService = () => {
    const name = customServiceName.trim();
    
    setCustomError('');
    
    if (customServices.length >= MAX_CUSTOM_SERVICES) {
      setCustomError(`You can only add up to ${MAX_CUSTOM_SERVICES} custom services.`);
      return;
    }
    
    if (!name) {
      setCustomError('Please enter a service name.');
      return;
    }
    
    if (containsBlockedWord(name)) {
      setCustomError(`"${name}" contains inappropriate language. Please use a professional service name.`);
      return;
    }
    
    if (allServiceOptions.some(s => s.toLowerCase() === name.toLowerCase())) {
      setCustomError(`"${name}" already exists in the list.`);
      return;
    }
    
    setCustomServices([...customServices, name]);
    setCustomServiceName('');
    setShowCustomInput(false);
    setCurrentPage(1);
  };

  // Remove custom service
  const removeCustomService = (serviceToRemove: string) => {
    setCustomServices(customServices.filter(s => s !== serviceToRemove));
    setSelectedServices(prev => prev.filter(s => s !== serviceToRemove));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedServices([]);
    setDistance(10);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const applyFilters = () => {
    let filtered = [...partners];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().replace('@', '');
      filtered = filtered.filter(partner => 
        partner.first_name?.toLowerCase().includes(searchLower) ||
        partner.bio?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by services
    if (selectedServices.length > 0) {
      filtered = filtered.filter(partner => {
        const services = (partner as any).service_types || [];
        const customPartnerServices = (partner as any).custom_service_types || [];
        const allPartnerServices = [...services, ...customPartnerServices];
        return selectedServices.some(service => allPartnerServices.includes(service));
      });
    }

    // Filter by distance based on location mode
    const activeLocation = locationMode === 'preset' ? presetCityLocation : (locationMode === 'current' ? userLocation : null);
    
    if (activeLocation) {
      filtered = filtered.filter(partner => {
        if ((partner as any).service_areas_center_lat && (partner as any).service_areas_center_lng) {
          const dist = calculateDistance(
            activeLocation.lat,
            activeLocation.lng,
            (partner as any).service_areas_center_lat,
            (partner as any).service_areas_center_lng
          );
          (partner as any)._distance = dist;
          return dist <= distance;
        }
        (partner as any)._distance = null;
        return true;
      });
    } else {
      filtered.forEach(partner => {
        (partner as any)._distance = null;
      });
    }

    setFilteredPartners(filtered);
    setCurrentPage(1);
  };

  const activeFilterCount = (searchTerm ? 1 : 0) + selectedServices.length + (distance !== 10 ? 1 : 0);

  // Pagination
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPartners = filteredPartners.slice(startIndex, endIndex);

  // Get current location display name
  const getLocationDisplayName = () => {
    if (locationMode === 'preset' && presetCityLocation) {
      return presetCityLocation.city;
    }
    if (locationMode === 'current') {
      return 'your current location';
    }
    return 'unknown location';
  };

  const PartnerCard = ({ partner }: { partner: Profile }) => {
    const services = (partner as any).service_types || [];
    const customPartnerServices = (partner as any).custom_service_types || [];
    const allServices = [...services, ...customPartnerServices];
    const primaryService = allServices[0] || 'Fitness Training';
    const rate = partner.hourly_rate || 0;
    const distance = (partner as any)._distance;

    return (
      <div 
        onClick={() => setSelectedPartner(partner)}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-red-500/50 hover:scale-[1.02] transition-all cursor-pointer group"
      >
        <div className="aspect-square bg-gradient-to-br from-red-500/20 to-orange-500/20 relative">
          {partner.live_photo_url ? (
            <img 
              src={partner.live_photo_url} 
              alt={partner.first_name || 'Partner'} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Dumbbell className="w-12 h-12 text-gray-500" />
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-white">{partner.first_name || 'Partner'}</h3>
              <p className="text-sm text-gray-400">@{partner.first_name?.toLowerCase().replace(/\s/g, '_') || 'partner'}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-red-500">${rate}</p>
              <p className="text-xs text-gray-500">/ hour</p>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-1">
            <Dumbbell className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-400">{primaryService}</span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs text-gray-400">New</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-400">
                {distance !== null ? `${Math.round(distance)} mi away` : 'Distance unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Find Your Workout Buddy</h1>
            <p className="text-gray-400">Discover fitness partners who match your vibe</p>
          </div>

          {/* Location Control Bar - Shows preset city and allows switching to current location */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">Showing partners near</p>
                  {locationLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                      <span className="text-white text-sm">Loading location...</span>
                    </div>
                  ) : locationError ? (
                    <p className="text-yellow-400 text-sm">{locationError}</p>
                  ) : (
                    <p className="text-white font-medium">
                      {locationMode === 'preset' && presetCityLocation ? presetCityLocation.city : 'your current location'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {presetCity && presetCityLocation && (
                  <button
                    onClick={switchToPresetCity}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                      locationMode === 'preset' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    {presetCity}
                  </button>
                )}
                <button
                  onClick={switchToCurrentLocation}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                    locationMode === 'current' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Current Location
                </button>
              </div>
            </div>

            {/* Distance Radius Slider/Selector */}
            {!locationLoading && !locationError && (locationMode === 'preset' || locationMode === 'current') && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Search radius:</label>
                  <span className="text-red-400 font-medium">{distance} miles</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={distance}
                  onChange={(e) => {
                    setDistance(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 mi</span>
                  <span>5 mi</span>
                  <span>10 mi</span>
                  <span>15 mi</span>
                  <span>20 mi</span>
                  <span>25 mi</span>
                </div>
              </div>
            )}
          </div>

          {/* Filters Bar */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
                />
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
              >
                Clear All Filters
              </button>
            </div>

            {/* Service Selection - CLICKABLE BOXES GRID */}
            <div className="border-t border-white/10 pt-4">
              <label className="block text-sm text-gray-400 mb-3">
                Select services you're looking for:
                {selectedServices.length > 0 && (
                  <span className="ml-2 text-red-400">({selectedServices.length} selected)</span>
                )}
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-3">
                {allServiceOptions.map(service => (
                  <button
                    key={service}
                    onClick={() => toggleService(service)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer relative group
                      ${selectedServices.includes(service) 
                        ? 'bg-red-500 text-white shadow-lg scale-[1.02]' 
                        : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:scale-[1.01]'
                      }
                    `}
                  >
                    {service}
                    {selectedServices.includes(service) && <span className="ml-1">✓</span>}
                    
                    {customServices.includes(service) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomService(service);
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs hover:bg-red-600 hidden group-hover:flex items-center justify-center"
                        title="Remove custom service"
                      >
                        ×
                      </button>
                    )}
                  </button>
                ))}
              </div>

              {/* Add Custom Service */}
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  disabled={customServices.length >= MAX_CUSTOM_SERVICES}
                  className={`mt-2 text-sm flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors
                    ${customServices.length >= MAX_CUSTOM_SERVICES 
                      ? 'text-gray-500 cursor-not-allowed' 
                      : 'text-red-400 hover:text-red-300 hover:bg-white/5'
                    }
                  `}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add custom service {customServices.length >= MAX_CUSTOM_SERVICES && `(max ${MAX_CUSTOM_SERVICES})`}
                </button>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    placeholder="e.g., Kickboxing, Parkour, Dance"
                    className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && addCustomService()}
                  />
                  <button
                    onClick={addCustomService}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomError('');
                      setCustomServiceName('');
                    }}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  {customError && (
                    <span className="text-red-400 text-xs">{customError}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Active Filters Tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {searchTerm && (
                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm flex items-center gap-1">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedServices.map(service => (
                <span key={service} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm flex items-center gap-1">
                  {service}
                  <button onClick={() => toggleService(service)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {distance !== 10 && (
                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm flex items-center gap-1">
                  Within {distance} miles
                  <button onClick={() => setDistance(10)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-400">
            Found {filteredPartners.length} partner{filteredPartners.length !== 1 ? 's' : ''}
            {!locationLoading && (locationMode === 'preset' || locationMode === 'current') && ` within ${distance} miles of ${getLocationDisplayName()}`}
          </div>

          {/* Partners Grid */}
          {filteredPartners.length === 0 ? (
            <div className="text-center py-20">
              <Dumbbell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Partners Found</h3>
              <p className="text-gray-400">Try adjusting your filters or increasing your search radius</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {currentPartners.map(partner => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Partner Profile Modal */}
      {selectedPartner && (
        <PartnerProfileView
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}
    </>
  );
}