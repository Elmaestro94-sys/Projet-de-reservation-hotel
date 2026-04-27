import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Users, Bed, BadgeCheck, Zap, Heart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';

interface PropertyCardProps {
  property: {
    id: string;
    slug: string;
    title: string;
    city: string;
    district?: string;
    type: string;
    pricePerNight: number;
    cleaningFee?: number;
    avgRating: number;
    reviewCount: number;
    isPremium?: boolean;
    isFeatured?: boolean;
    instantBooking?: boolean;
    maxGuests: number;
    bedrooms: number;
    photos?: { url: string }[];
    owner?: { firstName: string; lastName: string; isVerified: boolean };
  };
  isFavorited?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Appartement', HOUSE: 'Maison', VILLA: 'Villa',
  BUNGALOW: 'Bungalow', STUDIO: 'Studio', ROOM: 'Chambre',
  GUESTHOUSE: "Maison d'hôtes", HOTEL: 'Hôtel', RESORT: 'Resort',
};

export default function PropertyCard({ property, isFavorited: initialFav = false }: PropertyCardProps) {
  const { isAuthenticated } = useAuthStore();
  const [isFav, setIsFav] = useState(initialFav);
  const queryClient = useQueryClient();

  const favMutation = useMutation({
    mutationFn: () => propertyApi.toggleFavorite(property.id),
    onSuccess: (res) => {
      setIsFav(res.data.data.isFavorite);
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const coverPhoto =
    property.photos?.[0]?.url ||
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80';
  const location = [property.district, property.city].filter(Boolean).join(', ');

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <Link to={`/logements/${property.slug}`}>
          <img
            src={coverPhoto}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {property.isPremium && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              ✦ Premium
            </span>
          )}
          {property.instantBooking && (
            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
              <Zap className="w-3 h-3 fill-current" /> Instantané
            </span>
          )}
        </div>

        {/* Favorite */}
        {isAuthenticated && (
          <button
            onClick={(e) => { e.preventDefault(); favMutation.mutate(); }}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
              isFav
                ? 'bg-red-500 text-white'
                : 'bg-white/90 backdrop-blur-sm text-gray-500 hover:bg-white hover:text-red-400 hover:scale-110'
            }`}
          >
            <Heart className={`w-4 h-4 transition-all duration-200 ${isFav ? 'fill-current scale-110' : ''}`} />
          </button>
        )}

        {/* Rating pill */}
        {property.avgRating > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span className="text-xs font-bold text-gray-900">{property.avgRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({property.reviewCount})</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
            {TYPE_LABELS[property.type] || property.type}
          </span>
          {property.owner?.isVerified && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <BadgeCheck className="w-3.5 h-3.5" /> Vérifié
            </span>
          )}
        </div>

        <Link to={`/logements/${property.slug}`}>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug mt-1 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
            {property.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-300" />
          <span className="truncate">{location}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-300" />
            {property.maxGuests} pers.
          </span>
          <span className="w-1 h-1 bg-gray-200 rounded-full" />
          <span className="flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5 text-gray-300" />
            {property.bedrooms} ch.
          </span>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
          <div>
            <span className="font-bold text-gray-900 text-base">
              {property.pricePerNight.toLocaleString('fr-SN')}
            </span>
            <span className="text-xs text-gray-400 ml-1">XOF / nuit</span>
          </div>
          <Link
            to={`/logements/${property.slug}`}
            className="text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-all duration-200 hover:shadow-sm"
          >
            Voir →
          </Link>
        </div>
      </div>
    </div>
  );
}
