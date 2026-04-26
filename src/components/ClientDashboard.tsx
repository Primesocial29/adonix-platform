import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { X, Calendar, Clock, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function ClientDashboard() {
  const { user, profile, loading } = useAuth();
  
  // Booking states
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<any[]>([]);
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [declinedBookings, setDeclinedBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  // Modal states
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showConfirmedModal, setShowConfirmedModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showDeclinedModal, setShowDeclinedModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  
  // Profile stats
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  
  // Fetch client's bookings
  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);
  
  const fetchBookings = async () => {
    if (!user) return;
    setLoadingBookings(true);
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          partner:partner_id (
            id,
            first_name,
            username,
            live_photo_url,
            bio
          )
        `)
        .eq('client_id', user.id)
        .order('booking_date', { ascending: true });
      
      if (error) throw error;
      
      const now = new Date();
      const pending = [];
      const confirmed = [];
      const completed = [];
      const declined = [];
      
      (data || []).forEach(booking => {
        const bookingDate = new Date(booking.booking_date);
        if (booking.status === 'pending') {
          pending.push(booking);
        } else if (booking.status === 'confirmed') {
          if (bookingDate > now) {
            confirmed.push(booking);
          } else {
            completed.push(booking);
          }
        } else if (booking.status === 'completed') {
          completed.push(booking);
        } else if (booking.status === 'declined') {
          declined.push(booking);
        }
      });
      
      setPendingBookings(pending);
      setConfirmedBookings(confirmed);
      setCompletedBookings(completed);
      setDeclinedBookings(declined);
      
      // Calculate stats
      const totalSpentAmount = (data || []).reduce((sum, b) => {
        if (b.status === 'completed') {
          return sum + (b.total_amount || b.suggested_contribution || 0);
        }
        return sum;
      }, 0);
      setTotalSpent(totalSpentAmount);
      setTotalSessions(completed.length);
      
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDuration = (minutes: number) => {
    if (minutes === 30) return '30 min';
    if (minutes === 60) return '1 hour';
    if (minutes === 90) return '1.5 hours';
    return '2 hours';
  };
  
  const BookingCard = ({ booking, type }: { booking: any; type: 'pending' | 'confirmed' | 'completed' | 'declined' }) => {
    const partner = booking.partner;
    const statusColors = {
      pending: 'border-yellow-500/30 bg-yellow-500/5',
      confirmed: 'border-green-500/30 bg-green-500/5',
      completed: 'border-blue-500/30 bg-blue-500/5',
      declined: 'border-red-500/30 bg-red-500/5',
    };
    
    const statusIcons = {
      pending: <Clock className="w-4 h-4 text-yellow-500" />,
      confirmed: <CheckCircle className="w-4 h-4 text-green-500" />,
      completed: <CheckCircle className="w-4 h-4 text-blue-500" />,
      declined: <XCircle className="w-4 h-4 text-red-500" />,
    };
    
    const statusText = {
      pending: 'Awaiting Partner Response',
      confirmed: 'Confirmed',
      completed: 'Completed',
      declined: 'Declined',
    };
    
    return (
      <div 
        onClick={() => {
          setSelectedBooking(booking);
          setShowBookingDetails(true);
        }}
        className={`rounded-xl p-4 border cursor-pointer transition hover:scale-[1.01] ${statusColors[type]}`}
      >
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-red-500/20 flex-shrink-0">
            {partner?.live_photo_url ? (
              <img src={partner.live_photo_url} alt={partner.first_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🏋️</div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-white">@{partner?.username || partner?.first_name?.toLowerCase()}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                  <span>{booking.selected_service || booking.activity}</span>
                  <span>•</span>
                  <span>{formatDuration(booking.session_duration || 60)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-400">${(booking.total_amount || booking.suggested_contribution || 0).toFixed(2)}</p>
                <div className="flex items-center gap-1 text-xs">
                  {statusIcons[type]}
                  <span className={type === 'pending' ? 'text-yellow-400' : type === 'confirmed' ? 'text-green-400' : type === 'completed' ? 'text-blue-400' : 'text-red-400'}>
                    {statusText[type]}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(booking.booking_date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(booking.booking_date)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {booking.location_name?.split(',')[0] || 'Location TBD'}
              </span>
            </div>
            
            {type === 'declined' && booking.decline_reason && (
              <p className="mt-2 text-xs text-red-400">Reason: {booking.decline_reason}</p>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const BookingDetailsModal = () => {
    if (!selectedBooking) return null;
    
    const partner = selectedBooking.partner;
    const isPast = new Date(selectedBooking.booking_date) < new Date();
    const canCheckIn = selectedBooking.status === 'confirmed' && !isPast;
    
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowBookingDetails(false)}>
        <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-white/10" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Booking Details</h2>
            <button onClick={() => setShowBookingDetails(false)} className="p-1 hover:bg-white/10 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-5">
            {/* Partner Info */}
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-red-500/20">
                {partner?.live_photo_url ? (
                  <img src={partner.live_photo_url} alt={partner.first_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🏋️</div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">@{partner?.username || partner?.first_name?.toLowerCase()}</h3>
                <p className="text-sm text-gray-400">{partner?.bio?.slice(0, 80)}...</p>
              </div>
            </div>
            
            {/* Session Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white">Session Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Activity</p>
                  <p className="text-white font-medium">{selectedBooking.selected_service || selectedBooking.activity}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Duration</p>
                  <p className="text-white font-medium">{formatDuration(selectedBooking.session_duration || 60)}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Date</p>
                  <p className="text-white font-medium">{formatDate(selectedBooking.booking_date)}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Time</p>
                  <p className="text-white font-medium">{formatTime(selectedBooking.booking_date)}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg col-span-2">
                  <p className="text-gray-400 text-xs mb-1">Location</p>
                  <p className="text-white font-medium">{selectedBooking.location_name}</p>
                </div>
              </div>
            </div>
            
            {/* Price Breakdown */}
            <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl border border-red-500/30">
              <h3 className="font-semibold text-white mb-3">Price Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Suggested Contribution</span>
                  <span className="text-white">${(selectedBooking.suggested_contribution || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Intent Fee (non-refundable)</span>
                  <span className="text-white">${(selectedBooking.intent_fee || 1).toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-white">Total Charged</span>
                    <span className="text-green-400">${(selectedBooking.total_amount || selectedBooking.suggested_contribution || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status & Actions */}
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedBooking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  selectedBooking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                  selectedBooking.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {selectedBooking.status === 'pending' ? 'Awaiting Response' :
                   selectedBooking.status === 'confirmed' ? 'Confirmed' :
                   selectedBooking.status === 'completed' ? 'Completed' : 'Declined'}
                </span>
              </div>
              
              {selectedBooking.status === 'pending' && (
                <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <p className="text-xs text-yellow-400">Your booking request has been sent. The partner will respond shortly.</p>
                </div>
              )}
              
              {selectedBooking.status === 'confirmed' && !isPast && (
                <button className="w-full mt-3 py-3 bg-gradient-to-r from-green-600 to-green-700 rounded-lg font-semibold transition hover:scale-105">
                  GPS Check-In (Coming Soon)
                </button>
              )}
              
              {selectedBooking.status === 'declined' && selectedBooking.decline_reason && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg mt-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">Declined reason: {selectedBooking.decline_reason}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowBookingDetails(false)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const RequestsModal = ({ title, bookings, type, onClose }: { title: string; bookings: any[]; type: string; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {bookings.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No {type.toLowerCase()} bookings.</p>
          ) : (
            bookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} type={type as any} />
            ))
          )}
        </div>
      </div>
    </div>
  );
  
  if (loading || loadingBookings) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/adonixlogo.png" alt="Adonix Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold text-white">ADONIX</span>
            <span className="text-xs text-gray-400 hidden sm:block">Social Fitness, Elevated</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/browse'}
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
            >
              Find Partners
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome Back, {profile?.first_name || 'Member'}!</h1>
          <p className="text-gray-400">Track your fitness journey and booking history</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-5 text-center border border-green-500/30">
            <p className="text-2xl font-bold text-green-400">${totalSpent.toFixed(0)}</p>
            <p className="text-xs text-gray-400 mt-1">Total Spent</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-5 text-center border border-blue-500/30">
            <p className="text-2xl font-bold text-blue-400">{totalSessions}</p>
            <p className="text-xs text-gray-400 mt-1">Sessions Completed</p>
          </div>
        </div>
        
        {/* Booking Sections */}
        <div className="space-y-6">
          {/* Pending Requests */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Pending Requests</h2>
                {pendingBookings.length > 0 && (
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                    {pendingBookings.length}
                  </span>
                )}
              </div>
              {pendingBookings.length > 3 && (
                <button onClick={() => setShowPendingModal(true)} className="text-sm text-red-400 hover:text-red-300">
                  View All →
                </button>
              )}
            </div>
            {pendingBookings.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No pending booking requests.</p>
            ) : (
              <div className="space-y-3">
                {pendingBookings.slice(0, 3).map(booking => (
                  <BookingCard key={booking.id} booking={booking} type="pending" />
                ))}
              </div>
            )}
          </div>
          
          {/* Upcoming Sessions */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold">Upcoming Sessions</h2>
                {confirmedBookings.length > 0 && (
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
                    {confirmedBookings.length}
                  </span>
                )}
              </div>
              {confirmedBookings.length > 3 && (
                <button onClick={() => setShowConfirmedModal(true)} className="text-sm text-red-400 hover:text-red-300">
                  View All →
                </button>
              )}
            </div>
            {confirmedBookings.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No upcoming sessions. Book a partner to get started!</p>
            ) : (
              <div className="space-y-3">
                {confirmedBookings.slice(0, 3).map(booking => (
                  <BookingCard key={booking.id} booking={booking} type="confirmed" />
                ))}
              </div>
            )}
          </div>
          
          {/* Past Sessions */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Past Sessions</h2>
                {completedBookings.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                    {completedBookings.length}
                  </span>
                )}
              </div>
              {completedBookings.length > 3 && (
                <button onClick={() => setShowCompletedModal(true)} className="text-sm text-red-400 hover:text-red-300">
                  View All →
                </button>
              )}
            </div>
            {completedBookings.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No past sessions yet.</p>
            ) : (
              <div className="space-y-3">
                {completedBookings.slice(0, 3).map(booking => (
                  <BookingCard key={booking.id} booking={booking} type="completed" />
                ))}
              </div>
            )}
          </div>
          
          {/* Declined Requests */}
          {declinedBookings.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-semibold">Declined Requests</h2>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
                    {declinedBookings.length}
                  </span>
                </div>
                {declinedBookings.length > 3 && (
                  <button onClick={() => setShowDeclinedModal(true)} className="text-sm text-red-400 hover:text-red-300">
                    View All →
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {declinedBookings.slice(0, 3).map(booking => (
                  <BookingCard key={booking.id} booking={booking} type="declined" />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => window.location.href = '/browse'}
            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition transform hover:scale-105"
          >
            Find New Partner
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition"
          >
            Logout
          </button>
        </div>
        
        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-gray-500">
          <p>© 2026 ADONIX. All rights reserved. Elite Social Fitness Network.</p>
          <p className="mt-2">Adonix is a social fitness network — not a professional service. Meet only at verified public locations. GPS check-in required.</p>
        </div>
      </div>
      
      {/* Modals */}
      {showPendingModal && (
        <RequestsModal title="Pending Requests" bookings={pendingBookings} type="pending" onClose={() => setShowPendingModal(false)} />
      )}
      {showConfirmedModal && (
        <RequestsModal title="Upcoming Sessions" bookings={confirmedBookings} type="confirmed" onClose={() => setShowConfirmedModal(false)} />
      )}
      {showCompletedModal && (
        <RequestsModal title="Past Sessions" bookings={completedBookings} type="completed" onClose={() => setShowCompletedModal(false)} />
      )}
      {showDeclinedModal && (
        <RequestsModal title="Declined Requests" bookings={declinedBookings} type="declined" onClose={() => setShowDeclinedModal(false)} />
      )}
      {showBookingDetails && <BookingDetailsModal />}
    </div>
  );
}