import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import LiveCameraCapture from './LiveCameraCapture';

export default function PartnerDashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [pendingMeetups, setPendingMeetups] = useState<any[]>([]);
  const [upcomingMeetups, setUpcomingMeetups] = useState<any[]>([]);
  const [allMeetups, setAllMeetups] = useState<any[]>([]);
  const [totalContributions, setTotalContributions] = useState(0);
  const [showEditBio, setShowEditBio] = useState(false);
  const [editBioText, setEditBioText] = useState(profile?.bio || '');
  const [bioError, setBioError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  
  // Modal states
  const [showCamera, setShowCamera] = useState(false);
  const [showAllMeetupsModal, setShowAllMeetupsModal] = useState(false);
  const [showContributionsModal, setShowContributionsModal] = useState(false);
  const [showVenuesModal, setShowVenuesModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPastMeetupsModal, setShowPastMeetupsModal] = useState(false);
  
  // Data for modals
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [customServiceTypes, setCustomServiceTypes] = useState<string[]>([]);
  const [serviceRates, setServiceRates] = useState<any>({});
  const [halfHourEnabled, setHalfHourEnabled] = useState(false);
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [pastMeetups, setPastMeetups] = useState<any[]>([]);

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
        setServiceTypes(data.service_types || []);
        setCustomServiceTypes(data.custom_service_types || []);
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
      
      const now = new Date();
      setPendingMeetups((data || []).filter(b => b.status === 'pending'));
      setUpcomingMeetups((data || []).filter(b => b.status === 'confirmed' && new Date(b.booking_date) > now).slice(0, 3));
      setAllMeetups((data || []).filter(b => b.status === 'confirmed' && new Date(b.booking_date) > now));
      setPastMeetups((data || []).filter(b => b.status === 'completed' || new Date(b.booking_date) < now));
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

  const handleCameraCapture = async (blobOrDataURL: Blob | string) => {
    if (!user) return;
    
    // Confirm before replacing
    const confirmed = window.confirm('Replace your current profile photo? This cannot be undone.');
    if (!confirmed) return;
    
    // Rest of upload logic from PartnerProfileSetup
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('You must be logged in to upload a photo.');
      return;
    }
    
    try {
      let jpegBlob: Blob;
      if (typeof blobOrDataURL === 'string') {
        jpegBlob = dataURLtoBlob(blobOrDataURL);
      } else {
        jpegBlob = blobOrDataURL;
      }
      const fileName = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, jpegBlob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ live_photo_url: url }).eq('id', user.id);
      await refreshProfile();
      alert('Profile photo updated!');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload photo');
    } finally {
      setShowCamera(false);
    }
  };

  const dataURLtoBlob = (dataURL: string): Blob => {
    const [header, data] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(data);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const calculatePartnerShare = (contribution: number) => {
    const platformSupport = contribution * 0.15;
    const processingFee = contribution * 0.029 + 0.30;
    return contribution - platformSupport - processingFee;
  };

  // Time slots for schedule modal
  const generateTimeSlots = (includeHalfHour: boolean): string[] => {
    const slots: string[] = [];
    for (let h = 6; h <= 22; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      if (includeHalfHour && h < 22) slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const formatTimeLabel = (time: string): string => {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    const period = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display}:${minute} ${period}`;
  };

  const toggleDay = (day: string) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const toggleTimeSlot = (day: string, time: string) => {
    setAvailability(prev => prev.map(a => {
      if (a.day !== day) return a;
      const times = a.times.includes(time) ? a.times.filter(t => t !== time) : [...a.times, time].sort();
      return { ...a, times };
    }));
  };

  const saveAvailability = async () => {
    await supabase.from('profiles').update({ availability }).eq('id', user?.id);
    alert('Schedule saved!');
    setShowScheduleModal(false);
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

  const updateServiceRate = (service: string, field: 'hourly' | 'halfHour', value: string) => {
    const num = parseInt(value) || 0;
    setServiceRates(prev => ({
      ...prev,
      [service]: { ...(prev[service] || { hourly: 0, halfHour: 0 }), [field]: num }
    }));
  };

  const toggleServiceType = (service: string) => {
    setServiceTypes(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const saveServices = async () => {
    await supabase.from('profiles').update({
      service_types: serviceTypes,
      custom_service_types: customServiceTypes,
      service_rates: serviceRates,
      half_hour_enabled: halfHourEnabled
    }).eq('id', user?.id);
    alert('Services saved!');
    setShowServicesModal(false);
  };

  const allServices = [...serviceTypes, ...customServiceTypes];
  const SERVICE_TYPES = [
    'Walking', 'Jogging', 'Running', 'Biking', 'Yoga', 'Weight Lifting',
    'HIIT', 'Calisthenics', 'Swimming', 'Boxing', 'Pilates', 'Stretching'
  ];
  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
          <span className="text-2xl font-bold text-red-500">ADONIX</span>
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
                  <button onClick={() => { setShowVenuesModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">📍 Verified Venues</button>
                  <button onClick={() => { setShowServicesModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">💪 Services & Rates</button>
                  <button onClick={() => { setShowScheduleModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">⏰ My Schedule</button>
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
          <button 
            onClick={() => setShowCamera(true)}
            className="relative w-32 h-32 rounded-full mx-auto overflow-hidden bg-red-500/20 border-4 border-red-500/30 mb-4 cursor-pointer hover:opacity-80 transition"
          >
            {profile?.live_photo_url ? (
              <img src={profile.live_photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <span className="text-white text-xs">Tap to change</span>
            </div>
          </button>
          <div className="text-xs text-red-400 mb-2">LIVE ID ✓</div>
          
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
            <>
              <p className="text-gray-300 max-w-md mx-auto">{profile?.bio || 'No bio yet.'}</p>
              <button onClick={() => setShowEditBio(true)} className="text-sm text-red-400 hover:text-red-300 mt-2">✏️ Edit Bio</button>
            </>
          )}
          
          <div className="text-xs text-gray-500 mt-4 space-y-1">
            <p>🔹 AUTHENTICITY CHECK: Live Camera Only. AI-generated faces or filters are prohibited.</p>
            <p>🔹 This is a social meetup platform, not a professional service.</p>
          </div>
        </div>

        {/* Pending Requests Section */}
        {pendingMeetups.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">📋 Pending Meetup Invitations</h2>
              <button className="text-sm text-red-400 hover:text-red-300">View All →</button>
            </div>
            {pendingMeetups.map((meetup) => {
              const partnerShare = calculatePartnerShare(meetup.suggested_contribution || 75);
              return (
                <div key={meetup.id} className="bg-white/5 rounded-2xl p-5 mb-3 border border-white/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-lg">Member: {meetup.client_id?.slice(0, 8)}</p>
                      <p className="text-sm text-gray-400">{meetup.activity || 'Fitness'} • {new Date(meetup.booking_date).toLocaleDateString()}</p>
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

        {/* Upcoming Soon Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">⏰ Upcoming Soon</h2>
            <button onClick={() => setShowAllMeetupsModal(true)} className="text-sm text-red-400 hover:text-red-300">View All →</button>
          </div>
          {upcomingMeetups.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-8 text-center border border-white/10">
              <p className="text-gray-400">No upcoming meetups scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetups.map((meetup, i) => {
                const partnerShare = calculatePartnerShare(meetup.suggested_contribution || 75);
                return (
                  <div key={meetup.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{new Date(meetup.booking_date).toLocaleDateString()} at {new Date(meetup.booking_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                        <p className="text-sm text-gray-400">{meetup.activity || 'Fitness'} with Member</p>
                      </div>
                      <p className="text-green-400 text-sm">Your Share: ${partnerShare.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="text-xs px-3 py-1 bg-white/10 rounded-full">View Details</button>
                      <button className="text-xs px-3 py-1 bg-red-500/20 rounded-full">Cancel</button>
                      <button className="text-xs px-3 py-1 bg-blue-500/20 rounded-full">Request Change</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button onClick={() => setShowAllMeetupsModal(true)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">📅 All Meetups</button>
          <button onClick={() => setShowContributionsModal(true)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">💰 Contributions</button>
          <button onClick={() => setShowVenuesModal(true)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">📍 Verified Venues</button>
          <button onClick={() => setShowServicesModal(true)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">💪 Services & Rates</button>
          <button onClick={() => setShowScheduleModal(true)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">⏰ My Schedule</button>
          <button onClick={() => setShowPastMeetupsModal(true)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">📅 Past Meetups</button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-2xl p-5 text-center border border-white/10">
            <p className="text-3xl font-bold text-green-400">${totalContributions}</p>
            <p className="text-sm text-gray-400">Total Contributions</p>
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
      </div>

      {/* ========== MODALS ========== */}

      {/* Camera Modal */}
      {showCamera && (
        <LiveCameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          aspectRatio="square"
        />
      )}

      {/* All Meetups Modal */}
      {showAllMeetupsModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowAllMeetupsModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">📅 All Upcoming Meetups</h2>
            {allMeetups.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No upcoming meetups.</p>
            ) : (
              allMeetups.map((meetup) => (
                <div key={meetup.id} className="bg-white/5 rounded-xl p-4 mb-3">
                  <p>{new Date(meetup.booking_date).toLocaleDateString()} at {new Date(meetup.booking_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                  <p className="text-sm text-gray-400">{meetup.activity || 'Fitness'}</p>
                  <div className="flex gap-2 mt-2">
                    <button className="text-xs px-3 py-1 bg-white/10 rounded-full">View</button>
                    <button className="text-xs px-3 py-1 bg-red-500/20 rounded-full">Cancel</button>
                  </div>
                </div>
              ))
            )}
            <button onClick={() => setShowAllMeetupsModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
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

      {/* Venues Modal */}
      {showVenuesModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowVenuesModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">📍 Verified Public Venues</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Gym or park name..." className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm" />
              <button onClick={addLocation} className="px-3 py-2 bg-green-600 rounded-lg text-sm">Add</button>
            </div>
            {serviceAreas.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No venues added yet.</p>
            ) : (
              serviceAreas.map((area, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-2 mb-2">
                  <span className="text-sm">📍 {area.name}</span>
                  <button onClick={() => removeLocation(i)} className="text-red-400 text-sm">Remove</button>
                </div>
              ))
            )}
            <p className="text-xs text-yellow-400 mt-3">⚠️ Only public gyms, parks, and recreation centers are permitted.</p>
            <button onClick={() => setShowVenuesModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Services & Rates Modal */}
      {showServicesModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowServicesModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">💪 Services & Suggested Contributions</h2>
            
            <div className="flex flex-wrap gap-2 mb-6">
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
                    <label className="text-xs text-gray-400">Hourly ($50-500)</label>
                    <input
                      type="number"
                      value={serviceRates[service]?.hourly || ''}
                      onChange={(e) => updateServiceRate(service, 'hourly', e.target.value)}
                      placeholder="50"
                      className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  {halfHourEnabled && (
                    <div>
                      <label className="text-xs text-gray-400">Half-Hour ($30-250)</label>
                      <input
                        type="number"
                        value={serviceRates[service]?.halfHour || ''}
                        onChange={(e) => updateServiceRate(service, 'halfHour', e.target.value)}
                        placeholder="30"
                        className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between mt-4 mb-6">
              <span className="text-sm">Enable Half-Hour Meetups</span>
              <button
                onClick={() => setHalfHourEnabled(!halfHourEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${halfHourEnabled ? 'bg-red-600' : 'bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${halfHourEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={saveServices} className="flex-1 py-2 bg-green-600 rounded-lg">Save Changes</button>
              <button onClick={() => setShowServicesModal(false)} className="flex-1 py-2 bg-gray-600 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowScheduleModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">⏰ My Availability</h2>
            
            {DAYS_OF_WEEK.map(day => {
              const dayAvail = availability.find(a => a.day === day) || { day, times: [] };
              const isExpanded = expandedDays[day];
              return (
                <div key={day} className="border border-white/10 rounded-xl overflow-hidden mb-2">
                  <button
                    onClick={() => toggleDay(day)}
                    className="w-full flex justify-between items-center p-3 bg-white/5 hover:bg-white/10"
                  >
                    <span className="font-medium">{day}</span>
                    <span>{isExpanded ? '▼' : '▶'}</span>
                  </button>
                  {isExpanded && (
                    <div className="p-3">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {generateTimeSlots(halfHourEnabled).map(time => (
                          <button
                            key={time}
                            onClick={() => toggleTimeSlot(day, time)}
                            className={`px-2 py-1 text-xs rounded-lg ${
                              dayAvail.times.includes(time)
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
              );
            })}
            
            <div className="flex gap-3 mt-4">
              <button onClick={saveAvailability} className="flex-1 py-2 bg-green-600 rounded-lg">Save Schedule</button>
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-2 bg-gray-600 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Past Meetups Modal */}
      {showPastMeetupsModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowPastMeetupsModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">📅 Past Meetups</h2>
            {pastMeetups.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No past meetups.</p>
            ) : (
              pastMeetups.map(m => (
                <div key={m.id} className="bg-white/5 rounded-lg p-3 mb-2">
                  <p>{new Date(m.booking_date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-400">{m.activity || 'Fitness'}</p>
                </div>
              ))
            )}
            <button onClick={() => setShowPastMeetupsModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}