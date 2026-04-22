import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
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
import LandingPageNew from './components/LandingPageNew';
import { useAuth } from './hooks/useAuth';

// ... KEEP ALL YOUR EXISTING MODAL FUNCTIONS (CheckboxTermsModal, FooterInfoModal, ConfirmLeaveModal, PartnerSignupScreen, PartnerFlow, RoleSelection) EXACTLY AS THEY ARE ...

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentRoute === '/login') {
    return <LoginPage />;
  }

  // NEW TEST ROUTE - your new landing page
  if (currentRoute === '/test-landing') {
    return <LandingPageNew />;
  }

if (currentRoute === '/test-landing') {
  return <LandingPageNew />;
}

if (currentRoute === '/test-landing') {
  return <LandingPageNew />;
}

if (currentRoute === '/setup' || currentRoute === '/' || currentRoute === '') {
  return <RoleSelection />;
}

  if (currentRoute === '/partner-setup') {
    return <PartnerFlow />;
  }

  if (currentRoute === '/client-dashboard') {
    return <ClientDashboard />;
  }

  if (currentRoute === '/browse') {
    return <BrowsePartners />;
  }

  if (currentRoute === '/my-requests') {
    window.location.href = '/client-dashboard';
    return null;
  }

  if (currentRoute === '/dashboard') {
    return <PublicHome />;
  }

  if (currentRoute === '/admin-view') {
    return <AdminDashboard />;
  }

  if (currentRoute === '/partner-dashboard') {
    return <PartnerDashboard />;
  }

  if (currentRoute === '/trainer-dashboard') {
    return <TrainerDashboard />;
  }

  if (currentRoute === '/client-setup') {
    return <ClientOnboarding onComplete={() => {
      window.location.href = '/client-dashboard';
    }} />;
  }

  if (currentRoute === '/complete-profile') {
    window.location.href = '/setup';
    return null;
  }

  if (currentRoute === '/settings') {
    return <Settings />;
  }

  if (currentRoute === '/terms') {
    return <TermsPage />;
  }
  if (currentRoute === '/privacy') {
    return <PrivacyPage />;
  }
  if (currentRoute === '/contact') {
    return <ContactPage />;
  }

  if (currentRoute === '/accessibility') {
    return <AccessibilityPage />;
  }

  if (currentRoute === '/safety') {
    return <SafetyPage />;
  }

  return <RoleSelection />;
}

export default App;