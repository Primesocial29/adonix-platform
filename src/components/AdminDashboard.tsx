import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, DollarSign, Flag, CheckCircle } from 'lucide-react';

interface Booking {
  id: string;
  contact_email: string;
  partner_id: string;
  booking_date: string;
  total_amount: number;
  status: string;
  created_at: string;
  partner?: { first_name: string };
}

interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  reporter?: { first_name: string; email: string };
  reported_user?: { first_name: string; email: string };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    platformFees: 0,
    activePartners: 0,
    pendingMedia: 0,
    pendingReports: 0
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch bookings with partner first_name (not name)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`*, partner:partner_id ( first_name )`)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch reports with reporter and reported user names
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id ( first_name, email ),
          reported_user:reported_id ( first_name, email )
        `)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      setBookings(bookingsData || []);
      setReports(reportsData || []);

      const totalRevenue = bookingsData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const platformFees = bookingsData?.reduce((sum, b) => sum + (b.platform_fee || 0), 0) || 0;
      const pendingBookings = bookingsData?.filter(b => b.status === 'pending').length || 0;
      const pendingReports = reportsData?.filter(r => r.status === 'pending').length || 0;

      setStats({
        totalBookings: bookingsData?.length || 0,
        pendingBookings,
        totalRevenue,
        platformFees,
        activePartners: 0,
        pendingMedia: 0,
        pendingReports
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);
      if (error) throw error;
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating report:', err);
      alert('Failed to update report status');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: Flag, badge: stats.pendingReports },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="border-b border-gray-700 mb-6">
          <div className="flex space-x-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-orange-500 text-orange-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="bg-red-600 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending Reports</p>
                  <p className="text-2xl font-bold">{stats.pendingReports}</p>
                </div>
                <Flag className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-gray-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Partner</th>
                  <th className="px-4 py-3">Client Email</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id} className="border-t border-gray-700">
                    <td className="px-4 py-3">{new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{booking.partner?.first_name || 'Unknown'}</td>
                    <td className="px-4 py-3">{booking.contact_email}</td>
                    <td className="px-4 py-3">${booking.total_amount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === 'confirmed' ? 'bg-green-600' :
                        booking.status === 'pending' ? 'bg-yellow-600' : 'bg-gray-600'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
                No reports submitted.
              </div>
            ) : (
              reports.map(report => (
                <div key={report.id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Flag className="w-5 h-5 text-red-500" />
                        <span className="font-semibold">Report #{report.id.slice(0,8)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          report.status === 'pending' ? 'bg-yellow-600' :
                          report.status === 'reviewed' ? 'bg-green-600' : 'bg-gray-600'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        <strong>Reported user:</strong> {report.reported_user?.first_name || 'Unknown'} ({report.reported_user?.email})
                      </p>
                      <p className="text-sm text-gray-300">
                        <strong>Reported by:</strong> {report.reporter?.first_name || 'Unknown'} ({report.reporter?.email})
                      </p>
                      <p className="text-sm text-gray-300 mt-2">
                        <strong>Reason:</strong> {report.reason}
                      </p>
                      {report.description && (
                        <p className="text-sm text-gray-400 mt-1">
                          <strong>Details:</strong> {report.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateReportStatus(report.id, 'reviewed')}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                        >
                          <CheckCircle className="w-4 h-4" /> Mark Reviewed
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}