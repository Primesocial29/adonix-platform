import { useAuth } from '../hooks/useAuth';

export default function PartnerDashboard() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="text-white p-8">Loading...</div>;
  }

  if (!user) {
    return <div className="text-white p-8">No user found. Please sign in.</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="bg-white/5 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden">
            {profile?.live_photo_url ? (
              <img src={profile.live_photo_url} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">Hello, @{profile?.username || 'partner'}! 👋</h2>
            <p className="text-gray-400 mt-1">{profile?.bio || 'No bio yet. Click Edit Bio to add one.'}</p>
            <div className="flex gap-3 mt-3">
              <button className="px-3 py-1 text-sm bg-white/10 rounded-full hover:bg-white/20">✏️ Edit Bio</button>
              <button className="px-3 py-1 text-sm bg-white/10 rounded-full hover:bg-white/20">📸 Change Photo</button>
            </div>
          </div>
        </div>
      </div>
      <h1 className="text-3xl font-bold">Partner Dashboard Test</h1>
      <p>User ID: {user.id}</p>
      <p>Role: {profile?.role}</p>
      <p>Is Partner: {String(profile?.is_partner)}</p>
    </div>
  );
}
