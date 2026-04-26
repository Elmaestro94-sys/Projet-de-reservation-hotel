import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { adminApi } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED_BY_USER: 'bg-red-100 text-red-600',
  CANCELLED_BY_OWNER: 'bg-red-100 text-red-600',
};

export default function AdminBookingsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', page, status],
    queryFn: () => adminApi.bookings({ page, limit: 20, status: status || undefined }).then(r => r.data),
  });

  const bookings = data?.data || [];
  const meta = data?.meta || { total: 0, pages: 1 };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Réservations</h1>

      <div className="flex gap-3 mb-6">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="CONFIRMED">Confirmées</option>
          <option value="COMPLETED">Terminées</option>
          <option value="CANCELLED_BY_USER">Annulées</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? <div className="p-8 text-center"><p className="text-gray-400">Chargement...</p></div> : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs text-gray-500 font-medium uppercase">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Voyageur</th>
                <th className="px-4 py-3">Logement</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((booking: AdminBooking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{booking.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{booking.user?.firstName} {booking.user?.lastName}</p>
                    <p className="text-xs text-gray-400">{booking.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{booking.property?.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {format(new Date(booking.checkIn), 'd MMM', { locale: fr })} → {format(new Date(booking.checkOut), 'd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">{booking.totalAmount?.toLocaleString('fr-SN')} XOF</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-600'}`}>{booking.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">{meta.total} réservation{meta.total !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-gray-600">Page {page} / {meta.pages}</span>
            <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page >= meta.pages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AdminBooking {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  user?: { firstName: string; lastName: string; email: string };
  property?: { title: string };
}
