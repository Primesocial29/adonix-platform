import { useEffect, useState } from 'react';
import { supabase, Booking, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SessionCheckIn from './SessionCheckIn';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<(Booking & { partner?: Profile; client?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .or(`client_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('session_date', { ascending: true });

      if (error) throw error;

      const bookingsWithProfiles = await Promise.all(
        (data || []).map(async (booking) => {
          const isClient = booking.client_id === user.id;
          const otherUserId = isClient ? booking.partner_id : booking.client_id;

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .maybeSingle();

          return {
            ...booking,
            [isClient ? 'partner' : 'client']: profile,
          };
        })
      );

      setBookings(bookingsWithProfiles);
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20">
        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">No Bookings Yet</h3>
        <p className="text-gray-400">Book a session with a fitness partner to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {bookings.map((booking) => {
        const isClient = booking.client_id === user?.id;
        const otherPerson = isClient ? booking.partner : booking.client;
        const sessionDate = new Date(booking.session_date);
        const isPast = sessionDate < new Date();
        const isUpcoming = !isPast;

        return (
          <div
            key={booking.id}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-red-500" />
                    <h3 className="text-xl font-bold">
                      {isClient ? 'Session with' : 'Session for'} {otherPerson?.display_name}
                    </h3>
                  </div>
                  <div className="space-y-1 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {sessionDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {sessionDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      ({booking.session_duration} min)
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {booking.location_name}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-red-500">
                    ${booking.total_amount.toFixed(2)}
                  </div>
                  <div
                    className={`
                    inline-block px-3 py-1 rounded-full text-xs font-medium mt-2
                    ${booking.status === 'completed' ? 'bg-green-500/20 text-green-300' : ''}
                    ${booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300' : ''}
                    ${booking.status === 'checked_in' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                    ${booking.status === 'cancelled' ? 'bg-red-500/20 text-red-300' : ''}
                  `}
                  >
                    {booking.status}
                  </div>
                </div>
              </div>

              {isUpcoming && booking.status === 'confirmed' && (
                <SessionCheckIn booking={booking} onCheckInComplete={loadBookings} />
              )}

              {isClient && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Session Rate</span>
                      <span>${(booking.total_amount - booking.intent_fee).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Intent Fee</span>
                      <span>${booking.intent_fee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-1 mt-1 flex justify-between font-medium text-white">
                      <span>Total Paid</span>
                      <span>${booking.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {!isClient && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <div className="text-xs text-green-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Session Total</span>
                      <span>${(booking.total_amount - booking.intent_fee).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee (15%)</span>
                      <span>-${booking.platform_fee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-green-500/30 pt-1 mt-1 flex justify-between font-medium text-green-200">
                      <span>Your Earnings (85%)</span>
                      <span>${booking.partner_payout.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
