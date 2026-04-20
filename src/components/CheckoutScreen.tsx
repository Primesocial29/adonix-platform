import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { validateText } from '../lib/textSanitizer';
import BlockedWordAlert from './BlockedWordAlert';
import { useAuth } from '../contexts/AuthContext';

interface CheckoutScreenProps {
  // Data from PartnerProfileView.tsx
  partner: any;
  selectedActivity: string;
  selectedDuration: number; // in minutes (30, 60, 90, 120)
  selectedDate: string; // ISO date string
  selectedTimeSlot: {
    startTime: string;
    endTime: string;
    durationHours: number;
    durationMinutes: number;
  };
  selectedLocation: string;
  locationLat?: number;
  locationLng?: number;
  contactEmail: string;
  contactPhone: string;
  totalContribution: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckoutScreen({ 
  partner,
  selectedActivity,
  selectedDuration,
  selectedDate,
  selectedTimeSlot,
  selectedLocation,
  locationLat,
  locationLng,
  contactEmail,
  contactPhone,
  totalContribution,
  onClose,
  onSuccess
}: CheckoutScreenProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Get partner's username (never real name)
  const partnerUsername = (partner as any).username || partner.first_name?.toLowerCase().replace(/\s/g, '_') || 'partner';

  const hours = selectedDuration / 60;
  const subtotal = totalContribution;
  const platformFeePercent = 0.15;
  const platformFee = subtotal * platformFeePercent;
  const partnerPayout = subtotal - platformFee;
  const intentFee = 1.00;
  const totalAmount = subtotal + intentFee;

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError('');
    setEmailError(null);
    setBlockedWords([]);

    const emailValidation = await validateText(contactEmail, 'email address');
    if (!emailValidation.isValid) {
      setBlockedWords(emailValidation.blockedWords);
      setEmailError(emailValidation.error || 'Your email contains blocked words');
      setLoading(false);
      return;
    }

    try {
      const clientId = user?.id || null;
      
      // Combine date and time
      const bookingDateTime = new Date(selectedDate);
      const [startHour, startMinute] = selectedTimeSlot.startTime.split(':').map(Number);
      bookingDateTime.setHours(startHour, startMinute, 0, 0);
      const isoDate = bookingDateTime.toISOString();

      // Check for existing confirmed booking at the same time
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('partner_id', partner.id)
        .eq('booking_date', isoDate)
        .eq('status', 'confirmed');

      if (checkError) throw checkError;
      if (existingBookings && existingBookings.length > 0) {
        throw new Error('This time slot is already booked. Please choose another time.');
      }

      const bookingData = {
        client_id: clientId,
        partner_id: partner.id,
        contact_email: contactEmail,
        client_phone: contactPhone,
        selected_service: selectedActivity,
        contribution_type: 'community_support',
        booking_date: isoDate,
        session_date: isoDate,
        session_duration: selectedDuration,
        location_name: selectedLocation,
        location_lat: locationLat || null,
        location_lng: locationLng || null,
        partner_rate: totalContribution / hours,
        partner_payout: partnerPayout,
        platform_fee: platformFee,
        intent_fee: intentFee,
        total_amount: totalAmount,
        status: 'pending',
      };

      console.log('Inserting booking:', bookingData);

      const { error: bookingError } = await supabase.from('bookings').insert(bookingData);

      if (bookingError) {
        console.error('Supabase insert error:', bookingError);
        throw bookingError;
      }

      console.log(`Booking created for ${contactEmail} with @${partnerUsername}`);
      onSuccess();
    } catch (err) {
      console.error('Booking creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTimeDisplay = (time: string) => {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minute} ${period}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes === 30) return '30 minutes';
    if (minutes === 60) return '1 hour';
    if (minutes === 90) return '1.5 hours';
    return '2 hours';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-lg w-full my-8">
        <div className="border-b border-white/10 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          {emailError && <BlockedWordAlert blockedWords={blockedWords} onClose={() => { setEmailError(null); setBlockedWords([]); }} />}
          
          {/* Meetup Details */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-lg">Meetup Details</h3>
            <div className="text-sm space-y-2 text-gray-300">
              <p><span className="text-gray-400">Partner:</span> @{partnerUsername}</p>
              <p><span className="text-gray-400">Activity:</span> {selectedActivity}</p>
              <p><span className="text-gray-400">Date:</span> {formatDateDisplay(selectedDate)}</p>
              <p><span className="text-gray-400">Time:</span> {formatTimeDisplay(selectedTimeSlot.startTime)} - {formatTimeDisplay(selectedTimeSlot.endTime)}</p>
              <p><span className="text-gray-400">Duration:</span> {formatDuration(selectedDuration)}</p>
              <p><span className="text-gray-400">Location:</span> {selectedLocation}</p>
              <p><span className="text-gray-400">Email:</span> {contactEmail}</p>
              <p><span className="text-gray-400">Phone:</span> {contactPhone}</p>
            </div>
          </div>
          
          {/* Price Breakdown */}
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-3"><DollarSign className="w-5 h-5 text-red-500" /><h3 className="font-semibold text-lg">Price Breakdown</h3></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300"><span>Suggested Contribution ({hours}h)</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="border-t border-white/10 pt-2 space-y-2">
                <div className="flex justify-between text-gray-400 text-xs"><span>Partner receives (85%)</span><span className="text-green-400 font-medium">${partnerPayout.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-400 text-xs"><span>Platform Support (15%)</span><span>${platformFee.toFixed(2)}</span></div>
              </div>
              <div className="border-t border-white/10 pt-2"><div className="flex justify-between text-gray-300"><span>Intent Fee (Non-refundable)</span><span>${intentFee.toFixed(2)}</span></div></div>
              <div className="border-t border-red-500/30 pt-3 mt-3"><div className="flex justify-between text-xl font-bold"><span>Total</span><span className="text-red-500">${totalAmount.toFixed(2)}</span></div></div>
            </div>
          </div>
          
          {/* Safety Notice */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200"><p className="font-medium mb-1">Safety First</p><p className="text-xs text-blue-300">You'll need to check in via GPS within 200m of the meetup location. Residential addresses are blocked for your safety.</p></div>
          </div>
          
          {error && <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" /><p className="text-sm text-red-300">{error}</p></div>}
          
          <button onClick={handleConfirmBooking} disabled={loading} className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 rounded-full font-semibold transition-all transform hover:scale-105">
            {loading ? 'Processing...' : `Confirm & Support - $${totalAmount.toFixed(2)}`}
          </button>
          
          <p className="text-xs text-gray-500 text-center">The $1.00 intent fee is non-refundable and helps prevent no-shows.</p>
        </div>
      </div>
    </div>
  );
}