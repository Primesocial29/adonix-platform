import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, MapPin, Calendar, Clock, DollarSign, Star, 
  Award, Dumbbell, ChevronLeft, Heart, Share2, Flag
} from 'lucide-react';
import BookingFlow, { BookingDetails } from './BookingFlow';

interface PartnerProfileViewProps {
  partner: Profile;
  onClose: () => void;
  onBook?: (partner: Profile) => void;
}

export default function PartnerProfileView({ partner, onClose, onBook }: PartnerProfileViewProps) {
  const { user, profile } = useAuth();
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Get services and rates from partner
  const serviceTypes = (partner as any).service_types || [];
  const customServiceTypes = (partner as any).custom_service_types || [];
  const allServices = [...serviceTypes, ...customServiceTypes];
  const serviceRates = (partner as any).service_rates || {};
  const halfHourEnabled = (partner as any).half_hour_enabled || false;
  const availability = (partner as any).availability || [];
  const serviceAreas = (partner as any).service_areas || [];
  const certifications = (partner as any).certifications || [];

  // Fetch reviews (future feature - placeholder)
  useEffect(() => {
    // TODO: Fetch reviews when rating system is implemented
    setLoadingReviews(false);
  }, [partner.id]);

  const handleBookClick = () => {
    if (onBook) {
      onBook(partner);
    } else {
      setShowBookingFlow(true);
    }
  };

  const formatTimeSlot = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${period}`;
  };

  // Get days with availability
  const daysWithAvailability = availability.filter(day => day.times && day.times.length > 0);

  // Calculate average rating (placeholder)
  const avgRating = 4.8;
  const reviewCount = 24;

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header with close button */}
          <div className="sticky top-0 bg-black/90 z-10 pb-4 flex justify-between items-center">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Flag className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Profile Photo */}
          <div className="flex justify-center mb-6">
            <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-red-500/30 shadow-xl">
              {partner.live_photo_url ? (
                <img 
                  src={partner.live_photo_url} 
                  alt={partner.first_name || 'Partner'} 
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedImage(partner.live_photo_url!)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                  <Dumbbell className="w-16 h-16 text-gray-500" />
                </div>
              )}
            </div>
          </div>

          {/* Name and Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white">{partner.first_name || 'Partner'}</h1>
            <p className="text-gray-400 mt-1">@{partner.first_name?.toLowerCase().replace(/\s/g, '_') || 'partner'}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="text-white font-semibold">{avgRating}</span>
              <span className="text-gray-400">({reviewCount} reviews)</span>
            </div>
          </div>

          {/* Bio */}
          {partner.bio && (
            <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-gray-300 leading-relaxed">{partner.bio}</p>
            </div>
          )}

          {/* Services & Rates */}
          {allServices.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-red-500" />
                Activities & Suggested Contributions
              </h2>
              <div className="space-y-3">
                {allServices.map(service => {
                  const rates = serviceRates[service] || { hourly: partner.hourly_rate || 100, halfHour: 0 };
                  return (
                    <div key={service} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-white">{service}</span>
                        <div className="text-right">
                          <span className="text-red-500 font-bold">${rates.hourly}</span>
                          <span className="text-gray-400 text-sm"> suggested / hour</span>
                          {halfHourEnabled && rates.halfHour > 0 && (
                            <div className="text-sm text-gray-400">
                              or ${rates.halfHour} suggested / 30 min
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Availability */}
          {daysWithAvailability.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                Availability
              </h2>
              <div className="space-y-2">
                {daysWithAvailability.map(day => (
                  <div key={day.day} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="font-medium text-white mb-2">{day.day}</div>
                    <div className="flex flex-wrap gap-2">
                      {day.times.map((time: string) => (
                        <span key={time} className="text-xs text-gray-300 bg-white/10 px-2 py-1 rounded">
                          {formatTimeSlot(time)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Areas (Locations) */}
          {serviceAreas.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                Meeting Locations
              </h2>
              <div className="space-y-2">
                {serviceAreas.map((area: any, idx: number) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300 text-sm">{area.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-red-500" />
                Certifications
              </h2>
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section (placeholder) */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Reviews
            </h2>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
              <p className="text-gray-400">No reviews yet. Be the first to leave a review!</p>
            </div>
          </div>

          {/* Book Button */}
          <div className="sticky bottom-0 bg-black/90 pt-4 pb-6">
            <button
              onClick={handleBookClick}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-full font-semibold text-white transition-all transform hover:scale-105"
            >
              Invite to Meet with {partner.first_name}
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              By booking, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      {/* Booking Flow Modal */}
      {showBookingFlow && (
        <BookingFlow
          partner={partner}
          onClose={() => setShowBookingFlow(false)}
          onProceedToCheckout={(details) => {
            setShowBookingFlow(false);
            // Handle checkout
            console.log('Proceed to checkout:', details);
          }}
        />
      )}

      {/* Image Lightbox (simple) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Full size" 
            className="max-w-full max-h-full object-contain"
          />
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}