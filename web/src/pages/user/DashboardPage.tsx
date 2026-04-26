import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Heart, MessageSquare, CreditCard, Bell, ChevronRight, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { bookingApi, notificationApi } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED_BY_USER: 'bg-red-100 text-red-700',
  CANCELLED_BY_OWNER: 'bg-red-100 text-red-700',
  CANCELLED_BY_ADMIN: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  COMPLETED: 'Terminée',
  CANCELLED_BY_USER: 'Annulée',
  CANCELLED_BY_OWNER: 'Annulée',
  CANCELLED_BY_ADMIN: 'Annulée',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'OWNER';

  const { data: bookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingApi.myBookings().then(r => r.data.data),
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list().then(r => r.data.data),
  });

  const upcomingBookings = (bookings || []).filter((b: Booking) =>
    ['PENDING', 'CONFIRMED'].includes(b.status)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user?.firstName} 👋</h1>
        <p className="text-gray-500 mt-1">Bienvenue dans votre espace personnel</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { to: '/mes-reservations', icon: Calendar, label: 'Mes réservations', count: (bookings || []).length, color: 'bg-blue-50 text-blue-600' },
          { to: '/mes-favoris', icon: Heart, label: 'Mes favoris', count: null, color: 'bg-red-50 text-red-600' },
          { to: '/messages', icon: MessageSquare, label: 'Messages', count: null, color: 'bg-green-50 text-green-600' },
          { to: '/mes-paiements', icon: CreditCard, label: 'Paiements', count: null, color: 'bg-purple-50 text-purple-600' },
        ].map(({ to, icon: Icon, label, count, color }) => (
          <Link key={to} to={to} className="card p-5 hover:shadow-card-hover transition-shadow flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              {count !== null && <p className="text-2xl font-bold text-gray-900">{count}</p>}
            </div>
          </Link>
        ))}
      </div>

      {/* Owner CTA */}
      {isOwner && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 mb-8 flex items-center justify-between">
          <div className="text-white">
            <p className="font-bold text-lg">Espace propriétaire</p>
            <p className="text-primary-200 text-sm">Gérez vos annonces, réservations et revenus</p>
          </div>
          <Link to="/proprietaire" className="bg-white text-primary-700 font-medium px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors text-sm whitespace-nowrap flex items-center gap-2">
            Accéder <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming bookings */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Réservations à venir</h2>
            <Link to="/mes-reservations" className="text-sm text-primary-600 hover:underline">Voir tout</Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aucune réservation à venir</p>
              <Link to="/recherche" className="btn-primary text-sm mt-3 inline-block">Trouver un logement</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 3).map((booking: Booking) => (
                <Link key={booking.id} to={`/mes-reservations/${booking.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  {booking.property?.photos?.[0]?.url && (
                    <img src={booking.property.photos[0].url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{booking.property?.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {format(new Date(booking.checkIn), 'd MMM', { locale: fr })} → {format(new Date(booking.checkOut), 'd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <span className={`badge ${STATUS_STYLES[booking.status]}`}>{STATUS_LABELS[booking.status]}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Notifications récentes</h2>
          </div>
          {(!notifications || notifications.length === 0) ? (
            <div className="text-center py-8">
              <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notif: Notification) => (
                <div key={notif.id} className={`p-3 rounded-xl ${notif.isRead ? 'bg-gray-50' : 'bg-primary-50'}`}>
                  <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{notif.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(notif.createdAt), 'd MMM à HH:mm', { locale: fr })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Booking {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  property?: { title: string; photos?: { url: string }[] };
}

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}
