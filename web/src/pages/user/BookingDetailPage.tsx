import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Calendar, Users, CreditCard, Star, MessageSquare, X, CheckCircle } from 'lucide-react';
import { bookingApi, reviewApi, paymentApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.get(id!).then(r => r.data.data),
    enabled: !!id,
  });

  const booking = data;

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancel(id!, cancelReason),
    onSuccess: () => {
      toast.success('Réservation annulée');
      setShowCancelModal(false);
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    },
    onError: () => toast.error('Erreur lors de l\'annulation'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => reviewApi.create({ bookingId: id, ...reviewData }),
    onSuccess: () => {
      toast.success('Avis publié !');
      setShowReviewForm(false);
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur');
    },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await paymentApi.createStripeSession(id!);
      if (res.data?.url) window.location.href = res.data.url;
    },
    onError: () => toast.error('Erreur de paiement'),
  });

  if (isLoading) {
    return <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/2" />
      <div className="card p-6 h-48 bg-gray-200" />
    </div>;
  }

  if (!booking) return <div className="text-center py-20"><p className="text-gray-500">Réservation introuvable.</p></div>;

  const isGuest = booking.userId === user?.id;
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);
  const isPending = booking.status === 'PENDING';
  const hasPaid = booking.payments?.some((p: { status: string }) => p.status === 'PAID');
  const canReview = ['CONFIRMED', 'COMPLETED'].includes(booking.status) && isGuest && !booking.review;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réservation #{id?.slice(0, 8)}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Créée le {format(new Date(booking.createdAt), 'd MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <span className={`badge text-sm px-3 py-1.5 ${
          booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
          booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
          booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
          'bg-red-100 text-red-700'
        }`}>
          {booking.status === 'CONFIRMED' && <CheckCircle className="w-4 h-4" />}
          {booking.status === 'CONFIRMED' ? 'Confirmée' :
           booking.status === 'PENDING' ? 'En attente de paiement' :
           booking.status === 'COMPLETED' ? 'Terminée' : 'Annulée'}
        </span>
      </div>

      {/* Property summary */}
      <div className="card p-5 mb-6 flex gap-4">
        {booking.property?.photos?.[0]?.url && (
          <img src={booking.property.photos[0].url} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
        )}
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">{booking.property?.title}</h2>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4" /> {booking.property?.city}
          </p>
        </div>
      </div>

      {/* Booking details */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Détails du séjour</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Arrivée</label>
            <p className="font-semibold text-gray-900 flex items-center gap-1 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              {format(new Date(booking.checkIn), 'd MMMM yyyy', { locale: fr })}
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Départ</label>
            <p className="font-semibold text-gray-900 flex items-center gap-1 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              {format(new Date(booking.checkOut), 'd MMMM yyyy', { locale: fr })}
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Durée</label>
            <p className="font-semibold text-gray-900 mt-1">{booking.nights} nuit{booking.nights > 1 ? 's' : ''}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Voyageurs</label>
            <p className="font-semibold text-gray-900 flex items-center gap-1 mt-1">
              <Users className="w-4 h-4 text-gray-400" /> {booking.guests}
            </p>
          </div>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Récapitulatif des prix</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{booking.pricePerNight?.toLocaleString('fr-SN')} XOF × {booking.nights} nuit{booking.nights > 1 ? 's' : ''}</span>
            <span>{(booking.pricePerNight * booking.nights)?.toLocaleString('fr-SN')} XOF</span>
          </div>
          {booking.cleaningFee > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Frais de ménage</span>
              <span>{booking.cleaningFee?.toLocaleString('fr-SN')} XOF</span>
            </div>
          )}
          {booking.serviceFee > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Frais de service</span>
              <span>{booking.serviceFee?.toLocaleString('fr-SN')} XOF</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
            <span>Total</span>
            <span>{booking.totalAmount?.toLocaleString('fr-SN')} XOF</span>
          </div>
        </div>
      </div>

      {/* Payment status */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Paiement</h3>
        {hasPaid ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Paiement reçu</span>
          </div>
        ) : (
          <div>
            <p className="text-yellow-700 text-sm mb-3">Paiement en attente</p>
            {isPending && isGuest && (
              <button onClick={() => payMutation.mutate()} className="btn-primary text-sm">
                Payer maintenant
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review */}
      {canReview && (
        <div className="card p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-primary-500" /> Laisser un avis</h3>
          {showReviewForm ? (
            <div className="space-y-4">
              <div>
                <label className="label">Note globale</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setReviewData(p => ({ ...p, rating: n }))}>
                      <Star className={`w-8 h-8 ${n <= reviewData.rating ? 'text-primary-500 fill-current' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Votre commentaire</label>
                <textarea
                  value={reviewData.comment}
                  onChange={e => setReviewData(p => ({ ...p, comment: e.target.value }))}
                  className="input min-h-[100px]"
                  placeholder="Décrivez votre expérience..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => reviewMutation.mutate()} disabled={!reviewData.comment} className="btn-primary">Publier l'avis</button>
                <button onClick={() => setShowReviewForm(false)} className="btn-secondary">Annuler</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowReviewForm(true)} className="btn-secondary flex items-center gap-2">
              <Star className="w-4 h-4" /> Écrire un avis
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Messages</h3>
        {booking.messages?.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun message pour cette réservation.</p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {booking.messages?.map((msg: Message) => (
              <div key={msg.id} className={`flex gap-2 ${msg.sender?.id === user?.id ? 'flex-row-reverse' : ''}`}>
                <div className={`max-w-xs p-3 rounded-xl text-sm ${msg.sender?.id === user?.id ? 'bg-primary-100 text-primary-900' : 'bg-gray-100 text-gray-800'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {canCancel && isGuest && (
        <div>
          <button onClick={() => setShowCancelModal(true)} className="text-red-600 hover:text-red-700 text-sm font-medium hover:underline">
            Annuler cette réservation
          </button>
        </div>
      )}

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Annuler la réservation</h3>
              <button onClick={() => setShowCancelModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-gray-600 text-sm mb-4">Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.</p>
            <div className="mb-4">
              <label className="label">Raison (optionnel)</label>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="input" placeholder="Motif de l'annulation..." rows={3} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {cancelMutation.isPending ? 'Annulation...' : 'Confirmer l\'annulation'}
              </button>
              <button onClick={() => setShowCancelModal(false)} className="btn-secondary">Retour</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Message {
  id: string;
  content: string;
  sender?: { id: string };
}
