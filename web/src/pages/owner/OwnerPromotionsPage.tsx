import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

interface Promotion {
  id: string;
  code: string | null;
  discount: number;
  type: string;
  startDate: string;
  endDate: string;
  minNights: number | null;
  maxUsage: number | null;
  usageCount: number;
  isActive: boolean;
  property: { id: string; title: string };
}

interface Property {
  id: string;
  title: string;
}

const emptyForm = {
  propertyId: '',
  code: '',
  discount: 10,
  type: 'PERCENTAGE',
  startDate: '',
  endDate: '',
  minNights: '',
  maxUsage: '',
};

export default function OwnerPromotionsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: promotions = [], isLoading } = useQuery<Promotion[]>({
    queryKey: ['owner-promotions'],
    queryFn: () => api.get('/promotions').then(r => r.data.data),
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['owner-properties-list'],
    queryFn: () => api.get('/properties/my').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/promotions', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-promotions'] });
      setShowForm(false);
      setForm(emptyForm);
      toast.success('Promotion créée');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur';
      toast.error(msg);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/promotions/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-promotions'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/promotions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-promotions'] });
      toast.success('Promotion supprimée');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      discount: parseFloat(String(form.discount)),
      minNights: form.minNights ? parseInt(form.minNights) : undefined,
      maxUsage: form.maxUsage ? parseInt(form.maxUsage) : undefined,
      code: form.code || undefined,
    });
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();
  const isActive = (p: Promotion) => p.isActive && !isExpired(p.endDate) && new Date(p.startDate) <= new Date();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-500 text-sm mt-1">Créez des codes promo et réductions pour vos logements</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle promotion
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Créer une promotion</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Annonce *</label>
              <select
                value={form.propertyId}
                onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                required
                className="input"
              >
                <option value="">Sélectionnez un logement</option>
                {properties.map((p: Property) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Code promo (optionnel)</label>
              <input
                type="text"
                placeholder="ETE2025"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Réduction *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.discount}
                  onChange={e => setForm(f => ({ ...f, discount: parseFloat(e.target.value) }))}
                  required
                  className="input"
                />
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="input w-40"
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="FIXED">XOF fixe</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Nuits minimum</label>
              <input
                type="number"
                min={1}
                placeholder="Ex: 3"
                value={form.minNights}
                onChange={e => setForm(f => ({ ...f, minNights: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Date de début *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Date de fin *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Nombre max d'utilisations</label>
              <input
                type="number"
                min={1}
                placeholder="Illimité si vide"
                value={form.maxUsage}
                onChange={e => setForm(f => ({ ...f, maxUsage: e.target.value }))}
                className="input"
              />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? 'Création...' : 'Créer la promotion'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune promotion. Créez-en une pour attirer plus de voyageurs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map(promo => (
            <div key={promo.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {promo.code && (
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">
                      {promo.code}
                    </span>
                  )}
                  <span className="text-primary-600 font-semibold">
                    -{promo.discount}{promo.type === 'PERCENTAGE' ? '%' : ' XOF'}
                  </span>
                  <span className={`badge text-xs ${isActive(promo) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {isExpired(promo.endDate) ? 'Expirée' : isActive(promo) ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5 truncate">
                  {promo.property.title} · {new Date(promo.startDate).toLocaleDateString('fr-FR')} – {new Date(promo.endDate).toLocaleDateString('fr-FR')}
                  {promo.minNights && ` · min ${promo.minNights} nuits`}
                  {' · '}{promo.usageCount}{promo.maxUsage ? `/${promo.maxUsage}` : ''} utilisation{promo.usageCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleMutation.mutate({ id: promo.id, isActive: !promo.isActive })}
                  className="text-gray-400 hover:text-primary-600"
                  title={promo.isActive ? 'Désactiver' : 'Activer'}
                >
                  {promo.isActive ? <ToggleRight className="w-6 h-6 text-primary-500" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(promo.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
