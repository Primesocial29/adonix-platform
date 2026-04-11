import { useState, useEffect } from 'react';
import { Profile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { X, Calendar, MapPin, ChevronLeft, ChevronRight, Phone, Info, Clock } from 'lucide-react';
import { validateText } from '../lib/textSanitizer';
import BlockedWordAlert from './BlockedWordAlert';
import { useAuth } from '../contexts/AuthContext';

interface BookingFlowProps {
  partner: Profile;
  onClose: () => void;
  onProceedToCheckout: (bookingDetails: BookingDetails) => void;
}

export interface BookingDetails {
  partner: Profile;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  locationName: string;
  locationLat: number;
  locationLng: number;
  contactEmail: string;
  contactPhone: string;
  selectedService: string;
  serviceRate: number;
}

interface TimeBlock {
  start: string;
  end: string;
  startHour: number;
  endHour: number;
  duration: number;
}

export default function BookingFlow({ partner, onClose, onProceedToCheckout }: BookingFlowProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock | null>(null);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState<number | null>(null);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [availableTimeBlocks, setAvailableTimeBlocks] = useState<TimeBlock[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [hasPendingBooking, setHasPendingBooking] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);

  const allServices = [...(partner.service_types || []), ...(partner.custom_service_types || [])];
  const serviceRates = partner.service_rates || {};
  const halfHourEnabled = (partner as any).half_hour_enabled || false;

  const getServiceRate = (service: string) => {
    const rate = serviceRates[service];
    if (rate) return { hourly: rate.hourly, halfHour: rate.halfHour };
    return { hourly: 50, halfHour: 30 };
  };

  // Check if user already has a pending booking with this partner
  useEffect(() => {
    const checkPendingBooking = async () => {
      if (!user) {
        setCheckingPending(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, status')
          .eq('client_id', user.id)
          .eq('partner_id', partner.id)
          .in('status', ['pending', 'confirmed'])
          .maybeSingle();

        if (error) throw error;
        setHasPendingBooking(!!data);
      } catch (err) {
        console.error('Error checking pending booking:', err);
      } finally {
        setCheckingPending(false);
      }
    };

    checkPendingBooking();
  }, [user, partner.id]);

  // Generate time blocks for a given date
  const generateTimeBlocks = async (date: Date) => {
    if (!partner.availability) return [];
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = partner.availability.find((d: any) => d.day === dayName);
    
    if (!daySchedule || daySchedule.times.length === 0) return [];
    
    const availableTimes = daySchedule.times;
    const blocks: TimeBlock[] = [];
    
    // Get already booked times for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { data: bookedData } = await supabase
      .from('bookings')
      .select('booking_date')
      .eq('partner_id', partner.id)
      .eq('status', 'confirmed')
      .gte('booking_date', startOfDay.toISOString())
      .lte('booking_date', endOfDay.toISOString());
    
    const bookedTimes = (bookedData || []).map(b => 
      new Date(b.booking_date).toTimeString().slice(0, 5)
    );
    
    // Filter out booked times
    const freeTimes = availableTimes.filter(time => !bookedTimes.includes(time));
    
    if (freeTimes.length === 0) return [];
    
    // Convert time strings to hours for easier calculation
    const timeValues = freeTimes.map(time => {
      const [hour, minute] = time.split(':').map(Number);
      return hour + minute / 60;
    }).sort((a, b) => a - b);
    
    // Group contiguous times into blocks (max 2 hours)
    let currentBlockStart = timeValues[0];
    let prevTime = timeValues[0];
    
    for (let i = 1; i <= timeValues.length; i++) {
      const currentTime = timeValues[i];
      const isEndOfBlock = !currentTime || currentTime - prevTime > 0.5 || (currentTime - currentBlockStart) >= 2;
      
      if (isEndOfBlock) {
        const duration = Math.round((prevTime - currentBlockStart) * 60);
        if (duration >= 30) {
          const startHour = Math.floor(currentBlockStart);
          const startMinute = Math.round((currentBlockStart % 1) * 60);
          const endHour = Math.floor(prevTime);
          const endMinute = Math.round((prevTime % 1) * 60);
          
          blocks.push({
            start: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
            end: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
            startHour: currentBlockStart,
            endHour: prevTime,
            duration: duration
          });
        }
        currentBlockStart = currentTime;
      }
      prevTime = currentTime;
    }
    
    return blocks;
  };

  const handleDateClick = async (day: Date) => {
    setSelectedDate(day);
    setSelectedTimeBlock(null);
    setLoadingBlocks(true);
    
    const blocks = await generateTimeBlocks(day);
    setAvailableTimeBlocks(blocks);
    setLoadingBlocks(false);
  };

  const formatTimeDisplay = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${period}`;
  };

  const handleProceed = async () => {
    setEmailError(null);
    setPhoneError(null);
    setBlockedWords([]);
    
    if (!selectedDate || !selectedTimeBlock || selectedLocationIndex === null || !contactEmail || !contactPhone || !selectedService) {
      alert('Please fill in all fields');
      return;
    }
    
    if (hasPendingBooking) {
      alert('You already have a pending or confirmed booking with this partner. Please complete or cancel that session before booking another.');
      return;
    }
    
    const emailValidation = await validateText(contactEmail, 'email address');
    if (!emailValidation.isValid) {
      setBlockedWords(emailValidation.blockedWords);
      setEmailError(emailValidation.error || 'Your email contains blocked words');
      return;
    }
    
    const phoneRegex = /^[0-9]{10}$/;
    const cleanPhone = contactPhone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setPhoneError('Please enter a valid 10‑digit phone number.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      alert('Please enter a valid email address');
      return;
    }
    
    const [startHours, startMinutes] = selectedTimeBlock.start.split(':').map(Number);
    const sessionDate = new Date(selectedDate);
    sessionDate.setHours(startHours, startMinutes, 0, 0);
    
    const location = serviceAreas[selectedLocationIndex];
    const rate = getServiceRate(selectedService);
    const serviceRate = selectedTimeBlock.duration === 30 ? rate.halfHour : rate.hourly;
    
    onProceedToCheckout({
      partner,
      date: sessionDate,
      startTime: selectedTimeBlock.start,
      endTime: selectedTimeBlock.end,
      duration: selectedTimeBlock.duration,
      locationName: location.name,
      locationLat: location.lat || 0,
      locationLng: location.lng || 0,
      contactEmail,
      contactPhone: cleanPhone,
      selectedService,
      serviceRate,
    });
  };

  const days = (() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDay.getDay();
    const daysArray = [];
    for (let i = 0; i < startingDayOfWeek; i++) daysArray.push(null);
    for (let i = 1; i <= daysInMonth; i++) daysArray.push(new Date(year, month, i));
    return daysArray;
  })();

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const price = getServiceRate(selectedService);
  const halfHourPrice = price.halfHour;

  // Show pending booking warning
  if (hasPendingBooking && !checkingPending) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-3">Pending Booking Exists</h2>
          <p className="text-gray-400 mb-6">
            You already have a pending or confirmed booking with {partner.first_name}. 
            Please complete or cancel that session before booking another.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Invite to Meet with {partner.first_name}</h2>
            {partner.live_photo_url && (
              <img src={partner.live_photo_url} alt={partner.first_name || 'Partner'} className="w-16 h-16 rounded-full mt-2" />
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          {emailError && <BlockedWordAlert blockedWords={blockedWords} onClose={() => { setEmailError(null); setBlockedWords([]); }} />}
          {phoneError && <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">{phoneError}</div>}

          {/* Service Selection */}
          {allServices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Select Activity</label>
              <div className="flex flex-wrap gap-3">
                {allServices.map(service => {
                  const rates = getServiceRate(service);
                  return (
                    <button
                      key={service}
                      onClick={() => setSelectedService(service)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedService === service
                          ? 'bg-red-600 text-white'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {service} (${rates.hourly}/hr, ${rates.halfHour}/30min)
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3"><Calendar className="w-4 h-4 inline mr-1" /> Select Date</label>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:bg-white/10 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
                <span className="font-semibold">{monthName}</span>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:bg-white/10 rounded-full"><ChevronRight className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day} className="text-xs text-gray-500 font-medium py-2">{day}</div>)}
                {days.map((day, idx) => {
                  const isSelectable = day && day >= new Date(new Date().setHours(0, 0, 0, 0));
                  return (
                    <button
                      key={idx}
                      disabled={!day || !isSelectable}
                      onClick={() => day && handleDateClick(day)}
                      className={`aspect-square rounded-lg text-sm transition-all ${
                        !day ? 'invisible' : ''
                      } ${
                        !isSelectable ? 'text-gray-600 cursor-not-allowed' : 'hover:bg-white/10'
                      } ${selectedDate?.toDateString() === day?.toDateString() ? 'bg-red-500 font-bold' : ''}`}
                    >
                      {day?.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time Block Selection */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3"><Clock className="w-4 h-4 inline mr-1" /> Select Time Block</label>
              {loadingBlocks ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                </div>
              ) : availableTimeBlocks.length === 0 ? (
                <div className="bg-white/5 rounded-xl p-6 text-center">
                  <p className="text-gray-400">No available time slots on this date.</p>
                  <p className="text-sm text-gray-500 mt-1">Please select another date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {availableTimeBlocks.map((block, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTimeBlock(block)}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        selectedTimeBlock === block
                          ? 'border-red-500 bg-red-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-white">
                            {formatTimeDisplay(block.start)} - {formatTimeDisplay(block.end)}
                          </span>
                          <p className="text-sm text-gray-400 mt-1">
                            Duration: {block.duration} minutes
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-red-500 font-bold">
                            ${block.duration === 30 ? price.halfHour : price.hourly * (block.duration / 60)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact Info */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Contact Email</label>
            <input type="email" placeholder="your.email@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3"><Phone className="w-4 h-4 inline mr-1" /> Cell Phone Number</label>
            <input type="tel" placeholder="5551234567" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
          </div>

          {/* Location Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3"><MapPin className="w-4 h-4 inline mr-1" /> Session Location</label>
            {serviceAreas.length === 0 ? <p className="text-sm text-red-400">This partner hasn't added any service areas yet.</p> : (
              <select value={selectedLocationIndex ?? ''} onChange={(e) => setSelectedLocationIndex(Number(e.target.value))} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors">
                <option value="" disabled>Select a location</option>
                {serviceAreas.map((area, idx) => <option key={idx} value={idx}>{area.name}</option>)}
              </select>
            )}
          </div>

          {/* Notices */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-300">
              <p className="font-medium">Cancellation Policy</p>
              <p>You can cancel or modify your booking from your profile page. If you cancel less than {partner.cancellation_window || 24} hours before the session, the full amount will be charged.</p>
            </div>
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-400 text-center">⚠️ Public locations only. Private residences, hotels, Airbnbs, home gyms, and any non-public venues are strictly prohibited.</p>
          </div>

          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400 text-center">⚠️ WARNING: All payments must be made through Adonix Fit. Never send money via external payment apps.</p>
          </div>

          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-xs text-purple-300 text-center">👥 Two-person only: Sessions are limited to you and your partner. No friends, family, or spectators permitted.</p>
          </div>

          <button 
            onClick={handleProceed} 
            disabled={serviceAreas.length === 0 || !selectedService || !selectedTimeBlock || !selectedDate || hasPendingBooking} 
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold transition-all"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}