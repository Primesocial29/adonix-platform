import { Shield, MapPin, Users, AlertTriangle, Eye, CheckCircle } from 'lucide-react';

const safetyRules = [
  {
    icon: <MapPin className="w-8 h-8 text-green-400" />,
    title: 'Public Locations Only',
    subtitle: 'Rule #1',
    description:
      'All meetups must occur at verified public venues — gyms, parks, recreation centers, and other publicly accessible spaces. Private residences, hotels, home gyms, vehicles, and any non-public venues are strictly prohibited. Every location is GPS-verified at check-in.',
    color: 'border-green-500/30 bg-green-500/5',
    badge: 'bg-green-500/20 text-green-400',
  },
  {
    icon: <Eye className="w-8 h-8 text-blue-400" />,
    title: 'User Discretion',
    subtitle: 'Rule #2',
    description:
      'Adonix Fit is a social fitness platform — not a dating service, escort service, or any platform for solicitation. Users are solely responsible for their own safety decisions. Meet in well-lit, populated areas. Trust your instincts. If something feels wrong, leave immediately and report it.',
    color: 'border-blue-500/30 bg-blue-500/5',
    badge: 'bg-blue-500/20 text-blue-400',
  },
  {
    icon: <Shield className="w-8 h-8 text-red-400" />,
    title: 'GPS Check-In Required',
    subtitle: 'Rule #3',
    description:
      'Both parties must GPS check-in within 200 meters of the agreed meeting location before a session is confirmed. This verifies you are at the correct public venue. Sessions cannot begin without mutual GPS verification. Location data is logged for safety and dispute resolution.',
    color: 'border-red-500/30 bg-red-500/5',
    badge: 'bg-red-500/20 text-red-400',
  },
  {
    icon: <Users className="w-8 h-8 text-yellow-400" />,
    title: 'Two-Person Limit',
    subtitle: 'Rule #4',
    description:
      'Sessions are strictly between the registered client and the registered partner — one on one. No friends, family members, spectators, or additional participants are permitted during a session. Bringing additional individuals is a violation of platform policy and may result in immediate account suspension.',
    color: 'border-yellow-500/30 bg-yellow-500/5',
    badge: 'bg-yellow-500/20 text-yellow-400',
  },
  {
    icon: <AlertTriangle className="w-8 h-8 text-orange-400" />,
    title: 'Zero Tolerance Policy',
    subtitle: 'Rule #5',
    description:
      'Adonix Fit has zero tolerance for harassment, solicitation, inappropriate contact, exploitation, or any behavior that violates the dignity and safety of any user. Violations result in immediate permanent account termination and may be reported to law enforcement. All interactions are subject to monitoring for safety compliance.',
    color: 'border-orange-500/30 bg-orange-500/5',
    badge: 'bg-orange-500/20 text-orange-400',
  },
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 w-full border-b border-white/10 bg-black/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-lg">←</span>
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <span className="font-bold text-white">Community Safety</span>
          </div>
          <div className="w-16" />
        </div>
      </nav>

      <div className="pt-24 pb-16 max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 mb-6">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Safety First</h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Adonix Fit is committed to creating a safe environment for all community members. These five rules are non-negotiable and apply to every interaction on the platform.
          </p>
        </div>

        <div className="space-y-6 mb-12">
          {safetyRules.map((rule, index) => (
            <div
              key={index}
              className={`p-6 rounded-2xl border ${rule.color} transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">{rule.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rule.badge}`}>
                      {rule.subtitle}
                    </span>
                    <h2 className="text-xl font-bold text-white">{rule.title}</h2>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{rule.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">Report Safety Concerns</h3>
          <p className="text-gray-400 text-sm mb-4">
            If you witness or experience any safety violations, report them immediately through the app or contact us directly. Your report is confidential.
          </p>
          <a
            href="mailto:safety@adonixfit.com"
            className="inline-block px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-semibold text-white hover:from-red-700 hover:to-orange-700 transition-all"
          >
            Contact Safety Team
          </a>
        </div>

        <p className="text-xs text-gray-600 text-center mt-8">
          Adonix Fit is a social fitness platform. By using this service you acknowledge that all sessions are voluntary social interactions between independent adults. Adonix Fit does not provide personal training, escort, or any professional services.
        </p>
      </div>
    </div>
  );
}
