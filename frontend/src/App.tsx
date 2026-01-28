import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';

// Layouts
import SuperAdminLayout from './components/layouts/SuperAdminLayout';
import TenantLayout from './components/layouts/TenantLayout';

// SuperAdmin Pages
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminTenantsPage from './pages/SuperAdminTenantsPage';
import TenantDetailPage from './pages/TenantDetailPage';
import SuperAdminUsersPage from './pages/SuperAdminUsersPage';
import SuperAdminPlansPage from './pages/SuperAdminPlansPage';
import SuperAdminEmailConfigPage from './pages/SuperAdminEmailConfigPage';
import SuperAdminEmailTemplatesPage from './pages/SuperAdminEmailTemplatesPage';
import SuperAdminEmailLogsPage from './pages/SuperAdminEmailLogsPage';
import SuperAdminAnalyticsPage from './pages/SuperAdminAnalyticsPage';
import SuperAdminAuditLogsPage from './pages/SuperAdminAuditLogsPage';
import SuperAdminSubscriptionsPage from './pages/SuperAdminSubscriptionsPage';
import SuperAdminSettingsPage from './pages/SuperAdminSettingsPage';
import TenantsManagement from './pages/TenantsManagement';

// Tenant Pages
import AdminDashboard from './pages/AdminDashboard';
import CalendarPage from './pages/CalendarPage';
import AppointmentsListPage from './pages/AppointmentsListPage';
import NewAppointmentPage from './pages/NewAppointmentPage';
import AppointmentDetailPage from './pages/AppointmentDetailPage';
import PatientsListPage from './pages/PatientsListPage';
import NewPatientPage from './pages/NewPatientPage';
import PatientDetailPage from './pages/PatientDetailPage';
import TreatmentPlansListPage from './pages/TreatmentPlansListPage';
import NewTreatmentPlanPage from './pages/NewTreatmentPlanPage';
import TreatmentPlanDetailPage from './pages/TreatmentPlanDetailPage';
import InvoicesListPage from './pages/InvoicesListPage';
import NewInvoicePage from './pages/NewInvoicePage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import DocumentsListPage from './pages/DocumentsListPage';
import OdontogramsListPage from './pages/OdontogramsListPage';
import NewOdontogramPage from './pages/NewOdontogramPage';
import OdontogramDetailPage from './pages/OdontogramDetailPage';
import PatientDashboardPage from './pages/PatientDashboardPage';

const queryClient = new QueryClient();

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function TenantRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isSuperAdmin) {
    return <Navigate to="/superadmin" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isSuperAdmin) {
    return <Navigate to="/superadmin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            
            {/* SuperAdmin Routes */}
            <Route
              path="/superadmin"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <SuperAdminDashboard />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/tenants"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <SuperAdminTenantsPage />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/tenants/:id"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <TenantDetailPage />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/tenants/new"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <TenantsManagement />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/users"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <SuperAdminUsersPage />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/plans"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <SuperAdminPlansPage />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/email/config"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <SuperAdminEmailConfigPage />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/email/templates"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <SuperAdminEmailTemplatesPage />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/email/logs"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <SuperAdminEmailLogsPage />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/analytics"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <SuperAdminAnalyticsPage />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/audit-logs"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <SuperAdminAuditLogsPage />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/subscriptions"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <SuperAdminSubscriptionsPage />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/settings"
              element={
                <SuperAdminRoute>
                  <SuperAdminLayout>
                    <SuperAdminSettingsPage />
                  </SuperAdminLayout>
                </SuperAdminRoute>
              }
            />
            
            {/* Tenant Routes */}
            <Route
              path="/dashboard"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <AdminDashboard />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <CalendarPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <AppointmentsListPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/appointments/new"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <NewAppointmentPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/appointments/:id"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <AppointmentDetailPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <PatientsListPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/patients/new"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <NewPatientPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <PatientDetailPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/patients/:patientId/dashboard"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <PatientDashboardPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/treatment-plans"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <TreatmentPlansListPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/treatment-plans/new"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <NewTreatmentPlanPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/treatment-plans/:id"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <TreatmentPlanDetailPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <InvoicesListPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/invoices/new"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <NewInvoicePage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <InvoiceDetailPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <DocumentsListPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/odontograms"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <OdontogramsListPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/odontograms/new"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <NewOdontogramPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            <Route
              path="/odontograms/:id"
              element={
                <TenantRoute>
                  <TenantLayout>
                    <OdontogramDetailPage />
                  </TenantLayout>
                </TenantRoute>
              }
            />
            
            {/* Root redirect based on role */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Redirect /admin to /superadmin */}
            <Route path="/admin" element={<Navigate to="/superadmin" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
