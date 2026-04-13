import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function PartnerDashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [pastBookings, setPastBookings] = useState<any[]>([]);
  const [totalContributions, setTotalContributions] = useState(0);
  const [showEditBio, setShowEditBio] = useState(false);
  const [editBioText, setEditBioText] = useState(profile?.bio || '');
  const [bioError, setBioError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPastMeetupsModal, setShowPastMeetupsModal] = useState(false);
  const [showContributionsModal, setShowContributionsModal] = useState(false);
  
  // Profile data
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [customServiceTypes, setCustomServiceTypes] = useState<string[]>([]);
  const [serviceRates, setServiceRates] = useState<Record<string, { hourly: number; halfHour: number }>>({});
  const [halfHourEnabled, setHalfHourEnabled] = useState(false);
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

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
        .select('service_types, custom_service_types, service_rates, half_hour_enabled, service_areas, availability')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setServiceTypes(data.service_types || []);
        setCustomServiceTypes(data.custom_service_types || []);
        setServiceRates(data.service_rates || {});
        setHalfHourEnabled(data.half_hour_enabled || false);
        setServiceAreas(data.service_areas || []);
        setAvailability(data.availability || []);
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', user.id);

      if (error) throw error;

      const pending = (data || []).filter(b => b.status === 'pending');
      const upcoming = (data || []).filter(b => b.status === 'confirmed' && new Date(b.booking_date) > new Date());
      const past = (data || []).filter(b => b.status === 'completed');

      setPendingBookings(pending);
      setUpcomingBookings(upcoming.slice(0, 4));
      setPastBookings(past);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchContributions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('hourly_rate')
        .eq('partner_id', user.id)
        .eq('status', 'completed');

      if (error) throw error;
      const total = (data || []).reduce((sum, b) => sum + (b.hourly_rate || 0), 0);
      setTotalContributions(total);
    } catch (err) {
      console.error('Error fetching contributions:', err);
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
      alert('Failed to update bio');
    }
  };

  const addLocation = async () => {
    if (!newLocation.trim()) return;
    const updated = [...serviceAreas, { name: newLocation.trim(), lat: null, lng: null }];
    setServiceAreas(updated);
    await supabase.from('profiles').update({ service_areas: updated }).eq('id', user?.id);
    setNewLocation('');
  };

  const removeLocation = async (index: number) => {
    const updated = serviceAreas.filter((_, i) => i !== index);
    setServiceAreas(updated);
    await supabase.from('profiles').update({ service_areas: updated }).eq('id', user?.id);
  };

  const calculateNetEarnings = (rate: number) => {
    const platformFee = rate * 0.15;
    const processingFee = rate * 0.029 + 0.30;
    return rate - platformFee - processingFee;
  };

  const allServices = [...serviceTypes, ...customServiceTypes];

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
      {/* Navbar */}
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
              <span>⚙️</span> <span>Settings</span> <span>▼</span>
            </button>
            {showSettingsDropdown && (
              <div className="settings-dropdown absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-20">
                <div className="py-2">
                  <button onClick={() => { setShowEditProfileModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">✏️ Edit Profile</button>
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
        <div className="text-center mb-8">
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
                <p className="text-xs text-gray-400">{editBioText.length}/500</p>
                {bioError && <p className="text-xs text-red-400">{bioError}</p>}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={updateBio} className="flex-1 px-4 py-2 bg-green-600 rounded-lg">Save</button>
                <button onClick={() => { setShowEditBio(false); setBioError(''); }} className="flex-1 px-4 py-2 bg-gray-600 rounded-lg">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 max-w-md mx-auto mb-4">{profile?.bio || 'No bio yet.'}</p>
          )}
          
          <div className="flex justify-center gap-3 mb-3">
            <button onClick={() => setShowEditBio(true)} className="px-4 py-2 bg-white/10 rounded-full text-sm">✏️ Edit Bio</button>
            <button className="px-4 py-2 bg-white/10 rounded-full text-sm">📸 Change Photo</button>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>🔹 Profile info is self-reported — not verified by Adonix Fit.</p>
            <p>🔹 This is a social meetup platform, not a professional service.</p>
          </div>
        </div>

        {/* Services & Rates Section */}
        <div className="mb-8 bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">💪 Your Services & Suggested Contributions</h2>
          {allServices.length === 0 ? (
            <p className="text-gray-400">No services added yet. Click Edit Profile to add services.</p>
          ) : (
            <div className="space-y-3">
              {allServices.map(service => {
                const rate = serviceRates[service];
                return (
                  <div key={service} className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="font-medium">{service}</span>
                    <div className="text-right">
                      <span className="text-green-400">${rate?.hourly || 0}/hr</span>
                      {halfHourEnabled && rate?.halfHour > 0 && (
                        <span className="text-gray-400 text-sm ml-2">(${rate.halfHour}/30min)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={() => setShowEditProfileModal(true)} className="mt-4 text-sm text-red-400 hover:text-red-300">Edit Services →</button>
        </div>

        {/* Locations Section */}
        <div className="mb-8 bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">📍 Your Meetup Locations</h2>
          {serviceAreas.length === 0 ? (
            <p className="text-gray-400">No locations added yet. Click Edit Profile to add public meetup spots.</p>
          ) : (
            <div className="space-y-2">
              {serviceAreas.map((area, idx) => (
                <div key={idx} className="flex items-center gap-2 text-gray-300">
                  <span>📍</span>
                  <span className="text-sm">{area.name}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowEditProfileModal(true)} className="mt-4 text-sm text-red-400 hover:text-red-300">Edit Locations →</button>
        </div>

        {/* Availability Section */}
        <div className="mb-8 bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">⏰ Your Availability</h2>
          {availability.length === 0 || availability.every(d => d.times.length === 0) ? (
            <p className="text-gray-400">No availability set. Click Edit Profile to add your schedule.</p>
          ) : (
            <div className="space-y-2">
              {availability.filter(d => d.times.length > 0).slice(0, 5).map(day => (
                <div key={day.day} className="text-sm text-gray-300">
                  <span className="font-medium">{day.day}:</span> {day.times.slice(0, 3).join(', ')}{day.times.length > 3 && '...'}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowEditProfileModal(true)} className="mt-4 text-sm text-red-400 hover:text-red-300">Edit Schedule →</button>
        </div>

        {/* Upcoming Meetups */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">⏰ Your Upcoming Meetups</h2>
          {upcomingBookings.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-8 text-center">
              <p className="text-gray-400">No meetups scheduled yet.</p>
            </div>
          ) : (
            upcomingBookings.map((booking, idx) => (
              <div key={booking.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
                <p className="font-semibold">{idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : '📅 '}{new Date(booking.booking_date).toLocaleDateString()}</p>
                <p className="text-green-400">Your Net: ${calculateNetEarnings(booking.hourly_rate || 75).toFixed(2)}</p>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">💰 Your Net Contributions</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-green-400">${totalContributions}</p>
              <p className="text-sm text-gray-400">Total Contributions</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-yellow-400">{pendingBookings.length}</p>
              <p className="text-sm text-gray-400">Pending Invitations</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-white/10 text-center text-xs text-gray-500">
          <div className="flex flex-wrap justify-center gap-4 mb-3">
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/safety" className="hover:text-white">Safety</a>
          </div>
          <p>© 2026 Adonix Fit. Social fitness network — not a professional service.</p>
        </div>

        {/* Edit Profile Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowEditProfileModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">✏️ Edit Profile</h2>
              
              {/* Locations Tab */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">📍 Locations</h3>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Gym or park name..." className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm" />
                  <button onClick={addLocation} className="px-3 py-2 bg-green-600 rounded-lg text-sm">Add</button>
                </div>
                {serviceAreas.map((area, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-2 mb-1">
                    <span className="text-sm">{area.name}</span>
                    <button onClick={() => removeLocation(i)} className="text-red-400 text-sm">Remove</button>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-white/10 pt-4 mt-2">
                <p className="text-xs text-gray-400">For full profile editing (services, rates, schedule), please visit the profile setup page.</p>
                <button onClick={() => setShowEditProfileModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Past Meetups Modal */}
        {showPastMeetupsModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowPastMeetupsModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">📅 Past Meetups</h2>
              {pastBookings.length === 0 ? <p className="text-gray-400 text-center py-4">No past meetups.</p> : pastBookings.map(b => (
                <div key={b.id} className="bg-white/5 rounded-lg p-3 mb-2">
                  <p>{new Date(b.booking_date).toLocaleDateString()}</p>
                </div>
              ))}
              <button onClick={() => setShowPastMeetupsModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
            </div>
          </div>
        )}

        {/* Contributions Modal */}
        {showContributionsModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowContributionsModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">💰 Contribution History</h2>
              <p className="text-center text-3xl text-green-400">${totalContributions}</p>
              <p className="text-center text-gray-400 text-sm mt-1">Total all time</p>
              <button onClick={() => setShowContributionsModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}