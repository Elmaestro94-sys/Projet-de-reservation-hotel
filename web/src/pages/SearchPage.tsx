import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, MapPin, Calendar, Users, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { propertyApi } from '@/services/api';
import PropertyCard from '@/components/property/PropertyCard';

const PROPERTY_TYPES = [
  { value: '', label: 'Tous' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'HOUSE', label: 'Maison' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'BUNGALOW', label: 'Bungalow' },
  { value: 'GUESTHOUSE', label: "Maison d'hôtes" },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Plus récents' },
  { value: 'priceAsc', label: 'Prix ↑' },
  { value: 'priceDesc', label: 'Prix ↓' },
  { value: 'rating', label: 'Mieux notés' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') || '1',
    type: searchParams.get('type') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'createdAt',
    page: parseInt(searchParams.get('page') || '1'),
  });

  const queryParams = {
    ...(filters.city && { city: filters.city }),
    ...(filters.checkIn && { checkIn: filters.checkIn }),
    ...(filters.checkOut && { checkOut: filters.checkOut }),
    ...(parseInt(filters.guests) > 1 && { guests: filters.guests }),
    ...(filters.type && { type: filters.type }),
    ...(filters.minPrice && { minPrice: filters.minPrice }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
    sort: filters.sort,
    page: filters.page,
    limit: 12,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['properties', queryParams],
    queryFn: () => propertyApi.list(queryParams).then(r => r.data),
  });

  const properties = data?.data || [];
  const meta = data?.meta || { total: 0, pages: 1 };

  const applySearch = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applySearch();
  };

  const clearFilter = (key: keyof typeof filters, val = '') => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const resetAll = () => {
    setFilters(p => ({ ...p, type: '', minPrice: '', maxPrice: '' }));
  };

  const activeFilterCount = [filters.type, filters.minPrice, filters.maxPrice].filter(Boolean).length;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky search bar ── */}
      <div className="sticky top-20 z-30 bg-white border-b border-gray-100 shadow-sm">
        <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row gap-2.5">
            {/* City */}
            <div className="flex-1 flex items-center gap-2.5 border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Destination"
                value={filters.city}
                onChange={e => setFilters(p => ({ ...p, city: e.target.value }))}
                className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
              />
              {filters.city && (
                <button type="button" onClick={() => clearFilter('city')}>
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Dates */}
            <div className="flex items-center gap-2.5 border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white focus-within:border-primary-400 transition-all">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.checkIn}
                onChange={e => setFilters(p => ({ ...p, checkIn: e.target.value }))}
                className="text-sm outline-none text-gray-700 bg-transparent"
                min={today}
              />
              <span className="text-gray-300">→</span>
              <input
                type="date"
                value={filters.checkOut}
                onChange={e => setFilters(p => ({ ...p, checkOut: e.target.value }))}
                className="text-sm outline-none text-gray-700 bg-transparent"
                min={filters.checkIn || today}
              />
            </div>

            {/* Guests */}
            <div className="flex items-center gap-2.5 border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white">
              <Users className="w-4 h-4 text-gray-400" />
              <select
                value={filters.guests}
                onChange={e => setFilters(p => ({ ...p, guests: e.target.value }))}
                className="text-sm outline-none bg-transparent text-gray-700 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n} voyageur{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-primary gap-2 whitespace-nowrap">
              <Search className="w-4 h-4" /> Rechercher
            </button>
          </div>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Type filter pills ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          {PROPERTY_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setFilters(p => ({ ...p, type: t.value }))}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                filters.type === t.value
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-200 flex-shrink-0 mx-1" />

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={e => setFilters(p => ({ ...p, sort: e.target.value }))}
            className="flex-shrink-0 text-sm border border-gray-200 rounded-full px-4 py-2 outline-none bg-white text-gray-700 cursor-pointer hover:border-gray-300 transition-colors"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary-50 text-primary-700 border-primary-300'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Advanced filter panel ── */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6 animate-fade-in-down">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Prix minimum (XOF / nuit)</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))}
                  className="input"
                  placeholder="ex : 15 000"
                  min="0"
                  step="1000"
                />
              </div>
              <div>
                <label className="label">Prix maximum (XOF / nuit)</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
                  className="input"
                  placeholder="ex : 250 000"
                  min="0"
                  step="1000"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={applySearch} className="btn-primary">Appliquer les filtres</button>
              <button onClick={resetAll} className="btn-secondary">Réinitialiser</button>
            </div>
          </div>
        )}

        {/* ── Header row ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-display font-bold text-gray-900">
              {filters.city ? `Logements à ${filters.city}` : 'Tous les logements'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isLoading
                ? 'Chargement…'
                : `${meta.total} logement${meta.total !== 1 ? 's' : ''} trouvé${meta.total !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Active filter chips */}
          <div className="hidden md:flex items-center gap-2">
            {filters.minPrice && (
              <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                Min {parseInt(filters.minPrice).toLocaleString('fr-SN')} XOF
                <button onClick={() => clearFilter('minPrice')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.maxPrice && (
              <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                Max {parseInt(filters.maxPrice).toLocaleString('fr-SN')} XOF
                <button onClick={() => clearFilter('maxPrice')}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        </div>

        {/* ── Results ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-card">
                <div className="aspect-[4/3] skeleton" />
                <div className="p-4 space-y-3 bg-white">
                  <div className="h-3 skeleton rounded w-1/3" />
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-3 skeleton rounded w-1/2" />
                  <div className="flex justify-between mt-4">
                    <div className="h-5 skeleton rounded w-24" />
                    <div className="h-5 skeleton rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-display font-bold text-gray-900 mb-3">Aucun résultat</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Aucun logement ne correspond à vos critères. Essayez une autre destination ou élargissez vos filtres.
            </p>
            <button
              onClick={() => navigate('/recherche')}
              className="btn-primary"
            >
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {properties.map((property: Parameters<typeof PropertyCard>[0]['property']) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button
                  onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                  disabled={filters.page <= 1}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Précédent
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(meta.pages, 7) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setFilters(p => ({ ...p, page }))}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                          filters.page === page
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                  disabled={filters.page >= meta.pages}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Suivant <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
