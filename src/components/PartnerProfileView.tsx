import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, MapPin, Calendar, Clock, DollarSign, Star, 
  Award, Dumbbell, ChevronLeft, Heart, Share2, Flag, CheckCircle
} from 'lucide-react';

interface PartnerProfileViewProps {
  partner: Profile;
  onClose: () => void;
  onBook?: (partner: Profile) => void;
}

export default function PartnerProfileView({ partner, onClose, onBook }: PartnerProfileViewProps) {
  const { user, profile } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);
  
  // Selection states
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<1 | 2>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // Legal checkboxes
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [socialConfirmed, setSocialConfirmed] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [gpsConfirmed, setGpsConfirmed] = useState(false);
  
  // Get partner data
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

  // Get available dates (next 14 days where partner has availability)
  const getAvailableDates = () => {
    const dates: { date: string; dayName: string; dayNum: string; month: string }[] = [];
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = dayNames[date.getDay()];
      const hasAvailability = (availability || []).some(a => a.day === dayName && a.times && a.times.length > 0);
      
      if (hasAvailability) {
        dates.push({
          date: date.toISOString().split('T')[0],
          dayName: dayName.slice(0, 3),
          dayNum: date.getDate().toString(),
          month: monthNames[date.getMonth()]
        });
      }
    }
    return dates;
  };

  // Get available time slots for selected date
  const getAvailableTimeSlots = () => {
    if (!selectedDate) return [];
    const date = new Date(selectedDate);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    const daySchedule = (availability || []).find(a => a.day === dayName);
    if (!daySchedule || !daySchedule.times) return [];
    return daySchedule.times.sort();
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationHours: number): string => {
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + durationHours * 60;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  // Format time for display
  const formatTimeDisplay = (time: string): string => {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minute} ${period}`;
  };

  // Format date for display
  const formatDateDisplay = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Get current rate for selected activity
  const getCurrentRate = () => {
    const rates = serviceRates[selectedActivity] || { hourly: 75, halfHour: 0 };
    return rates.hourly;
  };

  // Calculate fee breakdown
  const currentRate = getCurrentRate();
  const totalContribution = currentRate * selectedDuration;
  const platformFee = totalContribution * 0.15;
  const processingFee = totalContribution * 0.029 + 0.30;
  const partnerReceives = totalContribution - platformFee - processingFee;

  // Get location distance (mock - would need real calculation)
  const getLocationDistance = (locationName: string): number => {
    const distances: Record<string, number> = {
      'Gold\'s Gym Downtown': 2,
      'Central Park Track': 3,
      'LA Fitness Uptown': 5,
    };
    return distances[locationName] || 3;
  };

  // Check if all required fields are filled
  const isFormComplete = () => {
    return selectedActivity &&
           selectedDate &&
           selectedStartTime &&
           selectedLocation &&
           contactEmail &&
           contactPhone &&
           ageConfirmed &&
           socialConfirmed &&
           locationConfirmed &&
           gpsConfirmed;
  };

  const handleSendInvitation = async () => {
    if (!isFormComplete()) return;
    
    const endTime = calculateEndTime(selectedStartTime, selectedDuration);
    
    // Create booking in database
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        alert('Please sign in to send an invitation.');
        return;
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          partner_id: partner.id,
          client_id: currentUser.id,
          activity: selectedActivity,
          booking_date: `${selectedDate}T${selectedStartTime}:00`,
          duration_hours: selectedDuration,
          suggested_contribution: totalContribution,
          location_name: selectedLocation,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          status: 'pending'
        })
        .select();
      
      if (error) throw error;
      
      alert('Invitation sent! The partner will be notified.');
      onClose();
    } catch (err) {
      console.error('Error creating booking:', err);
      alert('Failed to send invitation. Please try again.');
    }
  };

  const availableDates = getAvailableDates();
  const availableTimeSlots = getAvailableTimeSlots();
  const endTime = selectedStartTime ? calculateEndTime(selectedStartTime, selectedDuration) : '';
  const avgRating = 4.8;
  const reviewCount = 24;

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
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

          {/* Profile Section */}
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

          {/* Bio */}
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

          {/* STEP 1: Activity & Duration */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
            <h2 className="text-lg font-semibold mb-4 text-red-400">STEP 1: WHAT GETS YOU MOVING?</h2>
            
            <label className="block text-sm text-gray-400 mb-2">Select Activity</label>
            <div className="flex flex-wrap gap-2 mb-5">
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

          {/* STEP 2: Date & Time */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
            <h2 className="text-lg font-semibold mb-4 text-red-400">STEP 2: WHEN CAN YOU SWEAT?</h2>
            
            <label className="block text-sm text-gray-400 mb-2">Select Date</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {availableDates.map(date => (
                <button
                  key={date.date}
                  onClick={() => {
                    setSelectedDate(date.date);
                    setSelectedStartTime('');
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedDate === date.date
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {date.dayName} {date.dayNum}<br />{date.month}
                  {selectedDate === date.date && <span className="ml-1">✓</span>}
                </button>
              ))}
            </div>

            {selectedDate && (
              <>
                <label className="block text-sm text-gray-400 mb-2">Select Start Time</label>
                <div className="flex flex-wrap gap-2">
                  {availableTimeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedStartTime(time)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedStartTime === time
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                          : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {formatTimeDisplay(time)}
                      {selectedStartTime === time && <span className="ml-1">✓</span>}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Select a start time. End time will be calculated based on duration.</p>
              </>
            )}
          </div>

          {/* STEP 3: Location */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
            <h2 className="text-lg font-semibold mb-4 text-red-400">STEP 3: WHERE TO MEET?</h2>
            
            <div className="space-y-3">
              {serviceAreas.map((area: any, idx: number) => {
                const distance = getLocationDistance(area.name);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedLocation(area.name)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedLocation === area.name
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {selectedLocation === area.name ? (
                          <CheckCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{area.name}</p>
                        <p className="text-xs text-gray-400">{distance} miles from you</p>
                        {area.address && <p className="text-xs text-gray-500 mt-1">{area.address}</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-yellow-400 mt-3">⚠️ Only verified public venues. Private residences are strictly prohibited.</p>
          </div>

          {/* STEP 4: Contact Info */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
            <h2 className="text-lg font-semibold mb-4 text-red-400">STEP 4: YOUR CONTACT INFO</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* YOUR SELECTED BLOCK */}
          {selectedActivity && selectedDate && selectedStartTime && selectedLocation && (
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl p-5 border border-red-500/30 mb-5">
              <h2 className="text-lg font-semibold mb-3 text-white">YOUR SELECTED BLOCK</h2>
              <div className="space-y-2">
                <p className="text-white font-medium">🧘 {selectedActivity} · {selectedDuration} hour{selectedDuration > 1 ? 's' : ''}</p>
                <p className="text-gray-300 text-sm">📅 {formatDateDisplay(selectedDate)} · {formatTimeDisplay(selectedStartTime)} - {formatTimeDisplay(endTime)}</p>
                <p className="text-gray-300 text-sm">📍 {selectedLocation} ({getLocationDistance(selectedLocation)} miles)</p>
                <div className="border-t border-white/10 my-3 pt-3">
                  <p className="text-sm text-gray-300">💰 Suggested Contribution: ${totalContribution.toFixed(2)}</p>
                  <p className="text-xs text-red-400">Platform Support (15%): -${platformFee.toFixed(2)}</p>
                  <p className="text-xs text-red-400">Processing Fee: -${processingFee.toFixed(2)}</p>
                  <div className="border-t border-white/10 my-2"></div>
                  <p className="text-sm font-semibold text-green-400">Partner Receives: ${partnerReceives.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* LEGAL AGREEMENT */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
            <h2 className="text-lg font-semibold mb-3 text-red-400">⚖️ LEGAL AGREEMENT</h2>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-red-600"
                />
                <span className="text-sm text-gray-300">I confirm I am at least 18 years old.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={socialConfirmed}
                  onChange={(e) => setSocialConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-red-600"
                />
                <span className="text-sm text-gray-300">I understand this is a social meetup, not a professional service.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={locationConfirmed}
                  onChange={(e) => setLocationConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-red-600"
                />
                <span className="text-sm text-gray-300">I agree to meet at the verified public location above.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gpsConfirmed}
                  onChange={(e) => setGpsConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-red-600"
                />
                <span className="text-sm text-gray-300">I understand GPS check-in is required within 0.75 miles.</span>
              </label>
            </div>
          </div>

          {/* SEND BUTTON */}
          <button
            onClick={handleSendInvitation}
            disabled={!isFormComplete()}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all transform hover:scale-105 mb-4 ${
              isFormComplete()
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            SEND INVITATION REQUEST
          </button>

          {/* Legal Footer */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <p className="text-xs text-red-300 text-center">
              ⚠️ This is a social meetup, not a professional service.<br />
              Meet only at public locations. GPS check-in required.<br />
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