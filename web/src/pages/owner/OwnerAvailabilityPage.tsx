import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Lock, Unlock, Save } from 'lucide-react';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

interface Property {
  id: string;
  title: string;
}

interface AvailabilityEntry {
  date: string;
  isBlocked: boolean;
  price: number | null;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

export default function OwnerAvailabilityPage() {
  const qc = useQueryClient();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [propertyId, setPropertyId] = useState('');
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [customPrice, setCustomPrice] = useState('');
  const [mode, setMode] = useState<'block' | 'unblock'>('block');

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['owner-properties-list'],
    queryFn: () => api.get('/properties/my').then(r => r.data.data),
  });

  const { data: availability = [] } = useQuery<AvailabilityEntry[]>({
    queryKey: ['availability', propertyId, year, month],
    queryFn: () =>
      api.get(`/properties/${propertyId}/availability-calendar`, { params: { year, month: month + 1 } })
        .then(r => r.data.data)
        .catch(() => []),
    enabled: !!propertyId,
  });

  const saveMutation = useMutation({
    mutationFn: (data: object) =>
      api.put(`/properties/${propertyId}/availability`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability', propertyId] });
      setSelectedDates(new Set());
      toast.success('Disponibilités mises à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDates(new Set());
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDates(new Set());
  };

  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  const handleSave = () => {
    if (!propertyId) return toast.error('Sélectionnez un logement');
    if (selectedDates.size === 0) return toast.error('Sélectionnez au moins une date');
    saveMutation.mutate({
      dates: Array.from(selectedDates),
      isBlocked: mode === 'block',
      price: customPrice ? parseFloat(customPrice) : null,
    });
  };

  const blockedDates = new Set(availability.filter(a => a.isBlocked).map(a => a.date.split('T')[0]));
  const customPriceDates = new Map(
    availability.filter(a => a.price).map(a => [a.date.split('T')[0], a.price])
  );

  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendrier de disponibilité</h1>
        <p className="text-gray-500 text-sm mt-1">Bloquez des dates ou définissez des tarifs personnalisés</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="md:col-span-2 card p-4">
          {/* Property selector */}
          <select
            value={propertyId}
            onChange={e => { setPropertyId(e.target.value); setSelectedDates(new Set()); }}
            className="input mb-4"
          >
            <option value="">Sélectionnez un logement</option>
            {properties.map((p: Property) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Days header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const d = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isToday = dateStr === today.toISOString().split('T')[0];
              const isBlocked = blockedDates.has(dateStr);
              const isSelected = selectedDates.has(dateStr);
              const hasCustomPrice = customPriceDates.has(dateStr);
              const isPast = new Date(dateStr) < today;

              return (
                <button
                  key={d}
                  onClick={() => !isPast && propertyId && toggleDate(dateStr)}
                  disabled={isPast || !propertyId}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors
                    ${isPast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-primary-50'}
                    ${isSelected ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                    ${isBlocked && !isSelected ? 'bg-red-100 text-red-700' : ''}
                    ${isToday && !isSelected && !isBlocked ? 'border-2 border-primary-400 font-bold' : ''}
                    ${!isSelected && !isBlocked && !isPast ? 'text-gray-700' : ''}
                  `}
                >
                  <span>{d}</span>
                  {hasCustomPrice && !isSelected && (
                    <span className="text-[9px] text-blue-500 leading-none">€</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Bloqué</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-500 inline-block" /> Sélectionné</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-primary-400 inline-block" /> Aujourd'hui</span>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => setMode('block')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'block' ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Lock className="w-4 h-4" /> Bloquer les dates
              </button>
              <button
                onClick={() => setMode('unblock')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'unblock' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Unlock className="w-4 h-4" /> Débloquer les dates
              </button>
            </div>

            <div className="mb-4">
              <label className="label">Prix personnalisé (XOF)</label>
              <input
                type="number"
                placeholder="Tarif du logement si vide"
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                className="input"
                min={0}
              />
            </div>

            <div className="text-sm text-gray-500 mb-4">
              {selectedDates.size} date{selectedDates.size !== 1 ? 's' : ''} sélectionnée{selectedDates.size !== 1 ? 's' : ''}
            </div>

            <button
              onClick={handleSave}
              disabled={saveMutation.isPending || selectedDates.size === 0}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          {selectedDates.size > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Dates sélectionnées</h3>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {Array.from(selectedDates).sort().map(d => (
                  <div key={d} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{new Date(d).toLocaleDateString('fr-FR')}</span>
                    <button onClick={() => toggleDate(d)} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
