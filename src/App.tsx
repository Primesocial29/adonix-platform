import { useState, useEffect } from 'react';
import PublicHome from './components/PublicHome';
import AdminDashboard from './components/AdminDashboard';
import PartnerProfileSetup from './components/PartnerProfileSetup';
import ClientOnboarding from './components/ClientOnboarding';
import PartnerDashboard from './components/PartnerDashboard';
import ClientDashboard from './components/ClientDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import ContactPage from './components/ContactPage';
import Settings from './components/Settings';
import AccessibilityPage from './components/AccessibilityPage';
import BrowsePartners from './components/BrowsePartners';
import SafetyPage from './components/SafetyPage';
import CompleteProfile from './components/CompleteProfile';
import LoginPage from './components/LoginPage';

// Simple Role Selection Component - No new file needed
function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<'client' | 'partner' | null>(null);

  const handleRoleSelect = (role: 'client' | 'partner') => {
    setSelectedRole(role);
    // Save to localStorage so we remember
    localStorage.setItem('userRole', role);
    
    if (role === 'client') {
      window.location.href = '/client-setup';
    } else {
      window.location.href = '/partner-setup';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <img 
              src="/adonixlogo.png" 
              alt="Adonix Logo" 
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold text-white">ADONIX</span>
              <span className="text-xs text-gray-400">Social Fitness, Elevated</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔥</div>
          <h1 className="text-3xl font-bold text-white">Welcome to Adonix Fit</h1>
          <p className="text-lg text-gray-300 mt-1">Choose your path</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Client Option */}
          <button
            onClick={() => handleRoleSelect('client')}
            className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-red-500/50 transition-all group hover:scale-105"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">💸</div>
              <h2 className="text-2xl font-bold text-white mb-2">I WANT TO SWEAT</h2>
              <p className="text-gray-400 mb-4">You will pay for sessions</p>
              <div className="text-sm text-gray-500">
                Find fitness partners near you
              </div>
            </div>
          </button>

          {/* Partner Option */}
          <button
            onClick={() => handleRoleSelect('partner')}
            className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-red-500/50 transition-all group hover:scale-105"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h2 className="text-2xl font-bold text-white mb-2">I WANT TO MAKE PEOPLE SWEAT</h2>
              <p className="text-gray-400 mb-4">You will get paid for sessions</p>
              <div className="text-sm text-gray-500">
                Become a partner and earn
              </div>
            </div>
          </button>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-400 mb-3">Already have an account?</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all border border-white/20"
          >
            SIGN IN
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // LOGIN PAGE ROUTE - Must come before role selection
  if (currentRoute === '/login') {
    return <LoginPage />;
  }

  // ROLE SELECTION - This is the main entry point for setup
  if (currentRoute === '/setup' || currentRoute === '/' || currentRoute === '') {
    // Check if user already has a role saved
    const savedRole = localStorage.getItem('userRole');
    if (savedRole === 'client' && currentRoute !== '/') {
      window.location.href = '/client-setup';
      return null;
    }
    if (savedRole === 'partner' && currentRoute !== '/') {
      window.location.href = '/partner-setup';
      return null;
    }
    // Show role selection
    return <RoleSelection />;
  }

  // Client Dashboard
  if (currentRoute === '/client-dashboard') {
    return <ClientDashboard />;
  }

  // Browse Partners (Client discovery page)
  if (currentRoute === '/browse') {
    return <BrowsePartners />;
  }

  // My Requests page (placeholder - redirect to client dashboard for now)
  if (currentRoute === '/my-requests') {
    window.location.href = '/client-dashboard';
    return null;
  }

  // Dashboard routes based on role
  if (currentRoute === '/dashboard') {
    return <PublicHome />;
  }

  // Admin routes
  if (currentRoute === '/admin-view') {
    return <AdminDashboard />;
  }

  // Partner routes
  if (currentRoute === '/partner-setup') {
    return <PartnerProfileSetup onComplete={() => {
      window.location.href = '/partner-dashboard';
    }} />;
  }
  if (currentRoute === '/partner-dashboard') {
    return <PartnerDashboard />;
  }

  // Trainer routes
  if (currentRoute === '/trainer-dashboard') {
    return <TrainerDashboard />;
  }

  // CLIENT 4-STEP ONBOARDING
  if (currentRoute === '/client-setup') {
    return <ClientOnboarding onComplete={() => {
      window.location.href = '/client-dashboard';
    }} />;
  }

  // Complete profile route - redirect to role selection
  if (currentRoute === '/complete-profile') {
    window.location.href = '/setup';
    return null;
  }

  // Settings route
  if (currentRoute === '/settings') {
    return <Settings />;
  }

  // Legal pages
  if (currentRoute === '/terms') {
    return <TermsPage />;
  }
  if (currentRoute === '/privacy') {
    return <PrivacyPage />;
  }
  if (currentRoute === '/contact') {
    return <ContactPage />;
  }

  // Accessibility page
  if (currentRoute === '/accessibility') {
    return <AccessibilityPage />;
  }

  // Safety page
  if (currentRoute === '/safety') {
    return <SafetyPage />;
  }

  // Default - show role selection
  return <RoleSelection />;
}

export default App;