import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { MapPin, Clock, DollarSign, Star, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import PartnerProfileView from './PartnerProfileView';

interface Partner {
  id: string;
  first_name: string;
  username: string;
  live_photo_url: string;
  bio: string;
  avg_rating: number;
  total_reviews: number;
  service_types: string[];
  custom_service_types: string[];
  service_rates: Record<string, { hourly: number; halfHour: number }>;
  city: string;
  _distance?: number;
}

const SERVICE_TYPES = [
  'Walking', 'Jogging', 'Running', 'Biking', 'Yoga', 'Weight Lifting',
  'HIIT', 'Calisthenics', 'Swimming', 'Boxing', 'Pilates', 'Stretching'
];

const SORT_OPTIONS = [
  { value: 'distance', label: 'Distance (closest first)' },
  { value: 'rating', label: 'Rating (highest first)' },
  { value: 'price_low', label: 'Price (lowest first)' },
  { value: 'price_high', label: 'Price (highest first)' },
];

const PRICE_RANGES = [
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $150', min: 100, max: 150 },
  { label: '$150 - $200', min: 150, max: 200 },
  { label: '$200 - $300', min: 200, max: 300 },
  { label: '$300+', min: 300, max: 1000 },
];

export default function BrowsePartners() {
  const { user, profile } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [sortBy, setSortBy] = useState('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const partnersPerPage = 9;
  
  // Selected partner for profile view
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  
  // Mobile filter sidebar
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Calculate distance between two coordinates (in miles)
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

  // Get user's location
  const getUserLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
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
            errorMsg += 'Please enable location access to find partners near you.';
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
        // Still load partners (without distance calculation)
        fetchPartners();
      }
    );
  };

  // Fetch partners
  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_partner', true)
        .eq('profile_complete', true);
      
      if (error) throw error;
      
      let partnersWithDistance = (data || []).map((partner: any) => {
        let distance = null;
        if (userLocation && partner.service_areas_center_lat && partner.service_areas_center_lng) {
          distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            partner.service_areas_center_lat,
            partner.service_areas_center_lng
          );
        }
        // Get primary service rate
        const allServices = [...(partner.service_types || []), ...(partner.custom_service_types || [])];
        const primaryService = allServices[0] || 'Fitness';
        const hourlyRate = partner.service_rates?.[primaryService]?.hourly || 75;
        
        return {
          ...partner,
          _distance: distance,
          _primary_rate: hourlyRate,
          avg_rating: partner.avg_rating || 0,
          total_reviews: partner.total_reviews || 0,
          city: partner.city || 'Location not specified'
        };
      });
      
      setPartners(partnersWithDistance);
      applyFilters(partnersWithDistance);
    } catch (err) {
      console.error('Error fetching partners:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters
  const applyFilters = (partnersList = partners) => {
    let filtered = [...partnersList];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.first_name?.toLowerCase().includes(query) ||
        p.username?.toLowerCase().includes(query) ||
        p.bio?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query)
      );
    }
    
    // Filter by services
    if (selectedServices.length > 0) {
      filtered = filtered.filter(p => {
        const partnerServices = [...(p.service_types || []), ...(p.custom_service_types || [])];
        return selectedServices.some(s => partnerServices.includes(s));
      });
    }
    
    // Filter by price range
    if (selectedPriceRange) {
      filtered = filtered.filter(p => 
        p._primary_rate >= selectedPriceRange.min && 
        p._primary_rate <= selectedPriceRange.max
      );
    }
    
    // Filter by distance (if user location available)
    if (userLocation && searchRadius < 25) {
      filtered = filtered.filter(p => 
        p._distance !== null && p._distance <= searchRadius
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'distance':
        filtered.sort((a, b) => (a._distance || 999) - (b._distance || 999));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        break;
      case 'price_low':
        filtered.sort((a, b) => (a._primary_rate || 999) - (b._primary_rate || 999));
        break;
      case 'price_high':
        filtered.sort((a, b) => (b._primary_rate || 0) - (a._primary_rate || 0));
        break;
    }
    
    setFilteredPartners(filtered);
    setCurrentPage(1);
  };

  // Apply filters whenever any filter changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedServices, selectedPriceRange, sortBy, searchRadius, userLocation]);

  // Fetch partners when user location is set
  useEffect(() => {
    if (userLocation) {
      fetchPartners();
    }
  }, [userLocation]);

  // Initial load
  useEffect(() => {
    getUserLocation();
  }, []);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedServices([]);
    setSelectedPriceRange(null);
    setSortBy('distance');
    setSearchRadius(10);
    setMobileFiltersOpen(false);
  };

  // Pagination
  const totalPages = Math.ceil(filteredPartners.length / partnersPerPage);
  const startIndex = (currentPage - 1) * partnersPerPage;
  const endIndex = startIndex + partnersPerPage;
  const currentPartners = filteredPartners.slice(startIndex, endIndex);

  // Toggle service selection
  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  // Format rating stars
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
        ))}
        {hasHalfStar && (
          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-3 h-3 text-gray-500" />
        ))}
      </div>
    );
  };

  // Filter sidebar content (used both desktop and mobile)
  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Distance Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Distance within {searchRadius} miles
        </label>
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
          <span>1mi</span><span>5mi</span><span>10mi</span><span>15mi</span><span>20mi</span><span>25mi</span>
        </div>
      </div>
      
      {/* Service Types Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Activities</h3>
        <div className="flex flex-wrap gap-2">
          {SERVICE_TYPES.map(service => (
            <button
              key={service}
              onClick={() => toggleService(service)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedServices.includes(service)
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {service}
            </button>
          ))}
        </div>
      </div>
      
      {/* Price Range Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Price Range (per hour)</h3>
        <div className="space-y-2">
          {PRICE_RANGES.map(range => (
            <label key={range.label} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="priceRange"
                checked={selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max}
                onChange={() => setSelectedPriceRange({ min: range.min, max: range.max })}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-sm text-gray-300">{range.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="priceRange"
              checked={selectedPriceRange === null}
              onChange={() => setSelectedPriceRange(null)}
              className="w-4 h-4 accent-red-600"
            />
            <span className="text-sm text-gray-300">Any price</span>
          </label>
        </div>
      </div>
      
      {/* Sort By */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-red-500 focus:outline-none text-sm"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      {/* Reset Filters */}
      <button
        onClick={resetFilters}
        className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition"
      >
        Reset All Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/adonixlogo.png" 
                alt="Adonix Logo" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-white">ADONIX</span>
              <span className="text-xs text-gray-400 hidden sm:block">Social Fitness, Elevated</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/client-dashboard'}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                My Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Find Your Fitness Partner</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Connect with partners who match your fitness style, location, and budget.
            No awkward intros. Just good energy.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, city, or fitness interest..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="md:hidden px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Layout - 2 columns */}
        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden md:block w-72 shrink-0">
            <div className="sticky top-24 bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-white">Filters</h2>
                <button onClick={resetFilters} className="text-xs text-red-400 hover:text-red-300">
                  Reset all
                </button>
              </div>
              <FilterSidebar />
            </div>
          </div>

          {/* Partners Grid */}
          <div className="flex-1">
            {/* Results info */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-400">
                {loading ? 'Loading...' : `${filteredPartners.length} partner${filteredPartners.length !== 1 ? 's' : ''} found`}
              </p>
              <div className="md:hidden flex items-center gap-2">
                <span className="text-xs text-gray-500">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            )}

            {/* Location Error */}
            {locationError && !loading && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                <p className="text-yellow-400 text-sm">{locationError}</p>
                <button onClick={getUserLocation} className="mt-2 text-sm text-red-400 hover:text-red-300">
                  Try again →
                </button>
              </div>
            )}

            {/* No Results */}
            {!loading && filteredPartners.length === 0 && (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-gray-400 mb-2">No partners found</p>
                <p className="text-sm text-gray-500">Try adjusting your filters or search radius</p>
                <button onClick={resetFilters} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition">
                  Reset Filters
                </button>
              </div>
            )}

            {/* Partners Grid */}
            {!loading && filteredPartners.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {currentPartners.map((partner) => (
                    <div
                      key={partner.id}
                      className="bg-white/5 rounded-2xl border border-white/10 hover:border-red-500/50 transition-all group hover:scale-[1.02] duration-200 cursor-pointer overflow-hidden"
                      onClick={() => setSelectedPartner(partner)}
                    >
                      {/* Photo */}
                      <div className="aspect-square overflow-hidden bg-red-500/10">
                        {partner.live_photo_url ? (
                          <img
                            src={partner.live_photo_url}
                            alt={partner.first_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
                            📷
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-lg text-white">{partner.first_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {renderStars(partner.avg_rating)}
                              <span className="text-xs text-gray-500">
                                ({partner.total_reviews || 0})
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">${partner._primary_rate}</p>
                            <p className="text-xs text-gray-500">/ hour</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                          {partner.bio || 'No bio yet.'}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          {partner._distance !== null && partner._distance !== undefined && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {Math.round(partner._distance)} miles away
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {partner.city?.split(',')[0] || 'Location'}
                          </span>
                        </div>
                        
                        {/* Service tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {[...(partner.service_types || []), ...(partner.custom_service_types || [])].slice(0, 2).map(service => (
                            <span key={service} className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-gray-400">
                              {service}
                            </span>
                          ))}
                          {([...(partner.service_types || []), ...(partner.custom_service_types || [])].length > 2 && (
                            <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-gray-400">
                              +{([...(partner.service_types || []), ...(partner.custom_service_types || [])].length - 2)}
                            </span>
                          ))}
                        </div>
                        
                        <button className="w-full py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg text-sm font-medium transition">
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Sidebar */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 shadow-xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterSidebar />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  resetFilters();
                  setMobileFiltersOpen(false);
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition"
              >
                Reset All
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg font-medium transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Profile Modal */}
      {selectedPartner && (
        <PartnerProfileView
          partner={selectedPartner as any}
          onClose={() => setSelectedPartner(null)}
          onBook={(partner) => {
            console.log('Book partner:', partner);
            // Will implement booking in next step
            alert(`Booking with ${partner.first_name} coming soon!`);
          }}
        />
      )}
    </div>
  );
}