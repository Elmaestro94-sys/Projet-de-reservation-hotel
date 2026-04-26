import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, CheckCircle, Shield, ChevronRight, ChevronLeft } from 'lucide-react';
import { adminApi } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banUserId, setBanUserId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, role],
    queryFn: () => adminApi.users({ page, limit: 20, search: search || undefined, role: role || undefined }).then(r => r.data),
  });

  const users = data?.data || [];
  const meta = data?.meta || { total: 0, pages: 1 };

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.banUser(id, reason),
    onSuccess: () => {
      toast.success('Utilisateur banni');
      setBanUserId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => {
      toast.success('Utilisateur débanni');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Utilisateurs</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="flex-1 text-sm outline-none" placeholder="Email, nom..." />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
          <option value="">Tous les rôles</option>
          <option value="USER">Utilisateur</option>
          <option value="OWNER">Propriétaire</option>
          <option value="SUPER_ADMIN">Admin</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><p className="text-gray-400">Chargement...</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs text-gray-500 font-medium uppercase">
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Inscription</th>
                <th className="px-4 py-3">Activité</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user: AdminUser) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-700 text-xs font-bold">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : user.role === 'OWNER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {user.role === 'SUPER_ADMIN' && <Shield className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {format(new Date(user.createdAt), 'd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div>{user._count?.properties || 0} annonces</div>
                    <div>{user._count?.bookings || 0} réservations</div>
                  </td>
                  <td className="px-4 py-3">
                    {user.isBanned ? (
                      <span className="badge bg-red-100 text-red-700">Banni</span>
                    ) : user.isVerified ? (
                      <span className="badge bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Vérifié</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-600">Actif</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'SUPER_ADMIN' && (
                      user.isBanned ? (
                        <button onClick={() => unbanMutation.mutate(user.id)} className="text-xs text-green-600 hover:underline font-medium">Débannir</button>
                      ) : (
                        <button onClick={() => setBanUserId(user.id)} className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                          <Ban className="w-3.5 h-3.5" /> Bannir
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">{meta.total} utilisateur{meta.total !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">Page {page} / {meta.pages}</span>
            <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page >= meta.pages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Ban modal */}
      {banUserId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold text-gray-900 mb-4">Bannir l'utilisateur</h3>
            <div className="mb-4">
              <label className="label">Raison du bannissement</label>
              <textarea value={banReason} onChange={e => setBanReason(e.target.value)} className="input" rows={3} placeholder="Motif..." required />
            </div>
            <div className="flex gap-3">
              <button onClick={() => banMutation.mutate({ id: banUserId, reason: banReason })} disabled={!banReason} className="bg-red-600 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 text-sm">Confirmer le bannissement</button>
              <button onClick={() => setBanUserId(null)} className="btn-secondary text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  isBanned: boolean;
  createdAt: string;
  _count?: { properties: number; bookings: number };
}
