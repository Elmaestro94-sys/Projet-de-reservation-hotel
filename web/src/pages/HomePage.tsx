import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Star, Shield, Headphones, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { destinationApi, propertyApi } from '@/services/api';
import PropertyCard from '@/components/property/PropertyCard';

const DESTINATIONS = [
  { name: 'Dakar', image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600', count: '120+' },
  { name: 'Saly', image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600', count: '85+' },
  { name: 'Saint-Louis', image: 'https://images.unsplash.com/photo-1578469645742-46cae010e5d4?w=600', count: '45+' },
  { name: 'Cap Skirring', image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600', count: '30+' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ city: '', checkIn: '', checkOut: '', guests: '2' });

  const { data: featuredProperties } = useQuery({
    queryKey: ['properties-featured'],
    queryFn: () => propertyApi.list({ limit: 8, sort: 'rating' }).then(r => r.data.data),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.city) params.set('city', search.city);
    if (search.checkIn) params.set('checkIn', search.checkIn);
    if (search.checkOut) params.set('checkOut', search.checkOut);
    if (search.guests) params.set('guests', search.guests);
    navigate(`/recherche?${params}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[600px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/50 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Annonces vérifiées · Paiement sécurisé
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Votre séjour<br />
              <span className="text-primary-400">premium</span> au Sénégal
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Découvrez des logements d'exception à Dakar, Saly, Saint-Louis et partout au Sénégal. Villas, appartements, maisons de caractère.
            </p>

            {/* Search form */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2 shadow-2xl">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Destination (Dakar, Saly...)"
                    value={search.city}
                    onChange={e => setSearch(p => ({ ...p, city: e.target.value }))}
                    className="flex-1 text-sm outline-none text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div className="hidden md:block w-px bg-gray-200" />
                <div className="flex items-center gap-2 px-3 py-2">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="date"
                    value={search.checkIn}
                    onChange={e => setSearch(p => ({ ...p, checkIn: e.target.value }))}
                    className="text-sm outline-none text-gray-700"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="hidden md:block w-px bg-gray-200" />
                <div className="flex items-center gap-2 px-3 py-2">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="date"
                    value={search.checkOut}
                    onChange={e => setSearch(p => ({ ...p, checkOut: e.target.value }))}
                    className="text-sm outline-none text-gray-700"
                    min={search.checkIn || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="hidden md:block w-px bg-gray-200" />
                <div className="flex items-center gap-2 px-3 py-2">
                  <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <select
                    value={search.guests}
                    onChange={e => setSearch(p => ({ ...p, guests: e.target.value }))}
                    className="text-sm outline-none text-gray-700 bg-transparent"
                  >
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} voyageur{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-primary flex items-center gap-2 whitespace-nowrap">
                  <Search className="w-4 h-4" /> Rechercher
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Explorez nos destinations</h2>
            <p className="text-gray-500 mt-1">Des logements dans les plus belles villes du Sénégal</p>
          </div>
          <button onClick={() => navigate('/recherche')} className="flex items-center gap-1 text-primary-600 font-medium text-sm hover:underline">
            Voir tout <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DESTINATIONS.map(dest => (
            <button
              key={dest.name}
              onClick={() => navigate(`/recherche?city=${dest.name}`)}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer"
            >
              <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white text-left">
                <p className="font-bold text-lg">{dest.name}</p>
                <p className="text-sm text-gray-300">{dest.count} logements</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured properties */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Logements en vedette</h2>
              <p className="text-gray-500 mt-1">Sélection de nos meilleurs hébergements</p>
            </div>
            <button onClick={() => navigate('/recherche')} className="flex items-center gap-1 text-primary-600 font-medium text-sm hover:underline">
              Tous les logements <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(featuredProperties || []).slice(0, 8).map((property: PropertyListItem) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900">Pourquoi choisir Séjour Sénégal ?</h2>
          <p className="text-gray-500 mt-2">Une plateforme de confiance pensée pour le marché sénégalais</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: 'Annonces vérifiées',
              desc: 'Chaque propriétaire et logement est vérifié par notre équipe. Photos authentiques, descriptions précises.',
            },
            {
              icon: Star,
              title: 'Paiements sécurisés',
              desc: 'Stripe et PayTech pour payer par carte ou Orange Money. Vos données bancaires ne sont jamais stockées.',
            },
            {
              icon: Headphones,
              title: 'Support humain',
              desc: 'Notre équipe est disponible 7j/7 pour vous accompagner avant, pendant et après votre séjour.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-amber-50 transition-colors">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA become owner */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-3">Vous avez un logement au Sénégal ?</h2>
            <p className="text-primary-100 text-lg">Publiez votre annonce gratuitement et commencez à recevoir des réservations dès aujourd'hui.</p>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-primary-700 font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors whitespace-nowrap text-lg"
          >
            Devenir propriétaire
          </button>
        </div>
      </section>
    </div>
  );
}

interface PropertyListItem {
  id: string;
  slug: string;
  title: string;
  city: string;
  type: string;
  pricePerNight: number;
  avgRating: number;
  reviewCount: number;
  isPremium: boolean;
  maxGuests: number;
  bedrooms: number;
  photos: { url: string }[];
  owner: { firstName: string; lastName: string; isVerified: boolean };
}
