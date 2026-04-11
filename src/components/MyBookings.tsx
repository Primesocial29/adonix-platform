import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

interface Booking {
  id: string;
  booking_date: string;
  status: string;
  partner_id: string;
  partner?: {
    first_name: string;
    live_photo_url: string;
  };
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          status,
          partner_id,
          partner:profiles!bookings_partner_id_fkey (
            first_name,
            live_photo_url
          )
        `)
        .eq('client_id', user?.id)
        .order('booking_date', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300';
      case 'confirmed': return 'bg-green-500/20 text-green-300';
      case 'completed': return 'bg-blue-500/20 text-blue-300';
      case 'cancelled': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">My Meetups</h2>
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No meetups yet.</p>
          <p className="text-sm text-gray-500">Browse fitness partners and invite one to meet!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">My Meetups</h2>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {booking.partner?.live_photo_url ? (
                  <img 
                    src={booking.partner.live_photo_url} 
                    alt={booking.partner.first_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-red-500" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{booking.partner?.first_name || 'Partner'}</p>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(booking.booking_date).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}