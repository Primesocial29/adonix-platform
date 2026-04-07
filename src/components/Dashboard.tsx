import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../lib/supabase';
import FeaturedPartner from './FeaturedPartner';
import PartnerMarketplace from './PartnerMarketplace';
import BookingFlow, { BookingDetails } from './BookingFlow';
import CheckoutScreen from './CheckoutScreen';
import MyBookings from './MyBookings';
import { Dumbbell, LogOut, Users, Calendar } from 'lucide-react';

type Tab = 'browse' | 'bookings';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleBookPartner = (partner: Profile) => {
    setSelectedPartner(partner);
  };

  const handleProceedToCheckout = (details: BookingDetails) => {
    setBookingDetails(details);
    setSelectedPartner(null);
  };

  const handleBookingSuccess = () => {
    setBookingDetails(null);
    setActiveTab('bookings');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 w-full border-b border-white/10 bg-black/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-red-500" strokeWidth={2.5} />
            <span className="text-2xl font-bold tracking-tight">Hot Buddies</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="pt-20 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome, {profile?.display_name}!</h1>
          <p className="text-gray-400 text-lg">Your fitness partner marketplace awaits</p>
        </div>

        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('browse')}
            className={`
              px-6 py-3 font-medium transition-all flex items-center gap-2
              ${activeTab === 'browse'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
              }
            `}
          >
            <Users className="w-5 h-5" />
            Browse Partners
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`
              px-6 py-3 font-medium transition-all flex items-center gap-2
              ${activeTab === 'bookings'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
              }
            `}
          >
            <Calendar className="w-5 h-5" />
            My Bookings
          </button>
        </div>

        {activeTab === 'browse' && (
          <>
            <FeaturedPartner onBook={handleBookPartner} />
            <PartnerMarketplace onBookPartner={handleBookPartner} />
          </>
        )}
        {activeTab === 'bookings' && <MyBookings />}
      </div>

      {selectedPartner && (
        <BookingFlow
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          onProceedToCheckout={handleProceedToCheckout}
        />
      )}

      {bookingDetails && (
        <CheckoutScreen
          bookingDetails={bookingDetails}
          onClose={() => setBookingDetails(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
