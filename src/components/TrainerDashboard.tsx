import { useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Calendar, DollarSign, Clock, CheckCircle } from 'lucide-react';

export default function TrainerDashboard() {
  const { user } = useAuth();
  const [myClients, setMyClients] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'clients' | 'earnings'>('sessions');

  useEffect(() => {
    if (user) {
      loadUpcomingSessions();
      loadMyClients();
      loadEarnings();
    }
  }, [user]);

  const loadUpcomingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:profiles!bookings_client_id_fkey (id, first_name, email, live_photo_url)
        `)
        .eq('trainer_id', user?.id)
        .in('status', ['pending', 'confirmed'])
        .order('booking_date', { ascending: true });

      if (error) throw error;
      setUpcomingSessions(data || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyClients = async () => {
    try {
      // Get unique clients from completed/confirmed bookings
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          client:profiles!bookings_client_id_fkey (id, first_name, email, live_photo_url, fitness_level)
        `)
        .eq('trainer_id', user?.id)
        .in('status', ['confirmed', 'completed']);

      if (error) throw error;
      
      // Remove duplicates by client id
      const uniqueClients = Array.from(
        new Map((data || []).map(item => [item.client.id, item.client])).values()
      );
      setMyClients(uniqueClients);
    } catch (err) {
      console.error('Error loading clients:', err);
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

  const updateSessionStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      await loadUpcomingSessions();
      await loadEarnings();
      alert(`Session ${status === 'confirmed' ? 'accepted' : status}`);
    } catch (err) {
      console.error('Error updating session:', err);
      alert('Failed to update session');
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl p-6 border border-red-500/20">
        <h2 className="text-2xl font-bold">Welcome back, Trainer!</h2>
        <p className="text-gray-400 mt-1">Manage your sessions, clients, and earnings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingSessions.length}</p>
              <p className="text-sm text-gray-400">Upcoming Sessions</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Users className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myClients.length}</p>
              <p className="text-sm text-gray-400">Active Clients</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${earnings.toFixed(0)}</p>
              <p className="text-sm text-gray-400">Total Earnings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'sessions'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Session Requests
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'clients'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          My Clients
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

      {/* Sessions Tab - Pending & Upcoming */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Session Requests</h3>
              <p className="text-gray-400">When clients book you, they'll appear here</p>
            </div>
          ) : (
            upcomingSessions.map((session) => (
              <div key={session.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {session.client?.live_photo_url && (
                        <img
                          src={session.client.live_photo_url}
                          alt={session.client.first_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h4 className="text-xl font-semibold">
                          {session.client?.first_name || 'Client'}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {new Date(session.booking_date).toLocaleString()}
                        </p>
                        <p className="text-sm text-red-400">
                          ${session.hourly_rate}/hour
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {session.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateSessionStatus(session.id, 'confirmed')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Accept
                        </button>
                        <button
                          onClick={() => updateSessionStatus(session.id, 'cancelled')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {session.status === 'confirmed' && (
                      <span className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm font-semibold">
                        Confirmed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myClients.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Clients Yet</h3>
              <p className="text-gray-400">When you complete sessions, clients will appear here</p>
            </div>
          ) : (
            myClients.map((client) => (
              <div key={client.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  {client.live_photo_url && (
                    <img
                      src={client.live_photo_url}
                      alt={client.first_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold">{client.first_name}</h4>
                    <p className="text-sm text-gray-400">{client.fitness_level || 'Fitness Enthusiast'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Earnings Tab */}
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
    </div>
  );
}