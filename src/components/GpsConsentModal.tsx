import { useState } from 'react';
import { X, MapPin, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface GpsConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentGiven: () => void;
}

export default function GpsConsentModal({ isOpen, onClose, onConsentGiven }: GpsConsentModalProps) {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConsent = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          gps_consent_granted: true,
          gps_consent_granted_at: new Date().toISOString(),
        })
        .eq('id', user?.id);
      if (updateError) throw updateError;
      await refreshProfile();
      onConsentGiven();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save consent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl max-w-md w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold">Enable GPS for Safety</h2>
        </div>

        <div className="space-y-4 text-gray-300 text-sm">
          <p>Adonix Fit uses your device’s location to:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><Shield className="inline w-4 h-4 mr-1" /> Verify you are at the agreed public meeting place (gym, park, etc.)</li>
            <li><AlertTriangle className="inline w-4 h-4 mr-1" /> Enable emergency SOS – your real‑time location can be shared with emergency services if you trigger the SOS feature</li>
            <li>Prevent fraud and ensure both parties are safe</li>
          </ul>
          <p className="mt-3 text-xs text-gray-400">Your location is never shared with other users. It is only used for check‑in verification and emergency purposes. You can disable location services in your device settings, but you will not be able to use the session check‑in feature.</p>
          <p className="text-xs text-gray-400">By clicking “I Agree”, you consent to the collection and use of your precise location as described in our Privacy Policy.</p>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm mt-4">{error}</div>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleConsent}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'I Agree'}
          </button>
        </div>
      </div>
    </div>
  );
}