import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { adminApi } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; style: string; label: string }> = {
  PAID: { icon: <CheckCircle className="w-4 h-4" />, style: 'bg-green-100 text-green-700', label: 'Payé' },
  FAILED: { icon: <XCircle className="w-4 h-4" />, style: 'bg-red-100 text-red-700', label: 'Échoué' },
  PENDING: { icon: <Clock className="w-4 h-4" />, style: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
  REFUNDED: { icon: <CheckCircle className="w-4 h-4" />, style: 'bg-gray-100 text-gray-600', label: 'Remboursé' },
};

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page, status],
    queryFn: () => adminApi.payments({ page, limit: 20, status: status || undefined }).then(r => r.data),
  });

  const payments = data?.data || [];
  const meta = data?.meta || { total: 0, pages: 1 };
  const totalRevenue = payments.filter((p: AdminPayment) => p.status === 'PAID').reduce((acc: number, p: AdminPayment) => acc + p.amount, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          <p className="text-xs text-green-600">Total affiché</p>
          <p className="font-bold text-green-700">{totalRevenue.toLocaleString('fr-SN')} XOF</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
          <option value="">Tous les statuts</option>
          <option value="PAID">Payés</option>
          <option value="PENDING">En attente</option>
          <option value="FAILED">Échoués</option>
          <option value="REFUNDED">Remboursés</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? <div className="p-8 text-center"><p className="text-gray-400">Chargement...</p></div> : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs text-gray-500 font-medium uppercase">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Voyageur</th>
                <th className="px-4 py-3">Logement</th>
                <th className="px-4 py-3">Méthode</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment: AdminPayment) => {
                const s = STATUS_CONFIG[payment.status] || { icon: null, style: 'bg-gray-100 text-gray-600', label: payment.status };
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(payment.createdAt), 'd MMM yyyy', { locale: fr })}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{payment.booking?.user?.firstName} {payment.booking?.user?.lastName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{payment.booking?.property?.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.provider === 'STRIPE' ? 'Stripe' : 'PayTech'}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{payment.amount?.toLocaleString('fr-SN')} {payment.currency}</td>
                    <td className="px-4 py-3">
                      <span className={`badge flex items-center gap-1 text-xs ${s.style}`}>{s.icon} {s.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">{meta.total} transaction{meta.total !== 1 ? 's' : ''}</p>
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

interface AdminPayment {
  id: string;
  createdAt: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  booking?: { user?: { firstName: string; lastName: string }; property?: { title: string } };
}
