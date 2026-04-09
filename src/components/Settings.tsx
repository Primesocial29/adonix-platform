import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { User, Mail, MapPin, Calendar, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState('');
  
  // California opt-out preference
  const [doNotSell, setDoNotSell] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setBio(profile.bio || '');
      setCity(profile.city || '');
      setFitnessGoals(profile.fitness_goals || '');
      
      // Load opt-out preference from localStorage (or database)
      const savedPreference = localStorage.getItem('doNotSellData');
      if (savedPreference === 'true') {
        setDoNotSell(true);
      }
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSaved(false);
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          bio: bio,
          city: city,
          fitness_goals: fitnessGoals,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);
      
      if (updateError) throw updateError;
      
      // Save opt-out preference
      localStorage.setItem('doNotSellData', doNotSell.toString());
      
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDoNotSellToggle = () => {
    const newValue = !doNotSell;
    setDoNotSell(newValue);
    
    // If opting out, also set a cookie or preference for analytics pixels
    if (newValue) {
      // Disable tracking pixels
      localStorage.setItem('disableTracking', 'true');
    } else {
      localStorage.removeItem('disableTracking');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400 mb-8">Manage your profile and privacy preferences</p>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        {saved && (
          <div className="bg-green-500/20 border border-green-500 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-300 text-sm">Settings saved successfully!</p>
          </div>
        )}
        
        <div className="space-y-6">
          {/* Profile Information Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-red-500" />
              Profile Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Display Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white"
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact support for assistance.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white"
                  placeholder="e.g., Los Angeles, CA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white"
                  placeholder="Tell others about yourself..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Fitness Goals
                </label>
                <textarea
                  value={fitnessGoals}
                  onChange={(e) => setFitnessGoals(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white"
                  placeholder="What are your fitness goals?"
                />
              </div>
            </div>
          </div>
          
          {/* Privacy Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Privacy & Data</h2>
            
            <div className="space-y-4">
              {/* California Opt-Out Link */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Do Not Sell My Personal Information</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      California residents: Opt out of the sale or sharing of your personal information for cross-context behavioral advertising.
                    </p>
                  </div>
                  <button
                    onClick={handleDoNotSellToggle}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      doNotSell ? 'bg-red-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      doNotSell ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {doNotSell 
                    ? '✓ You have opted out of the sale of your personal information.' 
                    : 'Toggle on to opt out of data sharing for targeted advertising.'}
                </p>
              </div>
              
              {/* Account Deletion */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="font-medium text-white">Delete Account</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Permanently delete your account and all associated data.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      // Add account deletion logic here
                      alert('Account deletion request submitted. Contact support to complete.');
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 rounded-xl font-semibold transition-all transform hover:scale-105 text-white flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}