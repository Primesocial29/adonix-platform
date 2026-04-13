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
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [newLocation, setNewLocation] = useState('');

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
        .select('service_areas')
        .eq('id', user.id)
        .single();
      if (data) {
        setServiceAreas(data.service_areas || []);
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
            <button onClick={() => setShowEditProfileModal(true)} className="px-4 py-2 bg-white/10 rounded-full text-sm">⚙️ Edit Profile</button>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>🔹 Profile info is self-reported — not verified by Adonix Fit.</p>
            <p>🔹 This is a social meetup platform, not a professional service.</p>
          </div>
        </div>

        {/* Pending Invitations */}
        {pendingBookings.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">📋 New Meetup Invitations</h2>
            {pendingBookings.map((booking) => (
              <div key={booking.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-3">
                <p className="font-semibold">Client: {booking.client_id}</p>
                <p className="text-sm text-gray-400">{new Date(booking.booking_date).toLocaleDateString()}</p>
                <p className="text-sm text-green-400">Suggested: ${booking.hourly_rate || 75}</p>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Meetups */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">⏰ Your Upcoming Meetups</h2>
          {upcomingBookings.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-8 text-center">
              <p className="text-gray-400">No meetups scheduled yet.</p>
            </div>
          ) : (
            upcomingBookings.map((booking, idx) => (
              <div key={booking.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-3">
                <p className="font-semibold">{idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : '📅 '}{new Date(booking.booking_date).toLocaleDateString()}</p>
                <p className="text-green-400">Your Net: ${calculateNetEarnings(booking.hourly_rate || 75).toFixed(2)}</p>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mb-10">
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

        {/* Edit Profile Modal (simplified) */}
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowEditProfileModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">📍 My Locations</h2>
              <div className="flex gap-2 mb-4">
                <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Gym or park name..." className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                <button onClick={addLocation} className="px-4 py-2 bg-green-600 rounded-lg">Add</button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {serviceAreas.map((area, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                    <span className="text-sm">{area.name}</span>
                    <button onClick={() => removeLocation(i)} className="text-red-400">Remove</button>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowEditProfileModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
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