import { Shield, MapPin, Users, Camera, AlertTriangle, Scale, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest mb-4">
            <ShieldCheck className="w-3 h-3" />
            Zero Tolerance Protocol — Prime Social LLC
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Safety & Zero Tolerance
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Adonix Fit (a Prime Social LLC platform) is a <strong className="text-white">private social networking application</strong> — not a fitness service provider, healthcare entity, or employer. Our Zero Tolerance Protocol protects every member through transparency and public accountability.
          </p>
        </div>

        {/* Rule 1: Location */}
        <div className="mb-6 p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-red-500/30 transition-colors">
          <div className="flex items-start gap-4">
            <div className="bg-green-500/20 p-3 rounded-xl">
              <MapPin className="w-6 h-6 text-green-500 flex-shrink-0" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">1. Public Venues Only</h2>
              <p className="text-gray-300">
                All social meetups must occur at verified public venues (parks, gyms, or fitness centers). 
                Meetups at private residences, hotels, or non-public spaces are strictly prohibited.
              </p>
              <p className="text-sm text-red-400 font-bold mt-2">⚠️ Zero Tolerance: Immediate permanent ban for private location requests.</p>
            </div>
          </div>
        </div>

        {/* Rule 2: Identity */}
        <div className="mb-6 p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-red-500/30 transition-colors">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-500 flex-shrink-0" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">2. Independent Peer Discovery</h2>
              <p className="text-gray-300">
                Adonix is a social platform, not a service provider. You are responsible for vetting your 
                social partners. We do not perform background checks; exercise the same judgment you use on any social media platform.
              </p>
            </div>
          </div>
        </div>

        {/* Rule 3: Technical Verification */}
        <div className="mb-6 p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-red-500/30 transition-colors">
          <div className="flex items-start gap-4">
            <div className="bg-purple-500/20 p-3 rounded-xl">
              <Camera className="w-6 h-6 text-purple-500 flex-shrink-0" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">3. GPS Integrity Protocol</h2>
              <p className="text-gray-300">
                Safety requires proof of presence. Both participants must verify their GPS location at the 
                designated public venue to activate social support features.
              </p>
              <p className="text-sm text-gray-400 mt-2">📍 Location accuracy required within 0.75 miles.</p>
            </div>
          </div>
        </div>

        {/* Rule 4: Group Safety */}
        <div className="mb-6 p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-red-500/30 transition-colors">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500/20 p-3 rounded-xl">
              <Users className="w-6 h-6 text-orange-500 flex-shrink-0" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">4. Verified 1-on-1 Meetups</h2>
              <p className="text-gray-300">
                To maintain a secure and controlled environment, Adonix meetups are strictly limited to 
                the two individuals confirmed in the invitation. No spectators or unverified third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Rule 5: Reporting */}
        <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-red-500/30 transition-colors">
          <div className="flex items-start gap-4">
            <div className="bg-red-500/20 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">5. Instant Reporting</h2>
              <p className="text-gray-300">
                If a partner suggests moving to a private location or behaves inappropriately, report it 
                immediately through the app. Our safety team reviews all alerts within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Shield Disclaimer */}
        <div className="mt-12 p-8 bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-3 mb-4 text-red-500">
            <Scale className="w-6 h-6" />
            <h2 className="text-xl font-bold">Legal Disclosure & Agreement</h2>
          </div>
          <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
            <p>
              Adonix (a Prime Social LLC platform) is a private social networking application. 
              We are <span className="text-white font-medium">not</span> a fitness service provider, 
              healthcare entity, or employer. 
            </p>
            <p>
              By using this platform, you acknowledge that all meetups are independent social interactions. 
              Adonix does not provide professional certifications, medical advice, or insurance coverage. 
              Social partners are independent participants and are not employees, contractors, or agents of Adonix or Prime Social LLC.
            </p>
            <p className="italic">
              You assume all risks associated with social interactions and physical activities.
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-12 text-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20"
          >
            <ArrowLeft className="w-5 h-5" />
            Return to Dashboard
          </button>
          <p className="mt-6 text-gray-500 text-xs tracking-widest uppercase">
            &copy; 2026 Prime Social LLC. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}