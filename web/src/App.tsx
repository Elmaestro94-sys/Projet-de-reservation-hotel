import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import MainLayout from '@/components/layout/MainLayout';
import AdminLayout from '@/components/layout/AdminLayout';

// Public pages
import HomePage from '@/pages/HomePage';
import SearchPage from '@/pages/SearchPage';
import PropertyDetailPage from '@/pages/PropertyDetailPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

// User pages
import DashboardPage from '@/pages/user/DashboardPage';
import BookingsPage from '@/pages/user/BookingsPage';
import BookingDetailPage from '@/pages/user/BookingDetailPage';
import FavoritesPage from '@/pages/user/FavoritesPage';
import MessagesPage from '@/pages/user/MessagesPage';
import ProfilePage from '@/pages/user/ProfilePage';
import PaymentsPage from '@/pages/user/PaymentsPage';
import SecurityPage from '@/pages/user/SecurityPage';

// Owner pages
import OwnerDashboardPage from '@/pages/owner/OwnerDashboardPage';
import OwnerPropertiesPage from '@/pages/owner/OwnerPropertiesPage';
import OwnerBookingsPage from '@/pages/owner/OwnerBookingsPage';
import PropertyFormPage from '@/pages/owner/PropertyFormPage';
import OwnerPromotionsPage from '@/pages/owner/OwnerPromotionsPage';
import OwnerAvailabilityPage from '@/pages/owner/OwnerAvailabilityPage';

// Admin pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminPropertiesPage from '@/pages/admin/AdminPropertiesPage';
import AdminBookingsPage from '@/pages/admin/AdminBookingsPage';
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage';
import AdminAuditLogsPage from '@/pages/admin/AdminAuditLogsPage';
import AdminModerationPage from '@/pages/admin/AdminModerationPage';

// Other pages
import DestinationPage from '@/pages/DestinationPage';
import BookingReceiptPage from '@/pages/user/BookingReceiptPage';

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const adminRoles = ['SUPER_ADMIN', 'SUPPORT', 'FINANCE', 'MODERATOR'];
  if (!user || !adminRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/recherche" element={<SearchPage />} />
        <Route path="/logements/:slug" element={<PropertyDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/destinations/:slug" element={<DestinationPage />} />

        {/* User routes */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/mes-reservations" element={<PrivateRoute><BookingsPage /></PrivateRoute>} />
        <Route path="/mes-reservations/:id" element={<PrivateRoute><BookingDetailPage /></PrivateRoute>} />
        <Route path="/mes-reservations/:id/recu" element={<PrivateRoute><BookingReceiptPage /></PrivateRoute>} />
        <Route path="/mes-favoris" element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/profil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/mes-paiements" element={<PrivateRoute><PaymentsPage /></PrivateRoute>} />
        <Route path="/securite" element={<PrivateRoute><SecurityPage /></PrivateRoute>} />

        {/* Owner routes */}
        <Route path="/proprietaire" element={<PrivateRoute roles={['OWNER', 'SUPER_ADMIN']}><OwnerDashboardPage /></PrivateRoute>} />
        <Route path="/proprietaire/annonces" element={<PrivateRoute roles={['OWNER', 'SUPER_ADMIN']}><OwnerPropertiesPage /></PrivateRoute>} />
        <Route path="/proprietaire/annonces/nouvelle" element={<PrivateRoute roles={['OWNER', 'SUPER_ADMIN']}><PropertyFormPage /></PrivateRoute>} />
        <Route path="/proprietaire/annonces/:id/modifier" element={<PrivateRoute roles={['OWNER', 'SUPER_ADMIN']}><PropertyFormPage /></PrivateRoute>} />
        <Route path="/proprietaire/reservations" element={<PrivateRoute roles={['OWNER', 'SUPER_ADMIN']}><OwnerBookingsPage /></PrivateRoute>} />
        <Route path="/proprietaire/promotions" element={<PrivateRoute roles={['OWNER', 'SUPER_ADMIN']}><OwnerPromotionsPage /></PrivateRoute>} />
        <Route path="/proprietaire/disponibilites" element={<PrivateRoute roles={['OWNER', 'SUPER_ADMIN']}><OwnerAvailabilityPage /></PrivateRoute>} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="utilisateurs" element={<AdminUsersPage />} />
        <Route path="annonces" element={<AdminPropertiesPage />} />
        <Route path="reservations" element={<AdminBookingsPage />} />
        <Route path="paiements" element={<AdminPaymentsPage />} />
        <Route path="audit" element={<AdminAuditLogsPage />} />
        <Route path="moderation" element={<AdminModerationPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
