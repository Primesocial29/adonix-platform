import { useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { MapPin, Star, Dumbbell } from 'lucide-react';

interface FeaturedPartnerProps {
  onBook: (partner: Profile) => void;
}

export default function FeaturedPartner({ onBook }: FeaturedPartnerProps) {
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlexPartner();
  }, []);

  const fetchAlexPartner = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('display_name', 'Alex')
        .eq('is_partner', true)
        .maybeSingle();

      if (error) throw error;
      setPartner(data);
    } catch (err) {
      console.error('Error fetching Alex:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-12 p-8 rounded-3xl bg-gradient-to-br from-red-950/40 to-orange-950/40 border border-red-500/20 animate-pulse">
        <div className="h-64 bg-white/5 rounded-2xl"></div>
      </div>
    );
  }

  if (!partner) {
    return null;
  }

  return (
    <div className="mb-12 p-8 rounded-3xl bg-gradient-to-br from-red-950/40 to-orange-950/40 border border-red-500/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="px-4 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
            TEST PARTNER
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-bold">5.0</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-3">{partner.display_name}</h2>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              {partner.bio || 'Professional fitness coach ready to help you achieve your goals.'}
            </p>

            <div className="space-y-3 mb-6">
              {partner.specialties && partner.specialties.length > 0 && (
                <div className="flex items-start gap-2">
                  <Dumbbell className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    {partner.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-3 py-1 bg-white/10 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {partner.city && (
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-5 h-5 text-red-400" />
                  <span>{partner.city}</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-5xl font-bold text-white">
                ${partner.hourly_rate}
              </span>
              <span className="text-gray-400 text-lg">suggested contribution/hour</span>
            </div>

            <button
              onClick={() => onBook(partner)}
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl"
            >
              Invite to Meet - Test Platform Support & GPS Lock
            </button>

            <div className="mt-4 p-4 bg-black/30 rounded-xl border border-white/10">
              <p className="text-sm text-gray-400">
                <span className="font-bold text-white">Test Features:</span> Book a session to see the 15% platform fee calculation and GPS location verification in action.
              </p>
            </div>
          </div>

          <div className="relative">
            {partner.profile_photo_url ? (
              <img
                src={partner.profile_photo_url}
                alt={partner.display_name}
                className="w-full h-96 object-cover rounded-2xl shadow-2xl"
              />
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-white/10">
                <Dumbbell className="w-24 h-24 text-white/20" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
