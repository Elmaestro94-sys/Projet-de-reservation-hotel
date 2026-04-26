import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Building2, Calendar, Star, Plus, ChevronRight, Clock,
  Tag, CalendarDays, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { propertyApi, bookingApi } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  user?: { firstName: string; lastName: string };
  property?: { title: string };
}

export default function OwnerDashboardPage() {
  const currentYear = new Date().getFullYear();
  const [revenueYear, setRevenueYear] = useState(currentYear);

  const { data: stats } = useQuery({
    queryKey: ['owner-stats'],
    queryFn: () => propertyApi.myStats().then(r => r.data.data),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['owner-revenue', revenueYear],
    queryFn: () => propertyApi.myRevenueStats(revenueYear).then(r => r.data.data),
  });

  const { data: recentBookings } = useQuery({
    queryKey: ['owner-bookings', 'recent'],
    queryFn: () => bookingApi.ownerBookings().then(r => r.data.data),
  });

  const handleExportCSV = async () => {
    try {
      const response = await propertyApi.exportBookings();
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `reservations-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export téléchargé');
    } catch {
      toast.error('Erreur lors de l\'export');
    }
  };

  const kpis = [
    { label: 'Revenus totaux', value: `${(stats?.totalRevenue || 0).toLocaleString('fr-SN')} XOF`, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Annonces actives', value: stats?.properties || 0, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Réservations confirmées', value: stats?.confirmedBookings || 0, icon: Calendar, color: 'text-primary-600 bg-primary-50' },
    { label: 'En attente', value: stats?.pendingBookings || 0, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  ];

  const chartData = revenueData?.monthly?.map((m: { label: string; revenue: number; commissions: number; bookings: number }) => ({
    name: m.label,
    'Revenus nets': Math.round(m.revenue),
    'Commissions': Math.round(m.commissions),
  })) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espace propriétaire</h1>
          <p className="text-gray-500 mt-1">Gérez vos annonces et réservations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
          <Link to="/proprietaire/annonces/nouvelle" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouvelle annonce
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Revenus mensuels</h2>
          <select
            value={revenueYear}
            onChange={e => setRevenueYear(parseInt(e.target.value))}
            className="input w-28 text-sm py-1"
          >
            {[currentYear - 1, currentYear].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => typeof v === 'number' ? `${v.toLocaleString('fr-SN')} XOF` : v} />
            <Legend />
            <Bar dataKey="Revenus nets" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Commissions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { to: '/proprietaire/annonces', icon: Building2, label: 'Mes annonces', desc: 'Gérer et publier', color: 'bg-blue-50 text-blue-600' },
          { to: '/proprietaire/reservations', icon: Calendar, label: 'Réservations', desc: 'Confirmer les séjours', color: 'bg-primary-50 text-primary-600' },
          { to: '/proprietaire/promotions', icon: Tag, label: 'Promotions', desc: 'Codes et réductions', color: 'bg-orange-50 text-orange-600' },
          { to: '/proprietaire/disponibilites', icon: CalendarDays, label: 'Disponibilités', desc: 'Bloquer des dates', color: 'bg-purple-50 text-purple-600' },
        ].map(({ to, icon: Icon, label, desc, color }) => (
          <Link
            key={to}
            to={to}
            className="card p-5 hover:shadow-card-hover transition-shadow flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Réservations récentes</h2>
          <Link to="/proprietaire/reservations" className="text-sm text-primary-600 hover:underline">Voir tout</Link>
        </div>
        {(!recentBookings || recentBookings.length === 0) ? (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aucune réservation pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(recentBookings || []).slice(0, 5).map((booking: Booking) => (
              <div key={booking.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 text-sm font-bold">{booking.user?.firstName?.[0]}{booking.user?.lastName?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{booking.user?.firstName} {booking.user?.lastName}</p>
                  <p className="text-xs text-gray-500">
                    {booking.property?.title} · {format(new Date(booking.checkIn), 'd MMM', { locale: fr })} → {format(new Date(booking.checkOut), 'd MMM', { locale: fr })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{booking.totalAmount?.toLocaleString('fr-SN')} XOF</p>
                  <span className={`badge text-xs ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                    {booking.status === 'CONFIRMED' ? 'Confirmée' : booking.status === 'PENDING' ? 'En attente' : 'Annulée'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
