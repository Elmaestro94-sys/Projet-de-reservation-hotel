import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { MapPin, Star, ArrowRight } from 'lucide-react';
import { destinationApi, propertyApi } from '@/services/api';
import PropertyCard from '@/components/property/PropertyCard';

interface Destination {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  region: string;
}

export default function DestinationPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: destinations = [] } = useQuery<Destination[]>({
    queryKey: ['destinations'],
    queryFn: () => destinationApi.list().then(r => r.data.data),
  });

  const destination = destinations.find((d: Destination) => d.slug === slug);

  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['properties', 'destination', slug],
    queryFn: () => propertyApi.list({ city: destination?.name, limit: '12' }).then(r => r.data),
    enabled: !!destination,
  });

  const properties = propertiesData?.data || [];

  if (!destination && destinations.length > 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Destination introuvable.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <>
      {destination && (
        <Helmet>
          <title>Logements à {destination.name} - Séjour Sénégal</title>
          <meta
            name="description"
            content={destination.description || `Découvrez les meilleurs logements à ${destination.name}, ${destination.region}. Réservez votre séjour au Sénégal.`}
          />
          <meta property="og:title" content={`Logements à ${destination.name} - Séjour Sénégal`} />
          <meta property="og:description" content={destination.description || ''} />
          {destination.image && <meta property="og:image" content={destination.image} />}
          <link rel="canonical" href={`/destinations/${slug}`} />
        </Helmet>
      )}

      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {destination?.image ? (
          <img
            src={destination.image}
            alt={destination?.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-900" />
        )}
        <div className="absolute inset-0 bg-black/40 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
              <Link to="/" className="hover:text-white">Accueil</Link>
              <span>/</span>
              <Link to="/recherche" className="hover:text-white">Destinations</Link>
              <span>/</span>
              <span className="text-white">{destination?.name}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {destination ? `Logements à ${destination.name}` : 'Chargement...'}
            </h1>
            {destination?.region && (
              <p className="text-white/80 flex items-center gap-1 mt-2">
                <MapPin className="w-4 h-4" /> {destination.region}, Sénégal
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Description */}
        {destination?.description && (
          <div className="max-w-3xl mb-8">
            <p className="text-gray-600 text-lg leading-relaxed">{destination.description}</p>
          </div>
        )}

        {/* Quick search */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {isLoading ? 'Chargement...' : `${propertiesData?.total || 0} logement${(propertiesData?.total || 0) !== 1 ? 's' : ''} disponible${(propertiesData?.total || 0) !== 1 ? 's' : ''}`}
          </h2>
          <Link
            to={`/recherche?city=${destination?.name}`}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            Voir tous <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Properties grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-2xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">Aucun logement disponible pour le moment</p>
            <p className="text-sm">Revenez bientôt ou explorez d'autres destinations.</p>
            <Link to="/recherche" className="btn-primary mt-4 inline-block">Explorer toutes les destinations</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {properties.map((property: any) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {/* Other destinations */}
        {destinations.length > 1 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Autres destinations</h2>
            <div className="flex flex-wrap gap-3">
              {destinations
                .filter((d: Destination) => d.slug !== slug)
                .map((d: Destination) => (
                  <Link
                    key={d.id}
                    to={`/destinations/${d.slug}`}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" /> {d.name}
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
