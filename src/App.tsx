import { useState, useEffect } from 'react';
import PublicHome from './components/PublicHome';
import AdminDashboard from './components/AdminDashboard';
import PartnerProfileSetup from './components/PartnerProfileSetup';
import ClientOnboarding from './components/ClientOnboarding';
import PartnerDashboard from './components/PartnerDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import ContactPage from './components/ContactPage';
import Settings from './components/Settings';
import AccessibilityPage from './components/AccessibilityPage';
import BrowsePartners from './components/BrowsePartners';
import SafetyPage from './components/SafetyPage';
import CompleteProfile from './components/CompleteProfile';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Dashboard routes based on role
  if (currentRoute === '/dashboard') {
    return <PublicHome />;
  }

  // Browse Partners (Client discovery page)
  if (currentRoute === '/browse') {
    return <BrowsePartners />;
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

  // CLIENT 4-STEP ONBOARDING (with Create Your Account as Step 1)
  // This is the main client setup flow
  if (currentRoute === '/client-setup') {
    return <ClientOnboarding onComplete={() => {
      window.location.href = '/browse';
    }} />;
  }

  // Complete profile route - redirect to client-setup
  if (currentRoute === '/complete-profile') {
    window.location.href = '/client-setup';
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

  // Default
  return <PublicHome />;
}

export default App;