import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookingDetails } from './BookingFlow';
import { X, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { validateText } from '../lib/textSanitizer';
import BlockedWordAlert from './BlockedWordAlert';
import { useAuth } from '../contexts/AuthContext';

interface CheckoutScreenProps {
  bookingDetails: BookingDetails;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckoutScreen({ bookingDetails, onClose, onSuccess }: CheckoutScreenProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string | null>(null);

  const { partner, date, duration, locationName, locationLat, locationLng, contactEmail, contactPhone, selectedService, serviceRate } = bookingDetails;

  const hourlyRate = serviceRate || partner.hourly_rate || 0;
  const hours = duration / 60;
  const subtotal = hourlyRate * hours;
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
      const isoDate = date.toISOString();

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
        selected_service: selectedService,
        booking_date: isoDate,
        session_date: isoDate,
        session_duration: duration,
        location_name: locationName,
        location_lat: locationLat,
        location_lng: locationLng,
        partner_rate: hourlyRate,
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

      console.log(`Booking created for ${contactEmail} with ${partner.first_name}`);
      onSuccess();
    } catch (err) {
      console.error('Booking creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-lg w-full">
        <div className="border-b border-white/10 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-6">
          {emailError && <BlockedWordAlert blockedWords={blockedWords} onClose={() => { setEmailError(null); setBlockedWords([]); }} />}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-lg">Session Details</h3>
            <div className="text-sm space-y-2 text-gray-300">
              <p><span className="text-gray-400">Partner:</span> {partner.first_name}</p>
              <p><span className="text-gray-400">Service:</span> {selectedService}</p>
              <p><span className="text-gray-400">Date:</span> {date.toLocaleDateString()} at {bookingDetails.time}</p>
              <p><span className="text-gray-400">Duration:</span> {duration} minutes</p>
              <p><span className="text-gray-400">Location:</span> {locationName}</p>
              <p><span className="text-gray-400">Email:</span> {contactEmail}</p>
              <p><span className="text-gray-400">Phone:</span> {contactPhone}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-3"><DollarSign className="w-5 h-5 text-red-500" /><h3 className="font-semibold text-lg">Price Breakdown</h3></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300"><span>Session Rate ({hours}h × ${hourlyRate}/hr)</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="border-t border-white/10 pt-2 space-y-2">
                <div className="flex justify-between text-gray-400 text-xs"><span>Partner receives (85%)</span><span className="text-green-400 font-medium">${partnerPayout.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-400 text-xs"><span>Platform fee (15%)</span><span>${platformFee.toFixed(2)}</span></div>
              </div>
              <div className="border-t border-white/10 pt-2"><div className="flex justify-between text-gray-300"><span>Intent Fee (Non-refundable)</span><span>${intentFee.toFixed(2)}</span></div></div>
              <div className="border-t border-red-500/30 pt-3 mt-3"><div className="flex justify-between text-xl font-bold"><span>Total</span><span className="text-red-500">${totalAmount.toFixed(2)}</span></div></div>
            </div>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200"><p className="font-medium mb-1">Safety First</p><p className="text-xs text-blue-300">You'll need to check in via GPS within 200m of the session location. Residential addresses are blocked for your safety.</p></div>
          </div>
          {error && <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" /><p className="text-sm text-red-300">{error}</p></div>}
          <button onClick={handleConfirmBooking} disabled={loading} className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 rounded-full font-semibold transition-all transform hover:scale-105">{loading ? 'Processing...' : `Confirm Booking - $${totalAmount.toFixed(2)}`}</button>
          <p className="text-xs text-gray-500 text-center">The $1.00 intent fee is non-refundable and helps prevent no-shows.</p>
        </div>
      </div>
    </div>
  );
}