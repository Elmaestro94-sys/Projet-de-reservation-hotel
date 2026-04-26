import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
import { bookingApi } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TABS = [
  { value: '', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmées' },
  { value: 'COMPLETED', label: 'Terminées' },
  { value: 'CANCELLED_BY_USER', label: 'Annulées' },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED_BY_USER: 'bg-red-100 text-red-600',
  CANCELLED_BY_OWNER: 'bg-red-100 text-red-600',
  CANCELLED_BY_ADMIN: 'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  COMPLETED: 'Terminée',
  CANCELLED_BY_USER: 'Annulée',
  CANCELLED_BY_OWNER: 'Annulée par propriétaire',
  CANCELLED_BY_ADMIN: 'Annulée par admin',
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings', activeTab],
    queryFn: () => bookingApi.myBookings(activeTab || undefined).then(r => r.data.data),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mes réservations</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-20 card">
          <Calendar className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Aucune réservation</h3>
          <p className="text-gray-500 text-sm mb-6">Vous n'avez pas encore de réservation dans cette catégorie.</p>
          <Link to="/recherche" className="btn-primary inline-block">Explorer les logements</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {(bookings || []).map((booking: Booking) => (
            <Link
              key={booking.id}
              to={`/mes-reservations/${booking.id}`}
              className="card p-4 flex gap-4 hover:shadow-card-hover transition-shadow"
            >
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                {booking.property?.photos?.[0]?.url && (
                  <img src={booking.property.photos[0].url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{booking.property?.title}</h3>
                  <span className={`badge flex-shrink-0 ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {booking.property?.city}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {format(new Date(booking.checkIn), 'd MMM', { locale: fr })} → {format(new Date(booking.checkOut), 'd MMM yyyy', { locale: fr })}
                  </span>
                  <span>{booking.nights} nuit{booking.nights > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-gray-900 text-sm">{booking.totalAmount?.toLocaleString('fr-SN')} XOF</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface Booking {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  property?: { title: string; city: string; photos?: { url: string }[] };
}
