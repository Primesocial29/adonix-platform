import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'privacy';
  onClose: () => void;
  onAccept?: () => void;
}

export default function LegalModal({ type, onClose, onAccept }: LegalModalProps) {
  const [canAccept, setCanAccept] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type) {
      setCanAccept(false);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, [type]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
    if (isAtBottom && !canAccept) {
      setCanAccept(true);
    }
  };

  const handleAccept = () => {
    if (onAccept) onAccept();
    onClose();
  };

  const title = type === 'terms' ? 'Terms of Service' : 'Privacy Policy';
  const content = type === 'terms' ? termsContent : privacyContent;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 text-gray-300 space-y-4"
        >
          <div className="whitespace-pre-wrap">{content}</div>
          <div className="h-10 text-center text-xs text-gray-500 pt-4">
            {!canAccept && "▼ Scroll to the bottom to accept ▼"}
          </div>
        </div>
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleAccept}
            disabled={!canAccept}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
              canAccept 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}

const termsContent = `ADONIX - TERMS OF SERVICE

Last Updated: April 2026

1. SOCIAL NETWORK, NOT A PROFESSIONAL SERVICE
Adonix Fit is a private social networking platform for fitness enthusiasts to connect for voluntary social meetups. It is NOT a professional service marketplace, personal training service, dating app, or escort service.

2. PARTNER STATUS
Partners are independent social participants. They are not employees, agents, or contractors of Adonix. Adonix does not supervise, direct, or control Partners.

3. SUGGESTED CONTRIBUTIONS
Members may offer voluntary social gifts ("suggested contributions") to Partners. These are NOT fees for professional services. Platform Support (15%) is deducted for network facilitation.

4. MEETUP LOCATIONS
All meetups MUST occur at verified public locations. Private residences, hotels, Airbnbs, and other non-public venues are strictly prohibited.

5. GPS VERIFICATION
GPS check-in is required within 0.75 miles of the verified public location before any meetup can begin.

6. CODE OF CONDUCT
No harassment, solicitation, dating propositions, or unsafe behavior. Violations result in permanent ban.

7. LIABILITY DISCLAIMER
Adonix is not liable for any injuries, damages, or incidents that occur during meetups. You participate at your own risk.

8. ACCOUNT SUSPENSION
Adonix reserves the right to suspend or terminate any account for violation of these terms.

9. GOVERNING LAW
These terms are governed by the laws of the State of Delaware.`;

const privacyContent = `ADONIX - PRIVACY POLICY

Last Updated: April 2026

INFORMATION WE COLLECT
- Name, email, phone number, age, city, photos, and location data
- Meetup history and preferences
- Device information and IP address

HOW WE USE YOUR INFORMATION
- To facilitate meetups and verify identities
- To improve our platform and match you with partners
- To enforce safety and security measures

DATA SHARING
- We do NOT sell your personal data
- Payment information is processed securely through Stripe
- Location data is used only during active meetups for GPS check-in verification

DATA RETENTION
- You may request deletion of your account and data at any time
- Some data may be retained for legal compliance

YOUR RIGHTS
- Access, correct, or delete your personal information
- Opt out of marketing communications
- California residents have additional rights under CPRA

SECURITY
We use industry-standard encryption and security measures to protect your data.

CONTACT
For privacy questions: privacy@adonix.com`;