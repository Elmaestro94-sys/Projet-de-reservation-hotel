import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Star, MapPin, Users, Bed, Bath, Wifi, Car, Wind, Waves, ChevronLeft,
  Heart, Share2, BadgeCheck, Zap, ChevronRight, X, Calendar
} from 'lucide-react';
import { propertyApi, bookingApi, paymentApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />,
  parking: <Car className="w-4 h-4" />,
  climatisation: <Wind className="w-4 h-4" />,
  piscine: <Waves className="w-4 h-4" />,
};

export default function PropertyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [availability, setAvailability] = useState<{ available: boolean; totalAmount?: number; nights?: number } | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['property', slug],
    queryFn: () => propertyApi.get(slug!).then(r => r.data.data),
    enabled: !!slug,
  });

  const property = data;

  const checkAvailability = async () => {
    if (!checkIn || !checkOut) return toast.error('Sélectionnez vos dates');
    try {
      const { data: res } = await bookingApi.checkAvailability({ propertyId: property.id, checkIn, checkOut, guests });
      setAvailability(res.data);
      if (!res.data.available) toast.error(res.data.reason || 'Dates non disponibles');
    } catch {
      toast.error('Erreur de vérification des disponibilités');
    }
  };

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) { navigate('/login'); return; }
      if (!availability?.available) return toast.error('Vérifiez d\'abord les disponibilités');
      setBookingLoading(true);
      const { data: bookingRes } = await bookingApi.create({ propertyId: property.id, checkIn, checkOut, guests });
      const bookingId = bookingRes.data.id;

      // Create Stripe payment session
      const { data: paymentRes } = await paymentApi.createStripeSession(bookingId);
      if (paymentRes.data?.url) {
        window.location.href = paymentRes.data.url;
      } else {
        toast.success('Réservation créée ! En attente de confirmation.');
        navigate(`/mes-reservations/${bookingId}`);
      }
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur de réservation';
      toast.error(msg);
      setBookingLoading(false);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
        <div className="grid grid-cols-4 gap-2 h-80 mb-8">
          <div className="col-span-2 bg-gray-200 rounded-l-2xl" />
          <div className="bg-gray-200" />
          <div className="bg-gray-200 rounded-r-2xl" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-gray-500">Logement introuvable.</p>
        <Link to="/recherche" className="btn-primary mt-4 inline-block">Retour à la recherche</Link>
      </div>
    );
  }

  const photos = property.photos || [];
  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> Retour
        </button>
        <span>/</span>
        <span>{property.city}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">{property.title}</span>
      </nav>

      {/* Title & Actions */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{property.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            {property.avgRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-primary-500 fill-current" />
                <strong>{property.avgRating.toFixed(1)}</strong> ({property.reviewCount} avis)
              </span>
            )}
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{property.city}{property.district && `, ${property.district}`}</span>
            {property.owner?.isVerified && (
              <span className="flex items-center gap-1 text-green-600"><BadgeCheck className="w-4 h-4" /> Vérifié</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost flex items-center gap-2 text-sm"><Share2 className="w-4 h-4" /> Partager</button>
          <button className="btn-ghost flex items-center gap-2 text-sm"><Heart className="w-4 h-4" /> Sauvegarder</button>
        </div>
      </div>

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-80 md:h-[440px] mb-8 cursor-pointer" onClick={() => setLightbox(true)}>
          <div className="col-span-2 row-span-2 relative">
            <img src={photos[0]?.url} alt="" className="w-full h-full object-cover" />
          </div>
          {photos.slice(1, 5).map((p: { url: string }, i: number) => (
            <div key={i} className="relative">
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              {i === 3 && photos.length > 5 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-medium text-lg">
                  +{photos.length - 5} photos
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white hover:text-gray-300">
            <X className="w-8 h-8" />
          </button>
          <button onClick={() => setPhotoIndex(i => Math.max(0, i - 1))} className="absolute left-4 text-white hover:text-gray-300">
            <ChevronLeft className="w-10 h-10" />
          </button>
          <img src={photos[photoIndex]?.url} alt="" className="max-h-full max-w-full rounded-xl" />
          <button onClick={() => setPhotoIndex(i => Math.min(photos.length - 1, i + 1))} className="absolute right-4 text-white hover:text-gray-300">
            <ChevronRight className="w-10 h-10" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">{photoIndex + 1} / {photos.length}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key info */}
          <div className="flex flex-wrap gap-4 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-5 h-5 text-gray-400" /> <span>{property.maxGuests} voyageurs</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Bed className="w-5 h-5 text-gray-400" /> <span>{property.bedrooms} chambre{property.bedrooms > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Bath className="w-5 h-5 text-gray-400" /> <span>{property.bathrooms} salle{property.bathrooms > 1 ? 's' : ''} de bain</span>
            </div>
            {property.instantBooking && (
              <div className="flex items-center gap-2 text-green-600">
                <Zap className="w-5 h-5" /> <span>Réservation instantanée</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
          </div>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Équipements</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.amenities.map((amenity: string) => (
                  <div key={amenity} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    {AMENITY_ICONS[amenity] || <span className="w-4 h-4 text-gray-400">•</span>}
                    <span className="text-sm text-gray-700 capitalize">{amenity.replace('-', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {property.rules?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Règles du logement</h2>
              <ul className="space-y-2">
                {property.rules.map((rule: string) => (
                  <li key={rule} className="flex items-center gap-2 text-gray-600 text-sm">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" /> {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Owner */}
          <div className="border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Propriétaire</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-bold text-xl">
                  {property.owner?.firstName?.[0]}{property.owner?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{property.owner?.firstName} {property.owner?.lastName}</p>
                {property.owner?.isVerified && (
                  <p className="text-sm text-green-600 flex items-center gap-1"><BadgeCheck className="w-4 h-4" /> Propriétaire vérifié</p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">Membre depuis {new Date(property.owner?.createdAt).getFullYear()}</p>
              </div>
            </div>
            {isAuthenticated && user?.id !== property.owner?.id && (
              <Link to={`/messages`} state={{ receiverId: property.owner?.id }} className="btn-secondary text-sm mt-4 inline-block">
                Contacter le propriétaire
              </Link>
            )}
          </div>

          {/* Reviews */}
          {property.reviews?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary-500 fill-current" />
                {property.avgRating?.toFixed(1)} · {property.reviewCount} avis
              </h2>
              <div className="space-y-6">
                {property.reviews.map((review: Review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                        {review.reviewer?.firstName?.[0]}{review.reviewer?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{review.reviewer?.firstName} {review.reviewer?.lastName}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-primary-500 fill-current' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                    {review.ownerReply && (
                      <div className="mt-3 ml-4 p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs font-medium text-gray-700 mb-1">Réponse du propriétaire :</p>
                        <p className="text-sm text-gray-600">{review.ownerReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 card p-6 shadow-xl">
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-2xl font-bold text-gray-900">{property.pricePerNight.toLocaleString('fr-SN')}</span>
              <span className="text-gray-500">XOF / nuit</span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                <div className="p-3">
                  <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Arrivée</label>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={checkIn}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => { setCheckIn(e.target.value); setAvailability(null); }}
                      className="text-sm outline-none text-gray-900 w-full"
                    />
                  </div>
                </div>
                <div className="p-3">
                  <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Départ</label>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      onChange={e => { setCheckOut(e.target.value); setAvailability(null); }}
                      className="text-sm outline-none text-gray-900 w-full"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 p-3">
                <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Voyageurs</label>
                <select value={guests} onChange={e => setGuests(parseInt(e.target.value))} className="text-sm outline-none text-gray-900 w-full mt-1 bg-transparent">
                  {Array.from({ length: property.maxGuests }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} voyageur{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {!availability ? (
              <button onClick={checkAvailability} className="btn-primary w-full mb-3">
                Vérifier les disponibilités
              </button>
            ) : availability.available ? (
              <button
                onClick={() => bookingMutation.mutate()}
                disabled={bookingLoading}
                className="btn-primary w-full mb-3"
              >
                {bookingLoading ? 'Réservation...' : 'Réserver et payer'}
              </button>
            ) : (
              <button disabled className="w-full py-3 px-4 bg-red-100 text-red-600 rounded-xl font-medium cursor-not-allowed mb-3">
                Dates non disponibles
              </button>
            )}

            {/* Price breakdown */}
            {availability?.available && nights > 0 && (
              <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>{property.pricePerNight.toLocaleString('fr-SN')} XOF × {nights} nuit{nights > 1 ? 's' : ''}</span>
                  <span>{(property.pricePerNight * nights).toLocaleString('fr-SN')} XOF</span>
                </div>
                {property.cleaningFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Frais de ménage</span>
                    <span>{property.cleaningFee.toLocaleString('fr-SN')} XOF</span>
                  </div>
                )}
                {property.serviceFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Frais de service</span>
                    <span>{property.serviceFee.toLocaleString('fr-SN')} XOF</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{availability.totalAmount?.toLocaleString('fr-SN')} XOF</span>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center mt-4">Aucun paiement débité avant confirmation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  ownerReply?: string;
  reviewer: { firstName: string; lastName: string };
}
