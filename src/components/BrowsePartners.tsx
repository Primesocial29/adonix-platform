import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { Search, MapPin, DollarSign, Dumbbell, Star, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import PartnerProfileView from './PartnerProfileView';

interface BrowsePartnersProps {
  onSelectPartner?: (partner: Profile) => void;
}

// Service type options (from your PartnerProfileSetup)
const SERVICE_OPTIONS = [
  'Walking', 'Jogging', 'Running', 'Biking', 'Yoga', 'Weight Lifting',
  'HIIT', 'Calisthenics', 'Swimming', 'Boxing', 'Pilates', 'Stretching'
];

// Distance options (in miles)
const DISTANCE_OPTIONS = [1, 2, 5, 10, 15, 20, 25];

export default function BrowsePartners({ onSelectPartner }: BrowsePartnersProps) {
  const [partners, setPartners] = useState<Profile[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [distance, setDistance] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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

  // Try to get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location permission denied:', error);
        }
      );
    }
  }, []);

  // Fetch all partners on mount
  useEffect(() => {
    fetchPartners();
  }, []);

  // Apply filters whenever filters change
  useEffect(() => {
    applyFilters();
  }, [partners, searchTerm, selectedServices, distance, userLocation]);

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
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
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

    // Filter by search term (username)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().replace('@', '');
      filtered = filtered.filter(partner => 
        partner.first_name?.toLowerCase().includes(searchLower) ||
        partner.bio?.toLowerCase().includes(searchLower)
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

    // Filter by distance (if we have user location)
    if (userLocation) {
      filtered = filtered.filter(partner => {
        // If partner has coordinates stored, calculate distance
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
        // If no coordinates, show but mark distance as unknown
        (partner as any)._distance = null;
        return true;
      });
    } else {
      // No location, just show all
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

  const PartnerCard = ({ partner }: { partner: Profile }) => {
    const services = (partner as any).service_types || [];
    const customServices = (partner as any).custom_service_types || [];
    const allServices = [...services, ...customServices];
    const primaryService = allServices[0] || 'Fitness Training';
    const rate = partner.hourly_rate || 0;
    const distance = (partner as any)._distance;

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
              <p className="text-sm text-gray-400">@{partner.first_name?.toLowerCase().replace(/\s/g, '_') || 'partner'}</p>
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
              <span className="text-xs text-gray-400">New</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-400">
                {distance !== null ? `${Math.round(distance)} mi` : 'Near you'}
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

          {/* Filters Bar */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or @username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
                />
              </div>

              {/* Service Type Multi-Select */}
              <div className="relative">
                <button
                  onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-left text-white flex justify-between items-center"
                >
                  <span>{selectedServices.length > 0 ? `${selectedServices.length} selected` : 'All Services'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showServiceDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-zinc-800 border border-white/10 rounded-lg max-h-60 overflow-y-auto">
                    {SERVICE_OPTIONS.map(service => (
                      <label key={service} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service)}
                          onChange={() => toggleService(service)}
                          className="w-4 h-4 accent-red-500"
                        />
                        <span className="text-white text-sm">{service}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Distance Filter */}
              <select
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value))}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white"
              >
                {DISTANCE_OPTIONS.map(miles => (
                  <option key={miles} value={miles}>Within {miles} miles</option>
                ))}
              </select>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
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