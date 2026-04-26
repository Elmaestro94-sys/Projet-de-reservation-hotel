import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, MapPin, Calendar, Users, X } from 'lucide-react';
import { propertyApi } from '@/services/api';
import PropertyCard from '@/components/property/PropertyCard';

const PROPERTY_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'HOUSE', label: 'Maison' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'BUNGALOW', label: 'Bungalow' },
  { value: 'GUESTHOUSE', label: 'Guesthouse' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Plus récents' },
  { value: 'priceAsc', label: 'Prix croissant' },
  { value: 'priceDesc', label: 'Prix décroissant' },
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    setSearchParams(params);
  };

  const clearFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: '' }));
  };

  const activeFilterCount = [filters.type, filters.minPrice, filters.maxPrice].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
            <MapPin className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Destination"
              value={filters.city}
              onChange={e => setFilters(p => ({ ...p, city: e.target.value }))}
              className="flex-1 text-sm outline-none"
            />
            {filters.city && <button type="button" onClick={() => clearFilter('city')}><X className="w-4 h-4 text-gray-400" /></button>}
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={filters.checkIn} onChange={e => setFilters(p => ({ ...p, checkIn: e.target.value }))} className="text-sm outline-none text-gray-700" />
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={filters.checkOut} onChange={e => setFilters(p => ({ ...p, checkOut: e.target.value }))} className="text-sm outline-none text-gray-700" />
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
            <Users className="w-4 h-4 text-gray-400" />
            <select value={filters.guests} onChange={e => setFilters(p => ({ ...p, guests: e.target.value }))} className="text-sm outline-none bg-transparent text-gray-700">
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} voyageur{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Search className="w-4 h-4" /> Chercher
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {filters.city ? `Logements à ${filters.city}` : 'Tous les logements'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading ? 'Chargement...' : `${meta.total} logement${meta.total !== 1 ? 's' : ''} trouvé${meta.total !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filters.sort}
            onChange={e => setFilters(p => ({ ...p, sort: e.target.value }))}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none bg-white"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border transition-colors ${
              showFilters || activeFilterCount > 0 ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Type de logement</label>
              <select
                value={filters.type}
                onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
                className="input"
              >
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Prix min (XOF/nuit)</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))}
                className="input"
                placeholder="ex: 20000"
                min="0"
              />
            </div>
            <div>
              <label className="label">Prix max (XOF/nuit)</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
                className="input"
                placeholder="ex: 200000"
                min="0"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSearch} className="btn-primary">Appliquer</button>
            <button
              onClick={() => setFilters(p => ({ ...p, type: '', minPrice: '', maxPrice: '' }))}
              className="btn-secondary"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun logement trouvé</h3>
          <p className="text-gray-500">Essayez d'autres critères de recherche ou une autre destination.</p>
          <button onClick={() => navigate('/recherche')} className="btn-primary mt-6">
            Réinitialiser la recherche
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property: Parameters<typeof PropertyCard>[0]['property']) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          {/* Pagination */}
          {meta.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                disabled={filters.page <= 1}
                className="btn-secondary py-2 px-4 disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-500">Page {filters.page} / {meta.pages}</span>
              <button
                onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                disabled={filters.page >= meta.pages}
                className="btn-secondary py-2 px-4 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
