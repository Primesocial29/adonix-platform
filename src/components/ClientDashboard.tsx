import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import LiveCameraCapture from './LiveCameraCapture';
import { containsBlockedWords } from '../lib/textSanitizer';
import { Star, Camera, X, Heart, MapPin, Calendar, Clock, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';

export default function ClientDashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [showEditBio, setShowEditBio] = useState(false);
  const [editBioText, setEditBioText] = useState(profile?.bio || '');
  const [bioError, setBioError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  // Menu modal states
  const [showMyProfileModal, setShowMyProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Photo Gallery States
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [showPhotoGalleryModal, setShowPhotoGalleryModal] = useState(false);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const MAX_PHOTOS = 6;
  
  // Modal states
  const [showCamera, setShowCamera] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showAllMeetupsModal, setShowAllMeetupsModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  
  // Data states
  const [totalSpent, setTotalSpent] = useState(0);
  const [pendingSessions, setPendingSessions] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [allUpcomingSessions, setAllUpcomingSessions] = useState<any[]>([]);
  const [favoritePartners, setFavoritePartners] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Get client's username
  const clientUsername = (profile as any)?.username || profile?.first_name?.toLowerCase().replace(/\s/g, '_') || 'client';

  // Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'DELETE') return;
    setDeletingAccount(true);
    try {
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

  useEffect(() => {
    if (user) {
      loadPhotos();
      loadStats();
      loadUpcomingSessions();
      loadFavoritePartners();
      loadReviews();
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

  const loadStats = async () => {
    if (!user) return;
    try {
      // Get completed sessions total spent
      const { data: completedData } = await supabase
        .from('bookings')
        .select('suggested_contribution')
        .eq('client_id', user.id)
        .eq('status', 'completed');
      
      const total = (completedData || []).reduce((sum, b) => sum + (b.suggested_contribution || 0), 0);
      setTotalSpent(total);
      setCompletedSessions(completedData?.length || 0);
      
      // Get pending sessions
      const { data: pendingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', user.id)
        .eq('status', 'pending');
      setPendingSessions(pendingData?.length || 0);
      
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadUpcomingSessions = async () => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('bookings')
        .select('*, partner:partner_id(id, first_name, username, live_photo_url)')
        .eq('client_id', user.id)
        .in('status', ['confirmed', 'pending'])
        .gte('booking_date', now)
        .order('booking_date', { ascending: true });
      
      setUpcomingSessions((data || []).slice(0, 3));
      setAllUpcomingSessions(data || []);
    } catch (err) {
      console.error('Error loading upcoming sessions:', err);
    }
  };

  const loadFavoritePartners = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('favorites')
        .select('partner:partner_id(*)')
        .eq('client_id', user.id);
      
      setFavoritePartners(data?.map(f => f.partner) || []);
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  const loadReviews = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*, partner:partner_id(first_name, username, live_photo_url)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      
      setReviews(data || []);
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    if (minutes === 30) return '30 min';
    if (minutes === 60) return '1 hour';
    if (minutes === 90) return '1.5 hours';
    return '2 hours';
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
                  <button onClick={() => { setShowDeleteAccountModal(true); setShowSettingsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 text-red-400">🗑️ Delete Account</button>
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
          
          <h1 className="text-2xl font-bold text-white">🔥 @{clientUsername}</h1>
          
          <div className="flex items-center justify-center gap-1 mt-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-white font-semibold text-sm">New</span>
            <span className="text-gray-400 text-sm">(0 reviews)</span>
          </div>
          
          {showEditBio ? (
            <div className="max-w-md mx-auto mt-4">
              <textarea
                value={editBioText}
                onChange={(e) => setEditBioText(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                rows={3}
                placeholder="Share your fitness journey... (20-500 characters)"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={updateBio} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg">Save</button>
                <button onClick={() => setShowEditBio(false)} className="flex-1 px-4 py-2 bg-gray-600 rounded-lg">Cancel</button>
              </div>
              {bioError && <p className="text-red-400 text-sm mt-1">{bioError}</p>}
            </div>
          ) : (
            <>
              <p className="text-gray-300 max-w-md mx-auto mt-3">{profile?.bio || 'No bio yet. Click Edit Bio to share your fitness journey!'}</p>
              <button onClick={() => setShowEditBio(true)} className="text-sm text-red-400 hover:text-red-300 mt-2">Edit Bio</button>
            </>
          )}
          
          <div className="text-xs text-gray-500 mt-4 space-y-1">
            <p>AUTHENTICITY CHECK: Live Camera Only. AI-generated faces or filters are prohibited.</p>
            <p>This is a social meetup platform, not a professional service.</p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
            <p className="text-2xl font-bold text-green-400">${totalSpent}</p>
            <p className="text-xs text-gray-400">Total Spent</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
            <p className="text-2xl font-bold text-yellow-400">{pendingSessions}</p>
            <p className="text-xs text-gray-400">Pending</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
            <p className="text-2xl font-bold text-blue-400">{completedSessions}</p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button 
            onClick={() => window.location.href = '/browse'}
            className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold hover:scale-105 transition"
          >
            🔍 FIND PARTNERS
          </button>
          <button 
            onClick={() => window.location.href = '/my-requests'}
            className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-sm font-semibold hover:scale-105 transition"
          >
            📋 MY REQUESTS
          </button>
          <button 
            onClick={() => setShowFavoritesModal(true)}
            className="px-4 py-3 bg-white/10 rounded-xl text-sm font-semibold hover:bg-white/20 transition"
          >
            ❤️ FAVORITES
          </button>
          <button 
            onClick={() => setShowReviewsModal(true)}
            className="px-4 py-3 bg-white/10 rounded-xl text-sm font-semibold hover:bg-white/20 transition"
          >
            ⭐ MY REVIEWS
          </button>
        </div>

        {/* Upcoming Sessions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">UPCOMING SESSIONS</h2>
            {allUpcomingSessions.length > 3 && (
              <button onClick={() => setShowAllMeetupsModal(true)} className="text-sm text-red-400 hover:text-red-300">View All</button>
            )}
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-8 text-center border border-white/10">
              <p className="text-gray-400">No upcoming sessions. Find a partner to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">🧘 {session.selected_service || 'Fitness'} with @{session.partner?.username || 'partner'}</p>
                      <p className="text-sm text-gray-400 mt-1">📅 {formatDate(session.booking_date)}</p>
                      <p className="text-sm text-gray-400">📍 {session.location_name || 'Verified public venue'}</p>
                      <p className="text-xs text-gray-500 mt-1">⏱️ {formatDuration(session.session_duration || 60)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">${session.total_amount || session.suggested_contribution || 75}</p>
                      <p className={`text-xs px-2 py-0.5 rounded-full mt-1 ${session.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {session.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* High-Standard Protocol */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold mb-3">High-Standard Protocol</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Meet only at verified public venues — private residences are strictly excluded.</li>
            <li>• GPS check-in required for every meetup.</li>
            <li>• Two-person only — no extra friends or spectators.</li>
            <li>• Report concerns immediately. We review within 24 hours.</li>
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

        {/* Footer */}
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

      {/* All Upcoming Meetups Modal */}
      {showAllMeetupsModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowAllMeetupsModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">All Upcoming Sessions</h2>
            {allUpcomingSessions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No upcoming sessions.</p>
            ) : (
              <div className="space-y-3">
                {allUpcomingSessions.map((session) => (
                  <div key={session.id} className="bg-white/5 rounded-xl p-4">
                    <p className="font-medium">{session.selected_service || 'Fitness'} with @{session.partner?.username || 'partner'}</p>
                    <p className="text-sm text-gray-400">{formatDate(session.booking_date)}</p>
                    <p className="text-sm text-gray-400">{session.location_name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${session.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {session.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                      <span className="text-green-400 font-semibold">${session.total_amount || session.suggested_contribution || 75}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowAllMeetupsModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Favorites Modal */}
      {showFavoritesModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowFavoritesModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Favorite Partners</h2>
            {favoritePartners.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No favorite partners yet. Heart a partner to save them here!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favoritePartners.map((partner) => (
                  <div key={partner.id} className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-red-500/20">
                      {partner.live_photo_url ? (
                        <img src={partner.live_photo_url} alt={partner.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">📷</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">@{partner.username || partner.first_name?.toLowerCase()}</p>
                      <p className="text-xs text-gray-400">{partner.service_types?.slice(0, 2).join(', ') || 'Fitness'}</p>
                    </div>
                    <button 
                      onClick={() => window.location.href = `/partner/${partner.username}`}
                      className="px-3 py-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg text-xs"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowFavoritesModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowReviewsModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">My Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No reviews yet. Leave a review after your sessions!</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-white">@{review.partner?.username || 'partner'}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p className="text-sm text-gray-300 mt-2">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowReviewsModal(false)} className="w-full mt-4 py-2 bg-white/10 rounded-lg">Close</button>
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
                <p className="font-bold text-lg">@{clientUsername}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p><span className="text-gray-500">Bio:</span> {profile?.bio || 'No bio yet.'}</p>
              <p><span className="text-gray-500">Total Spent:</span> ${totalSpent}</p>
              <p><span className="text-gray-500">Completed Sessions:</span> {completedSessions}</p>
              <p><span className="text-gray-500">Pending Sessions:</span> {pendingSessions}</p>
            </div>
            <button onClick={() => setShowMyProfileModal(false)} className="w-full mt-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold transition-all">Close</button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 border border-white/10 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="font-medium text-white">Email Notifications</p>
                <p className="text-xs text-gray-400">Receive updates about your bookings and messages.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="font-medium text-white">Location Services</p>
                <p className="text-xs text-gray-400">Used for GPS check-in verification during meetups.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="font-medium text-white">Account Email</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button onClick={() => setShowSettingsModal(false)} className="w-full mt-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold transition-all">Close</button>
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
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="font-medium text-white">Contact Support</p>
                <p className="text-xs text-gray-400">primesocial@primesocial.xyz</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="font-medium text-white">Report an Issue</p>
                <p className="text-xs text-gray-400">We review all reports within 24 hours.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="font-medium text-white">Safety Concerns</p>
                <p className="text-xs text-gray-400">For urgent safety issues, contact local authorities first, then notify us.</p>
              </div>
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
              <li>Your reviews and favorites</li>
            </ul>
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
                onClick={() => { setShowDeleteAccountModal(false); setDeleteConfirmText(''); }}
                disabled={deletingAccount}
                className="flex-1 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
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