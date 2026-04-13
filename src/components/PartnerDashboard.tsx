import { useAuth } from '../hooks/useAuth';

export default function PartnerDashboard() {
  const { user, profile, loading } = useAuth();

  console.log('PartnerDashboard rendering', { user, profile, loading });

  if (loading) {
    return <div className="text-white p-8">Loading...</div>;
  }

  if (!user) {
    return <div className="text-white p-8">No user found. Please sign in.</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold">Partner Dashboard Test</h1>
      <p>User ID: {user.id}</p>
      <p>Role: {profile?.role}</p>
      <p>Is Partner: {String(profile?.is_partner)}</p>
    </div>
  );
}
