import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import LiveCameraCapture from './LiveCameraCapture';
import { containsBlockedWords, getBlockedWordsInText } from '../lib/textSanitizer';
import { Plus, X, Calendar, Clock, MapPin, Search, Navigation, Loader2, ChevronDown, ChevronRight, CheckCircle, ShieldCheck, Info, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

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
  const [selectedPhotoForLightbox, setSelectedPhotoForLightbox] = useState<string | null>(null);
  const MAX_PHOTOS = 6;
  
  // Modal states
  const [showCamera, setShowCamera] = useState(false);
  const [showAllMeetupsModal, setShowAllMeetupsModal] = useState(false);
  const [showContributionsModal, setShowContributionsModal] = useState(false);
  const [showVenuesModal, setShowVenuesModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Venues Modal States
  const [tempVenues, setTempVenues] = useState<any[]>([]);
  const [venuesChanged, setVenuesChanged] = useState(false);
  const [showVenuesUnsavedWarning, setShowVenuesUnsavedWarning] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState<SearchResult[]>([]);
  const [isSearchingVenues, setIsSearchingVenues] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<SearchResult | null>(null);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const MAX_VENUES = 5;
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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
        .select('service_types, custom_service_types, service_rates, service_areas, availability, username, phone, email')
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
        // Also load email from auth user (already in user object)
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

  // Venues Modal Functions
  const searchVenues = (query: string) => {
    setAddressQuery(query);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (query.length < 3) { setAddressResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      setIsSearchingVenues(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' gym fitness park')}&limit=10`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Adonix-Fit/1.0' } });
        const data = await response.json();
        const filtered = data.filter((result: any) => {
          const name = result.display_name.toLowerCase();
          return !name.includes('hotel') && !name.includes('motel') && !name.includes('apartment') && 
                 !name.includes('residential') && !name.includes('house') && !name.includes('home');
        });
        setAddressResults(filtered.slice(0, 10));
      } catch (error) {
        console.error('Search error:', error);
        setAddressResults([]);
      } finally {
        setIsSearchingVenues(false);
      }
    }, 500);
  };

  const searchNearMe = async (lat: number, lng: number) => {
    setIsSearchingVenues(true);
    setAddressResults([]);
    try {
      const radiusDegrees = 5 * 0.0145;
      const bbox = `${lng - radiusDegrees},${lat - radiusDegrees},${lng + radiusDegrees},${lat + radiusDegrees}`;
      const searchTerms = ['gym', 'fitness', 'park', 'recreation', 'sports', 'yoga', 'pilates', 'crossfit'];
      let allResults: any[] = [];
      for (const term of searchTerms) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${term}&limit=10&bounded=1&viewbox=${bbox}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Adonix-Fit/1.0' } });
        const data = await response.json();
        allResults = [...allResults, ...data];
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      const unique = allResults.filter((item, index, self) => index === self.findIndex(r => r.display_name === item.display_name));
      const filtered = unique.filter((result: any) => {
        const name = result.display_name.toLowerCase();
        return !name.includes('hotel') && !name.includes('motel') && !name.includes('apartment') && 
               !name.includes('residential') && !name.includes('house') && !name.includes('home');
      });
      setAddressResults(filtered.slice(0, 20));
      if (filtered.length === 0) {
        alert(`No gyms or parks found. Try searching for a specific gym name.`);
      }
    } catch (error) {
      console.error('Error finding nearby places:', error);
      alert('Unable to find nearby locations. Please try searching manually.');
    } finally {
      setIsSearchingVenues(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    setIsGettingLocation(true);
    setAddressResults([]);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setIsGettingLocation(false);
      await searchNearMe(lat, lng);
    }, () => {
      alert('Unable to get location. Please enable location permissions.');
      setIsGettingLocation(false);
    });
  };

  const initiateAddLocation = (result: SearchResult) => {
    if (tempVenues.length >= MAX_VENUES) {
      alert(`Maximum ${MAX_VENUES} locations allowed. Remove one before adding another.`);
      return;
    }
    const alreadyAdded = tempVenues.some(a => a.name === result.display_name);
    if (alreadyAdded) {
      alert('This location has already been added.');
      return;
    }
    setPendingLocation(result);
    setAddressResults([]);
    setShowLocationConfirm(true);
  };

  const confirmAddLocation = () => {
    if (!pendingLocation) return;
    const lat = parseFloat(pendingLocation.lat);
    const lng = parseFloat(pendingLocation.lon);
    const newArea = { name: pendingLocation.display_name, lat, lng };
    setTempVenues(prev => [...prev, newArea]);
    setVenuesChanged(true);
    setAddressQuery('');
    setPendingLocation(null);
    setShowLocationConfirm(false);
  };

  const removeTempVenue = (index: number) => {
    setTempVenues(prev => prev.filter((_, i) => i !== index));
    setVenuesChanged(true);
  };

  const openVenuesModal = () => {
    setTempVenues([...serviceAreas]);
    setVenuesChanged(false);
    setShowVenuesModal(true);
  };

  const saveVenues = async () => {
    setServiceAreas(tempVenues);
    await supabase.from('profiles').update({ service_areas: tempVenues }).eq('id', user?.id);
    setVenuesChanged(false);
    setShowVenuesModal(false);
    alert('Venues saved successfully!');
  };

  const closeVenuesModal = () => {
    if (venuesChanged) {
      setShowVenuesUnsavedWarning(true);
    } else {
      setShowVenuesModal(false);
    }
  };

  // Services Functions
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
        
        {/* Welcome Message */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">@{username || profile?.first_name?.toLowerCase() || 'partner'}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Ready to make someone sweat today?</p>
        </div>

        {/* Profile Section */}
        <div className="text-center mb-8">
          <div className="relative w-32 h-32 rounded-full mx-auto overflow-hidden bg-red-500/20 border-4 border-red-500/30 mb-2">
            {allPhotos[0] ? (
              <img 
                src={allPhotos[0]} 
                alt="Profile" 
                className="w-full h-full object-cover cursor-pointer" 
                onClick={() => setSelectedPhotoForLightbox(allPhotos[0])}
              />
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
          <button onClick={() => setShowAllMeetupsModal(true)} className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold hover:scale-105 transition">All Meetups</button>
          <button onClick={() => setShowContributionsModal(true)} className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold hover:scale-105 transition">Contributions</button>
          <button onClick={openVenuesModal} className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold hover:scale-105 transition">Verified Venues</button>
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

        {/* Logout Button */}
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

      {/* ========== MODALS ========== */}

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

      {/* Photo Gallery Modal with Lightbox */}
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
                    <div 
                      className={`aspect-square rounded-xl overflow-hidden border-2 ${idx === 0 ? 'border-red-500 ring-2 ring-red-500/50' : 'border-white/20'} cursor-pointer`}
                      onClick={() => setSelectedPhotoForLightbox(photo)}
                    >
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

      {/* Lightbox Modal */}
      {selectedPhotoForLightbox && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedPhotoForLightbox(null)}>
          <img src={selectedPhotoForLightbox} alt="Full size" className="max-w-full max-h-full object-contain" />
          <button 
            onClick={() => setSelectedPhotoForLightbox(null)} 
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
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

      {/* Booking Requests Modal */}
      {showBookingRequests && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowBookingRequests(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">📋 Pending Booking Requests</h2>
              <button onClick={() => setShowBookingRequests(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {bookingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No pending booking requests.</p>
                </div>
              ) : (
                bookingRequests.map((booking) => {
                  const client = booking.client;
                  const bookingDateTime = new Date(booking.booking_date);
                  const formattedDate = bookingDateTime.toLocaleDateString();
                  const formattedTime = bookingDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const durationHours = booking.session_duration / 60;
                  
                  return (
                    <div key={booking.id} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-red-500/30 transition">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-red-500/20 flex-shrink-0">
                          {client?.live_photo_url ? (
                            <img src={client.live_photo_url} alt={client.first_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-white text-lg">
                                {client?.first_name || 'Client'} @{client?.username || 'unknown'}
                              </h3>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                                <span className="flex items-center gap-1">💪 {booking.selected_service || booking.activity}</span>
                                <span className="flex items-center gap-1">⏱️ {durationHours}h</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-400">${booking.total_amount?.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">You'll receive ${booking.partner_payout?.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span>{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span>{formattedTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300 col-span-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span>{booking.location_name}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 p-3 bg-white/5 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Contact Info</p>
                            <p className="text-sm text-gray-300">📧 {booking.contact_email}</p>
                            <p className="text-sm text-gray-300">📞 {booking.client_phone}</p>
                          </div>
                          
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={() => acceptBooking(booking.id)}
                              disabled={processingBookingId === booking.id}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-semibold transition disabled:opacity-50"
                            >
                              {processingBookingId === booking.id ? 'Processing...' : '✓ Accept'}
                            </button>
                            <button
                              onClick={() => declineBooking(booking.id)}
                              disabled={processingBookingId === booking.id}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold transition disabled:opacity-50"
                            >
                              {processingBookingId === booking.id ? 'Processing...' : '✗ Decline'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
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

      {/* Verified Venues Modal - UPDATED with full functionality */}
      {showVenuesModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeVenuesModal}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">📍 Verified Public Venues</h2>
              <button onClick={closeVenuesModal} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Safety Warning */}
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-red-500" />
                  <p className="text-sm font-semibold text-white">Safety First</p>
                </div>
                <p className="text-xs text-gray-300 mb-2">All meetups must occur at verified public locations:</p>
                <ul className="space-y-1 text-xs text-gray-300 ml-4">
                  <li>✓ Public gyms, fitness centers, and parks</li>
                  <li>✓ Recreation centers and sports facilities</li>
                  <li>✗ NO private residences, hotels, or Airbnbs</li>
                  <li>✗ NO bars, clubs, or private studios</li>
                </ul>
                <p className="text-xs text-yellow-400 mt-3">⚠️ If you select a gym, ensure you have a valid membership and your gym allows guests.</p>
              </div>
              
              {/* Search Section */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Add public venues (MAX {MAX_VENUES})</p>
                
                <div className="flex gap-2 mb-3">
                  <button 
                    onClick={useCurrentLocation} 
                    disabled={isGettingLocation || isSearchingVenues} 
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {isGettingLocation ? <><Loader2 className="w-4 h-4 animate-spin" /> Locating...</> : <><Navigation className="w-4 h-4" /> Search Near Me</>}
                  </button>
                </div>
                
                <div className="relative">
                  <div className="absolute left-4 top-3.5">
                    {isSearchingVenues ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Search className="w-4 h-4 text-gray-400" />}
                  </div>
                  <input 
                    type="text" 
                    value={addressQuery} 
                    onChange={(e) => searchVenues(e.target.value)} 
                    placeholder="Search: gyms, parks, fitness centers..." 
                    className="w-full pl-11 pr-4 py-3 bg-black border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none" 
                  />
                </div>
                
                {addressResults.length > 0 && (
                  <div className="mt-3 bg-gray-800 border border-white/20 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <p className="px-4 pt-3 pb-1 text-[10px] text-gray-500 uppercase tracking-wider">Safe public venues — tap to add</p>
                    {addressResults.map((r, i) => (
                      <button 
                        key={i} 
                        onClick={() => initiateAddLocation(r)} 
                        className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/5 last:border-0 transition-colors flex items-center gap-3"
                      >
                        <MapPin className="w-4 h-4 text-green-500 shrink-0" />
                        <p className="text-sm text-white truncate">{r.display_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Current Venues List */}
              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Your Venues ({tempVenues.length}/{MAX_VENUES})
                </p>
                {tempVenues.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No venues added yet. Search above to add public venues.</p>
                ) : (
                  <div className="space-y-2">
                    {tempVenues.map((venue, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-300 truncate">{venue.name}</span>
                        </div>
                        <button onClick={() => removeTempVenue(idx)} className="text-red-400 hover:text-red-300 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer Buttons */}
            <div className="sticky bottom-0 bg-gray-900 border-t border-white/10 p-4 flex gap-3">
              <button onClick={closeVenuesModal} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition">
                Cancel
              </button>
              <button onClick={saveVenues} className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition hover:scale-105">
                Save Venues
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Warning Modal */}
      {showVenuesUnsavedWarning && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/10 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Unsaved Changes</h2>
            <p className="text-gray-400 mb-6">You have unsaved changes to your venues. What would you like to do?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowVenuesUnsavedWarning(false); setShowVenuesModal(false); }} 
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition"
              >
                Discard Changes
              </button>
              <button 
                onClick={() => { setShowVenuesUnsavedWarning(false); saveVenues(); }} 
                className="flex-1 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold transition"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setShowVenuesUnsavedWarning(false)} 
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 rounded-xl font-semibold transition"
              >
                Stay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Confirmation Modal for Venue Addition */}
      {showLocationConfirm && pendingLocation && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-7 h-7 text-green-500" />
              <h2 className="text-xl font-bold text-white">Confirm Public Venue</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Selected Location</p>
                <p className="text-white font-medium text-sm">{pendingLocation.display_name}</p>
              </div>
              <p className="text-gray-300 text-sm">By adding this location you confirm it is a verified public venue where meetups are permitted.</p>
              <ul className="space-y-2">
                {[
                  'This is a public park, gym, or fitness center.',
                  'This is NOT a private residence or hotel.',
                  'GPS check-in will be required upon arrival.',
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowLocationConfirm(false); setPendingLocation(null); }} className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                Go Back
              </button>
              <button onClick={confirmAddLocation} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all">
                Confirm Public Venue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services & Rates Modal */}
      {showServicesModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowServicesModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Services & Suggested Contributions</h2>
              <button onClick={() => setShowServicesModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <p className="text-xs text-gray-400 mb-2">Select your activities:</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {SERVICE_TYPES.map(service => (
                <button
                  key={service}
                  onClick={() => toggleServiceType(service)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    serviceTypes.includes(service)
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg scale-[1.02]'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {service} {serviceTypes.includes(service) && '✓'}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={customServiceInput}
                onChange={(e) => setCustomServiceInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomService()}
                placeholder="Add custom activity..."
                className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none text-sm"
              />
              <button onClick={addCustomService} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {customServiceError && <p className="text-xs text-red-400 mb-2">{customServiceError}</p>}

            {customServiceTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {customServiceTypes.map(service => (
                  <div key={service} className="flex items-center gap-1 bg-red-600/20 border border-red-500/30 rounded-full px-3 py-1">
                    <span className="text-sm text-red-300">{service}</span>
                    <button onClick={() => removeCustomService(service)} className="text-red-400 hover:text-red-300">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {([...serviceTypes, ...customServiceTypes]).length > 0 && (
              <div className="space-y-4 mb-6">
                <p className="text-sm font-medium text-white">Set suggested contributions per activity:</p>
                {[...serviceTypes, ...customServiceTypes].map(service => {
                  const isHalfHourOn = serviceHalfHourEnabled[service] || false;
                  return (
                    <div key={service} className="p-4 bg-black rounded-xl border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-semibold text-white">{service}</p>
                        {customServiceTypes.includes(service) && (
                          <button onClick={() => removeCustomService(service)} className="text-gray-400 hover:text-red-400">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Hourly Suggested Contribution <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-red-500 font-bold">$</span>
                            <input
                              type="number"
                              value={serviceRates[service]?.hourly || ''}
                              onChange={(e) => updateServiceRate(service, 'hourly', e.target.value)}
                              placeholder="100"
                              min="50"
                              max="500"
                              step="1"
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white"
                            />
                            <span className="text-gray-400 text-sm">/ hr</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Min $50 · Max $500</p>
                        </div>

                        {isHalfHourOn && (
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Half-Hour Suggested Contribution <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-red-500 font-bold">$</span>
                              <input
                                type="number"
                                value={serviceRates[service]?.halfHour || ''}
                                onChange={(e) => updateServiceRate(service, 'halfHour', e.target.value)}
                                placeholder="60"
                                min="30"
                                max={serviceRates[service]?.hourly || 500}
                                step="1"
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none text-white"
                              />
                              <span className="text-gray-400 text-sm">/ 30m</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Min $30 · Cannot exceed hourly rate</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 mt-2">
                          <div>
                            <p className="text-sm font-medium text-gray-300">Half-Hour Meetups</p>
                            <p className="text-xs text-gray-500 mt-0.5">Members can book 30-minute sessions</p>
                          </div>
                          <button
                            onClick={() => toggleServiceHalfHour(service)}
                            className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${isHalfHourOn ? 'bg-red-600' : 'bg-gray-600'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isHalfHourOn ? 'translate-x-6' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={saveServices} className="flex-1 py-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg font-semibold hover:scale-105 transition">Save Changes</button>
              <button onClick={() => setShowServicesModal(false)} className="flex-1 py-2 bg-gray-600 rounded-lg font-semibold hover:bg-gray-700 transition">Cancel</button>
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
                        {generateTimeSlots(true).map(time => (
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

      {/* My Profile Modal */}
      {showMyProfileModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowMyProfileModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowMyProfileModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">My Profile</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-red-500/20 border-2 border-red-500/30">
                {allPhotos[0] ? (
                  <img src={allPhotos[0]} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
                )}
              </div>
              <div>
                <p className="font-bold text-lg">@{username || profile?.first_name?.toLowerCase() || 'partner'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
                <p className="text-xs text-gray-400">{newPhone || 'No phone added'}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p><span className="text-gray-500">Bio:</span> {profile?.bio || 'No bio yet.'}</p>
              <p><span className="text-gray-500">Total Contributions:</span> ${totalContributions}</p>
              <p><span className="text-gray-500">Pending Invitations:</span> {pendingMeetups.length}</p>
              <p><span className="text-gray-500">Services:</span> {serviceTypes.length + customServiceTypes.length}</p>
            </div>
            <button onClick={() => setShowMyProfileModal(false)} className="w-full mt-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold transition-all">Close</button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => !settingsSubScreen && setShowSettingsModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 border border-white/10 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => {
              if (settingsSubScreen) {
                setSettingsSubScreen(null);
              } else {
                setShowSettingsModal(false);
              }
            }} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            {!settingsSubScreen ? (
              <>
                <h2 className="text-xl font-bold mb-4">Settings</h2>
                <div className="space-y-3">
                  <button onClick={() => setSettingsSubScreen('username')} className="w-full text-left p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between">
                    <div><p className="font-medium text-white">Username</p><p className="text-xs text-gray-400">@{username || 'set a username'}</p></div>
                    <span className="text-gray-400">→</span>
                  </button>
                  <button onClick={() => setSettingsSubScreen('email')} className="w-full text-left p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between">
                    <div><p className="font-medium text-white">Email Address</p><p className="text-xs text-gray-400">{user?.email || 'no email'}</p></div>
                    <span className="text-gray-400">→</span>
                  </button>
                  <button onClick={() => setSettingsSubScreen('phone')} className="w-full text-left p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between">
                    <div><p className="font-medium text-white">Phone Number</p><p className="text-xs text-gray-400">{newPhone || 'no phone number'}</p></div>
                    <span className="text-gray-400">→</span>
                  </button>
                  <button onClick={() => setSettingsSubScreen('password')} className="w-full text-left p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between">
                    <div><p className="font-medium text-white">Password</p><p className="text-xs text-gray-400">Change your password</p></div>
                    <span className="text-gray-400">→</span>
                  </button>
                  <button onClick={() => setSettingsSubScreen('notifications')} className="w-full text-left p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between">
                    <div><p className="font-medium text-white">Notifications</p><p className="text-xs text-gray-400">Manage your notification preferences</p></div>
                    <span className="text-gray-400">→</span>
                  </button>
                </div>
              </>
            ) : settingsSubScreen === 'username' ? (
              <>
                <h2 className="text-xl font-bold mb-4">Change Username</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">New Username <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                      <input type="text" value={editUsername} onChange={(e) => { const val = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_.]/g, ''); if (val.length <= 20) { setEditUsername(val); setUsernameError(''); } }} placeholder="username" className="w-full pl-7 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Letters, numbers, underscore (_), and period (.) only. 3-20 characters.</p>
                  </div>
                  {usernameError && <p className="text-red-400 text-sm">{usernameError}</p>}
                  {usernameAvailable === false && <p className="text-red-400 text-sm">Username already taken</p>}
                  {usernameAvailable === true && <p className="text-green-400 text-sm">Username is available!</p>}
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setSettingsSubScreen(null)} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition">Cancel</button>
                    <button onClick={updateUsername} disabled={!editUsername || editUsername.length < 3 || usernameAvailable !== true} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold transition disabled:opacity-50">Save</button>
                  </div>
                </div>
              </>
            ) : settingsSubScreen === 'email' ? (
              <>
                <h2 className="text-xl font-bold mb-4">Change Email Address</h2>
                <div className="space-y-4">
                  <div><label className="block text-sm text-gray-400 mb-1">New Email Address <span className="text-red-500">*</span></label><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="newemail@example.com" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none" /></div>
                  <div><label className="block text-sm text-gray-400 mb-1">Current Password <span className="text-red-500">*</span></label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter your current password" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none" /></div>
                  {emailError && <p className="text-red-400 text-sm">{emailError}</p>}
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setSettingsSubScreen(null)} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition">Cancel</button>
                    <button onClick={updateEmail} disabled={!newEmail || !currentPassword} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold transition disabled:opacity-50">Save</button>
                  </div>
                </div>
              </>
            ) : settingsSubScreen === 'phone' ? (
              <>
                <h2 className="text-xl font-bold mb-4">Change Phone Number</h2>
                <div className="space-y-4">
                  <div><label className="block text-sm text-gray-400 mb-1">New Phone Number <span className="text-red-500">*</span></label><input type="tel" value={newPhone} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); let formatted = ''; if (digits.length >= 1) formatted = '(' + digits.substring(0, 3); if (digits.length >= 4) formatted += ') ' + digits.substring(3, 6); if (digits.length >= 7) formatted += '-' + digits.substring(6, 10); setNewPhone(formatted); setPhoneError(''); }} placeholder="(555) 123-4567" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none" /></div>
                  {phoneError && <p className="text-red-400 text-sm">{phoneError}</p>}
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setSettingsSubScreen(null)} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition">Cancel</button>
                    <button onClick={updatePhone} disabled={!newPhone || newPhone.replace(/\D/g, '').length !== 10} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold transition disabled:opacity-50">Save</button>
                  </div>
                </div>
              </>
            ) : settingsSubScreen === 'password' ? (
              <>
                <h2 className="text-xl font-bold mb-4">Change Password</h2>
                <div className="space-y-4">
                  <div><label className="block text-sm text-gray-400 mb-1">Current Password <span className="text-red-500">*</span></label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none" /></div>
                  <div><label className="block text-sm text-gray-400 mb-1">New Password <span className="text-red-500">*</span></label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none" /><div className="mt-2 space-y-1 text-xs"><p className={newPassword.length >= 8 ? 'text-green-400' : 'text-gray-500'}>{newPassword.length >= 8 ? '✓' : '○'} At least 8 characters</p><p className={/[A-Z]/.test(newPassword) ? 'text-green-400' : 'text-gray-500'}>{/[A-Z]/.test(newPassword) ? '✓' : '○'} At least 1 uppercase letter</p><p className={/[a-z]/.test(newPassword) ? 'text-green-400' : 'text-gray-500'}>{/[a-z]/.test(newPassword) ? '✓' : '○'} At least 1 lowercase letter</p><p className={/[0-9]/.test(newPassword) ? 'text-green-400' : 'text-gray-500'}>{/[0-9]/.test(newPassword) ? '✓' : '○'} At least 1 number</p><p className={/[!@#$%^&*]/.test(newPassword) ? 'text-green-400' : 'text-gray-500'}>{/[!@#$%^&*]/.test(newPassword) ? '✓' : '○'} At least 1 special character (!@#$%^&*)</p></div></div>
                  <div><label className="block text-sm text-gray-400 mb-1">Confirm New Password <span className="text-red-500">*</span></label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-red-500 focus:outline-none" /></div>
                  {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setSettingsSubScreen(null)} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition">Cancel</button>
                    <button onClick={updatePassword} disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold transition disabled:opacity-50">Save</button>
                  </div>
                </div>
              </>
            ) : settingsSubScreen === 'notifications' ? (
              <>
                <h2 className="text-xl font-bold mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
                    <div><p className="font-medium text-white">Email Notifications</p><p className="text-xs text-gray-400">Receive updates about booking requests and messages</p></div>
                    <button onClick={() => setEmailNotifications(!emailNotifications)} className={`relative w-12 h-6 rounded-full transition-colors ${emailNotifications ? 'bg-red-600' : 'bg-gray-600'}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${emailNotifications ? 'translate-x-6' : ''}`} /></button>
                  </label>
                  <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
                    <div><p className="font-medium text-white">SMS Notifications</p><p className="text-xs text-gray-400">Get text message alerts for new booking requests</p></div>
                    <button onClick={() => setSmsNotifications(!smsNotifications)} className={`relative w-12 h-6 rounded-full transition-colors ${smsNotifications ? 'bg-red-600' : 'bg-gray-600'}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${smsNotifications ? 'translate-x-6' : ''}`} /></button>
                  </label>
                  <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
                    <div><p className="font-medium text-white">Marketing Emails</p><p className="text-xs text-gray-400">Receive promotions and updates from Adonix</p></div>
                    <button onClick={() => setMarketingEmails(!marketingEmails)} className={`relative w-12 h-6 rounded-full transition-colors ${marketingEmails ? 'bg-red-600' : 'bg-gray-600'}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${marketingEmails ? 'translate-x-6' : ''}`} /></button>
                  </label>
                  <div className="flex gap-3 mt-6"><button onClick={() => setSettingsSubScreen(null)} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition">Back</button></div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowHelpModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowHelpModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Help & Support</h2>
            <div className="space-y-3 text-sm text-gray-300">
              <p>Need help? We're here for you 24/7.</p>
              <div className="p-3 bg-white/5 rounded-lg"><p className="font-medium text-white">Contact Support</p><p className="text-xs text-gray-400">primesocial@primesocial.xyz</p></div>
              <div className="p-3 bg-white/5 rounded-lg"><p className="font-medium text-white">Report an Issue</p><p className="text-xs text-gray-400">We review all reports within 24 hours.</p></div>
              <div className="p-3 bg-white/5 rounded-lg"><p className="font-medium text-white">Safety Concerns</p><p className="text-xs text-gray-400">For urgent safety issues, contact local authorities first, then notify us.</p></div>
            </div>
            <button onClick={() => setShowHelpModal(false)} className="w-full mt-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold transition-all">Close</button>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => !deletingAccount && setShowDeleteAccountModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 border border-red-500/40 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => !deletingAccount && setShowDeleteAccountModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white" disabled={deletingAccount}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-3 text-red-400">⚠️ PERMANENT ACTION - CANNOT BE UNDONE</h2>
            <p className="text-sm text-gray-300 mb-3">Deleting your account will permanently remove:</p>
            <ul className="text-sm text-gray-300 space-y-1 mb-4 list-disc list-inside">
              <li>Your profile and bio</li>
              <li>All uploaded photos</li>
              <li>All bookings and session history</li>
              <li>All messages and conversations</li>
              <li>Your services, rates, and schedule</li>
            </ul>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Confirm your password to delete account <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                disabled={deletingAccount}
                className="w-full px-4 py-2 bg-black border border-red-500/40 rounded-lg text-white focus:border-red-500 focus:outline-none"
                placeholder="Enter your password"
              />
              {deletePasswordError && <p className="text-red-400 text-sm mt-1">{deletePasswordError}</p>}
            </div>
            
            <p className="text-sm text-gray-300 mb-2">Type <span className="font-bold text-red-400">DELETE</span> to confirm:</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={deletingAccount}
              className="w-full px-4 py-2 bg-black border border-red-500/40 rounded-lg text-white focus:border-red-500 focus:outline-none mb-4"
              placeholder="Type DELETE"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteAccountModal(false); setDeleteConfirmText(''); setDeletePassword(''); setDeletePasswordError(''); }}
                disabled={deletingAccount}
                className="flex-1 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccountWithPassword}
                disabled={deleteConfirmText !== 'DELETE' || !deletePassword || deletingAccount}
                className="flex-1 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingAccount ? 'Deleting...' : 'Permanent Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}