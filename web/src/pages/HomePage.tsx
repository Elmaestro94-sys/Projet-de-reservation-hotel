import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search, MapPin, Calendar, Users, Star, Shield, Headphones,
  ChevronRight, Zap, Award, TrendingUp, ArrowRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '@/services/api';
import PropertyCard from '@/components/property/PropertyCard';

const DESTINATIONS = [
  {
    name: 'Dakar',
    slug: 'dakar',
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
    count: '120+',
    tag: 'Capitale vibrante',
  },
  {
    name: 'Saly',
    slug: 'saly',
    image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&q=80',
    count: '85+',
    tag: 'Station balnéaire',
  },
  {
    name: 'Saint-Louis',
    slug: 'saint-louis',
    image: 'https://images.unsplash.com/photo-1578469645742-46cae010e5d4?w=800&q=80',
    count: '45+',
    tag: 'Patrimoine UNESCO',
  },
  {
    name: 'Cap Skirring',
    slug: 'cap-skirring',
    image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
    count: '30+',
    tag: 'Plages sauvages',
  },
  {
    name: 'Somone',
    slug: 'somone',
    image: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&q=80',
    count: '25+',
    tag: 'Lagon & nature',
  },
  {
    name: 'Ziguinchor',
    slug: 'ziguinchor',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80',
    count: '18+',
    tag: 'Casamance',
  },
];

const STATS = [
  { value: '280+', label: 'Logements', icon: Award },
  { value: '15', label: 'Villes', icon: MapPin },
  { value: '4.9★', label: 'Note moyenne', icon: Star },
  { value: '98%', label: 'Satisfaits', icon: TrendingUp },
];

const TESTIMONIALS = [
  {
    name: 'Aminata D.',
    city: 'Paris',
    avatar: 'AD',
    rating: 5,
    text: 'Expérience incroyable ! La villa à Saly était exactement comme sur les photos. Propriétaire très réactif et service impeccable.',
  },
  {
    name: 'Moussa K.',
    city: 'Dakar',
    avatar: 'MK',
    rating: 5,
    text: 'J\'utilise Séjour Sénégal pour tous mes déplacements pro. Simple, rapide et les logements sont toujours de qualité.',
  },
  {
    name: 'Sophie L.',
    city: 'Lyon',
    avatar: 'SL',
    rating: 5,
    text: 'Découvert des adresses magnifiques à Saint-Louis que je n\'aurais jamais trouvées ailleurs. Merci pour cette plateforme !',
  },
];

interface PropertyListItem {
  id: string; slug: string; title: string; city: string; district?: string;
  type: string; pricePerNight: number; avgRating: number; reviewCount: number;
  isPremium: boolean; instantBooking?: boolean; maxGuests: number; bedrooms: number;
  photos: { url: string }[]; owner: { firstName: string; lastName: string; isVerified: boolean };
}

export default function HomePage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
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
    <div className="overflow-x-hidden">
      <Helmet>
        <title>Séjour Sénégal – Locations premium au Sénégal</title>
        <meta name="description" content="Réservez des logements d'exception au Sénégal : villas, appartements et maisons à Dakar, Saly, Saint-Louis. Paiement sécurisé, annonces vérifiées." />
      </Helmet>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col justify-center">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1920&q=90"
            alt="Sénégal"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-dark-900/85 via-dark-900/60 to-primary-900/30" />
        </div>

        {/* Decorative orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-primary-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 text-white text-sm mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-slow" />
              <span className="font-medium">280+ logements vérifiés au Sénégal</span>
            </div>

            {/* Heading */}
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 animate-fade-in-up">
              Vivez le Sénégal{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-amber-300">
                autrement
              </span>
            </h1>

            <p className="text-xl text-gray-300 leading-relaxed mb-10 max-w-2xl animate-fade-in-up">
              Villas de prestige, appartements modernes, maisons de caractère —
              découvrez les hébergements les plus beaux du Sénégal, de Dakar à la Casamance.
            </p>

            {/* Search card */}
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-2xl shadow-premium p-2 animate-fade-in-up"
            >
              <div className="flex flex-col md:flex-row">
                {/* Destination */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 md:border-r border-gray-100">
                  <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Destination</p>
                    <input
                      type="text"
                      placeholder="Dakar, Saly, Saint-Louis…"
                      value={search.city}
                      onChange={e => setSearch(p => ({ ...p, city: e.target.value }))}
                      className="w-full text-sm font-medium outline-none text-gray-900 placeholder:text-gray-400 bg-transparent"
                    />
                  </div>
                </div>

                {/* Check-in */}
                <div className="flex items-center gap-3 px-4 py-3 md:border-r border-gray-100">
                  <Calendar className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Arrivée</p>
                    <input
                      type="date"
                      value={search.checkIn}
                      onChange={e => setSearch(p => ({ ...p, checkIn: e.target.value }))}
                      className="text-sm font-medium outline-none text-gray-700 bg-transparent"
                      min={today}
                    />
                  </div>
                </div>

                {/* Check-out */}
                <div className="flex items-center gap-3 px-4 py-3 md:border-r border-gray-100">
                  <Calendar className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Départ</p>
                    <input
                      type="date"
                      value={search.checkOut}
                      onChange={e => setSearch(p => ({ ...p, checkOut: e.target.value }))}
                      className="text-sm font-medium outline-none text-gray-700 bg-transparent"
                      min={search.checkIn || today}
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="flex items-center gap-3 px-4 py-3 md:border-r border-gray-100">
                  <Users className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Voyageurs</p>
                    <select
                      value={search.guests}
                      onChange={e => setSearch(p => ({ ...p, guests: e.target.value }))}
                      className="text-sm font-medium outline-none text-gray-700 bg-transparent cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => (
                        <option key={n} value={n}>{n} voyageur{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <div className="p-1.5">
                  <button
                    type="submit"
                    className="w-full md:w-auto h-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-glow whitespace-nowrap"
                  >
                    <Search className="w-4 h-4" />
                    Rechercher
                  </button>
                </div>
              </div>
            </form>

            {/* Quick links */}
            <div className="flex items-center gap-3 mt-5 text-sm text-white/70">
              <span>Populaires :</span>
              {['Dakar', 'Saly', 'Saint-Louis', 'Cap Skirring'].map(city => (
                <button
                  key={city}
                  onClick={() => navigate(`/recherche?city=${city}`)}
                  className="text-white/90 hover:text-white underline underline-offset-2 transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-float">
          <div className="w-px h-10 bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 divide-x-0 md:divide-x divide-gray-100">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-4 px-8 py-6">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-gray-900">{value}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DESTINATIONS ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-2">Explorez</p>
            <h2 className="font-display text-4xl font-bold text-gray-900">Nos destinations</h2>
            <p className="text-gray-500 mt-2 text-lg">Du Sahel à la Casamance, vivez chaque région</p>
          </div>
          <Link
            to="/recherche"
            className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors group"
          >
            Toutes les villes
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Asymmetric grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {/* Large card - Dakar */}
          <Link
            to={`/destinations/${DESTINATIONS[0].slug}`}
            className="group relative col-span-2 md:col-span-1 md:row-span-2 rounded-2xl overflow-hidden"
            style={{ minHeight: '360px' }}
          >
            <img
              src={DESTINATIONS[0].image}
              alt={DESTINATIONS[0].name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ minHeight: '360px' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <span className="text-xs font-semibold text-primary-300 uppercase tracking-widest mb-1">
                {DESTINATIONS[0].tag}
              </span>
              <h3 className="font-display text-3xl font-bold text-white">{DESTINATIONS[0].name}</h3>
              <p className="text-white/70 text-sm mt-1">{DESTINATIONS[0].count} logements</p>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                  Explorer <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>

          {/* Remaining 5 destinations */}
          {DESTINATIONS.slice(1).map(dest => (
            <Link
              key={dest.name}
              to={`/destinations/${dest.slug}`}
              className="group relative rounded-2xl overflow-hidden"
              style={{ minHeight: '168px' }}
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ minHeight: '168px' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-bold text-white text-base">{dest.name}</p>
                <p className="text-white/60 text-xs">{dest.count} logements</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── FEATURED PROPERTIES ─── */}
      <section className="bg-gray-50/80 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-2">Sélection</p>
              <h2 className="font-display text-4xl font-bold text-gray-900">Coups de cœur</h2>
              <p className="text-gray-500 mt-2 text-lg">Nos hébergements les mieux notés par les voyageurs</p>
            </div>
            <Link
              to="/recherche"
              className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors group"
            >
              Voir tout
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {featuredProperties?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(featuredProperties as PropertyListItem[]).slice(0, 8).map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden shadow-card animate-pulse">
                  <div className="aspect-[4/3] skeleton" />
                  <div className="p-4 space-y-3 bg-white">
                    <div className="h-3 skeleton rounded w-1/3" />
                    <div className="h-4 skeleton rounded w-3/4" />
                    <div className="h-3 skeleton rounded w-1/2" />
                    <div className="h-8 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10 md:hidden">
            <Link to="/recherche" className="btn-secondary">
              Voir tous les logements <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── WHY US ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-2">Pourquoi nous choisir</p>
          <h2 className="font-display text-4xl font-bold text-gray-900">La plateforme de confiance</h2>
          <p className="text-gray-500 mt-3 text-lg max-w-xl mx-auto">
            Pensée pour le marché sénégalais, Séjour Sénégal garantit sécurité et qualité à chaque réservation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              color: 'bg-blue-50 text-blue-600',
              title: 'Annonces vérifiées',
              desc: 'Chaque propriétaire et logement est contrôlé par notre équipe. Photos authentiques, descriptions précises.',
            },
            {
              icon: Zap,
              color: 'bg-primary-50 text-primary-600',
              title: 'Paiements sécurisés',
              desc: 'Stripe pour les cartes bancaires, PayTech pour Orange Money et Wave. Vos données ne sont jamais stockées.',
            },
            {
              icon: Headphones,
              color: 'bg-emerald-50 text-emerald-600',
              title: 'Support 7j/7',
              desc: 'Une équipe dédiée vous accompagne avant, pendant et après votre séjour pour une expérience sans stress.',
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className="group p-8 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-card transition-all duration-300 bg-white"
            >
              <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-3">{title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="bg-gradient-to-br from-gray-900 to-dark-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-2">Témoignages</p>
            <h2 className="font-display text-4xl font-bold text-white">Ce qu'ils disent</h2>
            <p className="text-gray-400 mt-3 text-lg">Des milliers de voyageurs nous font confiance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, city, avatar, rating, text }) => (
              <div key={name} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 hover:bg-white/10 transition-colors duration-300">
                <div className="flex mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed text-sm mb-6">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{avatar}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{name}</p>
                    <p className="text-gray-500 text-xs">{city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OWNER CTA ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700" />
        {/* Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-white text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-200 mb-3">Propriétaires</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Louez votre logement<br />au Sénégal
              </h2>
              <p className="text-primary-100 text-lg max-w-lg leading-relaxed">
                Rejoignez 500+ propriétaires qui génèrent des revenus grâce à leur patrimoine immobilier.
                Publication gratuite, paiements sécurisés.
              </p>
              <div className="flex flex-wrap gap-4 mt-6 justify-center lg:justify-start text-sm text-primary-200">
                <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Annonces gratuites</span>
                <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Paiements rapides</span>
                <span className="flex items-center gap-2"><Star className="w-4 h-4" /> Accompagnement dédié</span>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-all duration-200 shadow-premium text-center text-lg whitespace-nowrap"
              >
                Publier mon annonce
              </Link>
              <Link
                to="/recherche"
                className="px-8 py-4 bg-primary-800/50 backdrop-blur text-white font-semibold rounded-xl hover:bg-primary-800/70 border border-primary-500/50 transition-all duration-200 text-center whitespace-nowrap"
              >
                Explorer d'abord
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
