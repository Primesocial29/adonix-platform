import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, MapPin, Calendar, Clock, DollarSign, Star, 
  Award, Dumbbell, ChevronLeft, Heart, Share2, Flag, CheckCircle
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Selection states
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<1 | 2>(1);
  const [showFullBio, setShowFullBio] = useState(false);
  const [showFullAvailability, setShowFullAvailability] = useState(false);
  const [showFullVenues, setShowFullVenues] = useState(false);

  // Get services and rates from partner
  const serviceTypes = (partner as any).service_types || [];
  const customServiceTypes = (partner as any).custom_service_types || [];
  const allServices = [...serviceTypes, ...customServiceTypes];
  const serviceRates = (partner as any).service_rates || {};
  const halfHourEnabled = (partner as any).half_hour_enabled || false;
  const availability = (partner as any).availability || [];
  const serviceAreas = (partner as any).service_areas || [];
  const certifications = (partner as any).certifications || [];

  // Set default selected activity when services load
  useEffect(() => {
    if (allServices.length > 0 && !selectedActivity) {
      setSelectedActivity(allServices[0]);
    }
  }, [allServices]);

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

  // Get current rate for selected activity
  const getCurrentRate = () => {
    const rates = serviceRates[selectedActivity] || { hourly: 75, halfHour: 0 };
    return rates.hourly;
  };

  const currentRate = getCurrentRate();
  const totalContribution = currentRate * selectedDuration;
  const platformFee = totalContribution * 0.15;
  const processingFee = totalContribution * 0.029 + 0.30;
  const partnerReceives = totalContribution - platformFee - processingFee;

  // Get days with availability (for preview)
  const daysWithAvailability = availability.filter(day => day.times && day.times.length > 0);
  const previewDays = daysWithAvailability.slice(0, 3);
  const previewVenues = serviceAreas.slice(0, 3);

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
          <div className="flex justify-center mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-red-500/30 shadow-xl">
              {partner.live_photo_url ? (
                <img 
                  src={partner.live_photo_url} 
                  alt={partner.first_name || 'Partner'} 
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedImage(partner.live_photo_url!)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                  <Dumbbell className="w-12 h-12 text-gray-500" />
                </div>
              )}
            </div>
          </div>

          {/* Name and Rating */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">🔥 {partner.first_name || 'Partner'}</h1>
            <p className="text-gray-400 text-sm mt-1">@{partner.first_name?.toLowerCase().replace(/\s/g, '_') || 'partner'}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-white font-semibold text-sm">{avgRating}</span>
              <span className="text-gray-400 text-sm">({reviewCount} reviews)</span>
              <span className="text-xs text-red-400 ml-2 bg-red-500/20 px-2 py-0.5 rounded-full">LIVE ID</span>
            </div>
          </div>

          {/* Bio - Collapsible */}
          {partner.bio && (
            <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-gray-300 text-sm leading-relaxed">
                {showFullBio ? partner.bio : `${partner.bio.slice(0, 150)}${partner.bio.length > 150 ? '...' : ''}`}
              </p>
              {partner.bio.length > 150 && (
                <button 
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="text-xs text-red-400 hover:text-red-300 mt-2"
                >
                  {showFullBio ? 'Show less' : 'Read more'}
                </button>
              )}
              <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-white/10">
                🔹 Profile info is self-reported — not verified by Adonix.
              </p>
            </div>
          )}

          {/* Services & Rates */}
          {allServices.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-red-500" />
                Services & Suggested Contributions
              </h2>
              <div className="space-y-2">
                {allServices.map(service => {
                  const rates = serviceRates[service] || { hourly: 75, halfHour: 0 };
                  return (
                    <div key={service} className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white text-sm">{service}</span>
                        <div className="text-right">
                          <span className="text-red-400 font-bold text-sm">${rates.hourly}</span>
                          <span className="text-gray-400 text-xs">/hr</span>
                          {halfHourEnabled && rates.halfHour > 0 && (
                            <div className="text-xs text-gray-500">
                              or ${rates.halfHour}/30min
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

          {/* Credentials */}
          {certifications.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-red-500" />
                Self-Reported Credentials
              </h2>
              <div className="flex flex-wrap gap-2">
                {certifications.slice(0, 4).map((cert: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">
                    {cert}
                  </span>
                ))}
                {certifications.length > 4 && (
                  <span className="px-2 py-1 bg-white/10 text-gray-400 rounded-full text-xs">
                    +{certifications.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Public Venues - Collapsible */}
          {serviceAreas.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                Verified Public Venues
              </h2>
              <div className="space-y-1">
                {(showFullVenues ? serviceAreas : previewVenues).map((area: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-gray-400 text-sm">
                    <MapPin className="w-3 h-3" />
                    <span>{area.name}</span>
                  </div>
                ))}
                {serviceAreas.length > 3 && (
                  <button 
                    onClick={() => setShowFullVenues(!showFullVenues)}
                    className="text-xs text-red-400 hover:text-red-300 mt-1"
                  >
                    {showFullVenues ? 'Show less' : `+${serviceAreas.length - 3} more venues`}
                  </button>
                )}
              </div>
              <p className="text-xs text-yellow-400 mt-2">⚠️ Public locations only. GPS check-in required.</p>
            </div>
          )}

          {/* Availability - Collapsible */}
          {daysWithAvailability.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                Availability
              </h2>
              <div className="space-y-2">
                {(showFullAvailability ? daysWithAvailability : previewDays).map(day => (
                  <div key={day.day} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="font-medium text-white text-sm mb-1">{day.day}</div>
                    <div className="flex flex-wrap gap-1">
                      {day.times.slice(0, showFullAvailability ? undefined : 4).map((time: string) => (
                        <span key={time} className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                          {formatTimeSlot(time)}
                        </span>
                      ))}
                      {!showFullAvailability && day.times.length > 4 && (
                        <span className="text-xs text-gray-500">+{day.times.length - 4} more</span>
                      )}
                    </div>
                  </div>
                ))}
                {daysWithAvailability.length > 3 && (
                  <button 
                    onClick={() => setShowFullAvailability(!showFullAvailability)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    {showFullAvailability ? 'Show less' : `View all ${daysWithAvailability.length} days`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Request Meetup Section - BUTTON SELECTION */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-6">
            <h2 className="text-lg font-semibold mb-4">Request Meetup</h2>
            
            {/* Activity Selection - BUTTONS like partner profile */}
            <div className="mb-5">
              <label className="block text-sm text-gray-400 mb-2">Select Activity</label>
              <div className="flex flex-wrap gap-2">
                {allServices.map(service => (
                  <button
                    key={service}
                    onClick={() => setSelectedActivity(service)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedActivity === service
                        ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg scale-[1.02]'
                        : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {service}
                    {selectedActivity === service && <span className="ml-1">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selection - BUTTONS */}
            <div className="mb-5">
              <label className="block text-sm text-gray-400 mb-2">Duration</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedDuration(1)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedDuration === 1
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  1 hour
                  {selectedDuration === 1 && <span className="ml-1">✓</span>}
                </button>
                <button
                  onClick={() => setSelectedDuration(2)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedDuration === 2
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  2 hours (contiguous)
                  {selectedDuration === 2 && <span className="ml-1">✓</span>}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">You can only book 1 or 2 contiguous hours (back-to-back).</p>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-black/30 rounded-xl p-4 mb-5">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Suggested Contribution:</span>
                  <span className="text-white">${totalContribution.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform Support (15%):</span>
                  <span className="text-red-400">-${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Processing Fee (2.9% + $0.30):</span>
                  <span className="text-red-400">-${processingFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 my-2"></div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-300">Partner Receives:</span>
                  <span className="text-green-400">${partnerReceives.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Request Button */}
            <button
              onClick={handleBookClick}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold text-white transition-all transform hover:scale-105"
            >
              Continue to Schedule
            </button>
          </div>

          {/* Legal Footer */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <p className="text-xs text-red-300 text-center">
              ⚠️ This is a social meetup, not a professional service.<br />
              Meet only at verified public locations. GPS check-in required.<br />
              Two-person only — no extra friends or spectators.
            </p>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
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