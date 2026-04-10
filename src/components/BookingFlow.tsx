import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { Search, MapPin, Dumbbell, Star, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import PartnerProfileView from './PartnerProfileView';
import { useAuth } from '../contexts/AuthContext';

// Service type options (from your PartnerProfileSetup)
const SERVICE_OPTIONS = [
  'Walking', 'Jogging', 'Running', 'Biking', 'Yoga', 'Weight Lifting',
  'HIIT', 'Calisthenics', 'Swimming', 'Boxing', 'Pilates', 'Stretching'
];

// Distance options (in miles)
const DISTANCE_OPTIONS = [1, 2, 5, 10, 15, 20, 25];

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function BrowsePartners() {
  const { user, profile } = useAuth();
  const [partners, setPartners] = useState<Profile[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [radius, setRadius] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch user's location from profile or browser
  useEffect(() => {
    if (profile?.city) {
      // Geocode city to coordinates (simplified - in production use Google Geocoding API)
      // For now, we'll skip distance filtering if no coordinates
    }
    
    // Try to get browser location
    if (navigator.geolocation) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGettingLocation(false);
        },
        (error) => {
          console.warn('Location permission denied:', error);
          setGettingLocation(false);
        }
      );
    }
  }, [profile]);

  // Fetch all partners on mount
  useEffect(() => {
    fetchPartners();
  }, []);

  // Apply filters whenever filters change
  useEffect(() => {
    applyFilters();
  }, [partners, searchTerm, selectedServices, radius, userLocation]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      // Fetch all users with role = 'trainer' (partners)
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
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedServices([]);
    setRadius(10);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    let filtered = [...partners];

    // Filter by search term (username)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().replace('@', '');
      filtered = filtered.filter(partner => 
        partner.first_name?.toLowerCase().includes(searchLower) ||
        (partner as any).username?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by services (partner must offer at least ONE of the selected services)
    if (selectedServices.length > 0) {
      filtered = filtered.filter(partner => {
        const services = (partner as any).service_types || [];
        const customServices = (partner as any).custom_service_types || [];
        const allServices = [...services, ...customServices];
        return selectedServices.some(service => allServices.includes(service));
      });
    }

    // Filter by distance (if we have user location and partner coordinates)
    if (userLocation) {
      filtered = filtered.filter(partner => {
        // If partner has coordinates stored, calculate distance
        if ((partner as any).service_areas_center_lat && (partner as any).service_areas_center_lng) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            (partner as any).service_areas_center_lat,
            (partner as any).service_areas_center_lng
          );
          (partner as any)._distance = distance;
          return distance <= radius;
        }
        // If no coordinates, show but mark distance as unknown
        (partner as any)._distance = null;
        return true;
      });
    }

    setFilteredPartners(filtered);
    setCurrentPage(1);
  };

  const activeFilterCount = (searchTerm ? 1 : 0) + selectedServices.length + (radius !== 10 ? 1 : 0);

  // Pagination
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPartners = filteredPartners.slice(startIndex, endIndex);

  const PartnerCard = ({ partner }: { partner: Profile }) => {
    const services = (partner as any).service_types || [];
    const customServices = (partner as any).custom_service_types || [];
    const allServices = [...services, ...customServices];
    const primaryService = allServices[0] || 'Fitness Training';
    const rate = partner.hourly_rate || 0;
    const distance = (partner as any)._distance;
    const username = (partner as any).username || partner.first_name?.toLowerCase().replace(/\s/g, '_') || 'partner';

    return (
      <div 
        onClick={() => setSelectedPartner(partner)}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-red-500/50 hover:scale-[1.02] transition-all cursor-pointer group"
      >
        {/* Photo */}
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

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-white">{partner.first_name || 'Partner'}</h3>
              <p className="text-sm text-gray-400">@{username}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-red-500">${rate}</p>
              <p className="text-xs text-gray-500">/ hour</p>
            </div>
          </div>

          {/* Primary Service */}
          <div className="flex items-center gap-1 mt-1">
            <Dumbbell className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-400">{primaryService}</span>
          </div>

          {/* Rating & Distance */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs text-gray-400">4.8</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-400">
                {distance !== null ? `${Math.round(distance)} mi` : 'Distance unknown'}
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
            <h1 className="text-3xl font-bold mb-2">Find Your Workout Buddy</h1>
            <p className="text-gray-400">Discover fitness partners who match your vibe</p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username... (e.g., @jess_fit)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-red-500 focus:outline-none text-white placeholder-gray-500 text-lg"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {searchTerm && (
                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm flex items-center gap-1">
                  @{searchTerm}
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
              {radius !== 10 && (
                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm flex items-center gap-1">
                  Within {radius} miles
                  <button onClick={() => setRadius(10)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm hover:bg-gray-600"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Services Multi-Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Services</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {SERVICE_OPTIONS.map(service => (
                      <button
                        key={service}
                        onClick={() => toggleService(service)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          selectedServices.includes(service)
                            ? 'bg-red-600 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Select multiple services to find partners who offer any of them</p>
                </div>

                {/* Radius Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Search Radius: <span className="text-red-400 font-bold">{radius} miles</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="1"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(radius / 25) * 100}%, #4a4a4a ${(radius / 25) * 100}%, #4a4a4a 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25 mi</span>
                  </div>
                  {!userLocation && !gettingLocation && (
                    <p className="text-xs text-yellow-400 mt-2">
                      ⚠️ Enable location services to search by distance
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-400">
            Found {filteredPartners.length} partner{filteredPartners.length !== 1 ? 's' : ''}
          </div>

          {/* Partners Grid */}
          {filteredPartners.length === 0 ? (
            <div className="text-center py-20">
              <Dumbbell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Partners Found</h3>
              <p className="text-gray-400">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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