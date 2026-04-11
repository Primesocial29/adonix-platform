import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { Search, MapPin, Dumbbell, Star, ChevronLeft, ChevronRight, X, Plus, Navigation, AlertCircle, Target } from 'lucide-react';
import PartnerProfileView from './PartnerProfileView';

interface BrowsePartnersProps {
  onSelectPartner?: (partner: Profile) => void;
  presetCity?: string;  // City from previous screen
}

const BASE_SERVICE_OPTIONS = [
  'Walking', 'Jogging', 'Running', 'Biking', 'Yoga', 'Weight Lifting',
  'HIIT', 'Calisthenics', 'Swimming', 'Boxing', 'Pilates', 'Stretching'
];

const BLOCKED_WORDS = [
  'offensive', 'profanity', 'hate', 'adult', 'explicit', 'scam', 'illegal',
  'violence', 'abuse', 'spam', 'nude', 'porn', 'gambling', 'drugs', 'crypto',
  'bitcoin', 'darkweb', 'escort', 'sexual', 'xxx', 'fuck', 'shit', 'bitch',
  'asshole', 'naked', 'whore', 'sex'
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
  
  // Location states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const allServiceOptions = [...BASE_SERVICE_OPTIONS, ...customServices];
  const MAX_CUSTOM_SERVICES = 2;

  // Calculate distance between two coordinates (Haversine formula)
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

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }
    
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError(null);
        setLocationLoading(false);
        setLocationPermissionAsked(true);
      },
      (error) => {
        let errorMsg = '';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location access denied. Please enable location in your browser settings to find partners near you.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out. Please try again.';
            break;
          default:
            errorMsg = 'Unable to get your location.';
        }
        setLocationError(errorMsg);
        setLocationLoading(false);
        setLocationPermissionAsked(true);
      }
    );
  };

  // Ask for location when page loads
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Fetch all partners
  useEffect(() => {
    fetchPartners();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [partners, searchTerm, selectedServices, distance, userLocation, customServices]);

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

  const containsBlockedWord = (name: string): boolean => {
    const lowerName = name.toLowerCase().trim();
    return BLOCKED_WORDS.some(word => lowerName.includes(word.toLowerCase()));
  };

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
      const searchLower = searchTerm.toLowerCase();
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

    // Filter by distance (only if we have user location)
    if (userLocation) {
      filtered = filtered.filter(partner => {
        if ((partner as any).service_areas_center_lat && (partner as any).service_areas_center_lng) {
          const dist = calculateDistance(
            userLocation.lat,
            userLocation.lng,
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
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPartners = filteredPartners.slice(startIndex, endIndex);

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
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Find Your Workout Buddy</h1>
            <p className="text-gray-400">Discover fitness partners who match your vibe</p>
          </div>

          {/* Location Status Card */}
          <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5">
            {presetCity && (
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-3 pb-3 border-b border-white/10">
                <Target className="w-4 h-4 text-red-400" />
                <span>You're looking in <span className="text-white font-medium">{presetCity}</span></span>
              </div>
            )}
            
            {locationLoading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                <span className="text-gray-400">Getting your current location...</span>
              </div>
            ) : locationError ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>{locationError}</span>
                </div>
                <button
                  onClick={getCurrentLocation}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors self-start flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Use My Current Location
                </button>
              </div>
            ) : userLocation ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-green-400">
                  <Navigation className="w-5 h-5" />
                  <span>Using your current location to find partners near you</span>
                </div>
                
                {/* Distance Radius Slider */}
                <div className="pt-2">
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
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                    <span>25 mi</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-gray-400">Allow location access to find partners near you</p>
                <button
                  onClick={getCurrentLocation}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors self-start flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Use My Current Location
                </button>
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
              {distance !== 10 && userLocation && (
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
            {userLocation && ` within ${distance} miles of your location`}
          </div>

          {/* Partners Grid */}
          {filteredPartners.length === 0 ? (
            <div className="text-center py-20">
              <Dumbbell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Partners Found</h3>
              <p className="text-gray-400">
                {!userLocation 
                  ? "Enable location access to find partners near you"
                  : "Try adjusting your filters or increasing your search radius"}
              </p>
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