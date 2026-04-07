import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
}

export default function ReportModal({ isOpen, onClose, reportedUserId, reportedUserName }: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to report.');
      return;
    }
    if (!reason) {
      setError('Please select a reason.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: insertError } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_id: reportedUserId,
        reason,
        description,
      });
      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Report Submitted</h3>
            <p className="text-gray-400 mb-6">Thank you for helping keep Adonix Fit safe. We'll review this report.</p>
            <button onClick={onClose} className="px-4 py-2 bg-red-600 rounded-lg">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-2">Report {reportedUserName}</h2>
        <p className="text-gray-400 mb-6">Please tell us why you're reporting this user.</p>
        {error && <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white"
            >
              <option value="" disabled>Select a reason</option>
              <option value="Harassment">Harassment or bullying</option>
              <option value="Inappropriate content">Inappropriate photos or bio</option>
              <option value="Scam or fraud">Scam or fraudulent behaviour</option>
              <option value="Offensive language">Offensive or discriminatory language</option>
              <option value="Solicitation">Solicitation of illegal services</option>
              <option value="Safety concern">I felt unsafe</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Additional details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white"
              placeholder="Please provide any additional information..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}