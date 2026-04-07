import { useState, useEffect } from 'react';
import PublicHome from './components/PublicHome';
import AdminDashboard from './components/AdminDashboard';
import PartnerProfileSetup from './components/PartnerProfileSetup';
import ClientProfileSetup from './components/ClientProfileSetup';
import PartnerDashboard from './components/PartnerDashboard';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import ContactPage from './components/ContactPage';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentRoute === '/admin-view') {
    return <AdminDashboard />;
  }
  if (currentRoute === '/partner-setup') {
    return <PartnerProfileSetup />;
  }
  if (currentRoute === '/profile') {
    return <ClientProfileSetup />;
  }
  if (currentRoute === '/partner-dashboard') {
    return <PartnerDashboard />;
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
  return <PublicHome />;
}

export default App;