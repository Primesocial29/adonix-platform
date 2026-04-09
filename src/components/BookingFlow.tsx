import { useState, useEffect } from 'react';
import { Profile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { X, Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Phone, Info } from 'lucide-react';
import { validateText } from '../lib/textSanitizer';
import BlockedWordAlert from './BlockedWordAlert';

interface BookingFlowProps {
  partner: Profile;
  onClose: () => void;
  onProceedToCheckout: (bookingDetails: BookingDetails) => void;
}

export interface BookingDetails {
  partner: Profile;
  date: Date;
  time: string;
  duration: number;
  locationName: string;
  locationLat: number;
  locationLng: number;
  contactEmail: string;
  contactPhone: string;
  selectedService: string;
  serviceRate: number;
}

export default function BookingFlow({ partner, onClose, onProceedToCheckout }: BookingFlowProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState<number | null>(null);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [availableDaysMap, setAvailableDaysMap] = useState<Record<string, string[]>>({});

  const allServices = [...(partner.service_types || []), ...(partner.custom_service_types || [])];
  const serviceRates = partner.service_rates || {};

  const getServiceRate = (service: string) => {
    const rate = serviceRates[service];
    if (rate) return { hourly: rate.hourly, halfHour: rate.halfHour };
    const defaultHourly = partner.hourly_rate || 50;
    return { hourly: defaultHourly, halfHour: Math.floor(defaultHourly / 2) };
  };

  const getPriceForDuration = () => {
    if (!selectedService) return 0;
    const rate = getServiceRate(selectedService);
    const hours = duration / 60;
    return rate.hourly * hours;
  };

  const getHalfHourPrice = () => {
    if (!selectedService) return 0;
    return getServiceRate(selectedService).halfHour;
  };

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ];

  const serviceAreas = partner.service_areas || [];

  const getAvailableTimesForDate = async (date: Date) => {
    if (!partner.availability) return [];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = partner.availability.find((d: any) => d.day === dayName);
    let times = daySchedule ? daySchedule.times : [];
    // Fetch already booked times for this date
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
    const bookedTimes = (bookedData || []).map(b => new Date(b.booking_date).toTimeString().slice(0, 5));
    times = times.filter(time => !bookedTimes.includes(time));
    return times;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const isDateAvailable = async (date: Date) => {
    const times = await getAvailableTimesForDate(date);
    return times.length > 0;
  };

  const handleDateClick = async (day: Date) => {
    const available = await isDateAvailable(day);
    if (!available) return;
    setSelectedDate(day);
    setSelectedTime('');
  };

  const handleProceed = async () => {
    setEmailError(null);
    setPhoneError(null);
    setBlockedWords([]);
    if (!selectedDate || !selectedTime || selectedLocationIndex === null || !contactEmail || !contactPhone || !selectedService) {
      alert('Please fill in all fields');
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
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const sessionDate = new Date(selectedDate);
    sessionDate.setHours(hours, minutes, 0, 0);
    const location = serviceAreas[selectedLocationIndex];
    const rate = getServiceRate(selectedService);
    // For half‑hour sessions, use halfHour rate; otherwise hourly rate
    const serviceRate = duration === 30 ? rate.halfHour : rate.hourly;
    onProceedToCheckout({
      partner,
      date: sessionDate,
      time: selectedTime,
      duration,
      locationName: location.name,
      locationLat: location.lat || 0,
      locationLng: location.lng || 0,
      contactEmail,
      contactPhone: cleanPhone,
      selectedService,
      serviceRate,
    });
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const price = getPriceForDuration();
  const halfHourPrice = getHalfHourPrice();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Book Session with {partner.first_name}</h2>
            {partner.live_photo_url && (
              <img src={partner.live_photo_url} alt={partner.first_name || 'Partner'} className="w-16 h-16 rounded-full mt-2" />
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-6">
          {emailError && <BlockedWordAlert blockedWords={blockedWords} onClose={() => { setEmailError(null); setBlockedWords([]); }} />}
          {phoneError && <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">{phoneError}</div>}

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
                  const isAvailable = day ? isDateAvailable(day) : false;
                  return (
                    <button
                      key={idx}
                      disabled={!day || !isAvailable}
                      onClick={() => day && handleDateClick(day)}
                      className={`aspect-square rounded-lg text-sm transition-all ${
                        !day ? 'invisible' : ''
                      } ${
                        !isAvailable ? 'text-gray-600 cursor-not-allowed' : 'hover:bg-white/10'
                      } ${selectedDate?.toDateString() === day?.toDateString() ? 'bg-red-500 font-bold' : ''}`}
                    >
                      {day?.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3"><Clock className="w-4 h-4 inline mr-1" /> Select Time</label>
            {selectedDate ? (
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${selectedTime === time ? 'bg-red-500' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Please select a date first.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Duration</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors">
              <option value={30}>30 minutes (${halfHourPrice})</option>
              <option value={60}>1 hour (${halfHourPrice * 2})</option>
              <option value={90}>1.5 hours (${halfHourPrice * 3})</option>
              <option value={120}>2 hours (${halfHourPrice * 4})</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Contact Email</label>
            <input type="email" placeholder="your.email@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3"><Phone className="w-4 h-4 inline mr-1" /> Cell Phone Number</label>
            <input type="tel" placeholder="5551234567" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3"><MapPin className="w-4 h-4 inline mr-1" /> Session Location</label>
            {serviceAreas.length === 0 ? <p className="text-sm text-red-400">This partner hasn't added any service areas yet.</p> : (
              <select value={selectedLocationIndex ?? ''} onChange={(e) => setSelectedLocationIndex(Number(e.target.value))} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors">
                <option value="" disabled>Select a location</option>
                {serviceAreas.map((area, idx) => <option key={idx} value={idx}>{area.name}</option>)}
              </select>
            )}
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-300">
              <p className="font-medium">Cancellation Policy</p>
              <p>You can cancel or modify your booking from your profile page. If you cancel less than {partner.cancellation_window || 24} hours before the session, the full amount will be charged.</p>
              <a href="/profile" className="text-white underline mt-1 inline-block">Go to my profile →</a>
            </div>
          </div>

          {/* NEW: Public Locations Notice */}{/* NEW: No External Payment Apps Warning */}
<div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
  <p className="text-xs text-red-400 text-center">
    ⚠️ WARNING: All payments must be made through Adonix Fit. 
    Never send money via Venmo, CashApp, PayPal, Zelle, or any other external payment app. 
    Users who request external payments will be permanently banned.
  </p>
</div>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-400 text-center">
              ⚠️ Public locations only. Private residences, hotels, Airbnbs, home gyms, and any non-public venues are strictly prohibited. 
              Violations result in account suspension or permanent ban.
            </p>
          </div>

          <button 
            onClick={handleProceed} 
            disabled={serviceAreas.length === 0 || !selectedService} 
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold transition-all"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}