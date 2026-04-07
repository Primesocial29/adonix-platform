import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import QRCode from 'react-qr-code';
import { StandaloneSearchBox, useLoadScript } from '@react-google-maps/api';

const libraries = ["places"];
const ALLOWED_RADIUS_M = 1207; // 0.75 miles

interface Session {
  id: string;
  location_name: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  status: string;
  booked_duration_seconds: number;
}

interface Props {
  bookingId: string;
  partnerId: string;
  clientId: string;
  bookedDurationSeconds: number;
  onSessionComplete: () => void;
}

export default function PartnerSessionManager({ bookingId, partnerId, clientId, bookedDurationSeconds, onSessionComplete }: Props) {
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [qrValue, setQrValue] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [readySecondsLeft, setReadySecondsLeft] = useState<number>(0);
  const [sessionTimer, setSessionTimer] = useState<number>(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const createSession = async (place: google.maps.places.PlaceResult) => {
    const { data, error } = await supabase
      .from('training_sessions')
      .insert({
        booking_id: bookingId,
        partner_id: partnerId,
        client_id: clientId,
        location_name: place.name,
        location_address: place.formatted_address,
        location_lat: place.geometry!.location.lat(),
        location_lng: place.geometry!.location.lng(),
        radius_meters: ALLOWED_RADIUS_M,
        booked_duration_seconds: bookedDurationSeconds,
        status: 'pending_client_confirmation',
      })
      .select()
      .single();
    if (error) throw error;
    setSession(data);
    const qrUrl = `${window.location.origin}/client-checkin?sessionId=${data.id}`;
    setQrValue(qrUrl);
    setStatus('waiting_client');
  };

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`training-session-${session.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'training_sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          const updated = payload.new as Session;
          setSession(updated);
          handleStatusChange(updated.status);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'client_confirmed') {
      setStatus('client_confirmed');
      startReadyTimer();
    } else if (newStatus === 'active') {
      startSessionTimer();
    } else if (newStatus === 'completed') {
      if (intervalId) clearInterval(intervalId);
      onSessionComplete();
    }
  };

  const startReadyTimer = () => {
    let seconds = 120;
    setReadySecondsLeft(seconds);
    const id = setInterval(() => {
      seconds--;
      setReadySecondsLeft(seconds);
      if (seconds <= 0) {
        clearInterval(id);
        setStatus('ready_expired');
        alert('Time to start session expired. Please generate a new QR.');
      }
    }, 1000);
    setIntervalId(id);
  };

  const startSession = async () => {
    if (!session) return;
    if (intervalId) clearInterval(intervalId);
    await supabase
      .from('training_sessions')
      .update({ status: 'active', session_started_at: new Date().toISOString() })
      .eq('id', session.id);
    setStatus('active');
  };

  const startSessionTimer = () => {
    let remaining = bookedDurationSeconds;
    setSessionTimer(remaining);
    const id = setInterval(async () => {
      remaining--;
      setSessionTimer(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        await supabase
          .from('training_sessions')
          .update({ status: 'completed', session_completed_at: new Date().toISOString() })
          .eq('id', session!.id);
        setStatus('completed');
      }
    }, 1000);
    setIntervalId(id);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <div className="bg-black rounded-xl p-4 shadow text-white">
      {!session && (
  <div>
    <h3 className="font-bold text-lg text-gray-900 mb-2">Select meeting location</h3>
    <StandaloneSearchBox
      onLoad={(ref) => (searchBoxRef.current = ref)}
      onPlacesChanged={() => {
        const places = searchBoxRef.current?.getPlaces();
        if (places && places.length > 0) setSelectedPlace(places[0]);
      }}
    >
      <input
        type="text"
        placeholder="Search address or gym"
        className="w-full p-2 rounded-lg mt-1 bg-orange-600 text-white placeholder-white/80 focus:ring-2 focus:ring-orange-400 focus:outline-none"
      />
    </StandaloneSearchBox>
    <button
      onClick={() => selectedPlace && createSession(selectedPlace)}
      disabled={!selectedPlace}
      className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50"
    >
      Use this location
    </button>
  </div>
)}

      {session && qrValue && status === 'waiting_client' && (
        <div className="text-center">
          <h3 className="font-bold">Show this QR code to client</h3>
          <QRCode value={qrValue} size={200} style={{ margin: "auto", display: "block" }} />
          <p className="text-sm text-gray-500">Client must be within 0.75 miles to confirm payment.</p>
          <p className="text-xs mt-2">Status: Waiting for client confirmation...</p>
        </div>
      )}

      {status === 'client_confirmed' && (
        <div>
          <p className="text-green-600 font-bold">✅ Client confirmed payment!</p>
          <p>You have {readySecondsLeft} seconds to start the session.</p>
          <button onClick={startSession} className="mt-3 bg-blue-600 text-white px-6 py-2 rounded">
            Start Session
          </button>
        </div>
      )}

      {status === 'active' && (
        <div>
          <p className="text-blue-600 font-bold">Session in progress</p>
          <p className="text-2xl font-mono">{formatTime(sessionTimer)}</p>
        </div>
      )}

      {status === 'completed' && (
        <p className="text-green-600 font-bold">Session completed! Payment released.</p>
      )}
    </div>
  );
}