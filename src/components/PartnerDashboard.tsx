import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function PartnerDashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [totalContributions, setTotalContributions] = useState(0);
  const [showEditBio, setShowEditBio] = useState(false);
  const [editBioText, setEditBioText] = useState(profile?.bio || '');
  const [bioError, setBioError] = useState('');
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [serviceRates, setServiceRates] = useState<any>({});
  const [halfHourEnabled, setHalfHourEnabled] = useState(false);
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    if (user) {
      loadProfileData();
      fetchBookings();
      fetchContributions();
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
        setServiceTypes([...(data.service_types || []), ...(data.custom_service_types || [])]);
        setServiceRates(data.service_rates || {});
        setHalfHourEnabled(data.half_hour_enabled || false);
        setServiceAreas(data.service_areas || []);
        setAvailability(data.availability || []);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', user.id);
      
      setPendingBookings((data || []).filter(b => b.status === 'pending'));
      setUpcomingBookings((data || []).filter(b => b.status === 'confirmed' && new Date(b.booking_date) > new Date()).slice(0, 4));
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchContributions = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('bookings')
        .select('hourly_rate')
        .eq('partner_id', user.id)
        .eq('status', 'completed');
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
      await supabase.from('profiles').update({ bio: editBioText }).eq('id', user?.id);
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

  const calculateNet = (rate: number) => rate - (rate * 0.15) - (rate * 0.029 + 0.30);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 rounded-full mx-auto overflow-hidden bg-red-500/20 border-4 border-red-500/30 mb-4">
            {profile?.live_photo_url ? (
              <img src={profile.live_photo_url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
            )}
          </div>
          <h1 className="text-2xl font-bold">Hello, {profile?.first_name || 'Partner'}! 👋</h1>
          
          {showEditBio ? (
            <div className="max-w-md mx-auto mt-4">
              <textarea
                value={editBioText}
                onChange={(e) => setEditBioText(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={updateBio} className="flex-1 px-4 py-2 bg-green-600 rounded-lg">Save</button>
                <button onClick={() => setShowEditBio(false)} className="flex-1 px-4 py-2 bg-gray-600 rounded-lg">Cancel</button>
              </div>
              {bioError && <p className="text-red-400 text-sm mt-1">{bioError}</p>}
            </div>
          ) : (
            <p className="text-gray-300 max-w-md mx-auto mt-2">{profile?.bio || 'No bio yet.'}</p>
          )}
          
          <div className="flex justify-center gap-3 mt-3">
            <button onClick={() => setShowEditBio(true)} className="px-4 py-2 bg-white/10 rounded-full text-sm">✏️ Edit Bio</button>
            <button className="px-4 py-2 bg-white/10 rounded-full text-sm">📸 Change Photo</button>
            <button onClick={() => setShowEditProfileModal(true)} className="px-4 py-2 bg-white/10 rounded-full text-sm">📍 Edit Locations</button>
          </div>
          
          <div className="text-xs text-gray-500 mt-3">
            <p>🔹 Profile info is self-reported — not verified by Adonix Fit.</p>
            <p>🔹 This is a social meetup platform, not a professional service.</p>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white/5 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">💪 Your Services</h2>
          {serviceTypes.length === 0 ? (
            <p className="text-gray-400">No services added yet.</p>
          ) : (
            serviceTypes.map(service => (
              <div key={service} className="flex justify-between items-center py-2 border-b border-white/10">
                <span>{service}</span>
                <span className="text-green-400">${serviceRates[service]?.hourly || 0}/hr</span>
              </div>
            ))
          )}
        </div>

        {/* Locations Section */}
        <div className="bg-white/5 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">📍 Meetup Locations</h2>
          {serviceAreas.length === 0 ? (
            <p className="text-gray-400">No locations added yet.</p>
          ) : (
            serviceAreas.map((area, i) => (
              <div key={i} className="py-1 text-gray-300">📍 {area.name}</div>
            ))
          )}
        </div>

        {/* Upcoming Meetups */}
        <div className="bg-white/5 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">⏰ Upcoming Meetups</h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-gray-400">No upcoming meetups.</p>
          ) : (
            upcomingBookings.map((booking, i) => (
              <div key={booking.id} className="py-2 border-b border-white/10">
                <span className="font-medium">{i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : '📅 '}</span>
                {new Date(booking.booking_date).toLocaleDateString()}
                <span className="float-right text-green-400">${calculateNet(booking.hourly_rate || 75).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-green-400">${totalContributions}</p>
            <p className="text-sm text-gray-400">Total Contributions</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-yellow-400">{pendingBookings.length}</p>
            <p className="text-sm text-gray-400">Pending Invitations</p>
          </div>
        </div>

        {/* Edit Locations Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowEditProfileModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">📍 Manage Locations</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Gym or park name..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <button onClick={addLocation} className="px-4 py-2 bg-green-600 rounded-lg">Add</button>
              </div>
              {serviceAreas.map((area, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-2 mb-2">
                  <span>{area.name}</span>
                  <button onClick={() => removeLocation(i)} className="text-red-400">Remove</button>
                </div>
              ))}
              <button onClick={() => setShowEditProfileModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-8 border-t border-white/10 text-center text-xs text-gray-500">
          <div className="flex flex-wrap justify-center gap-4 mb-3">
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/safety" className="hover:text-white">Safety</a>
          </div>
          <p>© 2026 Adonix Fit. Social fitness network — not a professional service.</p>
        </div>
      </div>
    </div>
  );
}