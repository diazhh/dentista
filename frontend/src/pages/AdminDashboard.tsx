import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, FileText, DollarSign, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  pendingInvoices: number;
  monthlyRevenue: number;
}

interface UpcomingAppointment {
  id: string;
  patientName: string;
  startTime: string;
  status: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    totalPatients: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const [appointmentsRes, patientsRes, invoicesRes] = await Promise.all([
        api.get(`/appointments?startDate=${today}&endDate=${tomorrow}`),
        api.get('/patients'),
        api.get('/invoices?status=PENDING'),
      ]);

      setStats({
        todayAppointments: appointmentsRes.data.length || 0,
        totalPatients: patientsRes.data.length || 0,
        pendingInvoices: invoicesRes.data.length || 0,
        monthlyRevenue: 0,
      });

      setUpcomingAppointments(
        (appointmentsRes.data || []).slice(0, 5).map((apt: any) => ({
          id: apt.id,
          patientName: apt.patient?.name || 'Unknown',
          startTime: apt.startTime,
          status: apt.status,
        }))
      );
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your clinic today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/calendar" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Appointments</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.todayAppointments}</dd>
                </dl>
              </div>
            </div>
          </Link>

          <Link to="/patients" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Patients</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.totalPatients}</dd>
                </dl>
              </div>
            </div>
          </Link>

          <Link to="/invoices" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Invoices</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.pendingInvoices}</dd>
                </dl>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Monthly Revenue</dt>
                  <dd className="text-2xl font-semibold text-gray-900">${stats.monthlyRevenue.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/appointments/new"
            className="bg-blue-600 text-white rounded-lg shadow p-6 hover:bg-blue-700 transition-colors"
          >
            <Calendar className="h-8 w-8 mb-2" />
            <h3 className="text-lg font-semibold">New Appointment</h3>
            <p className="text-blue-100 text-sm mt-1">Schedule a new appointment</p>
          </Link>

          <Link
            to="/patients/new"
            className="bg-green-600 text-white rounded-lg shadow p-6 hover:bg-green-700 transition-colors"
          >
            <Users className="h-8 w-8 mb-2" />
            <h3 className="text-lg font-semibold">New Patient</h3>
            <p className="text-green-100 text-sm mt-1">Register a new patient</p>
          </Link>

          <Link
            to="/invoices/new"
            className="bg-purple-600 text-white rounded-lg shadow p-6 hover:bg-purple-700 transition-colors"
          >
            <FileText className="h-8 w-8 mb-2" />
            <h3 className="text-lg font-semibold">New Invoice</h3>
            <p className="text-purple-100 text-sm mt-1">Create a new invoice</p>
          </Link>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
            <Link to="/calendar" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Calendar
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingAppointments.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No appointments scheduled for today</p>
              </div>
            ) : (
              upcomingAppointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  to={`/appointments/${appointment.id}`}
                  className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{appointment.patientName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      appointment.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {appointment.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
