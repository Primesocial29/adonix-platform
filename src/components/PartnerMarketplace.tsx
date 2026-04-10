import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BrowsePartners from './BrowsePartners';

interface PartnerMarketplaceProps {
  onBookPartner: (partner: Profile) => void;
}

export default function PartnerMarketplace({ onBookPartner }: PartnerMarketplaceProps) {
  const { user } = useAuth();
  const [userCity, setUserCity] = useState('');

  // Get the client's city from their profile
  useEffect(() => {
    const loadUserCity = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('city')
          .eq('id', user.id)
          .single();
        if (data?.city) setUserCity(data.city);
      }
    };
    loadUserCity();
  }, [user]);

  return (
    <BrowsePartners 
      onSelectPartner={onBookPartner}
      presetCity={userCity}
    />
  );
}