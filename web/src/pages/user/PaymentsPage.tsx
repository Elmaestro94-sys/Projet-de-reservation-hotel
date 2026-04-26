import { useQuery } from '@tanstack/react-query';
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import { paymentApi } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PAID: <CheckCircle className="w-5 h-5 text-green-500" />,
  FAILED: <XCircle className="w-5 h-5 text-red-500" />,
  PENDING: <Clock className="w-5 h-5 text-yellow-500" />,
  REFUNDED: <CheckCircle className="w-5 h-5 text-gray-500" />,
};

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Payé', FAILED: 'Échoué', PENDING: 'En attente',
  REFUNDED: 'Remboursé', PROCESSING: 'En cours',
};

export default function PaymentsPage() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => paymentApi.myPayments().then(r => r.data.data),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mes paiements</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-4 h-20 animate-pulse bg-gray-200" />)}
        </div>
      ) : !payments || payments.length === 0 ? (
        <div className="text-center py-20 card">
          <CreditCard className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Aucun paiement</h3>
          <p className="text-gray-500 text-sm">Vos transactions apparaîtront ici après votre première réservation.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Logement</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Méthode</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment: Payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {format(new Date(payment.createdAt), 'd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{payment.booking?.property?.title}</p>
                    <p className="text-xs text-gray-400">{payment.booking?.nights} nuit{(payment.booking?.nights || 0) > 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{payment.provider === 'STRIPE' ? 'Carte bancaire' : 'PayTech'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                    {payment.amount?.toLocaleString('fr-SN')} {payment.currency}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {STATUS_ICONS[payment.status] || <Clock className="w-5 h-5 text-gray-400" />}
                      <span className="text-xs text-gray-600">{STATUS_LABELS[payment.status] || payment.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface Payment {
  id: string;
  createdAt: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  booking?: { nights: number; property?: { title: string } };
}
