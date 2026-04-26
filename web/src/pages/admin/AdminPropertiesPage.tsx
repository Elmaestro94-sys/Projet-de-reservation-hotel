import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, X, Eye, ChevronRight, ChevronLeft } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-700',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
};

export default function AdminPropertiesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-properties', page, status, search],
    queryFn: () => adminApi.properties({ page, limit: 20, status: status || undefined, search: search || undefined }).then(r => r.data),
  });

  const properties = data?.data || [];
  const meta = data?.meta || { total: 0, pages: 1 };

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveProperty(id),
    onSuccess: () => { toast.success('Annonce approuvée !'); queryClient.invalidateQueries({ queryKey: ['admin-properties'] }); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectProperty(id, reason),
    onSuccess: () => { toast.success('Annonce refusée'); setRejectId(null); queryClient.invalidateQueries({ queryKey: ['admin-properties'] }); },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Annonces</h1>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="flex-1 text-sm outline-none" placeholder="Titre, ville..." />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
          <option value="">Tous les statuts</option>
          <option value="PENDING_REVIEW">En attente</option>
          <option value="PUBLISHED">Publiées</option>
          <option value="DRAFT">Brouillons</option>
          <option value="REJECTED">Refusées</option>
          <option value="SUSPENDED">Suspendues</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? <div className="p-8 text-center"><p className="text-gray-400">Chargement...</p></div> : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs text-gray-500 font-medium uppercase">
                <th className="px-4 py-3">Annonce</th>
                <th className="px-4 py-3">Propriétaire</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {properties.map((property: AdminProperty) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {property.photos?.[0]?.url && (
                        <img src={property.photos[0].url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{property.title}</p>
                        <p className="text-xs text-gray-400">{property.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{property.owner?.firstName} {property.owner?.lastName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{property.city}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{property.pricePerNight?.toLocaleString('fr-SN')} XOF</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${STATUS_STYLES[property.status] || 'bg-gray-100 text-gray-600'}`}>{property.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {property.status === 'PUBLISHED' && (
                        <Link to={`/logements/${property.slug}`} className="text-gray-400 hover:text-gray-600" title="Voir">
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                      {property.status === 'PENDING_REVIEW' && (
                        <>
                          <button onClick={() => approveMutation.mutate(property.id)} disabled={approveMutation.isPending} className="text-green-600 hover:text-green-700" title="Approuver">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => setRejectId(property.id)} className="text-red-500 hover:text-red-700" title="Refuser">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">{meta.total} annonce{meta.total !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-gray-600">Page {page} / {meta.pages}</span>
            <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page >= meta.pages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {rejectId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold text-gray-900 mb-4">Refuser l'annonce</h3>
            <div className="mb-4">
              <label className="label">Raison du refus</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="input" rows={3} placeholder="Indiquez pourquoi l'annonce est refusée..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => rejectMutation.mutate({ id: rejectId, reason: rejectReason })} disabled={!rejectReason} className="bg-red-600 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 text-sm">Confirmer le refus</button>
              <button onClick={() => setRejectId(null)} className="btn-secondary text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AdminProperty {
  id: string;
  slug: string;
  title: string;
  type: string;
  city: string;
  status: string;
  pricePerNight: number;
  owner?: { firstName: string; lastName: string };
  photos?: { url: string }[];
}
