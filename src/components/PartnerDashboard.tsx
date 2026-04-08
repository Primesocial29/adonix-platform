import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Check, X, User, MapPin, Clock, AlertCircle } from 'lucide-react';
import GpsConsentModal from './GpsConsentModal';
import DeclineModal from './DeclineModal';
import PartnerSessionManager from './PartnerSessionManager';

interface Booking {
  id: string;
  contact_email: string;
  booking_date: string;
  status: string;
  client_id: string;
  location_lat: number;
  location_lng: number;
  session_started_at: string | null;
  session_ended_at: string | null;
  check_in_verified: boolean;
  client_profile?: {
    first_name: string;
    fitness_goals: string;
    photos: string[];
  };
  duration_seconds?: number;
}

export default function PartnerDashboard() {
  const { user, isPartner, loading: authLoading, refreshProfile } = useAuth();
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ booking: Booking; type: 'checkin' | 'checkout' } | null>(null);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineBookingId, setDeclineBookingId] = useState<string | null>(null);
  const [declineClientId, setDeclineClientId] = useState<string | null>(null);
  const [activeCheckinBooking, setActiveCheckinBooking] = useState<Booking | null>(null);

  // Role guard - redirect if not a partner
  if (!authLoading && !isPartner) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">You don't have access to this page.</p>
          <a href="/" className="text-red-500 hover:underline">Return to Home</a>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (user && isPartner) {
      fetchBookings();
    }
  }, [user, isPartner]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', user?.id);

      if (bookingsError) throw bookingsError;

      const enriched = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('first_name, fitness_goals, photos')
            .eq('id', booking.client_id)
            .single();
          return {
            ...booking,
            client_profile: clientProfile || { first_name: 'Unknown', fitness_goals: '', photos: [] }
          };
        })
      );

      setPendingBookings(enriched.filter(b => b.status === 'pending'));
      setUpcomingBookings(enriched.filter(b => b.status === 'confirmed' && !b.session_ended_at));
      setPastBookings(enriched.filter(b => b.status === 'completed' || b.session_ended_at));
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setActionLoading(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
      if (error) throw error;
      await fetchBookings();
    } catch (err) {
      console.error('Error updating booking:', err);
      alert('Failed to update booking. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineClick = (bookingId: string, clientId: string) => {
    setDeclineBookingId(bookingId);
    setDeclineClientId(clientId);
    setDeclineModalOpen(true);
  };

  const onConsentGiven = async () => {
    await refreshProfile();
  };

  if (!user || !isPartner) {
    return null;
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (activeCheckinBooking) {
    const durationSeconds = activeCheckinBooking.duration_seconds || 3600;
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setActiveCheckinBooking(null)}
            className="mb-4 text-blue-400 underline hover:text-blue-300"
          >
            ← Back to dashboard
          </button>
          <PartnerSessionManager
            bookingId={activeCheckinBooking.id}
            partnerId={user.id}
            clientId={activeCheckinBooking.client_id}
            bookedDurationSeconds={durationSeconds}
            onSessionComplete={() => {
              setActiveCheckinBooking(null);
              fetchBookings();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Partner Dashboard</h1>
        <p className="text-gray-400 mb-8">Manage your sessions and check in/out</p>

        {gpsError && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-300">{gpsError}</p>
          </div>
        )}

        {pendingBookings.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
            <div className="space-y-4">
              {pendingBookings.map(booking => (
                <div key={booking.id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Client: {booking.client_profile?.first_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-400">Requested: {new Date(booking.booking_date).toLocaleString()}</p>
                      {booking.client_profile?.fitness_goals && (
                        <p className="text-sm text-gray-300 mt-1">Goals: {booking.client_profile.fitness_goals}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        disabled={actionLoading === booking.id}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeclineClick(booking.id, booking.client_id)}
                        disabled={actionLoading === booking.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {upcomingBookings.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-4 mt-6">Upcoming Sessions</h2>
            <div className="space-y-6">
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{booking.client_profile?.first_name || 'Client'}</h3>
                          <p className="text-sm text-gray-400">
                            Session: {new Date(booking.booking_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {booking.client_profile?.fitness_goals && (
                        <div className="mb-4 p-3 bg-white/5 rounded-lg">
                          <p className="text-sm text-gray-300">
                            <span className="font-medium text-white">Fitness Goals:</span><br />
                            {booking.client_profile.fitness_goals}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => setActiveCheckinBooking(booking)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          Setup GPS Check‑in (QR)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {pastBookings.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-4 mt-6">Past Sessions</h2>
            <div className="space-y-6">
              {pastBookings.map(booking => (
                <div key={booking.id} className="bg-gray-900/50 border border-white/10 rounded-xl p-6 opacity-75">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{booking.client_profile?.first_name || 'Client'}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(booking.booking_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Status: {booking.status}
                    {booking.session_ended_at && ` • Completed at ${new Date(booking.session_ended_at).toLocaleTimeString()}`}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {pendingBookings.length === 0 && upcomingBookings.length === 0 && pastBookings.length === 0 && (
          <div className="bg-gray-900/50 border border-white/10 rounded-xl p-8 text-center">
            <p className="text-gray-400">No sessions found.</p>
          </div>
        )}
      </div>

      <GpsConsentModal
        isOpen={showGpsModal}
        onClose={() => {
          setShowGpsModal(false);
          setPendingAction(null);
        }}
        onConsentGiven={onConsentGiven}
      />

      {declineModalOpen && declineBookingId && declineClientId && (
        <DeclineModal
          isOpen={declineModalOpen}
          onClose={() => setDeclineModalOpen(false)}
          bookingId={declineBookingId}
          clientId={declineClientId}
          onDeclined={fetchBookings}
        />
      )}
    </div>
  );
}