import { useQuery } from '@tanstack/react-query';
import { Users, Building2, Calendar, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED_BY_USER: 'bg-red-100 text-red-700',
};

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then(r => r.data.data),
  });

  const kpis = [
    { label: 'Utilisateurs', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Annonces publiées', value: stats?.publishedProperties || 0, icon: Building2, color: 'bg-green-50 text-green-600' },
    { label: 'En attente de validation', value: stats?.pendingProperties || 0, icon: Clock, color: 'bg-yellow-50 text-yellow-600', alert: (stats?.pendingProperties || 0) > 0 },
    { label: 'Réservations totales', value: stats?.totalBookings || 0, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    { label: 'Revenus plateforme (XOF)', value: `${((stats?.totalRevenue || 0) * 0.1).toLocaleString('fr-SN')}`, icon: TrendingUp, color: 'bg-primary-50 text-primary-600' },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de la plateforme Séjour Sénégal</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color, alert }) => (
          <div key={label} className={`bg-white rounded-2xl p-5 border ${alert ? 'border-yellow-300' : 'border-transparent'} shadow-sm`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              {alert ? <AlertTriangle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Pending properties alert */}
      {(stats?.pendingProperties || 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800 font-medium">
              {stats.pendingProperties} annonce{stats.pendingProperties > 1 ? 's' : ''} en attente de validation
            </p>
          </div>
          <a href="/admin/annonces?status=PENDING_REVIEW" className="text-sm text-yellow-700 font-medium hover:underline">
            Voir les annonces →
          </a>
        </div>
      )}

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Réservations récentes</h2>
        {(!stats?.recentBookings || stats.recentBookings.length === 0) ? (
          <p className="text-gray-500 text-sm text-center py-8">Aucune réservation récente</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 font-medium uppercase border-b border-gray-100">
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Voyageur</th>
                  <th className="pb-3">Logement</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentBookings.map((booking: Booking) => (
                  <tr key={booking.id}>
                    <td className="py-3 text-xs text-gray-400 font-mono">#{booking.id.slice(0, 8)}</td>
                    <td className="py-3 text-sm text-gray-700">{booking.user?.firstName} {booking.user?.lastName}</td>
                    <td className="py-3 text-sm text-gray-700">{booking.property?.title}</td>
                    <td className="py-3 text-sm text-gray-500">{format(new Date(booking.createdAt), 'd MMM yyyy', { locale: fr })}</td>
                    <td className="py-3">
                      <span className={`badge text-xs ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface Booking {
  id: string;
  status: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
  property?: { title: string };
}
