import { Link } from 'react-router-dom';
import { Star, MapPin, Users, Bed, BadgeCheck, Zap } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { Heart } from 'lucide-react';
import { useState } from 'react';

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
  GUESTHOUSE: 'Guesthouse', HOTEL: 'Hôtel', RESORT: 'Resort',
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

  const coverPhoto = property.photos?.[0]?.url || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600';
  const location = [property.district, property.city].filter(Boolean).join(', ');

  return (
    <div className="group card hover:shadow-card-hover transition-shadow duration-300">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link to={`/logements/${property.slug}`}>
          <img
            src={coverPhoto}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {property.isPremium && (
            <span className="badge bg-primary-600 text-white">Premium</span>
          )}
          {property.instantBooking && (
            <span className="badge bg-green-600 text-white">
              <Zap className="w-3 h-3" /> Instant
            </span>
          )}
        </div>

        {/* Favorite button */}
        {isAuthenticated && (
          <button
            onClick={() => favMutation.mutate()}
            className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-colors ${
              isFav ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <span className="text-xs text-gray-500 font-medium">{TYPE_LABELS[property.type] || property.type}</span>
            <h3 className="font-semibold text-gray-900 truncate text-sm mt-0.5 leading-snug">
              <Link to={`/logements/${property.slug}`} className="hover:text-primary-600 transition-colors">
                {property.title}
              </Link>
            </h3>
          </div>
          {property.avgRating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 text-primary-500 fill-current" />
              <span className="text-sm font-semibold text-gray-900">{property.avgRating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({property.reviewCount})</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {property.maxGuests}</span>
          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {property.bedrooms} ch.</span>
          {property.owner?.isVerified && (
            <span className="flex items-center gap-1 text-green-600 ml-auto">
              <BadgeCheck className="w-3.5 h-3.5" /> Vérifié
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="font-bold text-gray-900">{property.pricePerNight.toLocaleString('fr-SN')} XOF</span>
            <span className="text-xs text-gray-400"> / nuit</span>
          </div>
          <Link
            to={`/logements/${property.slug}`}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            Voir les détails →
          </Link>
        </div>
      </div>
    </div>
  );
}
