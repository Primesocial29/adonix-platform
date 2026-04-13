import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function PartnerDashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [debug, setDebug] = useState<any>({});

  useEffect(() => {
    console.log('PartnerDashboard mounted', { user, profile, loading });
    setDebug({ userId: user?.id, role: profile?.role, isPartner: profile?.is_partner });
  }, [user, profile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        <p className="ml-4">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No user found. Please sign in.</p>
          <a href="/" className="text-red-500 hover:underline">Go to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Profile Header */}
        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden">
              {profile?.live_photo_url ? (
                <img src={profile.live_photo_url} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">Hello, {profile?.first_name || 'Partner'}! 👋</h2>
              <p className="text-gray-400 mt-1">{profile?.bio || 'No bio yet. Click Edit Bio to add one.'}</p>
              <div className="flex gap-3 mt-3">
                <button className="px-3 py-1 text-sm bg-white/10 rounded-full hover:bg-white/20">✏️ Edit Bio</button>
                <button className="px-3 py-1 text-sm bg-white/10 rounded-full hover:bg-white/20">📸 Change Photo</button>
                <button onClick={() => refreshProfile()} className="px-3 py-1 text-sm bg-blue-600/30 rounded-full hover:bg-blue-600/50">🔄 Refresh</button>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info - Remove after testing */}
        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
          <h3 className="text-lg font-semibold mb-3">Debug Info</h3>
          <div className="space-y-1 text-sm text-gray-400">
            <p>User ID: {user.id}</p>
            <p>Role: {profile?.role || 'undefined'}</p>
            <p>Is Partner: {String(profile?.is_partner || 'undefined')}</p>
            <p>Profile Complete: {String(profile?.profile_complete || 'undefined')}</p>
          </div>
        </div>

        {/* Pending Requests - Placeholder */}
        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
          <h3 className="text-xl font-semibold mb-4">📋 Pending Requests</h3>
          <p className="text-gray-400">No pending requests at this time.</p>
        </div>

        {/* Upcoming Soon - Placeholder */}
        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
          <h3 className="text-xl font-semibold mb-4">⏰ Upcoming Soon</h3>
          <p className="text-gray-400">No upcoming meetups scheduled.</p>
        </div>

        {/* All Upcoming Meetups - Placeholder */}
        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
          <h3 className="text-xl font-semibold mb-4">📅 All Upcoming Meetups</h3>
          <p className="text-gray-400">No meetups scheduled.</p>
        </div>

        {/* Earnings Summary - Placeholder */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold mb-4">💰 Earnings Summary</h3>
          <p className="text-gray-400">Total earned this month: $0.00</p>
          <p className="text-xs text-gray-500 mt-2">Adonix Fit uses Stripe for all payments.</p>
        </div>

      </div>
    </div>
  );
}