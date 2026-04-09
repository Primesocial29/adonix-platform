import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function ClientCheckin() {
  // Get sessionId from URL query string
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('sessionId');
    setSessionId(id);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
      .then(({ data, error }) => {
        if (error) setError('Invalid session');
        else setSession(data);
      });
  }, [sessionId]);

  const handleConfirm = () => {
    if (!session) return;
    if (!navigator.geolocation) {
      setError('GPS not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const distance = getDistance(pos.coords.latitude, pos.coords.longitude, session.location_lat, session.location_lng);
        if (distance > session.radius_meters) {
          setError(`You are ${Math.round(distance)}m away. Must be within ${session.radius_meters}m (0.75 miles).`);
          return;
        }
        if (pos.coords.accuracy > 300) {
          setError(`GPS accuracy low (${Math.round(pos.coords.accuracy)}m). Try again.`);
          return;
        }
        await supabase
          .from('training_sessions')
          .update({ status: 'client_confirmed', client_confirmed_at: new Date().toISOString() })
          .eq('id', session.id);
        setConfirmed(true);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!session) return <div className="p-4">Loading session...</div>;
  if (confirmed) return <div className="p-4 text-green-600 text-center">✅ Payment confirmed! Partner will start the session soon.</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold">Confirm check‑in</h2>
      <p className="mt-2"><strong>Location:</strong> {session.location_name}<br/>{session.location_address}</p>
      <p className="text-sm text-gray-500">You must be within 0.75 miles (1207 meters) to confirm payment.</p>
      
      {/* GPS Verification Notice */}
      <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
        <p className="text-xs text-blue-800 text-center">
          📍 GPS Verification Required: You must be within 0.75 miles (1207 meters) of the session location to confirm payment.
          Please ensure you are at the correct public location.
        </p>
      </div>
      
      <button onClick={handleConfirm} className="mt-4 bg-green-600 text-white px-6 py-2 rounded w-full">
        Confirm Payment & Location
      </button>
    </div>
  );
}