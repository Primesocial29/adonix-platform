import { useState, useEffect } from 'react';
import PublicHome from './components/PublicHome';
import AdminDashboard from './components/AdminDashboard';
import PartnerProfileSetup from './components/PartnerProfileSetup';
import ClientProfileSetup from './components/ClientProfileSetup';
import PartnerDashboard from './components/PartnerDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import ContactPage from './components/ContactPage';
import Settings from './components/Settings';
import AccessibilityPage from './components/AccessibilityPage';
import BrowsePartners from './components/BrowsePartners';

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

  // Client routes
  if (currentRoute === '/client-setup') {
    return <ClientProfileSetup onComplete={() => {
      window.location.href = '/browse'; // Redirect to browse instead of dashboard
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

  // Default
  return <PublicHome />;
}

export default App;