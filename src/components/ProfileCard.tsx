import React, { useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface ProfileCardProps {
  profile: Profile;
  onBookSession?: (profile: Profile) => void;
}

export function ProfileCard({ profile, onBookSession }: ProfileCardProps) {
  const { user, isTrainer, isClient } = useAuth();
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  
  const isOwnProfile = user?.id === profile.id;

  const handleReport = async () => {
    if (!reportReason) return;
    
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user?.id,
          reported_id: profile.id,
          reason: reportReason,
          status: 'pending'
        });
      
      if (error) throw error;
      
      alert('Report submitted successfully');
      setShowReportModal(false);
      setReportReason('');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Profile Header */}
      <div className="flex items-center space-x-4 mb-4">
        {profile.live_photo_url && (
          <img 
            src={profile.live_photo_url} 
            alt={profile.first_name || 'Profile'} 
            className="w-20 h-20 rounded-full object-cover"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold">{profile.first_name || 'Anonymous'}</h2>
          <p className="text-gray-600">{profile.role === 'trainer' ? '🏋️ Fitness Partner' : '💪 Fitness Enthusiast'}</p>
        </div>
      </div>

      {/* Profile Details */}
      <div className="space-y-3 mb-6">
        {profile.bio && (
          <div>
            <h3 className="font-semibold text-gray-700">Bio</h3>
            <p className="text-gray-600">{profile.bio}</p>
          </div>
        )}
        
        {profile.specialties && profile.specialties.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-700">Specialties</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile.specialties.map((specialty, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {profile.hourly_rate && profile.role === 'trainer' && (
          <div>
            <h3 className="font-semibold text-gray-700">Suggested Contribution</h3>
            <p className="text-2xl font-bold text-green-600">${profile.hourly_rate}/hour</p>
          </div>
        )}
        
        {profile.fitness_level && (
          <div>
            <h3 className="font-semibold text-gray-700">Fitness Level</h3>
            <p className="text-gray-600">{profile.fitness_level}</p>
          </div>
        )}
        
        {profile.age && (
          <div>
            <h3 className="font-semibold text-gray-700">Age</h3>
            <p className="text-gray-600">{profile.age}</p>
          </div>
        )}
        
        {profile.gender && (
          <div>
            <h3 className="font-semibold text-gray-700">Gender</h3>
            <p className="text-gray-600">{profile.gender}</p>
          </div>
        )}
      </div>

      {/* Action Buttons - Only show for other users' profiles */}
      {!isOwnProfile && (
        <div className="space-y-3">
          {/* Book Session - Only show if viewer is client and profile is trainer */}
          {isClient && profile.role === 'trainer' && onBookSession && (
            <button
              onClick={() => onBookSession(profile)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Invite to Meet with {profile.first_name || 'Partner'}
            </button>
          )}
          
          {/* Report User - Available to all users (can't report yourself) */}
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition font-semibold"
          >
            ⚠️ Report User
          </button>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Report User</h3>
            <p className="text-gray-600 mb-4">Why are you reporting {profile.first_name}?</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Please provide details..."
              className="w-full p-2 border rounded-lg mb-4"
              rows={4}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleReport}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
              >
                Submit Report
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}