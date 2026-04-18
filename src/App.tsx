import { useState, useEffect } from 'react';
import PublicHome from './components/PublicHome';
import AdminDashboard from './components/AdminDashboard';
import PartnerProfileSetup from './components/PartnerProfileSetup';
import ClientProfileSetup from './components/ClientProfileSetup';
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
    // You can add role-based logic here later
    return <PublicHome />; // Temporary - will show role-specific dashboard
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

  // Trainer routes (same as partner for now)
  if (currentRoute === '/trainer-dashboard') {
    return <TrainerDashboard />;
  }

  // Client routes - UPDATED to use new ClientOnboarding
  if (currentRoute === '/client-setup') {
    return <ClientOnboarding onComplete={() => {
      window.location.href = '/client-dashboard';
    }} />;
  }

  // Complete profile route
  // Complete profile route - redirect to proper onboarding
if (currentRoute === '/complete-profile') {
  return <ClientOnboarding onComplete={() => {
    window.location.href = '/client-dashboard';
  }} />;
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