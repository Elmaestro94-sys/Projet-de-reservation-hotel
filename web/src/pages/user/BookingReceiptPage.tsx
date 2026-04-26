import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, Download, ArrowLeft, CheckCircle } from 'lucide-react';
import { bookingApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';

export default function BookingReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['booking-receipt', id],
    queryFn: () => bookingApi.get(id!).then(r => r.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Réservation introuvable.</p>
        <Link to="/mes-reservations" className="btn-primary mt-4 inline-block">Mes réservations</Link>
      </div>
    );
  }

  const booking = data;
  const payment = booking.payments?.[0];
  const nights = booking.nights;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Screen-only back link */}
      <div className="print:hidden flex items-center justify-between mb-6">
        <Link to={`/mes-reservations/${id}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          <button
            onClick={() => window.print()}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" /> Télécharger PDF
          </button>
        </div>
      </div>

      {/* Receipt */}
      <div id="receipt" className="bg-white border border-gray-200 rounded-2xl p-8 print:border-0 print:rounded-none print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
          <div>
            <div className="text-2xl font-bold text-primary-600 mb-1">Séjour Sénégal</div>
            <p className="text-gray-500 text-sm">hello@sejoursenegal.sn</p>
            <p className="text-gray-500 text-sm">Dakar, Sénégal</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Reçu de réservation</div>
            <div className="text-lg font-bold text-gray-900 mt-1">#{booking.id.slice(0, 8).toUpperCase()}</div>
            <div className="text-sm text-gray-500 mt-1">
              {new Date(booking.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
            </div>
          </div>
        </div>

        {/* Status */}
        {booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ? (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-4 py-3 mb-6">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Réservation confirmée</span>
          </div>
        ) : (
          <div className="bg-yellow-50 text-yellow-700 rounded-xl px-4 py-3 mb-6">
            <span className="font-medium">En attente de confirmation</span>
          </div>
        )}

        {/* Guest & Property */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Voyageur</h3>
            <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Logement</h3>
            <p className="font-semibold text-gray-900">{booking.property?.title}</p>
            <p className="text-sm text-gray-500">{booking.property?.city}{booking.property?.district ? `, ${booking.property.district}` : ''}</p>
          </div>
        </div>

        {/* Stay details */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Arrivée</p>
              <p className="font-semibold text-gray-900">
                {new Date(booking.checkIn).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Durée</p>
              <p className="font-semibold text-gray-900">{nights} nuit{nights > 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Départ</p>
              <p className="font-semibold text-gray-900">
                {new Date(booking.checkOut).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
              </p>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Détail du prix</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{booking.pricePerNight?.toLocaleString('fr-SN')} XOF × {nights} nuit{nights > 1 ? 's' : ''}</span>
              <span className="text-gray-900">{(booking.pricePerNight * nights).toLocaleString('fr-SN')} XOF</span>
            </div>
            {booking.cleaningFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frais de ménage</span>
                <span className="text-gray-900">{booking.cleaningFee.toLocaleString('fr-SN')} XOF</span>
              </div>
            )}
            {booking.serviceFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frais de service</span>
                <span className="text-gray-900">{booking.serviceFee.toLocaleString('fr-SN')} XOF</span>
              </div>
            )}
            {booking.promotionDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Réduction promotionnelle</span>
                <span>-{booking.promotionDiscount.toLocaleString('fr-SN')} XOF</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 text-base">
              <span>Total</span>
              <span>{booking.totalAmount?.toLocaleString('fr-SN')} XOF</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        {payment && (
          <div className="border border-gray-200 rounded-xl p-4 mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Paiement</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Méthode</p>
                <p className="font-medium text-gray-900 capitalize">{payment.provider?.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-gray-500">Statut</p>
                <p className={`font-medium ${payment.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {payment.status === 'PAID' ? 'Payé' : payment.status}
                </p>
              </div>
              {payment.paidAt && (
                <div>
                  <p className="text-gray-500">Date de paiement</p>
                  <p className="font-medium text-gray-900">
                    {new Date(payment.paidAt).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                  </p>
                </div>
              )}
              {payment.providerReference && (
                <div>
                  <p className="text-gray-500">Référence</p>
                  <p className="font-mono text-xs text-gray-900">{payment.providerReference}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
          <p>Merci d'avoir choisi Séjour Sénégal · Ce document est généré automatiquement</p>
          <p className="mt-1">En cas de litige, contactez-nous à hello@sejoursenegal.sn</p>
        </div>
      </div>
    </div>
  );
}
