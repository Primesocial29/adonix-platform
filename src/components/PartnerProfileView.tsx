import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, MapPin, Calendar, Clock, DollarSign, Star, 
  Award, Dumbbell, ChevronLeft, Heart, Flag, CheckCircle
} from 'lucide-react';

interface PartnerProfileViewProps {
  partner: Profile;
  onClose: () => void;
  onBook?: (partner: Profile) => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  durationHours: number;
  durationMinutes: number;
}

type DurationOption = 30 | 60 | 90 | 120;
type ScreenState = 'form' | 'review' | 'processing' | 'success';

export default function PartnerProfileView({ partner, onClose, onBook }: PartnerProfileViewProps) {
  const { user, profile } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);
  const [screen, setScreen] = useState<ScreenState>('form');
  
  // Client Contact Info (ALL REQUIRED)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // Validation errors
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Selection states (single selection only)
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<DurationOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  
  // Step error messages
  const [step1Error, setStep1Error] = useState('');
  const [step2Error, setStep2Error] = useState('');
  const [step3Error, setStep3Error] = useState('');
  const [step4Error, setStep4Error] = useState('');
  const [step5Error, setStep5Error] = useState('');
  
  // Legal checkboxes (ALL REQUIRED)
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [socialConfirmed, setSocialConfirmed] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [gpsConfirmed, setGpsConfirmed] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [respectConfirmed, setRespectConfirmed] = useState(false);
  
  // Get partner data
  const serviceTypes = (partner as any).service_types || [];
  const customServiceTypes = (partner as any).custom_service_types || [];
  const allServices = [...serviceTypes, ...customServiceTypes];
  const serviceRates = (partner as any).service_rates || {};
  const availability = (partner as any).availability || [];
  const serviceAreas = (partner as any).service_areas || [];

  // Helper function to check if a specific service offers half-hour sessions
  const isHalfHourEnabledForService = useCallback((service: string): boolean => {
    const rate = serviceRates[service];
    return !!(rate?.halfHour && rate.halfHour > 0);
  }, [serviceRates]);

  // Helper functions
  const timeToMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  };
  
  const minutesToTime = (minutes: number): string => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const hasExactDurationBlocks = useCallback((targetMinutes: number, halfHourEnabledForService: boolean): boolean => {
    for (const daySchedule of availability) {
      if (!daySchedule.times || daySchedule.times.length === 0) continue;
      
      const sortedTimes = [...daySchedule.times].sort();
      const slotDuration = halfHourEnabledForService ? 30 : 60;
      const blocksNeeded = targetMinutes / slotDuration;
      
      for (let i = 0; i <= sortedTimes.length - blocksNeeded; i++) {
        let isExactBlock = true;
        
        for (let j = 0; j < blocksNeeded; j++) {
          const expectedTime = timeToMinutes(sortedTimes[i]) + (j * slotDuration);
          const actualTime = timeToMinutes(sortedTimes[i + j]);
          if (actualTime !== expectedTime) {
            isExactBlock = false;
            break;
          }
        }
        
        if (isExactBlock && (i + blocksNeeded) < sortedTimes.length) {
          const nextTimeAfterBlock = timeToMinutes(sortedTimes[i + blocksNeeded]);
          const expectedEndTime = timeToMinutes(sortedTimes[i]) + targetMinutes;
          if (nextTimeAfterBlock === expectedEndTime) {
            isExactBlock = false;
          }
        }
        
        if (isExactBlock) return true;
      }
    }
    return false;
  }, [availability]);

  const getAvailableDurationOptions = useCallback((service: string): DurationOption[] => {
    const options: DurationOption[] = [];
    const halfHourEnabledForService = isHalfHourEnabledForService(service);
    
    if (halfHourEnabledForService) {
      options.push(30);
    }
    
    options.push(60);
    
    if (hasExactDurationBlocks(90, halfHourEnabledForService)) {
      options.push(90);
    }
    
    if (hasExactDurationBlocks(120, halfHourEnabledForService)) {
      options.push(120);
    }
    
    return options;
  }, [isHalfHourEnabledForService, hasExactDurationBlocks]);

  const hasExactDurationOnDay = useCallback((times: string[], targetMinutes: number, halfHourEnabledForService: boolean): boolean => {
    if (!times || times.length === 0) return false;
    
    const sortedTimes = [...times].sort();
    const slotDuration = halfHourEnabledForService ? 30 : 60;
    const blocksNeeded = targetMinutes / slotDuration;
    
    for (let i = 0; i <= sortedTimes.length - blocksNeeded; i++) {
      let isExactBlock = true;
      
      for (let j = 0; j < blocksNeeded; j++) {
        const expectedTime = timeToMinutes(sortedTimes[i]) + (j * slotDuration);
        const actualTime = timeToMinutes(sortedTimes[i + j]);
        if (actualTime !== expectedTime) {
          isExactBlock = false;
          break;
        }
      }
      
      if (isExactBlock) {
        if ((i + blocksNeeded) < sortedTimes.length) {
          const nextTimeAfterBlock = timeToMinutes(sortedTimes[i + blocksNeeded]);
          const expectedEndTime = timeToMinutes(sortedTimes[i]) + targetMinutes;
          if (nextTimeAfterBlock === expectedEndTime) {
            isExactBlock = false;
          }
        }
        if (isExactBlock) return true;
      }
    }
    return false;
  }, []);

  const getAvailableDates = useCallback(() => {
    if (!selectedDuration || !selectedActivity) return [];
    
    const halfHourEnabledForService = isHalfHourEnabledForService(selectedActivity);
    const dates: { date: string; dayName: string; dayNum: string; month: string }[] = [];
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = dayNames[date.getDay()];
      const daySchedule = (availability || []).find(a => a.day === dayName);
      
      if (daySchedule && daySchedule.times && daySchedule.times.length > 0) {
        if (hasExactDurationOnDay(daySchedule.times, selectedDuration, halfHourEnabledForService)) {
          dates.push({
            date: date.toISOString().split('T')[0],
            dayName: dayName.slice(0, 3),
            dayNum: date.getDate().toString(),
            month: monthNames[date.getMonth()]
          });
        }
      }
    }
    return dates;
  }, [selectedDuration, selectedActivity, availability, isHalfHourEnabledForService, hasExactDurationOnDay]);

  const getAvailableTimeSlots = useCallback((): TimeSlot[] => {
    if (!selectedDate || !selectedDuration || !selectedActivity) return [];
    
    const halfHourEnabledForService = isHalfHourEnabledForService(selectedActivity);
    const date = new Date(selectedDate);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    const daySchedule = (availability || []).find(a => a.day === dayName);
    
    if (!daySchedule || !daySchedule.times || daySchedule.times.length === 0) return [];
    
    const sortedTimes = [...daySchedule.times].sort();
    const slotDuration = halfHourEnabledForService ? 30 : 60;
    const blocksNeeded = selectedDuration / slotDuration;
    const slots: TimeSlot[] = [];
    
    for (let i = 0; i <= sortedTimes.length - blocksNeeded; i++) {
      let isExactBlock = true;
      
      for (let j = 0; j < blocksNeeded; j++) {
        const expectedTime = timeToMinutes(sortedTimes[i]) + (j * slotDuration);
        const actualTime = timeToMinutes(sortedTimes[i + j]);
        if (actualTime !== expectedTime) {
          isExactBlock = false;
          break;
        }
      }
      
      if (isExactBlock && (i + blocksNeeded) < sortedTimes.length) {
        const nextTimeAfterBlock = timeToMinutes(sortedTimes[i + blocksNeeded]);
        const expectedEndTime = timeToMinutes(sortedTimes[i]) + selectedDuration;
        if (nextTimeAfterBlock === expectedEndTime) {
          isExactBlock = false;
        }
      }
      
      if (isExactBlock) {
        const startTime = sortedTimes[i];
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = startMinutes + selectedDuration;
        const endTime = minutesToTime(endMinutes);
        
        slots.push({
          startTime,
          endTime,
          durationHours: selectedDuration / 60,
          durationMinutes: selectedDuration
        });
      }
    }
    
    return slots;
  }, [selectedDate, selectedDuration, selectedActivity, availability, isHalfHourEnabledForService]);

  const getCurrentRate = useCallback(() => {
    const rates = serviceRates[selectedActivity] || { hourly: 75, halfHour: null };
    return rates.hourly;
  }, [serviceRates, selectedActivity]);

  const getLocationDistance = useCallback((locationName: string): number => {
    const distances: Record<string, number> = {
      'Gold\'s Gym Downtown': 2,
      'Central Park Track': 3,
      'Barry\'s Bootcamp': 4,
    };
    return distances[locationName] || 3;
  }, []);

  const formatTimeDisplay = useCallback((time: string): string => {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minute} ${period}`;
  }, []);

  const formatDateDisplay = useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, []);

  const formatDuration = useCallback((minutes: number): string => {
    if (minutes === 30) return '30 min';
    if (minutes === 60) return '1 hour';
    if (minutes === 90) return '1.5 hours';
    return '2 hours';
  }, []);

  const currentRate = getCurrentRate();
  const totalContribution = selectedTimeSlot ? currentRate * selectedTimeSlot.durationHours : 0;

  // Validation functions - NO STATE UPDATES HERE
  const isContactInfoValid = useMemo(() => {
    let isValid = true;
    
    if (!firstName.trim()) isValid = false;
    if (!lastName.trim()) isValid = false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim() || !emailRegex.test(contactEmail)) isValid = false;
    
    const phoneDigits = contactPhone.replace(/\D/g, '');
    if (!contactPhone.trim() || phoneDigits.length !== 10) isValid = false;
    
    return isValid;
  }, [firstName, lastName, contactEmail, contactPhone]);

  const isSelectionsValid = useMemo(() => {
    return !!selectedActivity && !!selectedDuration && !!selectedDate && !!selectedTimeSlot && !!selectedLocation;
  }, [selectedActivity, selectedDuration, selectedDate, selectedTimeSlot, selectedLocation]);

  const isCheckboxesValid = useMemo(() => {
    return ageConfirmed && socialConfirmed && locationConfirmed && gpsConfirmed && paymentConfirmed && respectConfirmed;
  }, [ageConfirmed, socialConfirmed, locationConfirmed, gpsConfirmed, paymentConfirmed, respectConfirmed]);

  const isFormComplete = isContactInfoValid && isSelectionsValid && isCheckboxesValid;

  // Handle input changes with validation
  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    if (!value.trim()) {
      setFirstNameError('First name is required');
    } else {
      setFirstNameError('');
    }
  };

  const handleLastNameChange = (value: string) => {
    setLastName(value);
    if (!value.trim()) {
      setLastNameError('Last name is required');
    } else {
      setLastNameError('');
    }
  };

  const handleEmailChange = (value: string) => {
    setContactEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim() || !emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handlePhoneChange = (value: string) => {
    setContactPhone(value);
    const phoneDigits = value.replace(/\D/g, '');
    if (!value.trim() || phoneDigits.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number');
    } else {
      setPhoneError('');
    }
  };

  const handleActivitySelect = (activity: string) => {
    setSelectedActivity(activity);
    setSelectedDuration(null);
    setSelectedDate('');
    setSelectedTimeSlot(null);
    setStep1Error('');
    setStep2Error('');
    setStep3Error('');
    setStep4Error('');
  };

  const handleDurationSelect = (duration: DurationOption) => {
    setSelectedDuration(duration);
    setSelectedDate('');
    setSelectedTimeSlot(null);
    setStep2Error('');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setStep3Error('');
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setStep4Error('');
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setStep5Error('');
  };

  const handleSecureSession = () => {
    // Final validation before proceeding
    if (!selectedActivity) setStep1Error('Please select an activity');
    if (!selectedDuration) setStep2Error('Please select a duration');
    if (!selectedDate) setStep3Error('Please select a date');
    if (!selectedTimeSlot) setStep4Error('Please select a time');
    if (!selectedLocation) setStep5Error('Please select a location');
    
    if (isFormComplete) {
      setScreen('review');
    }
  };

  const handleConfirmAndAuthorize = async () => {
    setScreen('processing');
    
    // Simulate payment authorization (replace with actual Stripe integration)
    setTimeout(() => {
      setScreen('success');
    }, 2000);
  };

  const handleBackToForm = () => {
    setScreen('form');
  };

  const availableDurationOptions = selectedActivity ? getAvailableDurationOptions(selectedActivity) : [];
  const availableDates = getAvailableDates();
  const availableTimeSlots = getAvailableTimeSlots();
  const avgRating = 4.8;
  const reviewCount = 24;

  // Get partner's username (never real name)
  const partnerUsername = (partner as any).username || partner.first_name?.toLowerCase().replace(/\s/g, '_') || 'partner';

  // SCREEN 1: BOOKING FORM
  if (screen === 'form') {
    return (
      <>
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="sticky top-0 bg-black/90 z-10 pb-4 flex justify-between items-center">
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/10 rounded-full">
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full">
                  <Flag className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Section - No personal info, only @username */}
            <div className="flex justify-center mb-4">
              <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-red-500/30 shadow-xl">
                {partner.live_photo_url ? (
                  <img 
                    src={partner.live_photo_url} 
                    alt={partnerUsername} 
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
              <h1 className="text-2xl font-bold text-white">🔥 @{partnerUsername}</h1>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-white font-semibold text-sm">{avgRating}</span>
                <span className="text-gray-400 text-sm">({reviewCount} reviews)</span>
              </div>
            </div>

            {/* Bio */}
            {partner.bio && (
              <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-gray-300 text-sm leading-relaxed">
                  {showFullBio ? partner.bio : `${partner.bio.slice(0, 150)}${partner.bio.length > 150 ? '...' : ''}`}
                </p>
                {partner.bio.length > 150 && (
                  <button onClick={() => setShowFullBio(!showFullBio)} className="text-xs text-red-400 hover:text-red-300 mt-2">
                    {showFullBio ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* STEP 1: Activity - Single select */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
              <h2 className="text-lg font-semibold mb-2 text-red-400">STEP 1 · HOW DO YOU WANT TO SWEAT WITH @{partnerUsername}?</h2>
              <p className="text-xs text-yellow-400 mb-3">⚠️ Select one option only</p>
              {step1Error && <p className="text-red-400 text-xs mb-2">{step1Error}</p>}
              <div className="flex flex-wrap gap-2">
                {allServices.map(service => (
                  <button
                    key={service}
                    onClick={() => handleActivitySelect(service)}
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

            {/* STEP 2: Duration - Single select (based on selected service's half-hour setting) */}
            {selectedActivity && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
                <h2 className="text-lg font-semibold mb-2 text-red-400">STEP 2 · HOW LONG CAN YOU LAST?</h2>
                <p className="text-xs text-yellow-400 mb-3">⚠️ Select one option only</p>
                {step2Error && <p className="text-red-400 text-xs mb-2">{step2Error}</p>}
                <div className="flex flex-wrap gap-3">
                  {availableDurationOptions.map(duration => (
                    <button
                      key={duration}
                      onClick={() => handleDurationSelect(duration)}
                      className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                        selectedDuration === duration
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                          : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {formatDuration(duration)}
                      {selectedDuration === duration && <span className="ml-1">✓</span>}
                    </button>
                  ))}
                </div>
                {availableDurationOptions.length === 1 && availableDurationOptions[0] === 60 && (
                  <p className="text-xs text-gray-400 mt-2">ℹ️ This activity is only available for 1-hour sessions.</p>
                )}
                {availableDurationOptions.includes(30) && (
                  <p className="text-xs text-green-400 mt-2">✓ 30-minute sessions are available for this activity.</p>
                )}
              </div>
            )}

            {/* STEP 3: Date - Single select */}
            {selectedDuration && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
                <h2 className="text-lg font-semibold mb-2 text-red-400">STEP 3 · WHEN CAN YOU SWEAT?</h2>
                <p className="text-xs text-yellow-400 mb-3">⚠️ Select one option only</p>
                {step3Error && <p className="text-red-400 text-xs mb-2">{step3Error}</p>}
                <div className="flex flex-wrap gap-2">
                  {availableDates.map(date => (
                    <button
                      key={date.date}
                      onClick={() => handleDateSelect(date.date)}
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
                {availableDates.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No available dates for {formatDuration(selectedDuration)} sessions.
                  </p>
                )}
              </div>
            )}

            {/* STEP 4: Time Slots - Single select */}
            {selectedDate && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
                <h2 className="text-lg font-semibold mb-2 text-red-400">STEP 4 · WHAT TIME?</h2>
                <p className="text-xs text-yellow-400 mb-3">⚠️ Select one option only</p>
                {step4Error && <p className="text-red-400 text-xs mb-2">{step4Error}</p>}
                <div className="flex flex-wrap gap-2">
                  {availableTimeSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTimeSlotSelect(slot)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedTimeSlot?.startTime === slot.startTime
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                          : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {formatTimeDisplay(slot.startTime)}
                      <span className="block text-xs opacity-80">
                        {formatDuration(slot.durationMinutes)}
                      </span>
                      {selectedTimeSlot?.startTime === slot.startTime && <span className="ml-1">✓</span>}
                    </button>
                  ))}
                </div>
                {availableTimeSlots.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No available time slots for this date.
                  </p>
                )}
              </div>
            )}

            {/* STEP 5: Location - Single select */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
              <h2 className="text-lg font-semibold mb-2 text-red-400">STEP 5 · WHERE TO MEET?</h2>
              <p className="text-xs text-yellow-400 mb-3">⚠️ Select one option only</p>
              {step5Error && <p className="text-red-400 text-xs mb-2">{step5Error}</p>}
              <div className="space-y-3">
                {serviceAreas.map((area: any, idx: number) => {
                  const distance = getLocationDistance(area.name);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleLocationSelect(area.name)}
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
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-yellow-400 mt-3">⚠️ Only verified public venues. Private residences prohibited.</p>
            </div>

            {/* YOUR SELECTED BLOCK */}
            {selectedActivity && selectedDuration && selectedDate && selectedTimeSlot && selectedLocation && (
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl p-5 border border-red-500/30 mb-5">
                <h2 className="text-lg font-semibold mb-3 text-white">YOUR SELECTED BLOCK</h2>
                <div className="space-y-2">
                  <p className="text-white font-medium">🧘 {selectedActivity} · {formatDuration(selectedTimeSlot.durationMinutes)}</p>
                  <p className="text-gray-300 text-sm">📅 {formatDateDisplay(selectedDate)} · {formatTimeDisplay(selectedTimeSlot.startTime)} - {formatTimeDisplay(selectedTimeSlot.endTime)}</p>
                  <p className="text-gray-300 text-sm">📍 {selectedLocation} ({getLocationDistance(selectedLocation)} miles)</p>
                  <div className="border-t border-white/10 my-3 pt-3">
                    <p className="text-sm font-semibold text-green-400">💰 Total: ${totalContribution.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* YOUR CONTACT INFO - All fields required */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
              <h2 className="text-lg font-semibold mb-2 text-red-400">YOUR CONTACT INFO</h2>
              <p className="text-xs text-yellow-400 mb-3">⚠️ All fields required — must be valid</p>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => handleFirstNameChange(e.target.value)}
                    placeholder="First Name *"
                    className={`w-full px-4 py-2 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none ${
                      firstNameError ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {firstNameError && <p className="text-red-400 text-xs mt-1">{firstNameError}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => handleLastNameChange(e.target.value)}
                    placeholder="Last Name *"
                    className={`w-full px-4 py-2 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none ${
                      lastNameError ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {lastNameError && <p className="text-red-400 text-xs mt-1">{lastNameError}</p>}
                </div>
                <div>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Email Address *"
                    className={`w-full px-4 py-2 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none ${
                      emailError ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
                </div>
                <div>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Phone Number *"
                    className={`w-full px-4 py-2 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none ${
                      phoneError ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                </div>
              </div>
            </div>

            {/* AGREEMENT & ACKNOWLEDGMENTS - All required */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
              <h2 className="text-lg font-semibold mb-2 text-red-400">AGREEMENT & ACKNOWLEDGMENTS</h2>
              <p className="text-xs text-yellow-400 mb-3">⚠️ All boxes MUST be checked to continue</p>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-1 w-4 h-4 accent-red-600" />
                  <span className="text-sm text-gray-300">I confirm I am at least 18 years old.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={socialConfirmed} onChange={(e) => setSocialConfirmed(e.target.checked)} className="mt-1 w-4 h-4 accent-red-600" />
                  <span className="text-sm text-gray-300">Not for dating, hookups, or adult entertainment. We're here to suffer together, not cuddle after.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={locationConfirmed} onChange={(e) => setLocationConfirmed(e.target.checked)} className="mt-1 w-4 h-4 accent-red-600" />
                  <span className="text-sm text-gray-300">I agree to meet only at verified public locations. No private residences, hotels, or Airbnbs.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={gpsConfirmed} onChange={(e) => setGpsConfirmed(e.target.checked)} className="mt-1 w-4 h-4 accent-red-600" />
                  <span className="text-sm text-gray-300">I understand GPS check-in is required within 0.75 miles.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={paymentConfirmed} onChange={(e) => setPaymentConfirmed(e.target.checked)} className="mt-1 w-4 h-4 accent-red-600" />
                  <span className="text-sm text-gray-300">I will pay upfront. Funds held until session is complete.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={respectConfirmed} onChange={(e) => setRespectConfirmed(e.target.checked)} className="mt-1 w-4 h-4 accent-red-600" />
                  <span className="text-sm text-gray-300">I agree to be on time, respectful, and communicate if I need to cancel or reschedule.</span>
                </label>
              </div>
              <div className="mt-4 p-3 bg-gray-800/50 rounded-xl">
                <p className="text-xs text-gray-400">📋 Cancel within 24 hours → Full refund</p>
                <p className="text-xs text-gray-400">📋 Cancel within 12 hours → 50% refund</p>
                <p className="text-xs text-gray-400">📋 No show → No refund</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-semibold text-white transition-all bg-white/10 hover:bg-white/20 border border-white/20"
              >
                CLOSE
              </button>
              <button
                onClick={handleSecureSession}
                disabled={!isFormComplete}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all transform hover:scale-105 ${
                  isFormComplete
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                SECURE SESSION - ${totalContribution.toFixed(2)}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              🔔 Once @{partnerUsername} approves, you'll be able to chat and coordinate your session.
            </p>
            <p className="text-xs text-red-400 text-center mt-2">
              ⚠️ Meet only in public. Report bad behavior.
            </p>
          </div>
        </div>

        {/* Image Lightbox */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer" onClick={() => setSelectedImage(null)}>
            <img src={selectedImage} alt="Full size" className="max-w-full max-h-full object-contain" />
            <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20" onClick={() => setSelectedImage(null)}>
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
      </>
    );
  }

  // SCREEN 2: REVIEW & CONFIRM
  if (screen === 'review') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="sticky top-0 bg-black/90 z-10 pb-4 flex justify-between items-center">
            <button onClick={handleBackToForm} className="p-2 hover:bg-white/10 rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/10 rounded-full">
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full">
                <Flag className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-red-500/20 mb-3">
              {partner.live_photo_url ? (
                <img src={partner.live_photo_url} alt={partnerUsername} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">📷</div>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">REVIEW YOUR REQUEST</h2>
          </div>

          {/* Session Details */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
            <h3 className="font-semibold text-white mb-3">SESSION DETAILS</h3>
            <div className="space-y-2">
              <p className="text-white">🧘 {selectedActivity} with @{partnerUsername}</p>
              <p className="text-gray-300 text-sm">⏱️ {formatDuration(selectedTimeSlot!.durationMinutes)}</p>
              <p className="text-gray-300 text-sm">📅 {formatDateDisplay(selectedDate)} · {formatTimeDisplay(selectedTimeSlot!.startTime)} - {formatTimeDisplay(selectedTimeSlot!.endTime)}</p>
              <p className="text-gray-300 text-sm">📍 {selectedLocation} ({getLocationDistance(selectedLocation)} miles)</p>
              <p className="text-gray-300 text-sm">💰 Total: ${totalContribution.toFixed(2)}</p>
              <p className="text-xs text-yellow-400 mt-2">💬 You'll be able to chat with @{partnerUsername} ONLY after they approve your request.</p>
            </div>
          </div>

          {/* Your Contact Info */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
            <h3 className="font-semibold text-white mb-3">YOUR CONTACT INFO</h3>
            <div className="space-y-1">
              <p className="text-gray-300">{firstName} {lastName}</p>
              <p className="text-gray-300">{contactEmail}</p>
              <p className="text-gray-300">{contactPhone}</p>
            </div>
          </div>

          {/* Payment Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-5">
            <p className="text-yellow-400 text-sm font-semibold mb-2">⚠️ YOUR CARD WILL BE AUTHORIZED FOR ${totalContribution.toFixed(2)}</p>
            <p className="text-xs text-gray-300">You will ONLY be charged after the session is completed together.</p>
            <div className="mt-3 pt-3 border-t border-yellow-500/30">
              <p className="text-xs text-gray-400">✓ Cancel within 24 hours → Full refund</p>
              <p className="text-xs text-gray-400">✓ Cancel within 12 hours → 50% refund</p>
              <p className="text-xs text-gray-400">✓ No show → No refund</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleBackToForm}
              className="flex-1 py-3 rounded-xl font-semibold text-white transition-all bg-white/10 hover:bg-white/20 border border-white/20"
            >
              CANCEL
            </button>
            <button
              onClick={handleConfirmAndAuthorize}
              className="flex-1 py-3 rounded-xl font-semibold text-white transition-all transform hover:scale-105 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              CONFIRM & AUTHORIZE ${totalContribution.toFixed(2)}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">↳ Back to form ↳ Authorizes card & sends request</p>
        </div>
      </div>
    );
  }

  // SCREEN 3: PROCESSING
  if (screen === 'processing') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500"></div>
          </div>
          <p className="text-white text-lg font-semibold">AUTHORIZING YOUR CARD...</p>
          <p className="text-gray-400 text-sm mt-2">Please don't close</p>
        </div>
      </div>
    );
  }

  // SCREEN 4: SUCCESS
  if (screen === 'success') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="sticky top-0 bg-black/90 z-10 pb-4 flex justify-between items-center">
            <div></div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/10 rounded-full">
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full">
                <Flag className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full mx-auto bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">REQUEST SENT!</h2>
            <p className="text-gray-300 mt-2">Your request has been sent to @{partnerUsername}</p>
          </div>

          {/* What Happens Next */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
            <h3 className="font-semibold text-white mb-3">WHAT HAPPENS NEXT?</h3>
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">🔔 @{partnerUsername} will review your request</p>
              <p className="text-gray-300 text-sm">📧 You'll get an email when they respond</p>
              <p className="text-gray-300 text-sm">💳 Your card has been authorized for ${totalContribution.toFixed(2)}</p>
              <p className="text-gray-300 text-sm">💬 Once @{partnerUsername} approves, you'll be able to chat through the app to coordinate.</p>
              <p className="text-gray-300 text-sm">📍 The exact meetup spot will be shared ONLY after approval and before your session.</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => {
                onClose();
                window.location.href = '/requests';
              }}
              className="flex-1 py-3 rounded-xl font-semibold text-white transition-all bg-white/10 hover:bg-white/20 border border-white/20"
            >
              VIEW REQUESTS
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-white transition-all bg-gradient-to-r from-red-600 to-orange-600 hover:scale-105"
            >
              CLOSE
            </button>
          </div>

          <p className="text-xs text-red-400 text-center mt-2">⚠️ Meet only in public. Report bad behavior.</p>
        </div>
      </div>
    );
  }

  return null;
}