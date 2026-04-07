import { useState, useEffect } from 'react';
import { Dumbbell, LogOut } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import TrainerDashboard from "./TrainerDashboard";  // ← Changed from PartnerMarketplace
import BookingFlow, { BookingDetails } from './BookingFlow';
import CheckoutScreen from './CheckoutScreen';
import AuthModal from './AuthModal';

export default function PublicHome() {
  const { user, profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

  const handleBookTrainer = (trainer: Profile) => {
    setSelectedPartner(trainer);  // ← Fixed: changed 'partner' to 'trainer'
  };

  const handleProceedToCheckout = (details: BookingDetails) => {
    setBookingDetails(details);
    setSelectedPartner(null);
  };

  const handleBookingSuccess = () => {
    setBookingDetails(null);
    alert('Booking created successfully!');
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Client notifications for booking status changes
  useEffect(() => {
    if (!user || profile?.is_partner) return;

    const fetchClientBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, partner_id')
        .eq('client_id', user.id)
        .in('status', ['confirmed', 'declined']);

      if (error) {
        console.error('Error fetching client bookings:', error);
        return;
      }

      const stored = localStorage.getItem('notifiedBookingIds');
      const notifiedIds = stored ? JSON.parse(stored) : [];

      const newBookings = data?.filter(booking => !notifiedIds.includes(booking.id));

      if (newBookings && newBookings.length > 0) {
        const partnerIds = newBookings.map(b => b.partner_id);
        const { data: partners } = await supabase
          .from('profiles')
          .select('id, first_name')
          .in('id', partnerIds);

        const partnerMap = new Map(partners?.map(p => [p.id, p.first_name]));
        const messages = newBookings.map(b => {
          const partnerName = partnerMap.get(b.partner_id) || 'a partner';
          return `Your booking request has been ${b.status} by ${partnerName}.`;
        }).join('\n');

        alert(messages);

        const updatedIds = [...notifiedIds, ...newBookings.map(b => b.id)];
        localStorage.setItem('notifiedBookingIds', JSON.stringify(updatedIds));
      }
    };

    fetchClientBookings();
  }, [user, profile]);

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 w-full border-b border-white/10 bg-black/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/Screenshot_2026-04-03_221406.png" alt="Adonix Fit" className="h-8 w-auto" />
            <span className="text-2xl font-bold tracking-tight">Adonix Fit</span>
          </div>
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <span className="text-gray-300 text-sm">
                  Welcome, {profile?.first_name || 'Fitness Enthusiast'}!
                </span>
                {profile?.is_partner && (
                  <a href="/partner-dashboard" className="text-gray-400 hover:text-white transition-colors">
                    Partner Dashboard
                  </a>
                )}
                <a href="/profile" className="text-gray-400 hover:text-white transition-colors">
                  My Profile
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-20 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Fitness Partners</h1>
          <p className="text-gray-400 text-lg">Find your perfect workout buddy</p>
          {/* Optional: Remove this button if you don't need it anymore */}
          <button
            onClick={() => window.location.href = '/partner-setup'}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Partner Setup (Test)
          </button>
        </div>

        <TrainerDashboard onBookTrainer={handleBookTrainer} />
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

      {showAuthModal && (
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}

      <footer className="mt-12 pt-8 pb-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500">
              © 2026 Adonix Fit. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
              <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/contact" className="hover:text-white transition-colors">Contact</a>
              <span className="text-gray-600 hidden sm:inline">|</span>
              <span className="text-gray-600">Adonix Fit – Safe fitness connections</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}