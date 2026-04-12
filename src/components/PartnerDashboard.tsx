import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  User, MapPin, AlertCircle, Images, CalendarDays, DollarSign,
  Settings, Bell, ChevronRight, Star, ShieldCheck, Clock, Flag,
  Ban, CheckCircle, X, Loader2
} from 'lucide-react';
import GpsConsentModal from './GpsConsentModal';
import DeclineModal from './DeclineModal';
import PartnerSessionManager from './PartnerSessionManager';
import ProfileGallery from './ProfileGallery';

interface Booking {
  id: string;
  contact_email: string;
  booking_date: string;
  status: string;
  client_id: string;
  partner_id: string;
  location_lat: number;
  location_lng: number;
  session_started_at: string | null;
  session_ended_at: string | null;
  check_in_verified: boolean;
  duration_seconds?: number;
  activity_type?: string;
  location_name?: string;
  client_profile?: ClientProfile | null;
}

interface ClientProfile {
  id: string;
  first_name: string | null;
  live_photo_url: string | null;
  bio: string | null;
  fitness_goals: string | null;
  created_at: string;
  cancellation_count: number | null;
}

type Tab = 'gallery' | 'requests' | 'upcoming' | 'earnings';

function ClientProfileModal({
  booking,
  onClose,
  onAccept,
  onDecline,
  actionLoading,
}: {
  booking: Booking;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  actionLoading: boolean;
}) {
  const client = booking.client_profile;
  const joinDate = client?.created_at
    ? new Date(client.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';
  const cancellations = client?.cancellation_count ?? 0;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Review Before Accepting</p>
            <h2 className="text-lg font-bold text-white">Client Profile</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-xs text-blue-300 leading-relaxed">
              Review this client's profile before accepting this meetup invitation. This is a social fitness meetup, not a professional service. Trust your instincts. Meet only in public locations.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 shrink-0">
              {client?.live_photo_url ? (
                <img src={client.live_photo_url} alt={client.first_name ?? 'Client'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{client?.first_name ?? 'Client'}</h3>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                Member since {joinDate}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">ID on File</span>
              </div>
            </div>
          </div>

          {cancellations >= 3 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">
                This client has canceled {cancellations} time{cancellations !== 1 ? 's' : ''} in the past 30 days.
              </p>
            </div>
          )}

          {client?.bio && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">About</p>
              <p className="text-sm text-gray-200 leading-relaxed">{client.bio}</p>
            </div>
          )}

          {client?.fitness_goals && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fitness Goals</p>
              <p className="text-sm text-gray-200">{client.fitness_goals}</p>
            </div>
          )}

          <div className="pt-1 border-t border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Meetup Details</p>
            <div className="space-y-1 text-sm text-gray-300">
              <p>
                <span className="text-gray-500">Date: </span>
                {new Date(booking.booking_date).toLocaleString()}
              </p>
              {booking.activity_type && (
                <p><span className="text-gray-500">Activity: </span>{booking.activity_type}</p>
              )}
              {booking.location_name && (
                <p><span className="text-gray-500">Location: </span>{booking.location_name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-white/10 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={onDecline}
              disabled={actionLoading}
              className="flex-1 py-3 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 font-semibold transition-colors text-sm"
            >
              Decline Request
            </button>
            <button
              onClick={onAccept}
              disabled={actionLoading}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors text-sm flex items-center justify-center gap-2"
            >
              {actionLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle className="w-4 h-4" />
              }
              Accept Request
            </button>
          </div>
          <div className="flex justify-center gap-6">
            <button className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
              <Flag className="w-3 h-3" /> Report Client
            </button>
            <button className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
              <Ban className="w-3 h-3" /> Block Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnerDashboard() {
  const { user, loading: authLoading, refreshProfile, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('gallery');
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineBookingId, setDeclineBookingId] = useState<string | null>(null);
  const [declineClientId, setDeclineClientId] = useState<string | null>(null);
  const [activeCheckinBooking, setActiveCheckinBooking] = useState<Booking | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [primaryPhoto, setPrimaryPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setGalleryPhotos((profile as any).profile_photos ?? []);
      setPrimaryPhoto(profile.live_photo_url ?? null);
    }
  }, [profile]);

  useEffect(() => {
    if (user) fetchBookings();
    else setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => { if (loading) setLoading(false); }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchBookings = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', user.id)
        .order('booking_date', { ascending: true });

      if (error) { setLoading(false); return; }

      const clientIds = [...new Set((bookingsData ?? []).map(b => b.client_id).filter(Boolean))];
      let clientMap: Record<string, ClientProfile> = {};

      if (clientIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, live_photo_url, bio, fitness_goals, created_at, cancellation_count')
          .in('id', clientIds);
        if (profiles) {
          profiles.forEach(p => { clientMap[p.id] = p; });
        }
      }

      const enriched = (bookingsData ?? []).map(b => ({
        ...b,
        client_profile: clientMap[b.client_id] ?? null,
      }));

      setPendingBookings(enriched.filter(b => b.status === 'pending'));
      setUpcomingBookings(enriched.filter(b => b.status === 'confirmed' && !b.session_ended_at));
      setPastBookings(enriched.filter(b => b.status === 'completed' || b.session_ended_at));
    } catch (err) {
      console.error('fetchBookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (booking: Booking) => {
    setActionLoading(booking.id);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);
      if (error) throw error;
      setReviewingBooking(null);
      await fetchBookings();
    } catch {
      alert('Failed to accept. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineFromModal = (booking: Booking) => {
    setReviewingBooking(null);
    setDeclineBookingId(booking.id);
    setDeclineClientId(booking.client_id);
    setDeclineModalOpen(true);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'gallery', label: 'Gallery', icon: <Images className="w-4 h-4" /> },
    { id: 'requests', label: 'Requests', icon: <Bell className="w-4 h-4" />, badge: pendingBookings.length },
    { id: 'upcoming', label: 'My Meetups', icon: <CalendarDays className="w-4 h-4" />, badge: upcomingBookings.length },
    { id: 'earnings', label: 'Earnings', icon: <DollarSign className="w-4 h-4" /> },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center gap-4">
        <div className="space-y-3 w-full max-w-sm px-6">
          <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (activeCheckinBooking) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setActiveCheckinBooking(null)}
            className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <PartnerSessionManager
            bookingId={activeCheckinBooking.id}
            partnerId={user.id}
            clientId={activeCheckinBooking.client_id}
            bookedDurationSeconds={activeCheckinBooking.duration_seconds || 3600}
            onSessionComplete={() => { setActiveCheckinBooking(null); fetchBookings(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black/95 backdrop-blur-md border-b border-white/10 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img
              src="/Screenshot_2026-04-03_221406.png"
              alt="Adonix Fit"
              className="h-8 w-auto object-contain"
            />
          </a>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">Partner Dashboard</span>
            <a
              href="/settings"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-gray-400" />
            </a>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-red-500/20 border border-white/20">
              {primaryPhoto
                ? <img src={primaryPhoto} alt="Profile" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-red-400" /></div>
              }
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 flex gap-1 pb-3 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-0.5 bg-white text-red-600 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Profile Gallery</h2>
              <p className="text-sm text-gray-400">Showcase yourself. Up to 6 live photos.</p>
            </div>

            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <ProfileGallery
                userId={user.id}
                initialPhotos={galleryPhotos}
                primaryPhotoUrl={primaryPhoto}
                onPrimaryChanged={(url) => setPrimaryPhoto(url)}
                onPhotosChanged={(photos) => setGalleryPhotos(photos)}
              />
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-sm font-semibold text-white mb-3">Profile Preview</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 shrink-0 border border-white/10">
                  {primaryPhoto
                    ? <img src={primaryPhoto} alt="Primary" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-gray-600" /></div>
                  }
                </div>
                <div>
                  <p className="font-semibold text-white">{profile?.first_name ?? 'Your Name'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {profile?.service_types?.slice(0, 2).join(' · ') ?? 'No activities set yet'}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-400">New Partner</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Incoming Requests</h2>
              <p className="text-sm text-gray-400">Review each client before accepting.</p>
            </div>

            {pendingBookings.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
                <Bell className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No pending requests</p>
                <p className="text-sm text-gray-600 mt-1">New meetup requests will appear here</p>
              </div>
            ) : (
              pendingBookings.map(booking => (
                <button
                  key={booking.id}
                  onClick={() => setReviewingBooking(booking)}
                  className="w-full text-left p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl hover:border-yellow-500/40 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/10">
                        {booking.client_profile?.live_photo_url
                          ? <img src={booking.client_profile.live_photo_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-gray-500" /></div>
                        }
                      </div>
                      <div>
                        <p className="font-semibold text-white">{booking.client_profile?.first_name ?? 'Client'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(booking.booking_date).toLocaleString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit'
                          })}
                        </p>
                        {booking.activity_type && (
                          <p className="text-xs text-yellow-400 mt-0.5">{booking.activity_type}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 group-hover:text-white transition-colors">
                      <span className="text-xs hidden sm:block">Review</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                  {(booking.client_profile?.cancellation_count ?? 0) >= 3 && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-yellow-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {booking.client_profile?.cancellation_count} recent cancellations
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">My Meetups</h2>
              <p className="text-sm text-gray-400">Confirmed and upcoming sessions.</p>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
                <CalendarDays className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No upcoming meetups</p>
                <p className="text-sm text-gray-600 mt-1">Accepted requests will show here</p>
              </div>
            ) : (
              upcomingBookings.map(booking => (
                <div key={booking.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/10">
                      {booking.client_profile?.live_photo_url
                        ? <img src={booking.client_profile.live_photo_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-gray-500" /></div>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{booking.client_profile?.first_name ?? 'Client'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(booking.booking_date).toLocaleString('en-US', {
                          weekday: 'long', month: 'long', day: 'numeric',
                          hour: 'numeric', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full font-medium">
                      Confirmed
                    </span>
                  </div>

                  {booking.activity_type && (
                    <p className="mb-3 text-sm text-gray-300">
                      <span className="text-gray-500">Activity: </span>{booking.activity_type}
                    </p>
                  )}

                  <button
                    onClick={() => setActiveCheckinBooking(booking)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Setup GPS Check-in
                  </button>
                </div>
              ))
            )}

            {pastBookings.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-gray-500 mt-6 mb-2 uppercase tracking-wider">Past Meetups</h3>
                {pastBookings.map(booking => (
                  <div key={booking.id} className="p-4 bg-white/2 border border-white/5 rounded-2xl opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0">
                        {booking.client_profile?.live_photo_url
                          ? <img src={booking.client_profile.live_photo_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-gray-600" /></div>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300">{booking.client_profile?.first_name ?? 'Client'}</p>
                        <p className="text-xs text-gray-500">{new Date(booking.booking_date).toLocaleDateString()}</p>
                      </div>
                      <span className="ml-auto text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full capitalize">
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Earnings</h2>
              <p className="text-sm text-gray-400">Your payout breakdown.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">This Month</p>
                <p className="text-2xl font-bold text-white">$0</p>
                <p className="text-xs text-green-400 mt-1">Net after fees</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Total Meetups</p>
                <p className="text-2xl font-bold text-white">{pastBookings.length}</p>
                <p className="text-xs text-gray-500 mt-1">Completed sessions</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <p className="text-sm font-semibold text-white">Fee Breakdown</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Gross earnings</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Platform Support (15%)</span>
                  <span className="text-red-400">-$0.00</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Processing fee (2.9% + $0.30)</span>
                  <span className="text-red-400">-$0.00</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                  <span className="text-white">Net earnings</span>
                  <span className="text-green-400">$0.00</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-300">
                Adonix Fit uses Stripe for all payments. For payment issues, contact Stripe support directly.
              </p>
            </div>
          </div>
        )}

      </div>

      <GpsConsentModal
        isOpen={showGpsModal}
        onClose={() => setShowGpsModal(false)}
        onConsentGiven={refreshProfile}
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

      {reviewingBooking && (
        <ClientProfileModal
          booking={reviewingBooking}
          onClose={() => setReviewingBooking(null)}
          onAccept={() => handleAccept(reviewingBooking)}
          onDecline={() => handleDeclineFromModal(reviewingBooking)}
          actionLoading={actionLoading === reviewingBooking.id}
        />
      )}
    </div>
  );
}
