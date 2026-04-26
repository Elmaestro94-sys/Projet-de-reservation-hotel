import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { bookingApi } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const TABS = [
  { value: '', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmées' },
  { value: 'COMPLETED', label: 'Terminées' },
];

export default function OwnerBookingsPage() {
  const [activeTab, setActiveTab] = useState('');
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['owner-bookings', activeTab],
    queryFn: () => bookingApi.ownerBookings(activeTab || undefined).then(r => r.data.data),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => bookingApi.confirm(id),
    onSuccess: () => {
      toast.success('Réservation confirmée !');
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
    },
    onError: () => toast.error('Erreur de confirmation'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingApi.cancel(id, 'Annulée par le propriétaire'),
    onSuccess: () => {
      toast.success('Réservation refusée');
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
    },
    onError: () => toast.error('Erreur d\'annulation'),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Réservations reçues</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-28 animate-pulse bg-gray-200" />)}
        </div>
      ) : !bookings || bookings.length === 0 ? (
        <div className="text-center py-20 card">
          <Calendar className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune réservation dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: Booking) => (
            <div key={booking.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{booking.user?.firstName} {booking.user?.lastName}</p>
                    <p className="text-xs text-gray-500">{booking.user?.email}</p>
                  </div>
                </div>
                <span className={`badge ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  {booking.status === 'CONFIRMED' ? 'Confirmée' : booking.status === 'PENDING' ? 'En attente' : 'Terminée'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
                <div>
                  <label className="text-xs text-gray-400 uppercase">Logement</label>
                  <p className="font-medium text-gray-800 mt-0.5">{booking.property?.title}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase">Dates</label>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {format(new Date(booking.checkIn), 'd MMM', { locale: fr })} → {format(new Date(booking.checkOut), 'd MMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase">Durée</label>
                  <p className="font-medium text-gray-800 mt-0.5">{booking.nights} nuit{booking.nights > 1 ? 's' : ''} · {booking.guests} voyageur{booking.guests > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase">Montant</label>
                  <p className="font-bold text-gray-900 mt-0.5">{booking.totalAmount?.toLocaleString('fr-SN')} XOF</p>
                  <p className="text-xs text-green-600">Vous recevez : {booking.ownerAmount?.toLocaleString('fr-SN')} XOF</p>
                </div>
              </div>

              {booking.guestNote && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                  <strong>Note du voyageur :</strong> {booking.guestNote}
                </div>
              )}

              {booking.status === 'PENDING' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => confirmMutation.mutate(booking.id)}
                    disabled={confirmMutation.isPending}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Confirmer
                  </button>
                  <button
                    onClick={() => cancelMutation.mutate(booking.id)}
                    disabled={cancelMutation.isPending}
                    className="flex items-center gap-2 btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4" /> Refuser
                  </button>
                </div>
              )}
            </div>
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
  guests: number;
  totalAmount: number;
  ownerAmount: number;
  guestNote?: string;
  user?: { firstName: string; lastName: string; email: string };
  property?: { title: string };
}
