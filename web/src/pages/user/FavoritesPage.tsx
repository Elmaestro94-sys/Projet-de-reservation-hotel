import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { propertyApi } from '@/services/api';
import PropertyCard from '@/components/property/PropertyCard';

export default function FavoritesPage() {
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => propertyApi.favorites().then(r => r.data.data),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mes favoris</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-64 animate-pulse bg-gray-200" />)}
        </div>
      ) : !favorites || favorites.length === 0 ? (
        <div className="text-center py-20 card">
          <Heart className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Aucun favori</h3>
          <p className="text-gray-500 text-sm mb-6">Sauvegardez les logements qui vous intéressent pour les retrouver facilement.</p>
          <Link to="/recherche" className="btn-primary inline-block">Explorer les logements</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((property: Parameters<typeof PropertyCard>[0]['property']) => (
            <PropertyCard key={property.id} property={property} isFavorited />
          ))}
        </div>
      )}
    </div>
  );
}
