import { useState } from 'react';
import { X, Flag, Ban } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DeclineModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  clientId: string;
  onDeclined: () => void;
}

const DECLINE_REASONS = [
  'Client requested cancellation',
  'Client inappropriate behavior',
  'Client no-show',
  'Location not suitable',
  'Time conflict',
  'Other (please specify)'
];

export default function DeclineModal({ isOpen, onClose, bookingId, clientId, onDeclined }: DeclineModalProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [blockUser, setBlockUser] = useState(false);
  const [reportUser, setReportUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason && !customReason) {
      setError('Please select or enter a reason.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const finalReason = selectedReason === 'Other (please specify)' ? customReason : selectedReason;
      // Update booking status and decline reason
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'declined',
          decline_reason: finalReason,
          declined_at: new Date().toISOString(),
        })
        .eq('id', bookingId);
      if (updateError) throw updateError;

      // If block user, add to blocked_users table
      if (blockUser) {
        const { error: blockError } = await supabase
          .from('blocked_users')
          .insert({
            partner_id: user?.id,
            client_id: clientId,
            created_at: new Date().toISOString(),
          });
        if (blockError) console.error('Block error:', blockError);
      }

      // If report user, insert into reports table
      if (reportUser) {
        const { error: reportError } = await supabase
          .from('reports')
          .insert({
            reporter_id: user?.id,
            reported_id: clientId,
            reason: 'Declined booking due to: ' + finalReason,
            status: 'pending',
            created_at: new Date().toISOString(),
          });
        if (reportError) console.error('Report error:', reportError);
      }

      onDeclined();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl max-w-md w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        <h2 className="text-2xl font-bold mb-2">Decline Booking</h2>
        <p className="text-gray-400 mb-6">Please tell us why you're declining this session.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Reason</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white"
            >
              <option value="">Select a reason</option>
              {DECLINE_REASONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {selectedReason === 'Other (please specify)' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Please specify</label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white"
                placeholder="Enter details..."
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="blockUser"
              checked={blockUser}
              onChange={(e) => setBlockUser(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="blockUser" className="text-sm text-gray-300 flex items-center gap-2">
              <Ban className="w-4 h-4" /> Block this user from future bookings
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="reportUser"
              checked={reportUser}
              onChange={(e) => setReportUser(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="reportUser" className="text-sm text-gray-300 flex items-center gap-2">
              <Flag className="w-4 h-4" /> Report this user for spam/harassment
            </label>
          </div>

          {error && <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">{error}</div>}

          <div className="flex gap-3 mt-4">
            <button onClick={onClose} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold disabled:opacity-50">
              {loading ? 'Processing...' : 'Confirm Decline'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}