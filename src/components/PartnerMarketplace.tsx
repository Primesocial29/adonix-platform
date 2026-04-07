import { useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Calendar, DollarSign } from 'lucide-react';
import ReportModal from './ReportModal';

interface TrainerDashboardProps {
  onBookTrainer?: (trainer: Profile) => void;
}

export default function TrainerDashboard({ onBookTrainer }: TrainerDashboardProps) {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingTrainer, setReportingTrainer] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [activeTab, setActiveTab] = useState<'browse' | 'myBookings' | 'earnings'>('browse');

  useEffect(() => {
    if (user) {
      loadTrainers();
      loadMyBookings();
      loadEarnings();
    }
  }, [user]);

  const loadTrainers = async () => {
    try {
      console.log('Fetching trainers from profiles table...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'trainer')
        .neq('id', user?.id);

      if (error) throw error;
      setTrainers(data || []);
    } catch (err) {
      console.error('Error loading trainers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trainer:profiles!bookings_trainer_id_fkey (*),
          client:profiles!bookings_client_id_fkey (*)
        `)
        .or(`trainer_id.eq.${user?.id},client_id.eq.${user?.id}`)
        .order('session_date', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  };

  const loadEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('hourly_rate')
        .eq('trainer_id', user?.id)
        .eq('status', 'completed');

      if (error) throw error;
      
      const total = (data || []).reduce((sum, booking) => sum + (booking.hourly_rate || 0), 0);
      setEarnings(total);
    } catch (err) {
      console.error('Error loading earnings:', err);
    }
  };

  const handleReport = (trainer: Profile) => {
    setReportingTrainer(trainer);
    setShowReportModal(true);
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      await loadMyBookings();
      alert(`Booking ${status} successfully`);
    } catch (err) {
      console.error('Error updating booking:', err);
      alert('Failed to update booking');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'browse'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Browse Trainers
        </button>
        <button
          onClick={() => setActiveTab('myBookings')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'myBookings'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          My Bookings
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'earnings'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Earnings
        </button>
      </div>

      {/* Browse Trainers Tab */}
      {activeTab === 'browse' && (
        <>
          {trainers.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Trainers Available Yet</h3>
              <p className="text-gray-400">Check back soon for fitness trainers in your area</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-red-500/50 transition-all"
                >
                  {trainer.live_photo_url && (
                    <div className="aspect-square bg-gradient-to-br from-red-500/20 to-orange-500/20">
                      <img
                        src={trainer.live_photo_url}
                        alt={trainer.first_name || 'Trainer'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{trainer.first_name}</h3>
                      <p className="text-gray-400">
                        {trainer.age} • {trainer.gender} • {trainer.fitness_level}
                      </p>
                    </div>

                    {trainer.bio && (
                      <p className="text-gray-300 text-sm line-clamp-3">{trainer.bio}</p>
                    )}

                    {trainer.specialties && trainer.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {trainer.specialties.map((specialty, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-gray-400">Hourly Rate</div>
                        <div className="text-2xl font-bold text-red-500">
                          ${trainer.hourly_rate?.toFixed(2)}
                        </div>
                      </div>

                      {/* Only show book/report buttons if user is logged in and viewing other trainers */}
                      {user && user.id !== trainer.id && onBookTrainer && (
                        <>
                          <button
                            onClick={() => onBookTrainer(trainer)}
                            className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <Calendar className="w-5 h-5" />
                            Book Session
                          </button>

                          <button
                            onClick={() => handleReport(trainer)}
                            className="w-full mt-2 py-2 bg-gray-700 hover:bg-gray-600 rounded-full text-sm font-medium transition-colors"
                          >
                            Report User
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Bookings Tab */}
      {activeTab === 'myBookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Bookings Yet</h3>
              <p className="text-gray-400">Browse trainers and book your first session!</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-semibold">
                      {booking.trainer?.first_name || 'Unknown Trainer'}
                    </h4>
                    <p className="text-gray-400 text-sm mt-1">
                      Session Date: {new Date(booking.session_date).toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Rate: ${booking.hourly_rate}/hour
                    </p>
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                        booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        booking.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* If user is a trainer, show accept/decline buttons for pending bookings */}
                  {user?.id === booking.trainer_id && booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Earnings Tab (Trainer Only) */}
      {activeTab === 'earnings' && (
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-8">
          <div className="text-center">
            <DollarSign className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">Total Earnings</h3>
            <p className="text-5xl font-bold text-red-500 mb-4">${earnings.toFixed(2)}</p>
            <p className="text-gray-400">From completed sessions</p>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && reportingTrainer && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={reportingTrainer.id}
          reportedUserName={reportingTrainer.first_name || 'User'}
        />
      )}
    </div>
  );
}