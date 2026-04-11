import { Shield, MapPin, Users, Camera, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Safety First</h1>
          <p className="text-gray-400 text-lg">Adonix Fit is a social fitness network. Here's how we keep meetups safe.</p>
        </div>

        {/* Rule 1 */}
        <div className="mb-6 p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-start gap-4">
            <MapPin className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">1. Public Locations Only</h2>
              <p className="text-gray-300">All meetups must happen at public gyms, parks, or fitness studios. No private residences, hotels, or Airbnbs.</p>
              <p className="text-sm text-yellow-400 mt-2">⚠️ 3-strike policy = permanent ban</p>
            </div>
          </div>
        </div>

        {/* Rule 2 */}
        <div className="mb-6 p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-start gap-4">
            <Users className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">2. You're the Decider</h2>
              <p className="text-gray-300">We're a social platform, not a hiring service. You choose who to meet based on profiles, community ratings, and your own judgment.</p>
            </div>
          </div>
        </div>

        {/* Rule 3 */}
        <div className="mb-6 p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-start gap-4">
            <Camera className="w-8 h-8 text-purple-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">3. GPS Check-In Required</h2>
              <p className="text-gray-300">Upon arrival, scan the QR code and verify your GPS location. This confirms you're at the agreed public location.</p>
              <p className="text-sm text-gray-400 mt-2">📍 Accuracy required within 0.75 miles</p>
            </div>
          </div>
        </div>

        {/* Rule 4 */}
        <div className="mb-6 p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-start gap-4">
            <Users className="w-8 h-8 text-orange-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">4. Two-Person Only</h2>
              <p className="text-gray-300">Meetups are for you and your invited partner only. No extra friends, family, or spectators.</p>
            </div>
          </div>
        </div>

        {/* Rule 5 */}
        <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">5. Report Concerns Immediately</h2>
              <p className="text-gray-300">If something feels off, report it immediately. Our moderation team reviews all reports within 24 hours.</p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">Social Meetup Agreement</h2>
              <p className="text-gray-300 text-sm">By using Adonix Fit, you acknowledge this is a social networking platform. Partners are independent social participants, not employees. You are responsible for your own safety during meetups.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-semibold transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back to Safety
          </Link>
        </div>
      </div>
    </div>
  );
}