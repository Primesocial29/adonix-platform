import { useState } from 'react';
import { supabase, Booking } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

interface SessionCheckInProps {
  booking: Booking;
  onCheckInComplete: () => void;
}

export default function SessionCheckIn({ booking, onCheckInComplete }: SessionCheckInProps) {
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isClient = user?.id === booking.client_id;
  const hasCheckedIn = isClient ? booking.client_checked_in : booking.partner_checked_in;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const checkIfResidential = async (lat: number, lng: number): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();

      const residentialTypes = ['house', 'residential', 'apartments', 'apartment'];
      const addressType = data.type?.toLowerCase() || '';
      const category = data.category?.toLowerCase() || '';

      return residentialTypes.some(
        type => addressType.includes(type) || category.includes(type)
      );
    } catch (err) {
      console.warn('Could not verify location type, allowing check-in');
      return false;
    }
  };

  const handleCheckIn = async () => {
    setChecking(true);
    setError('');
    setSuccess('');

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      const distance = calculateDistance(
        userLat,
        userLng,
        booking.location_lat,
        booking.location_lng
      );

      if (distance > 200) {
        throw new Error(
          `You are ${Math.round(distance)}m away. You must be within 200m of ${booking.location_name} to check in.`
        );
      }

      const isResidential = await checkIfResidential(userLat, userLng);
      if (isResidential) {
        throw new Error(
          'Check-in blocked: Your current location appears to be a residential address. For safety, sessions must occur at public gyms or parks.'
        );
      }

      const updateData = isClient
        ? {
            client_checked_in: true,
            client_checkin_time: new Date().toISOString(),
          }
        : {
            partner_checked_in: true,
            partner_checkin_time: new Date().toISOString(),
          };

      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);

      if (updateError) throw updateError;

      setSuccess(`Successfully checked in at ${booking.location_name}!`);
      setTimeout(() => {
        onCheckInComplete();
      }, 2000);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setError('Location access denied. Please enable location services and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Check-in failed');
      }
    } finally {
      setChecking(false);
    }
  };

  if (hasCheckedIn) {
    return (
      <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 flex items-center gap-4">
        <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-green-300 mb-1">Checked In</h3>
          <p className="text-sm text-green-400">
            You've successfully checked in to this session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        <MapPin className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-lg mb-2">Session Check-In</h3>
          <p className="text-sm text-gray-400 mb-4">
            Check in when you arrive at {booking.location_name}. GPS will verify you're within 200m
            of the location.
          </p>
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 flex gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-200">
              <p className="font-medium mb-1">Safety Notice</p>
              <p>
                For your safety, check-ins at residential addresses are blocked. Sessions must take
                place at public gyms or parks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-300">{success}</p>
        </div>
      )}

      <button
        onClick={handleCheckIn}
        disabled={checking}
        className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
      >
        {checking ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Verifying Location...
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            Check In Now
          </>
        )}
      </button>
    </div>
  );
}
