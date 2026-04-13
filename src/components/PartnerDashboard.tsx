import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { User, MapPin, AlertCircle, Images, CalendarDays, DollarSign, Settings, Bell, ChevronRight, Star, ShieldCheck, Clock, Flag, Ban, CheckCircle, X, Loader2, CreditCard as Edit2, Camera, TrendingUp, AlertTriangle, Info, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import GpsConsentModal from './GpsConsentModal';
import DeclineModal from './DeclineModal';
import PartnerSessionManager from './PartnerSessionManager';
import ProfileGallery from './ProfileGallery';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  amount?: number;
  change_request_details?: any;
  change_request_expires_at?: string;
  change_request_status?: string;
  client_profile?: ClientProfile | null;
}

interface ClientProfile {
  id: string;
  first_name: string | null;
  username: string | null;
  live_photo_url: string | null;
  bio: string | null;
  fitness_goals: string | null;
  created_at: string;
  cancellation_count: number | null;
  monthly_cancellations: number | null;
  cancellation_rate: number | null;
}

type Tab = 'overview' | 'gallery' | 'requests' | 'meetups' | 'earnings';

// ─── Fee helpers ──────────────────────────────────────────────────────────────

function calcFees(gross: number) {
  const platform = +(gross * 0.15).toFixed(2);
  const stripe = +(gross * 0.029 + 0.3).toFixed(2);
  const net = +(gross - platform - stripe).toFixed(2);
  return { platform, stripe, net };
}

function fmtCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeeBreakdown({ gross, label = 'Suggested Contribution' }: { gross: number; label?: string }) {
  const { platform, stripe, net } = calcFees(gross);
  return (
    <div className="mt-3 p-3 bg-black/40 border border-white/10 rounded-xl text-xs space-y-1.5 font-mono">
      <div className="flex justify-between text-gray-300">
        <span>{label}:</span>
        <span>{fmtCurrency(gross)}</span>
      </div>
      <div className="flex justify-between text-gray-400">
        <span>Platform Support (15%):</span>
        <span className="text-red-400">-{fmtCurrency(platform)}</span>
      </div>
      <div className="flex justify-between text-gray-400">
        <span>Processing Fee (2.9% + $0.30):</span>
        <span className="text-red-400">-{fmtCurrency(stripe)}</span>
      </div>
      <div className="border-t border-white/10 pt-1.5 flex justify-between font-bold text-green-400">
        <span>Your Net Earnings:</span>
        <span>{fmtCurrency(net)}</span>
      </div>
    </div>
  );
}

function SocialMeetupDisclaimer() {
  return (
    <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">
      This is a social fitness meetup, not a professional service. Partners are independent social participants.
    </p>
  );
}

function CancellationWarning({ hours24 }: { hours24: boolean }) {
  if (!hours24) return null;
  return (
    <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-300">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
      <span>By cancelling or requesting changes, you acknowledge that you may forfeit payment if within 24 hours of the meetup.</span>
    </div>
  );
}

// ─── Client Profile Modal ──────────────────────────────────────────────────────

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
  const gross = booking.amount ?? 0;
  const { platform, stripe, net } = calcFees(gross);
  const joinDate = client?.created_at
    ? new Date(client.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';
  const cancellations = client?.cancellation_count ?? 0;
  const monthlyCanx = client?.monthly_cancellations ?? 0;
  const rate = client?.cancellation_rate ?? 0;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-950 border border-white/20 rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">

        <div className="sticky top-0 bg-gray-950/95 backdrop-blur-md p-5 border-b border-white/10 flex items-center justify-between z-10">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Review Before Accepting</p>
            <h2 className="text-lg font-bold text-white">Client Profile</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-xs text-blue-300 leading-relaxed">
              Review this client's profile before accepting this meetup invitation. This is a social fitness meetup, not a professional service. Trust your instincts. Meet only in public locations.
            </p>
          </div>

          {/* Client identity */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 shrink-0">
              {client?.live_photo_url
                ? <img src={client.live_photo_url} alt={client.first_name ?? 'Client'} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-gray-500" /></div>
              }
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{client?.first_name ?? 'Client'}</h3>
              {client?.username && <p className="text-sm text-gray-400">@{client.username}</p>}
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> Member since {joinDate}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">ID on File</span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {(monthlyCanx >= 3 || rate > 0.3) && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-300 space-y-0.5">
                {monthlyCanx >= 3 && <p>This client has canceled {monthlyCanx} time{monthlyCanx !== 1 ? 's' : ''} in the past 30 days.</p>}
                {rate > 0.3 && <p>Cancellation rate: {Math.round(rate * 100)}%</p>}
              </div>
            </div>
          )}

          {/* Bio & Goals */}
          {client?.bio && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">About</p>
              <p className="text-sm text-gray-200 leading-relaxed">{client.bio}</p>
            </div>
          )}
          {client?.fitness_goals && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Fitness Goals</p>
              <p className="text-sm text-gray-200">{client.fitness_goals}</p>
            </div>
          )}

          {/* Meetup details */}
          <div className="border-t border-white/10 pt-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Meetup Details</p>
            <div className="space-y-1 text-sm text-gray-300">
              <p><span className="text-gray-500">Date: </span>{new Date(booking.booking_date).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              {booking.activity_type && <p><span className="text-gray-500">Activity: </span>{booking.activity_type}</p>}
              {booking.location_name && <p><span className="text-gray-500">Location: </span>{booking.location_name}</p>}
            </div>
          </div>

          {/* Financial summary */}
          {gross > 0 && (
            <div className="border-t border-white/10 pt-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Financial Summary</p>
              <div className="p-3 bg-black/40 border border-white/10 rounded-xl text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-gray-300">
                  <span>Client Pays:</span><span>{fmtCurrency(gross)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Platform Support (15%):</span><span className="text-red-400">-{fmtCurrency(platform)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Processing Fee:</span><span className="text-red-400">-{fmtCurrency(stripe)}</span>
                </div>
                <div className="border-t border-white/10 pt-1.5 flex justify-between font-bold text-green-400">
                  <span>You Receive:</span><span>{fmtCurrency(net)}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2 flex items-start gap-1">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                Payment processed securely through Stripe. You'll receive funds within 3-5 business days after the meetup.
              </p>
            </div>
          )}

          <p className="text-[10px] text-gray-600 leading-relaxed border-t border-white/10 pt-4">
            This is a social fitness meetup, not a professional service. Trust your instincts. Meet only in public locations.
          </p>
        </div>

        <div className="sticky bottom-0 bg-gray-950/95 backdrop-blur-md p-5 border-t border-white/10 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={onDecline}
              disabled={actionLoading}
              aria-label="Decline Request"
              className="flex-1 min-h-[44px] py-3 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 font-semibold transition-colors text-sm"
            >
              Decline Request
            </button>
            <button
              onClick={onAccept}
              disabled={actionLoading}
              aria-label="Accept Request"
              className="flex-1 min-h-[44px] py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors text-sm flex items-center justify-center gap-2"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Accept Request
            </button>
          </div>
          <div className="flex justify-center gap-6">
            <button aria-label="Report Client" className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
              <Flag className="w-3 h-3" /> Report Client
            </button>
            <button aria-label="Block Client" className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
              <Ban className="w-3 h-3" /> Block Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cancel Modal ──────────────────────────────────────────────────────────────

function CancelModal({
  booking,
  onClose,
  onConfirm,
  loading,
}: {
  booking: Booking;
  onClose: () => void;
  onConfirm: (reason: string, message: string) => void;
  loading: boolean;
}) {
  const sessionTime = new Date(booking.booking_date).getTime();
  const hoursUntil = (sessionTime - Date.now()) / 3600000;
  const isWithin24 = hoursUntil < 24;
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-950 border border-white/20 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Cancel Meetup</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <CancellationWarning hours24={isWithin24} />
          {!isWithin24 && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-300">
              More than 24 hours away — you can cancel freely with no payment penalty.
            </div>
          )}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Reason (optional)</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
            >
              <option value="">Select a reason</option>
              <option>Schedule conflict</option>
              <option>Emergency</option>
              <option>Health issue</option>
              <option>Location not suitable</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Message to client (optional, max 150 chars)</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 150))}
              rows={2}
              placeholder="Let the client know why..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 resize-none"
            />
            <p className="text-[10px] text-gray-600 mt-1 text-right">{message.length}/150</p>
          </div>
        </div>
        <div className="p-5 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 min-h-[44px] py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm transition-colors">
            Keep Meetup
          </button>
          <button
            onClick={() => onConfirm(reason, message)}
            disabled={loading}
            className="flex-1 min-h-[44px] py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bio Editor ───────────────────────────────────────────────────────────────

function BioEditor({
  initialBio,
  userId,
  onClose,
  onSaved,
}: {
  initialBio: string;
  userId: string;
  onClose: () => void;
  onSaved: (bio: string) => void;
}) {
  const [bio, setBio] = useState(initialBio);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (bio.length < 20) { setErr('Bio must be at least 20 characters.'); return; }
    if (bio.length > 500) { setErr('Bio must be under 500 characters.'); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ bio }).eq('id', userId);
    setSaving(false);
    if (error) { setErr('Failed to save. Try again.'); return; }
    onSaved(bio);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-950 border border-white/20 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Edit Bio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={5}
            maxLength={500}
            placeholder="Tell clients about yourself (20–500 characters)..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 resize-none"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{bio.length < 20 ? `${20 - bio.length} more chars needed` : 'Looks good'}</span>
            <span>{bio.length}/500</span>
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>
        <div className="p-5 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 min-h-[44px] py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm transition-colors">Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 min-h-[44px] py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Bio
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PartnerDashboard() {
  const { user, loading: authLoading, refreshProfile, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
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
  const [cancelingBooking, setCancelingBooking] = useState<Booking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showBioEditor, setShowBioEditor] = useState(false);
  const [showGalleryTab, setShowGalleryTab] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [primaryPhoto, setPrimaryPhoto] = useState<string | null>(null);
  const [localBio, setLocalBio] = useState<string>('');

  useEffect(() => {
    if (profile) {
      setGalleryPhotos((profile as any).profile_photos ?? []);
      setPrimaryPhoto(profile.live_photo_url ?? null);
      setLocalBio(profile.bio ?? '');
    }
  }, [profile]);

  useEffect(() => {
    if (user) fetchBookings();
    else setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => { if (loading) setLoading(false); }, 6000);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchBookings = useCallback(async () => {
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
          .select('id, first_name, username, live_photo_url, bio, fitness_goals, created_at, cancellation_count, monthly_cancellations, cancellation_rate')
          .in('id', clientIds);
        if (profiles) profiles.forEach(p => { clientMap[p.id] = p; });
      }

      const now = new Date();
      const enriched = (bookingsData ?? []).map(b => ({ ...b, client_profile: clientMap[b.client_id] ?? null }));
      setPendingBookings(enriched.filter(b => b.status === 'pending'));
      setUpcomingBookings(enriched.filter(b => b.status === 'confirmed' && !b.session_ended_at && new Date(b.booking_date) > now));
      setPastBookings(enriched.filter(b => b.status === 'completed' || b.session_ended_at || (b.status === 'declined')));
    } catch (err) {
      console.error('fetchBookings error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleAccept = async (booking: Booking) => {
    setActionLoading(booking.id);
    try {
      const { error } = await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', booking.id);
      if (error) throw error;
      await supabase.from('booking_audit_log').insert({
        booking_id: booking.id,
        action: 'accepted',
        initiated_by: user!.id,
      });
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

  const handleCancelConfirm = async (reason: string, message: string) => {
    if (!cancelingBooking) return;
    setCancelLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', decline_reason: reason, declined_at: new Date().toISOString() })
        .eq('id', cancelingBooking.id);
      if (error) throw error;
      await supabase.from('booking_audit_log').insert({
        booking_id: cancelingBooking.id,
        action: 'cancelled',
        initiated_by: user!.id,
        reason,
        message: message || null,
      });
      setCancelingBooking(null);
      await fetchBookings();
    } catch {
      alert('Failed to cancel. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Earnings calculation
  const totalGross = pastBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.amount ?? 0), 0);
  const { platform: totalPlatform, stripe: totalStripe, net: totalNet } = calcFees(totalGross);

  // This month earnings
  const thisMonth = new Date();
  const monthGross = pastBookings
    .filter(b => b.status === 'completed' && new Date(b.booking_date).getMonth() === thisMonth.getMonth() && new Date(b.booking_date).getFullYear() === thisMonth.getFullYear())
    .reduce((sum, b) => sum + (b.amount ?? 0), 0);
  const { net: monthNet } = calcFees(monthGross);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'gallery', label: 'Gallery', icon: <Images className="w-4 h-4" /> },
    { id: 'requests', label: 'Requests', icon: <Bell className="w-4 h-4" />, badge: pendingBookings.length },
    { id: 'meetups', label: 'My Meetups', icon: <CalendarDays className="w-4 h-4" />, badge: upcomingBookings.length },
    { id: 'earnings', label: 'Earnings', icon: <DollarSign className="w-4 h-4" /> },
  ];

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <div className="border-b border-white/10 p-4 flex items-center justify-between">
          <div className="h-8 w-28 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-white/5 rounded-full animate-pulse" />
        </div>
        <div className="p-5 space-y-4 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/5 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          ))}
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

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-md border-b border-white/10 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" aria-label="Go to home" className="flex items-center gap-2">
            <img src="/Screenshot_2026-04-03_221406.png" alt="Adonix Fit" className="h-8 w-auto object-contain" />
          </a>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">Partner Dashboard</span>
            <a href="/settings" aria-label="Settings" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
              <Settings className="w-4 h-4 text-gray-400" />
            </a>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-red-500/20 border border-white/20 shrink-0">
              {primaryPhoto
                ? <img src={primaryPhoto} alt="My profile" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-red-400" /></div>
              }
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-3xl mx-auto px-4 flex gap-1 pb-3 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[36px] ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-0.5 bg-white text-red-600 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

        {/* ══ OVERVIEW TAB ════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* 1. Profile Header */}
            <section aria-label="Profile Header" className="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-white/20">
                    {primaryPhoto
                      ? <img src={primaryPhoto} alt="Profile" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-gray-500" /></div>
                    }
                  </div>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    aria-label="Change profile photo"
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center border-2 border-black hover:bg-red-700 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white">
                    Hello, {profile?.username ? `@${profile.username}` : (profile?.first_name ?? 'Partner')}! 👋
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {profile?.service_types?.slice(0, 2).join(' · ') ?? 'Partner'}
                  </p>
                  <div className="mt-3">
                    {localBio
                      ? <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">{localBio}</p>
                      : <p className="text-sm text-gray-600 italic">No bio yet. Add one to attract clients.</p>
                    }
                  </div>
                  <button
                    onClick={() => setShowBioEditor(true)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Bio
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/10">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{upcomingBookings.length}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Upcoming</p>
                </div>
                <div className="text-center border-x border-white/10">
                  <p className="text-xl font-bold text-white">{pendingBookings.length}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{fmtCurrency(monthNet)}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">This Month</p>
                </div>
              </div>
            </section>

            {/* 2. Pending Requests preview */}
            <section aria-label="Pending Requests">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Pending Requests
                  {pendingBookings.length > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                      {pendingBookings.length}
                    </span>
                  )}
                </h2>
                <button onClick={() => setActiveTab('requests')} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-0.5 transition-colors">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {pendingBookings.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
                  <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingBookings.slice(0, 3).map(booking => {
                    const gross = booking.amount ?? 0;
                    return (
                      <div key={booking.id} className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10 border border-white/10 shrink-0">
                            {booking.client_profile?.live_photo_url
                              ? <img src={booking.client_profile.live_photo_url} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-gray-500" /></div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm">{booking.client_profile?.first_name ?? 'Client'}</p>
                            {booking.client_profile?.username && <p className="text-[10px] text-gray-500">@{booking.client_profile.username}</p>}
                            <p className="text-xs text-gray-400">
                              {new Date(booking.booking_date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </p>
                            {booking.activity_type && <p className="text-xs text-yellow-400">{booking.activity_type}</p>}
                          </div>
                        </div>

                        {gross > 0 && <FeeBreakdown gross={gross} />}
                        <SocialMeetupDisclaimer />

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => setReviewingBooking(booking)}
                            aria-label="View Client Profile"
                            className="flex-1 min-h-[44px] py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors border border-white/10"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => handleAccept(booking)}
                            disabled={actionLoading === booking.id}
                            aria-label="Accept Request"
                            className="flex-1 min-h-[44px] py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
                          >
                            {actionLoading === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineFromModal(booking)}
                            aria-label="Decline Request"
                            className="flex-1 min-h-[44px] py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 3. Upcoming Soon (next 5) */}
            <section aria-label="Upcoming Soon">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white">Upcoming Soon</h2>
                <button onClick={() => setActiveTab('meetups')} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-0.5 transition-colors">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
                  <CalendarDays className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No upcoming meetups</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(showAllUpcoming ? upcomingBookings : upcomingBookings.slice(0, 5)).map(booking => {
                    const sessionTime = new Date(booking.booking_date).getTime();
                    const hoursUntil = (sessionTime - Date.now()) / 3600000;
                    const isWithin24 = hoursUntil < 24;
                    return (
                      <div key={booking.id} className={`p-4 border rounded-2xl ${isWithin24 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10 border border-white/10 shrink-0">
                            {booking.client_profile?.live_photo_url
                              ? <img src={booking.client_profile.live_photo_url} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-gray-500" /></div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">{booking.client_profile?.first_name ?? 'Client'}</p>
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-full">Confirmed</span>
                              {isWithin24 && <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">Soon</span>}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(booking.booking_date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </p>
                            {booking.activity_type && <p className="text-xs text-gray-500">{booking.activity_type}</p>}
                            {booking.location_name && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />{booking.location_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => setActiveCheckinBooking(booking)}
                            className="flex-1 min-h-[44px] py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                          >
                            <MapPin className="w-3.5 h-3.5" /> GPS Check-in
                          </button>
                          <button
                            onClick={() => setCancelingBooking(booking)}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 text-xs transition-colors border border-white/10"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {upcomingBookings.length > 5 && (
                    <button
                      onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                      className="w-full py-3 border border-dashed border-white/10 rounded-2xl text-xs text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-1"
                    >
                      {showAllUpcoming ? <><ChevronUp className="w-3.5 h-3.5" /> Show Less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {upcomingBookings.length - 5} More</>}
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* 4. Earnings Summary */}
            <section aria-label="Earnings Summary">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white">Earnings Summary</h2>
                <button onClick={() => setActiveTab('earnings')} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-0.5 transition-colors">
                  Full History <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-black/30 rounded-xl">
                    <p className="text-[10px] text-gray-500 mb-0.5">This Month (Net)</p>
                    <p className="text-lg font-bold text-white">{fmtCurrency(monthNet)}</p>
                  </div>
                  <div className="p-3 bg-black/30 rounded-xl">
                    <p className="text-[10px] text-gray-500 mb-0.5">Total Meetups</p>
                    <p className="text-lg font-bold text-white">{pastBookings.filter(b => b.status === 'completed').length}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-gray-400">
                    <span>Gross (all time):</span><span>{fmtCurrency(totalGross)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Platform Support (15%):</span><span className="text-red-400">-{fmtCurrency(totalPlatform)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Processing Fees:</span><span className="text-red-400">-{fmtCurrency(totalStripe)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-1.5 flex justify-between font-bold text-green-400">
                    <span>Net Earnings:</span><span>{fmtCurrency(totalNet)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600">
                  Adonix Fit uses Stripe for all payments. For payment issues, contact Stripe support.
                </p>
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 pt-6 pb-8">
              <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-600">
                <a href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</a>
                <a href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
                <a href="/safety" className="hover:text-gray-400 transition-colors">Safety Guidelines</a>
                <a href="/privacy#ccpa" className="hover:text-gray-400 transition-colors">Do Not Sell My Data</a>
                <a href="/contact" className="hover:text-gray-400 transition-colors">Contact Support</a>
              </div>
            </footer>
          </>
        )}

        {/* ══ GALLERY TAB ═════════════════════════════════════════════════ */}
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
                  <p className="text-xs text-gray-400 mt-0.5">{profile?.service_types?.slice(0, 2).join(' · ') ?? 'No activities yet'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-400">New Partner</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ REQUESTS TAB ════════════════════════════════════════════════ */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Incoming Requests</h2>
              <p className="text-sm text-gray-400">Review each client before accepting. Trust your instincts.</p>
            </div>

            {pendingBookings.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
                <Bell className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No pending requests</p>
                <p className="text-sm text-gray-600 mt-1">New meetup requests will appear here</p>
              </div>
            ) : (
              pendingBookings.map(booking => {
                const gross = booking.amount ?? 0;
                return (
                  <div key={booking.id} className="p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/10 shrink-0">
                        {booking.client_profile?.live_photo_url
                          ? <img src={booking.client_profile.live_photo_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-gray-500" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white">{booking.client_profile?.first_name ?? 'Client'}</p>
                        {booking.client_profile?.username && <p className="text-[10px] text-gray-500">@{booking.client_profile.username}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(booking.booking_date).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                        {booking.activity_type && <p className="text-xs text-yellow-400 mt-0.5">{booking.activity_type}</p>}
                        {booking.location_name && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{booking.location_name}</p>}
                      </div>
                    </div>

                    {(booking.client_profile?.monthly_cancellations ?? 0) >= 3 && (
                      <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-2 text-xs text-yellow-300">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {booking.client_profile?.monthly_cancellations} cancellations this month
                      </div>
                    )}

                    {gross > 0 && <FeeBreakdown gross={gross} />}
                    <SocialMeetupDisclaimer />

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setReviewingBooking(booking)}
                        aria-label="View Client Profile"
                        className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors border border-white/10"
                      >
                        View Client Profile
                      </button>
                      <button
                        onClick={() => handleAccept(booking)}
                        disabled={actionLoading === booking.id}
                        aria-label="Accept"
                        className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        {actionLoading === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineFromModal(booking)}
                        aria-label="Decline"
                        className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ══ MEETUPS TAB ═════════════════════════════════════════════════ */}
        {activeTab === 'meetups' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">My Meetups</h2>
              <p className="text-sm text-gray-400">All confirmed and past social fitness meetups.</p>
            </div>

            {upcomingBookings.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Upcoming</h3>
                {upcomingBookings.map(booking => {
                  const sessionTime = new Date(booking.booking_date).getTime();
                  const hoursUntil = (sessionTime - Date.now()) / 3600000;
                  const isWithin24 = hoursUntil < 24;
                  return (
                    <div key={booking.id} className={`p-5 border rounded-2xl ${isWithin24 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/10 shrink-0">
                          {booking.client_profile?.live_photo_url
                            ? <img src={booking.client_profile.live_photo_url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-gray-500" /></div>
                          }
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-white">{booking.client_profile?.first_name ?? 'Client'}</p>
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-full">Confirmed</span>
                            {isWithin24 && <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">Within 24 hrs</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(booking.booking_date).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                          {booking.activity_type && <p className="text-xs text-gray-500">{booking.activity_type}</p>}
                          {booking.location_name && <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{booking.location_name}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveCheckinBooking(booking)}
                          className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MapPin className="w-3.5 h-3.5" /> GPS Check-in
                        </button>
                        <button
                          onClick={() => setCancelingBooking(booking)}
                          className="min-h-[44px] px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 text-xs transition-colors border border-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {upcomingBookings.length === 0 && (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                <CalendarDays className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No upcoming meetups</p>
                <p className="text-sm text-gray-600 mt-1">Accepted requests appear here</p>
              </div>
            )}

            {pastBookings.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Past Meetups</h3>
                {pastBookings.map(booking => (
                  <div key={booking.id} className="p-4 border border-white/5 rounded-2xl opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0">
                        {booking.client_profile?.live_photo_url
                          ? <img src={booking.client_profile.live_photo_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-gray-600" /></div>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300">{booking.client_profile?.first_name ?? 'Client'}</p>
                        <p className="text-xs text-gray-500">{new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <span className="ml-auto text-[10px] px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full capitalize">{booking.status}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ══ EARNINGS TAB ════════════════════════════════════════════════ */}
        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Earnings</h2>
              <p className="text-sm text-gray-400">Your full payout history and breakdown.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">This Month (Net)</p>
                <p className="text-2xl font-bold text-white">{fmtCurrency(monthNet)}</p>
                <p className="text-xs text-green-400 mt-1">After all fees</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Completed</p>
                <p className="text-2xl font-bold text-white">{pastBookings.filter(b => b.status === 'completed').length}</p>
                <p className="text-xs text-gray-500 mt-1">Social meetups</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <p className="text-sm font-semibold text-white">All-Time Breakdown</p>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between text-gray-300">
                  <span>Gross Earnings</span><span>{fmtCurrency(totalGross)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Platform Support (15%)</span><span className="text-red-400">-{fmtCurrency(totalPlatform)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Processing Fees (2.9% + $0.30)</span><span className="text-red-400">-{fmtCurrency(totalStripe)}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                  <span className="text-white">Net Earnings</span><span className="text-green-400">{fmtCurrency(totalNet)}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-300">
                Adonix Fit uses Stripe for all payments. For payment issues, contact Stripe support directly.
              </p>
            </div>

            {pastBookings.filter(b => b.status === 'completed').length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">Transaction History</p>
                {pastBookings.filter(b => b.status === 'completed').map(b => {
                  const g = b.amount ?? 0;
                  const { net } = calcFees(g);
                  return (
                    <div key={b.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{b.client_profile?.first_name ?? 'Client'}</p>
                        <p className="text-xs text-gray-500">{new Date(b.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">+{fmtCurrency(net)}</p>
                        <p className="text-[10px] text-gray-600">net</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
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

      {cancelingBooking && (
        <CancelModal
          booking={cancelingBooking}
          onClose={() => setCancelingBooking(null)}
          onConfirm={handleCancelConfirm}
          loading={cancelLoading}
        />
      )}

      {showBioEditor && user && (
        <BioEditor
          initialBio={localBio}
          userId={user.id}
          onClose={() => setShowBioEditor(false)}
          onSaved={(bio) => setLocalBio(bio)}
        />
      )}
    </div>
  );
}
