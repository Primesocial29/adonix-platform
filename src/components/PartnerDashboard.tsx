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
  
  // Legal modal states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  
  // Photo Gallery States
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [showPhotoGalleryModal, setShowPhotoGalleryModal] = useState(false);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const MAX_PHOTOS = 6;
  
  // Modal states
  const [showCamera, setShowCamera] = useState(false);
  const [showAllMeetupsModal, setShowAllMeetupsModal] = useState(false);
  const [showContributionsModal, setShowContributionsModal] = useState(false);
  const [showVenuesModal, setShowVenuesModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
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

  // Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  useEffect(() => {
    if (user) {
      loadProfileData();
      fetchMeetups();
      fetchContributions();
      loadPhotos();
    }
  }, [user]);

  const loadPhotos = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('photos, live_photo_url')
        .eq('id', user.id)
        .single();
      
      let photoArray: string[] = [];
      
      if (data?.photos && data.photos.length > 0) {
        photoArray = data.photos;
      } else if (data?.live_photo_url) {
        photoArray = [data.live_photo_url];
      }
      
      setAllPhotos(photoArray);
    } catch (err) {
      console.error('Error loading photos:', err);
      if (profile?.live_photo_url) {
        setAllPhotos([profile.live_photo_url]);
      }
    }
  };

  const savePhotos = async (photos: string[]) => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ photos: photos })
      .eq('id', user.id);
    setAllPhotos(photos);
    
    if (photos[0] !== profile?.live_photo_url) {
      await supabase
        .from('profiles')
        .update({ live_photo_url: photos[0] })
        .eq('id', user.id);
      await refreshProfile();
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

  const handleAddPhoto = async (blobOrDataURL: Blob | string) => {
    if (allPhotos.length >= MAX_PHOTOS) {
      alert(`Maximum ${MAX_PHOTOS} photos allowed. Delete one first.`);
      return;
    }
    
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
      const timestamp = Date.now();
      const fileName = `${user.id}/photo_${timestamp}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, jpegBlob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newPhotoUrl = `${urlData.publicUrl}?t=${timestamp}`;
      
      const updatedPhotos = [...allPhotos, newPhotoUrl];
      await savePhotos(updatedPhotos);
      setShowAddPhotoModal(false);
      alert('Photo added!');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload photo');
    }
  };

  const handleSetPrimaryPhoto = async (index: number) => {
    if (index === 0) return;
    const newOrder = [allPhotos[index], ...allPhotos.filter((_, i) => i !== index)];
    await savePhotos(newOrder);
    alert('Profile photo updated!');
  };

  const handleDeletePhoto = async (index: number) => {
    if (allPhotos.length === 1) {
      alert('You must keep at least one photo.');
      return;
    }
    const confirmed = window.confirm('Delete this photo? This cannot be undone.');
    if (!confirmed) return;
    const newPhotos = allPhotos.filter((_, i) => i !== index);
    await savePhotos(newPhotos);
  };

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

  const calculatePartnerShare = (contribution: number) => {
    const platformSupport = contribution * 0.15;
    const processingFee = contribution * 0.029 + 0.30;
    return contribution - platformSupport - processingFee;
  };

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
      {/* Navbar with Logo and Tagline */}
<div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
  <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
    <div className="flex items-center gap-3">
      <img 
        src="/Screenshot_2026-04-03_221406.png" 
        alt="Adonix Logo" 
        className="h-8 w-auto"
      />
      <span className="text-xl font-bold text-red-500">Adonix – Social Fitness, Elevated</span>
    </div>
    <div className="relative">
      <button 
        onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
        className="settings-button flex items-center gap-2 px-3 py-2 bg-white/10 rounded-full hover:bg-white/20 transition"
      >
        <span>Settings</span>
        <span>▼</span>
      </button>
      {showSettingsDropdown && (
        <div className="settings-dropdown absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-20">
          <div className="py-2">
            <button onClick={() => { setShowVenuesModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">Verified Venues</button>
            <button onClick={() => { setShowServicesModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">Services & Rates</button>
            <button onClick={() => { setShowScheduleModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">My Schedule</button>
            <button onClick={() => { setShowPhotoGalleryModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">My Photos</button>
            <button onClick={() => { setShowContributionsModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">Contribution History</button>
          </div>
        </div>
      )}
    </div>
  </div>
</div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Profile Section */}
        <div className="text-center mb-8">
          <div className="relative w-32 h-32 rounded-full mx-auto overflow-hidden bg-red-500/20 border-4 border-red-500/30 mb-2">
            {allPhotos[0] ? (
              <img src={allPhotos[0]} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
            )}
          </div>
          <button 
            onClick={() => setShowPhotoGalleryModal(true)}
            className="text-xs text-red-400 hover:text-red-300 mb-3"
          >
            Change Profile Photo
          </button>
          <div className="text-xs text-red-400 mb-3">LIVE ID</div>
          
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
                <button onClick={updateBio} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg">Save</button>
                <button onClick={() => setShowEditBio(false)} className="flex-1 px-4 py-2 bg-gray-600 rounded-lg">Cancel</button>
              </div>
              {bioError && <p className="text-red-400 text-sm mt-1">{bioError}</p>}
            </div>
          ) : (
            <>
              <p className="text-gray-300 max-w-md mx-auto">{profile?.bio || 'No bio yet.'}</p>
              <button onClick={() => setShowEditBio(true)} className="text-sm text-red-400 hover:text-red-300 mt-2">Edit Bio</button>
            </>
          )}
          
          <div className="text-xs text-gray-500 mt-4 space-y-1">
            <p>AUTHENTICITY CHECK: Live Camera Only. AI-generated faces or filters are prohibited.</p>
            <p>This is a social meetup platform, not a professional service.</p>
          </div>
        </div>

        {/* Pending Requests Section */}
        {pendingMeetups.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Pending Meetup Invitations</h2>
              <button className="text-sm text-red-400 hover:text-red-300">View All</button>
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
                    <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-sm">Accept</button>
                    <button className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg text-sm">Decline</button>
                    <button className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">View Member</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upcoming Soon Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Soon</h2>
            <button onClick={() => setShowAllMeetupsModal(true)} className="text-sm text-red-400 hover:text-red-300">View All</button>
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
                        <p className="font-medium">{i === 0 ? '1st ' : i === 1 ? '2nd ' : i === 2 ? '3rd ' : ''}{new Date(meetup.booking_date).toLocaleDateString()} at {new Date(meetup.booking_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                        <p className="text-sm text-gray-400">{meetup.activity || 'Fitness'} with Member</p>
                      </div>
                      <p className="text-green-400 text-sm">Your Share: ${partnerShare.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="text-xs px-3 py-1 bg-white/10 rounded-full">View Details</button>
                      <button className="text-xs px-3 py-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-full">Cancel</button>
                      <button className="text-xs px-3 py-1 bg-white/10 rounded-full">Request Change</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button onClick={() => setShowAllMeetupsModal(true)} className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold hover:scale-105 transition">All Meetups</button>
          <button onClick={() => setShowContributionsModal(true)} className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold hover:scale-105 transition">Contributions</button>
          <button onClick={() => setShowVenuesModal(true)} className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold hover:scale-105 transition">Verified Venues</button>
          <button onClick={() => setShowServicesModal(true)} className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold hover:scale-105 transition">Services & Rates</button>
          <button onClick={() => setShowScheduleModal(true)} className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold hover:scale-105 transition">My Schedule</button>
          <button onClick={() => setShowPhotoGalleryModal(true)} className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold hover:scale-105 transition">My Photos</button>
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
            Adonix provides the platform for public meetups. Suggested contributions are support for the Partner's time and are not wages for employment.
          </p>
        </div>

        {/* Legal Reminders */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold mb-3">High-Standard Protocol</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>You are an independent social participant, not an employee.</li>
            <li>Meet only at verified public venues — private residences are strictly excluded.</li>
            <li>GPS check-in required for every meetup.</li>
            <li>Two-person only — no extra friends or spectators.</li>
            <li>Report concerns immediately. We review within 24 hours.</li>
          </ul>
        </div>

        {/* Logout Button - Under High-Standard Protocol Section */}
        <div className="mb-6">
          <button 
            onClick={handleLogout}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-semibold hover:scale-105 transition"
          >
            Logout
          </button>
        </div>

        {/* Footer with Modal Links */}
        <div className="pt-8 border-t border-white/10 text-center text-xs text-gray-500">
          <div className="flex flex-wrap justify-center gap-4 mb-3">
            <button onClick={() => setShowTermsModal(true)} className="hover:text-white transition">Terms of Service</button>
            <button onClick={() => setShowPrivacyModal(true)} className="hover:text-white transition">Privacy Policy</button>
            <button onClick={() => setShowSafetyModal(true)} className="hover:text-white transition">Safety Guidelines</button>
          </div>
          <p>© 2026 Adonix. All rights reserved. Elite Social Fitness Network.</p>
        </div>
      </div>

      {/* ========== MODALS (same as before) ========== */}

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowTermsModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Terms of Service</h2>
              <button onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="prose prose-invert max-w-none text-gray-300 text-sm space-y-4">
              <p>By using Adonix, you agree to the following terms:</p>
              <p>1. Adonix is a social fitness network, not a professional service marketplace.</p>
              <p>2. Partners are independent social participants, not employees or contractors.</p>
              <p>3. Suggested contributions are voluntary social gifts, not professional service fees.</p>
              <p>4. All meetups must occur at verified public locations. Private residences are strictly excluded.</p>
              <p>5. You are responsible for your own safety and well-being during meetups.</p>
              <p>6. Adonix is not liable for any injuries, damages, or incidents that occur during meetups.</p>
              <p>7. Platform Support (15%) + processing fees are deducted from each suggested contribution.</p>
              <p>8. Violation of these terms may result in permanent account suspension.</p>
            </div>
            <button onClick={() => setShowTermsModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowPrivacyModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Privacy Policy</h2>
              <button onClick={() => setShowPrivacyModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="prose prose-invert max-w-none text-gray-300 text-sm space-y-4">
              <p>Adonix respects your privacy. This policy explains how we collect and protect your data.</p>
              <p><strong>Information We Collect:</strong> Name, email, age, location, photos, and meetup history.</p>
              <p><strong>How We Use Your Information:</strong> To facilitate meetups, verify identities, and improve our platform.</p>
              <p><strong>Data Sharing:</strong> We do not sell your personal data. Payment information is processed securely through Stripe.</p>
              <p><strong>Location Data:</strong> Used only during active meetups for GPS check-in verification.</p>
              <p><strong>Data Retention:</strong> You may request deletion of your account and data at any time.</p>
              <p><strong>California Residents:</strong> You have the right to opt out of data sharing under CPRA.</p>
            </div>
            <button onClick={() => setShowPrivacyModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Safety Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowSafetyModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Safety Guidelines</h2>
              <button onClick={() => setShowSafetyModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="prose prose-invert max-w-none text-gray-300 text-sm space-y-4">
              <p><strong>1. Public Locations Only</strong> - All meetups must occur at verified public gyms, parks, or recreation centers.</p>
              <p><strong>2. You're the Decider</strong> - Trust your instincts. If something feels off, don't go.</p>
              <p><strong>3. GPS Check-In Required</strong> - You must verify your location within 0.75 miles of the agreed venue.</p>
              <p><strong>4. Two-Person Only</strong> - No extra friends, family, or spectators permitted.</p>
              <p><strong>5. Report Concerns Immediately</strong> - We review all reports within 24 hours.</p>
              <p><strong>Zero-Tolerance Policy:</strong> Private location requests, harassment, or unsafe behavior = permanent ban.</p>
            </div>
            <button onClick={() => setShowSafetyModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      {showPhotoGalleryModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowPhotoGalleryModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">My Photos</h2>
              {allPhotos.length < MAX_PHOTOS && (
                <button 
                  onClick={() => setShowAddPhotoModal(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg text-sm"
                >
                  Add Photo
                </button>
              )}
            </div>
            
            {allPhotos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No photos yet.</p>
                <button 
                  onClick={() => setShowAddPhotoModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg"
                >
                  Add Your First Photo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {allPhotos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <div className={`aspect-square rounded-xl overflow-hidden border-2 ${idx === 0 ? 'border-red-500 ring-2 ring-red-500/50' : 'border-white/20'}`}>
                      <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                        Current Profile
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      {idx !== 0 && (
                        <button 
                          onClick={() => handleSetPrimaryPhoto(idx)}
                          className="bg-black/70 text-white text-xs px-2 py-1 rounded-lg hover:bg-red-600 transition"
                        >
                          Set as Primary
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeletePhoto(idx)}
                        className="bg-red-600 text-white text-xs px-2 py-1 rounded-lg hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Up to {MAX_PHOTOS} live photos. Tap "Set as Primary" to change your profile picture.
            </p>
            
            <button 
              onClick={() => setShowPhotoGalleryModal(false)}
              className="w-full mt-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      {showAddPhotoModal && (
        <LiveCameraCapture
          onCapture={handleAddPhoto}
          onClose={() => setShowAddPhotoModal(false)}
          aspectRatio="square"
        />
      )}

      {/* All Meetups Modal */}
      {showAllMeetupsModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowAllMeetupsModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">All Upcoming Meetups</h2>
            {allMeetups.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No upcoming meetups.</p>
            ) : (
              allMeetups.map((meetup) => (
                <div key={meetup.id} className="bg-white/5 rounded-xl p-4 mb-3">
                  <p>{new Date(meetup.booking_date).toLocaleDateString()} at {new Date(meetup.booking_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                  <p className="text-sm text-gray-400">{meetup.activity || 'Fitness'}</p>
                  <div className="flex gap-2 mt-2">
                    <button className="text-xs px-3 py-1 bg-white/10 rounded-full">View</button>
                    <button className="text-xs px-3 py-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-full">Cancel</button>
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
            <h2 className="text-xl font-bold mb-4">Contribution History</h2>
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
            <h2 className="text-xl font-bold mb-4">Verified Public Venues</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Gym or park name..." className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm" />
              <button onClick={addLocation} className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-sm">Add</button>
            </div>
            {serviceAreas.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No venues added yet.</p>
            ) : (
              serviceAreas.map((area, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-2 mb-2">
                  <span className="text-sm">{area.name}</span>
                  <button onClick={() => removeLocation(i)} className="text-red-400 text-sm">Remove</button>
                </div>
              ))
            )}
            <p className="text-xs text-yellow-400 mt-3">Only public gyms, parks, and recreation centers are permitted.</p>
            <button onClick={() => setShowVenuesModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Services & Rates Modal */}
      {showServicesModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowServicesModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Services & Suggested Contributions</h2>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {SERVICE_TYPES.map(service => (
                <button
                  key={service}
                  onClick={() => toggleServiceType(service)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    serviceTypes.includes(service)
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
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
              <button onClick={saveServices} className="flex-1 py-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg">Save Changes</button>
              <button onClick={() => setShowServicesModal(false)} className="flex-1 py-2 bg-gray-600 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowScheduleModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">My Availability</h2>
            
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
                                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
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
              <button onClick={saveAvailability} className="flex-1 py-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg">Save Schedule</button>
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-2 bg-gray-600 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}