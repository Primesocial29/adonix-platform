import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Booking {
  id: string;
  contact_email: string;
  booking_date: string;
  status: string;
  client_id: string;
  location_name?: string;
  activity?: string;
  suggested_contribution?: number;
  client?: {
    first_name: string;
    username: string;
    live_photo_url: string;
    bio: string;
    fitness_goals: string[];
    created_at: string;
  };
}

interface ServiceArea {
  name: string;
  lat: number | null;
  lng: number | null;
}

interface Availability {
  day: string;
  times: string[];
}

const SERVICE_TYPES = [
  'Walking', 'Jogging', 'Running', 'Biking', 'Yoga', 'Weight Lifting',
  'HIIT', 'Calisthenics', 'Swimming', 'Boxing', 'Pilates', 'Stretching'
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const generateTimeSlots = (includeHalfHour: boolean): string[] => {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    if (includeHalfHour && h < 22) slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

function formatTimeLabel(time: string): string {
  const [hour, minute] = time.split(':');
  const h = parseInt(hour);
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${minute} ${period}`;
}

export default function PartnerDashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [totalContributions, setTotalContributions] = useState(0);
  const [showEditBio, setShowEditBio] = useState(false);
  const [editBioText, setEditBioText] = useState(profile?.bio || '');
  const [bioError, setBioError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  
  // Modal states
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showPastMeetupsModal, setShowPastMeetupsModal] = useState(false);
  const [showContributionsModal, setShowContributionsModal] = useState(false);
  
  // Edit data states
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [customServiceTypes, setCustomServiceTypes] = useState<string[]>([]);
  const [serviceRates, setServiceRates] = useState<Record<string, { hourly: number; halfHour: number }>>({});
  const [halfHourEnabled, setHalfHourEnabled] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [monthlyContributions, setMonthlyContributions] = useState<{ month: string; total: number }[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.settings-dropdown') && !target.closest('.settings-button')) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchContributions();
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('service_areas, availability, service_types, custom_service_types, service_rates, half_hour_enabled')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setServiceAreas(data.service_areas || []);
        setAvailability(data.availability || DAYS_OF_WEEK.map(d => ({ day: d, times: [] })));
        setServiceTypes(data.service_types || []);
        setCustomServiceTypes(data.custom_service_types || []);
        setServiceRates(data.service_rates || {});
        setHalfHourEnabled(data.half_hour_enabled || false);
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:profiles!bookings_client_id_fkey (
            first_name,
            username,
            live_photo_url,
            bio,
            fitness_goals,
            created_at
          )
        `)
        .eq('partner_id', user.id);

      if (error) throw error;

      const pending = (bookingsData || []).filter(b => b.status === 'pending');
      const upcoming = (bookingsData || []).filter(b => b.status === 'confirmed' && new Date(b.booking_date) > new Date());
      const past = (bookingsData || []).filter(b => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.booking_date) < new Date()));
      
      setPendingBookings(pending);
      setUpcomingBookings(upcoming.sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()).slice(0, 4));
      setPastBookings(past.sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()));
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchContributions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('suggested_contribution, booking_date')
        .eq('partner_id', user.id)
        .eq('status', 'completed');
      
      if (error) throw error;
      
      const total = (data || []).reduce((sum, b) => sum + (b.suggested_contribution || 0), 0);
      setTotalContributions(total);
      
      // Group by month
      const byMonth: Record<string, number> = {};
      (data || []).forEach(b => {
        const month = new Date(b.booking_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        byMonth[month] = (byMonth[month] || 0) + (b.suggested_contribution || 0);
      });
      setMonthlyContributions(Object.entries(byMonth).map(([month, total]) => ({ month, total })));
    } catch (err) {
      console.error('Error fetching contributions:', err);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
      
      if (error) throw error;
      await fetchBookings();
    } catch (err) {
      console.error('Error updating booking:', err);
      alert('Failed to update. Please try again.');
    }
  };

  const updateBio = async () => {
    if (editBioText.length < 20) {
      setBioError('Bio must be at least 20 characters');
      return;
    }
    if (editBioText.length > 500) {
      setBioError('Bio cannot exceed 500 characters');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: editBioText })
        .eq('id', user?.id);
      
      if (error) throw error;
      await refreshProfile();
      setShowEditBio(false);
      setBioError('');
    } catch (err) {
      console.error('Error updating bio:', err);
      alert('Failed to update bio');
    }
  };

  const addLocation = async () => {
    if (!newLocation.trim()) return;
    const newArea = { name: newLocation.trim(), lat: null, lng: null };
    const updated = [...serviceAreas, newArea];
    setServiceAreas(updated);
    
    await supabase
      .from('profiles')
      .update({ service_areas: updated })
      .eq('id', user?.id);
    
    setNewLocation('');
  };

  const removeLocation = async (index: number) => {
    const updated = serviceAreas.filter((_, i) => i !== index);
    setServiceAreas(updated);
    await supabase
      .from('profiles')
      .update({ service_areas: updated })
      .eq('id', user?.id);
  };

  const toggleTimeSlot = (day: string, time: string) => {
    setAvailability(prev => prev.map(a => {
      if (a.day !== day) return a;
      const times = a.times.includes(time) ? a.times.filter(t => t !== time) : [...a.times, time].sort();
      return { ...a, times };
    }));
  };

  const saveAvailability = async () => {
    await supabase
      .from('profiles')
      .update({ availability })
      .eq('id', user?.id);
    alert('Schedule saved!');
    setShowScheduleModal(false);
  };

  const toggleDay = (day: string) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const toggleServiceType = (service: string) => {
    setServiceTypes(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const updateServiceRate = (service: string, field: 'hourly' | 'halfHour', value: string) => {
    const num = parseInt(value) || 0;
    setServiceRates(prev => ({
      ...prev,
      [service]: { ...(prev[service] || { hourly: 0, halfHour: 0 }), [field]: num }
    }));
  };

  const saveServices = async () => {
    await supabase
      .from('profiles')
      .update({
        service_types: serviceTypes,
        custom_service_types: customServiceTypes,
        service_rates: serviceRates,
        half_hour_enabled: halfHourEnabled
      })
      .eq('id', user?.id);
    alert('Services saved!');
    setShowServicesModal(false);
  };

  const calculateNetEarnings = (contribution: number) => {
    const platformFee = contribution * 0.15;
    const processingFee = contribution * 0.029 + 0.30;
    return contribution - platformFee - processingFee;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please sign in to access the partner dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar with Settings Dropdown */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏋️</span>
            <span className="font-bold text-xl">Adonix Fit</span>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="settings-button flex items-center gap-2 px-3 py-2 bg-white/10 rounded-full hover:bg-white/20 transition"
            >
              <span>⚙️</span>
              <span>Settings</span>
              <span>▼</span>
            </button>
            {showSettingsDropdown && (
              <div className="settings-dropdown absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-20">
                <div className="py-2">
                  <button onClick={() => { setShowLocationsModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">📍 My Locations</button>
                  <button onClick={() => { setShowScheduleModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">⏰ My Schedule</button>
                  <button onClick={() => { setShowServicesModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">💪 My Services & Rates</button>
                  <button onClick={() => { setShowPastMeetupsModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">📅 Past Meetups</button>
                  <button onClick={() => { setShowContributionsModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">💰 Contribution History</button>
                  <div className="border-t border-white/10 my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10">🚪 Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Profile Section */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 rounded-full mx-auto overflow-hidden bg-red-500/20 border-4 border-red-500/30 mb-4">
            {profile?.live_photo_url ? (
              <img src={profile.live_photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Hello, {profile?.first_name || 'Partner'}! 👋</h1>
          
          {showEditBio ? (
            <div className="max-w-md mx-auto mb-4">
              <textarea
                value={editBioText}
                onChange={(e) => setEditBioText(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                rows={4}
                placeholder="Tell clients about yourself... (20-500 characters)"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-400">{editBioText.length}/500 characters</p>
                {bioError && <p className="text-xs text-red-400">{bioError}</p>}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={updateBio} className="flex-1 px-4 py-2 bg-green-600 rounded-lg">Save</button>
                <button onClick={() => { setShowEditBio(false); setBioError(''); }} className="flex-1 px-4 py-2 bg-gray-600 rounded-lg">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 max-w-md mx-auto mb-4">{profile?.bio || 'No bio yet. Click Edit Bio to add one.'}</p>
          )}
          
          <div className="flex justify-center gap-3 mb-3">
            <button onClick={() => setShowEditBio(true)} className="px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition">✏️ Edit Bio</button>
            <button className="px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition">📸 Change Photo</button>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>🔹 Profile info is self-reported — not verified by Adonix Fit.</p>
            <p>🔹 This is a social meetup platform, not a professional service.</p>
          </div>
        </div>

        {/* Pending Invitations Section */}
        {pendingBookings.length > 0 && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">📋 New Meetup Invitations</h2>
              <button className="text-sm text-red-400 hover:text-red-300">View All →</button>
            </div>
            <div className="space-y-4">
              {pendingBookings.map((booking) => {
                const netEarnings = calculateNetEarnings(booking.suggested_contribution || 75);
                return (
                  <div key={booking.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-lg">{booking.client?.first_name || 'Client'}</p>
                        <p className="text-sm text-gray-400">@{booking.client?.username || 'client'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">{booking.activity || 'Fitness'} • {new Date(booking.booking_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-3 italic">"Can't wait to move together!"</p>
                    <div className="bg-white/5 rounded-xl p-3 mb-4">
                      <p className="text-sm">Suggested Contribution: ${booking.suggested_contribution || 75}.00</p>
                      <p className="text-sm text-green-400">Your Net: ${netEarnings.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowClientModal(true);
                        }}
                        className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20"
                      >
                        👤 View Profile
                      </button>
                      <button 
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        className="px-4 py-2 bg-green-600 rounded-lg text-sm hover:bg-green-700"
                      >
                        ✅ Accept
                      </button>
                      <button 
                        onClick={() => updateBookingStatus(booking.id, 'declined')}
                        className="px-4 py-2 bg-red-600 rounded-lg text-sm hover:bg-red-700"
                      >
                        ❌ Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Meetups Section */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">⏰ Your Upcoming Meetups</h2>
            <button className="text-sm text-red-400 hover:text-red-300">View All →</button>
          </div>
          
          {upcomingBookings.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-gray-400">No meetups scheduled yet. When clients invite you, they'll show up here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking, index) => {
                const netEarnings = calculateNetEarnings(booking.suggested_contribution || 75);
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📅';
                return (
                  <div key={booking.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{medal} {new Date(booking.booking_date).toLocaleDateString()} at {new Date(booking.booking_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                        <p className="text-lg font-medium">{booking.activity || 'Fitness'} with {booking.client?.first_name || 'Client'}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">📍 {booking.location_name || 'Gold\'s Gym Downtown'}</p>
                    <p className="text-green-400 text-sm mb-4">💰 Your Net: ${netEarnings.toFixed(2)}</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowClientModal(true);
                        }}
                        className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20"
                      >
                        👤 View Profile
                      </button>
                      <button className="px-4 py-2 bg-yellow-600/30 rounded-lg text-sm hover:bg-yellow-600/50">❌ Cancel</button>
                      <button className="px-4 py-2 bg-blue-600/30 rounded-lg text-sm hover:bg-blue-600/50">🔄 Request Change</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats Section */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">💰 Your Net Contributions</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-green-400">${totalContributions}</p>
              <p className="text-sm text-gray-400">Total Suggested Contributions</p>
              <p className="text-xs text-gray-500">all time</p>
              <button onClick={() => setShowContributionsModal(true)} className="mt-3 text-sm text-red-400 hover:text-red-300">View Details →</button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-yellow-400">{pendingBookings.length}</p>
              <p className="text-sm text-gray-400">Pending Invitations</p>
              <p className="text-xs text-gray-500">waiting for you</p>
              <button className="mt-3 text-sm text-red-400 hover:text-red-300">View Requests →</button>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            ℹ️ Platform Support (15%) + processing fees are deducted. Stripe handles all payments.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">⚙️ Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button onClick={() => setShowPastMeetupsModal(true)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">📅 Past Meetups</button>
            <button onClick={() => setShowLocationsModal(true)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">📍 My Locations</button>
            <button onClick={() => setShowScheduleModal(true)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">⏰ My Schedule</button>
            <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">🔒 Safety Guidelines</button>
            <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">⚖️ Legal Documents</button>
            <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">❓ Help & Support</button>
          </div>
        </div>

        {/* Legal Reminders */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-10">
          <h3 className="font-semibold mb-3">🛡️ Remember</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• You're an independent social participant, not an employee.</li>
            <li>• Meet only at public locations — no private residences.</li>
            <li>• GPS check-in required for every meetup.</li>
            <li>• Two-person only — no extra friends or spectators.</li>
            <li>• Report concerns immediately. We review within 24 hours.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-white/10">
          <div className="text-center text-xs text-gray-500 space-y-3">
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/terms" className="hover:text-white transition">Terms of Service</a>
              <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
              <a href="/safety" className="hover:text-white transition">Safety Guidelines</a>
              <a href="/contact" className="hover:text-white transition">Contact</a>
              <a href="/accessibility" className="hover:text-white transition">Accessibility</a>
            </div>
            <p>© 2026 Adonix Fit. All rights reserved.</p>
            <p className="text-xs text-gray-600">Adonix Fit is a social fitness network — not a professional service marketplace.</p>
            <p className="text-xs text-gray-600">📍 Meet only at public locations. GPS check-in required.</p>
          </div>
        </div>

        {/* ========== MODALS ========== */}

        {/* Locations Modal */}
        {showLocationsModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowLocationsModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">📍 My Meetup Locations</h2>
              <p className="text-xs text-gray-400 mb-4">Add public gyms, parks, or fitness centers where you meet clients.</p>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Gym name or park address..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500"
                />
                <button onClick={addLocation} className="px-4 py-2 bg-green-600 rounded-lg">Add</button>
              </div>
              
              <div className="space-y-2">
                {serviceAreas.map((area, index) => (
                  <div key={index} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                    <span className="text-sm">{area.name}</span>
                    <button onClick={() => removeLocation(index)} className="text-red-400 hover:text-red-300">Remove</button>
                  </div>
                ))}
              </div>
              
              <button onClick={() => setShowLocationsModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowScheduleModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">⏰ My Availability</h2>
              <p className="text-xs text-gray-400 mb-4">Select days and times you're available for meetups.</p>
              
              <div className="space-y-2">
                {availability.map((daySchedule) => (
                  <div key={daySchedule.day} className="border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleDay(daySchedule.day)}
                      className="w-full flex justify-between items-center p-3 bg-white/5 hover:bg-white/10"
                    >
                      <span className="font-medium">{daySchedule.day}</span>
                      <span>{expandedDays[daySchedule.day] ? '▼' : '▶'}</span>
                    </button>
                    {expandedDays[daySchedule.day] && (
                      <div className="p-3">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {generateTimeSlots(halfHourEnabled).map(time => (
                            <button
                              key={time}
                              onClick={() => toggleTimeSlot(daySchedule.day, time)}
                              className={`px-2 py-1 text-xs rounded-lg ${
                                daySchedule.times.includes(time)
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              {formatTimeLabel(time)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 mt-4">
                <button onClick={saveAvailability} className="flex-1 py-2 bg-green-600 rounded-lg">Save Schedule</button>
                <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-2 bg-gray-600 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Services Modal */}
        {showServicesModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowServicesModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">💪 My Services & Suggested Contributions</h2>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {SERVICE_TYPES.map(service => (
                  <button
                    key={service}
                    onClick={() => toggleServiceType(service)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      serviceTypes.includes(service)
                        ? 'bg-red-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
              
              {serviceTypes.map(service => (
                <div key={service} className="bg-white/5 rounded-xl p-3 mb-3">
                  <p className="font-medium mb-2">{service}</p>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-xs text-gray-400">Hourly</label>
                      <input
                        type="number"
                        value={serviceRates[service]?.hourly || ''}
                        onChange={(e) => updateServiceRate(service, 'hourly', e.target.value)}
                        placeholder="50-500"
                        className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                    {halfHourEnabled && (
                      <div>
                        <label className="text-xs text-gray-400">Half-Hour</label>
                        <input
                          type="number"
                          value={serviceRates[service]?.halfHour || ''}
                          onChange={(e) => updateServiceRate(service, 'halfHour', e.target.value)}
                          placeholder="30-250"
                          className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="flex items-center justify-between mt-4 mb-4">
                <span className="text-sm">Enable Half-Hour Meetups</span>
                <button
                  onClick={() => setHalfHourEnabled(!halfHourEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${halfHourEnabled ? 'bg-red-600' : 'bg-gray-600'}`}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${halfHourEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              
              <div className="flex gap-3">
                <button onClick={saveServices} className="flex-1 py-2 bg-green-600 rounded-lg">Save Services</button>
                <button onClick={() => setShowServicesModal(false)} className="flex-1 py-2 bg-gray-600 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Past Meetups Modal */}
        {showPastMeetupsModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowPastMeetupsModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">📅 Past Meetups</h2>
              
              {pastBookings.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No past meetups yet.</p>
              ) : (
                <div className="space-y-3">
                  {pastBookings.map(booking => (
                    <div key={booking.id} className="bg-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{booking.client?.first_name || 'Client'}</p>
                          <p className="text-sm text-gray-400">{booking.activity || 'Fitness'}</p>
                          <p className="text-xs text-gray-500">{new Date(booking.booking_date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button onClick={() => setShowPastMeetupsModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
            </div>
          </div>
        )}

        {/* Contributions History Modal */}
        {showContributionsModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowContributionsModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">💰 Contribution History</h2>
              
              {monthlyContributions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No contributions yet.</p>
              ) : (
                <div className="space-y-3">
                  {monthlyContributions.map((month, index) => (
                    <div key={index} className="flex justify-between items-center bg-white/5 rounded-xl p-3">
                      <span className="text-sm">{month.month}</span>
                      <span className="text-green-400 font-medium">${month.total}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="bg-yellow-500/10 rounded-xl p-3 mt-4">
                <p className="text-xs text-yellow-300">ℹ️ Platform Support (15%) + processing fees are deducted from each suggested contribution.</p>
              </div>
              
              <button onClick={() => setShowContributionsModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
            </div>
          </div>
        )}

        {/* Client Profile Modal */}
        {showClientModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowClientModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-white/10 mb-3">
                  {selectedBooking.client?.live_photo_url ? (
                    <img src={selectedBooking.client.live_photo_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                  )}
                </div>
                <h3 className="text-xl font-bold">{selectedBooking.client?.first_name || 'Client'}</h3>
                <p className="text-gray-400 text-sm">@{selectedBooking.client?.username || 'client'}</p>
                <p className="text-xs text-gray-500 mt-1">Member since: {selectedBooking.client?.created_at ? new Date(selectedBooking.client.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-300 italic">"{selectedBooking.client?.bio || 'Looking forward to moving together!'}"</p>
                {selectedBooking.client?.fitness_goals && selectedBooking.client.fitness_goals.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">Goals: {selectedBooking.client.fitness_goals.join(', ')}</p>
                )}
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-sm font-medium mb-2">📋 Meetup Request</p>
                <p className="text-sm">Activity: {selectedBooking.activity || 'Fitness'}</p>
                <p className="text-sm">Date: {new Date(selectedBooking.booking_date).toLocaleDateString()}</p>
                <p className="text-sm">Time: {new Date(selectedBooking.booking_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                <p className="text-sm">📍 {selectedBooking.location_name || 'Gold\'s Gym Downtown'}</p>
                <div className="border-t border-white/10 my-3 pt-3">
                  <p className="text-sm">Suggested Contribution: ${selectedBooking.suggested_contribution || 75}.00</p>
                  <p className="text-sm text-red-400">Platform Support (15%): -${((selectedBooking.suggested_contribution || 75) * 0.15).toFixed(2)}</p>
                  <p className="text-sm text-red-400">Processing fees: -${((selectedBooking.suggested_contribution || 75) * 0.029 + 0.30).toFixed(2)}</p>
                  <p className="text-sm font-bold text-green-400 mt-1">Your Net: ${calculateNetEarnings(selectedBooking.suggested_contribution || 75).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4">
                <p className="text-xs text-yellow-300 text-center">⚠️ This is a social meetup, not a professional service. Meet only at public locations. GPS check-in required.</p>
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')} className="flex-1 py-2 bg-green-600 rounded-lg text-sm font-medium">✅ Accept</button>
                <button onClick={() => updateBookingStatus(selectedBooking.id, 'declined')} className="flex-1 py-2 bg-red-600 rounded-lg text-sm font-medium">❌ Decline</button>
                <button className="px-3 py-2 bg-gray-700 rounded-lg text-sm">🚫 Report</button>
                <button className="px-3 py-2 bg-gray-700 rounded-lg text-sm">🔒 Block</button>
              </div>
              
              <button onClick={() => setShowClientModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg text-sm">Close</button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}