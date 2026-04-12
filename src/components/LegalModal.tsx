import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import TermsContent from './TermsContent';
import PrivacyContent from './PrivacyContent';

type LegalModalType = 'terms' | 'privacy';

interface LegalModalProps {
  type: LegalModalType;
  onClose: () => void;
}

export default function LegalModal({ type, onClose }: LegalModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-950 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-white">
            {type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={scrollRef} className="overflow-y-auto flex-1 px-6 py-4">
          {type === 'terms' ? <TermsContent /> : <PrivacyContent />}
        </div>

        <div className="px-6 py-4 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
