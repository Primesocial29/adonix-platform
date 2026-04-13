import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function PartnerDashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [pendingMeetups, setPendingMeetups] = useState<any[]>([]);
  const [upcomingMeetups, setUpcomingMeetups] = useState<any[]>([]);
  const [pastMeetups, setPastMeetups] = useState<any[]>([]);
  const [totalContributions, setTotalContributions] = useState(0);
  const [showEditBio, setShowEditBio] = useState(false);
  const [editBioText, setEditBioText] = useState(profile?.bio || '');
  const [bioError, setBioError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPastMeetupsModal, setShowPastMeetupsModal] = useState(false);
  const [showContributionsModal, setShowContributionsModal] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [serviceRates, setServiceRates] = useState<any>({});
  const [halfHourEnabled, setHalfHourEnabled] = useState(false);
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    if (user) {
      loadProfileData();
      fetchMeetups();
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

  const fetchMeetups = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', user.id);
      
      setPendingMeetups((data || []).filter(b => b.status === 'pending'));
      setUpcomingMeetups((data || []).filter(b => b.status === 'confirmed' && new Date(b.booking_date) > new Date()).slice(0, 4));
      setPastMeetups((data || []).filter(b => b.status === 'completed'));
    } catch (err) {
      console.error('Error fetching meetups:', err);
    }
  };

  const fetchContributions = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('bookings')
        .select('suggested_contribution')
        .eq('partner_id', user.id)
        .eq('status', 'completed');
      const total = (data || []).reduce((sum, b) => sum + (b.suggested_contribution || 0), 0);
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

  const calculatePartnerShare = (contribution: number) => {
    const platformSupport = contribution * 0.15;
    const processingFee = contribution * 0.029 + 0.30;
    return contribution - platformSupport - processingFee;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
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
            <span className="font-bold text-xl text-red-500">ADONIX</span>
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
        
        {/* Profile Header - Verified Identity Badge */}
        <div className="text-center mb-8">
          <div className="relative w-32 h-32 rounded-full mx-auto overflow-hidden bg-red-500/20 border-4 border-red-500/30 mb-4">
            {profile?.live_photo_url ? (
              <img src={profile.live_photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
            )}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
              LIVE ID ✓
            </div>
          </div>
          
          <h1 className="text-2xl font-bold">Hello, {profile?.first_name || 'Partner'}! 👋</h1>
          
          {showEditBio ? (
            <div className="max-w-md mx-auto mt-4">
              <textarea
                value={editBioText}
                onChange={(e) => setEditBioText(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                rows={3}
                placeholder="Share your philosophy... (20-500 characters)"
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
            <button className="px-4 py-2 bg-white/10 rounded-full text-sm">📸 Capture Live Identity</button>
            <button onClick={() => setShowEditProfileModal(true)} className="px-4 py-2 bg-white/10 rounded-full text-sm">📍 Verified Venues</button>
          </div>
          
          <div className="text-xs text-gray-500 mt-3 space-y-1">
            <p>🔹 AUTHENTICITY CHECK: Live Camera Only. AI-generated faces or filters are prohibited.</p>
            <p>🔹 This is a social meetup platform, not a professional service.</p>
            <p>🔹 Profile info is self-reported — not verified by Adonix.</p>
          </div>
        </div>

        {/* Pending Meetups Section */}
        {pendingMeetups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">📋 Pending Meetup Invitations</h2>
            {pendingMeetups.map((meetup) => {
              const partnerShare = calculatePartnerShare(meetup.suggested_contribution || 75);
              return (
                <div key={meetup.id} className="bg-white/5 rounded-2xl p-5 mb-3 border border-white/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-lg">Member: {meetup.client_id?.slice(0, 8)}</p>
                      <p className="text-sm text-gray-400">{new Date(meetup.booking_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 mb-4">
                    <p className="text-sm">Suggested Contribution: ${meetup.suggested_contribution || 75}.00</p>
                    <p className="text-sm text-red-400">Platform Support (15%): -${((meetup.suggested_contribution || 75) * 0.15).toFixed(2)}</p>
                    <p className="text-sm text-red-400">Processing: -${((meetup.suggested_contribution || 75) * 0.029 + 0.30).toFixed(2)}</p>
                    <p className="text-sm font-bold text-green-400 mt-1">Your Share: ${partnerShare.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-green-600 rounded-lg text-sm hover:bg-green-700">✅ Accept</button>
                    <button className="px-4 py-2 bg-red-600 rounded-lg text-sm hover:bg-red-700">❌ Decline</button>
                    <button className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">👤 View Member</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Services Section */}
        <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
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

        {/* Verified Venues Section */}
        <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-3">📍 Verified Public Venues</h2>
          {serviceAreas.length === 0 ? (
            <p className="text-gray-400">No venues added yet.</p>
          ) : (
            serviceAreas.map((area, i) => (
              <div key={i} className="py-1 text-gray-300">📍 {area.name}</div>
            ))
          )}
          <p className="text-xs text-yellow-400 mt-3">⚠️ PUBLIC-FLOOR POLICY: All meetups must occur in verified public gyms, parks, or recreation centers. Private residences are strictly excluded.</p>
        </div>

        {/* Upcoming Meetups */}
        <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-3">⏰ Your Upcoming Meetups</h2>
          {upcomingMeetups.length === 0 ? (
            <p className="text-gray-400">No upcoming meetups scheduled.</p>
          ) : (
            upcomingMeetups.map((meetup, i) => {
              const partnerShare = calculatePartnerShare(meetup.suggested_contribution || 75);
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📅';
              return (
                <div key={meetup.id} className="py-3 border-b border-white/10">
                  <p className="font-medium">{medal} {new Date(meetup.booking_date).toLocaleDateString()}</p>
                  <p className="text-green-400 text-sm">Your Share: ${partnerShare.toFixed(2)}</p>
                  <div className="flex gap-2 mt-2">
                    <button className="text-xs px-3 py-1 bg-white/10 rounded-full">View Details</button>
                    <button className="text-xs px-3 py-1 bg-red-500/20 rounded-full">Cancel</button>
                    <button className="text-xs px-3 py-1 bg-blue-500/20 rounded-full">Request Change</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-2xl p-5 text-center border border-white/10">
            <p className="text-3xl font-bold text-green-400">${totalContributions}</p>
            <p className="text-sm text-gray-400">Total Suggested Contributions</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-5 text-center border border-white/10">
            <p className="text-3xl font-bold text-yellow-400">{pendingMeetups.length}</p>
            <p className="text-sm text-gray-400">Pending Invitations</p>
          </div>
        </div>

        {/* Financial Disclaimer */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-6">
          <p className="text-xs text-blue-300 text-center">
            💰 Adonix provides the platform for public meetups. Suggested contributions are support for the Partner's time and are not wages for employment.
          </p>
        </div>

        {/* Legal Reminders */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold mb-3">🛡️ High-Standard Protocol</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• You are an independent social participant, not an employee.</li>
            <li>• Meet only at verified public venues — private residences are strictly excluded.</li>
            <li>• GPS check-in required for every meetup.</li>
            <li>• Two-person only — no extra friends or spectators.</li>
            <li>• Report concerns immediately. We review within 24 hours.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-white/10 text-center text-xs text-gray-500">
          <div className="flex flex-wrap justify-center gap-4 mb-3">
            <a href="/terms" className="hover:text-white">Terms of Service</a>
            <a href="/privacy" className="hover:text-white">Privacy Policy</a>
            <a href="/safety" className="hover:text-white">Safety Guidelines</a>
          </div>
          <p>© 2026 Adonix. All rights reserved. Elite Social Fitness Network.</p>
        </div>

        {/* Edit Profile Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowEditProfileModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">✏️ Edit Profile</h2>
              
              <div className="mb-6">
                <h3 className="font-semibold mb-2">📍 Verified Public Venues</h3>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Gym or park name..." className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm" />
                  <button onClick={addLocation} className="px-3 py-2 bg-green-600 rounded-lg text-sm">Add Venue</button>
                </div>
                {serviceAreas.map((area, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-2 mb-1">
                    <span className="text-sm">📍 {area.name}</span>
                    <button onClick={() => removeLocation(i)} className="text-red-400 text-sm">Remove</button>
                  </div>
                ))}
                <p className="text-xs text-yellow-400 mt-3">⚠️ Only public gyms, parks, and recreation centers are permitted.</p>
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <button onClick={() => setShowEditProfileModal(false)} className="w-full py-2 bg-white/10 rounded-lg">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Past Meetups Modal */}
        {showPastMeetupsModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowPastMeetupsModal(false)}>
            <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">📅 Past Meetups</h2>
              {pastMeetups.length === 0 ? <p className="text-gray-400 text-center py-4">No past meetups.</p> : pastMeetups.map(m => (
                <div key={m.id} className="bg-white/5 rounded-lg p-3 mb-2">
                  <p>{new Date(m.booking_date).toLocaleDateString()}</p>
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
              <p className="text-xs text-gray-500 text-center mt-4">Platform Support (15%) + processing fees are deducted.</p>
              <button onClick={() => setShowContributionsModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}