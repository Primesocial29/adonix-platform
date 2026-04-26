import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import LiveCameraCapture from './LiveCameraCapture';
import { containsBlockedWords, getBlockedWordsInText } from '../lib/textSanitizer';
import { Plus, X, Calendar, Clock, MapPin } from 'lucide-react';

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

  // Menu modal states
  const [showMyProfileModal, setShowMyProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  // Delete Account Password Verification
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  
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
  
  // Booking Requests Modal
  const [showBookingRequests, setShowBookingRequests] = useState(false);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  
  // Data for modals
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [customServiceTypes, setCustomServiceTypes] = useState<string[]>([]);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [customServiceError, setCustomServiceError] = useState('');
  const [serviceRates, setServiceRates] = useState<any>({});
  const [serviceHalfHourEnabled, setServiceHalfHourEnabled] = useState<Record<string, boolean>>({});
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [pastMeetups, setPastMeetups] = useState<any[]>([]);

  // Settings state
  const [settingsSubScreen, setSettingsSubScreen] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Updated Delete Account with Password Verification
  const handleDeleteAccountWithPassword = async () => {
    if (!user || deleteConfirmText !== 'DELETE') return;
    if (!deletePassword) {
      setDeletePasswordError('Please enter your password');
      return;
    }
    
    setDeletingAccount(true);
    setDeletePasswordError('');
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: deletePassword,
      });
      
      if (signInError) {
        setDeletePasswordError('Incorrect password. Please try again.');
        setDeletingAccount(false);
        return;
      }
      
      await supabase.from('bookings').delete().or(`client_id.eq.${user.id},partner_id.eq.${user.id}`);
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Delete account error:', err);
      alert('Failed to delete account. Please contact support.');
      setDeletingAccount(false);
    }
  };

  // Fetch booking requests for partner
  const fetchBookingRequests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:client_id (
            id,
            first_name,
            username,
            live_photo_url,
            bio
          )
        `)
        .eq('partner_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBookingRequests(data || []);
    } catch (err) {
      console.error('Error fetching booking requests:', err);
    }
  };

  // Accept booking request
  const acceptBooking = async (bookingId: string) => {
    setProcessingBookingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      await fetchBookingRequests();
      await fetchMeetups();
      alert('Booking confirmed! You can now message the client.');
    } catch (err) {
      console.error('Error accepting booking:', err);
      alert('Failed to accept booking. Please try again.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  // Decline booking request
  const declineBooking = async (bookingId: string) => {
    const reason = prompt('Please provide a reason for declining (optional):');
    
    setProcessingBookingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'declined',
          decline_reason: reason || null,
          declined_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      await fetchBookingRequests();
      alert('Booking request declined.');
    } catch (err) {
      console.error('Error declining booking:', err);
      alert('Failed to decline booking. Please try again.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfileData();
      fetchMeetups();
      fetchContributions();
      loadPhotos();
      fetchBookingRequests();
    }
  }, [user]);

  // Check username availability for settings
  useEffect(() => {
    const checkAvailability = async () => {
      if (!editUsername || editUsername.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', editUsername.toLowerCase())
          .maybeSingle();
        if (error) throw error;
        setUsernameAvailable(!data);
      } catch (err) {
        console.error('Error checking username:', err);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };
    const timeout = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeout);
  }, [editUsername]);

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
        .select('service_types, custom_service_types, service_rates, service_areas, availability, username, phone')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setServiceTypes(data.service_types || []);
        setCustomServiceTypes(data.custom_service_types || []);
        const rates = data.service_rates || {};
        setServiceRates(rates);
        const halfHourSettings: Record<string, boolean> = {};
        Object.keys(rates).forEach(service => {
          halfHourSettings[service] = !!(rates[service]?.halfHour && rates[service].halfHour > 0);
        });
        setServiceHalfHourEnabled(halfHourSettings);
        setServiceAreas(data.service_areas || []);
        setAvailability(data.availability || []);
        setUsername(data.username || '');
        setEditUsername(data.username || '');
        setNewPhone(data.phone || '');
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
    if (containsBlockedWords(editBioText)) {
      setBioError('Bio contains blocked words. Please remove them.');
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

  // Settings handlers
  const updateUsername = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ username: editUsername.toLowerCase() })
      .eq('id', user.id);
    if (error) {
      setUsernameError(error.message);
    } else {
      setUsername(editUsername);
      setSettingsSubScreen(null);
      alert('Username updated successfully!');
    }
  };

  const updateEmail = async () => {
    if (!user) return;
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });
    if (signInError) {
      setEmailError('Incorrect password');
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setEmailError(error.message);
    } else {
      setSettingsSubScreen(null);
      alert('Email updated! Please verify your new email address.');
    }
  };

  const updatePhone = async () => {
    if (!user) return;
    const digits = newPhone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ phone: newPhone })
      .eq('id', user.id);
    if (error) {
      setPhoneError(error.message);
    } else {
      await refreshProfile();
      setSettingsSubScreen(null);
      alert('Phone number updated successfully!');
    }
  };

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(error.message);
    } else {
      setSettingsSubScreen(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password updated successfully!');
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
      [service]: { ...(prev[service] || { hourly: 0, halfHour: null }), [field]: num }
    }));
  };

  const toggleServiceType = (service: string) => {
    setServiceTypes(prev => {
      if (prev.includes(service)) {
        const updated = { ...serviceRates };
        const halfHourUpdated = { ...serviceHalfHourEnabled };
        delete updated[service];
        delete halfHourUpdated[service];
        setServiceRates(updated);
        setServiceHalfHourEnabled(halfHourUpdated);
        return prev.filter(s => s !== service);
      }
      return [...prev, service];
    });
  };

  const addCustomService = () => {
    const val = customServiceInput.trim();
    if (!val) return;
    if (containsBlockedWords(val)) {
      setCustomServiceError('Activity name contains blocked words.');
      return;
    }
    const allServices = [...serviceTypes, ...customServiceTypes];
    if (allServices.some(s => s.toLowerCase() === val.toLowerCase())) {
      setCustomServiceError('Activity already exists.');
      return;
    }
    setCustomServiceTypes(prev => [...prev, val]);
    setCustomServiceInput('');
    setCustomServiceError('');
  };

  const removeCustomService = (service: string) => {
    setCustomServiceTypes(prev => prev.filter(s => s !== service));
    const updated = { ...serviceRates };
    const halfHourUpdated = { ...serviceHalfHourEnabled };
    delete updated[service];
    delete halfHourUpdated[service];
    setServiceRates(updated);
    setServiceHalfHourEnabled(halfHourUpdated);
  };

  const toggleServiceHalfHour = (service: string) => {
    const newValue = !serviceHalfHourEnabled[service];
    setServiceHalfHourEnabled(prev => ({ ...prev, [service]: newValue }));
    if (!newValue) {
      setServiceRates(prev => ({
        ...prev,
        [service]: { ...(prev[service] || { hourly: 0 }), halfHour: null }
      }));
    }
  };

  const saveServices = async () => {
    const cleanedRates = { ...serviceRates };
    Object.keys(cleanedRates).forEach(service => {
      if (!serviceHalfHourEnabled[service]) {
        cleanedRates[service] = { hourly: cleanedRates[service]?.hourly || 0, halfHour: null };
      }
    });
    
    await supabase.from('profiles').update({
      service_types: serviceTypes,
      custom_service_types: customServiceTypes,
      service_rates: cleanedRates
    }).eq('id', user?.id);
    
    alert('Services saved!');
    setShowServicesModal(false);
    loadProfileData();
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
      {/* Navbar with Logo and Branding */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/adonixlogo.png"
              alt="Adonix"
              className="h-11 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white leading-tight">ADONIX</span>
              <span className="text-xs text-gray-400 tracking-wide">Social Fitness, Elevated</span>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-full hover:bg-white/20 transition"
            >
              <span>Menu</span>
              <span>▼</span>
            </button>
            {showSettingsDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-20">
                <div className="py-2">
                  <button onClick={() => { setShowMyProfileModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">👤 My Profile</button>
                  <button onClick={() => { setShowPhotoGalleryModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">📸 My Photos</button>
                  <button onClick={() => { setShowSettingsModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">⚙️ Settings</button>
                  <button onClick={() => { setShowHelpModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">❓ Help & Support</button>
                  <button onClick={() => { setShowSafetyModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">🛡️ Safety Guidelines</button>
                  <button onClick={() => { setShowDeleteAccountModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10">🗑️ Delete Account</button>
                  <button onClick={() => { handleLogout(); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">🚪 Logout</button>
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

        {/* Pending Meetup Invitations */}
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
          <button onClick={() => setShowBookingRequests(true)} className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold hover:scale-105 transition relative">
            📋 Booking Requests
            {bookingRequests.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {bookingRequests.length}
              </span>
            )}
          </button>
          <button onClick={() => setShowAllMeetupsModal(true)} className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold