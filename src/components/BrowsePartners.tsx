import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { Search, MapPin, DollarSign, Dumbbell, Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
const DISTANCE_OPTIONS = [2, 5, 10, 15, 20, 25];

export default function BrowsePartners({ onSelectPartner }: BrowsePartnersProps) {
  const [partners, setPartners] = useState<Profile[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState('');
  const [distance, setDistance] = useState(10);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all partners on mount
  useEffect(() => {
    fetchPartners();
  }, []);

  // Apply filters whenever filters change
  useEffect(() => {
    applyFilters();
  }, [partners, selectedService, distance, minPrice, maxPrice, searchTerm]);

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

  const applyFilters = () => {
    let filtered = [...partners];

    // Filter by search term (username or bio)
    if (searchTerm) {
      filtered = filtered.filter(partner => 
        partner.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by service type (check if partner offers this service)
    if (selectedService) {
      filtered = filtered.filter(partner => {
        const services = (partner as any).service_types || [];
        const customServices = (partner as any).custom_service_types || [];
        const allServices = [...services, ...customServices];
        return allServices.includes(selectedService);
      });
    }

    // Filter by price range (using hourly_rate)
    if (minPrice) {
      filtered = filtered.filter(partner => 
        (partner.hourly_rate || 0) >= parseInt(minPrice)
      );
    }
    if (maxPrice) {
      filtered = filtered.filter(partner => 
        (partner.hourly_rate || 0) <= parseInt(maxPrice)
      );
    }

    // Note: Distance filtering would require geolocation
    // For now, we'll skip actual distance calculation
    // You can add this later with user's saved location

    setFilteredPartners(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedService('');
    setDistance(10);
    setMinPrice('');
    setMaxPrice('');
    setSearchTerm('');
  };

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

    return (
      <div 
        onClick={() => onSelectPartner?.(partner)}
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
              <p className="text-sm text-gray-400">{primaryService}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-red-500">${rate}</p>
              <p className="text-xs text-gray-500">/ hour</p>
            </div>
          </div>

          {/* Rating placeholder */}
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs text-gray-400">New</span>
          </div>

          {/* Bio preview */}
          {partner.bio && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
              {partner.bio}
            </p>
          )}
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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Your Workout Buddy</h1>
          <p className="text-gray-400">Discover fitness partners who match your vibe</p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
              />
            </div>

            {/* Service Type Filter */}
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white"
            >
              <option value="">All Services</option>
              {SERVICE_OPTIONS.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>

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

            {/* Price Range */}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min $"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
              />
              <input
                type="number"
                placeholder="Max $"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
              />
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

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
            <div 
  onClick={() => setSelectedPartner(partner)}
  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-red-500/50 hover:scale-[1.02] transition-all cursor-pointer group"
>
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
  );
}