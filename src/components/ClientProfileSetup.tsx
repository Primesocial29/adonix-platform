import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Trash2 } from 'lucide-react';
import { validateText } from '../lib/textSanitizer';
import BlockedWordAlert from './BlockedWordAlert';

interface ClientProfileSetupProps {
  onComplete?: () => void;
}

export default function ClientProfileSetup({ onComplete }: ClientProfileSetupProps) {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Validation states
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setFirstName(data.first_name || '');
        setFitnessGoals(data.fitness_goals || '');
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setGoalsError(null);
    setBlockedWords([]);
    
    if (fitnessGoals) {
      const goalsValidation = await validateText(fitnessGoals, 'fitness goals');
      if (!goalsValidation.isValid) {
        setBlockedWords(goalsValidation.blockedWords);
        setGoalsError(goalsValidation.error || 'Your fitness goals contain blocked words');
        return;
      }
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          fitness_goals: fitnessGoals,
          photos: photos,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      await refreshProfile(); // Update context
      alert('Profile saved successfully!');
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2 text-white">My Profile</h1>
        <p className="text-gray-400 mb-8 text-base">Update your information for partners to see</p>
        
        {goalsError && (
          <BlockedWordAlert 
            blockedWords={blockedWords} 
            onClose={() => {
              setGoalsError(null);
              setBlockedWords([]);
            }}
          />
        )}
        
        {/* Name */}
        <div className="mb-8">
          <label className="block text-base font-medium mb-2 text-white">
            Your Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="What should partners call you?"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none transition-colors text-white placeholder-gray-500 text-base"
          />
        </div>
        
        {/* Fitness Goals */}
        <div className="mb-8">
          <label className="block text-base font-medium mb-2 text-white">
            Fitness Goals
          </label>
          <textarea
            value={fitnessGoals}
            onChange={(e) => setFitnessGoals(e.target.value)}
            placeholder="What are you hoping to achieve? (e.g., lose weight, build muscle, improve endurance)"
            rows={4}
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:border-red-500 focus:outline-none transition-colors text-white placeholder-gray-500 text-base ${
              goalsError ? 'border-red-500' : 'border-white/10'
            }`}
          />
          <p className="text-xs text-gray-500 mt-2">Share your goals so partners can better help you.</p>
        </div>
        
        {/* Photos */}
        <div className="mb-8">
          <label className="block text-base font-medium mb-2 flex items-center gap-2 text-white">
            <Camera className="w-5 h-5" />
            Photos
          </label>
          <p className="text-xs text-gray-500 mb-3">Upload photos of yourself (optional, helps partners know you)</p>
          
          <div className="grid grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square bg-white/5 rounded-xl overflow-hidden">
                <img src={photo} alt={`Profile ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                  className="absolute top-2 right-2 p-1 bg-red-600 rounded-full hover:bg-red-700"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                alert('Camera capture will be implemented next');
              }}
              className="aspect-square bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-red-500 transition-colors"
            >
              <Camera className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-gray-400">Add Photo</span>
            </button>
          </div>
        </div>
        
        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 rounded-xl font-semibold transition-all transform hover:scale-105 text-white text-base"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}