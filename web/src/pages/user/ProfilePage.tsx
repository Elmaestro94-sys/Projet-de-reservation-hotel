import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Download, Trash2 } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    language: 'fr',
    currency: 'XOF',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const profileMutation = useMutation({
    mutationFn: () => authApi.updateProfile(profileForm),
    onSuccess: (res) => {
      setUser(res.data.data);
      toast.success('Profil mis à jour !');
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: () => toast.error('Erreur de mise à jour'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
    onSuccess: () => {
      toast.success('Mot de passe modifié !');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur');
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Les mots de passe ne correspondent pas');
    }
    passwordMutation.mutate();
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/v1/users/export', {
        headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mes-donnees-sejour-senegal.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur lors de l\'export');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Paramètres du compte</h1>

      {/* Profile form */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Informations personnelles</h2>
        <form onSubmit={e => { e.preventDefault(); profileMutation.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prénom</label>
              <input value={profileForm.firstName} onChange={e => setProfileForm(p => ({ ...p, firstName: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="label">Nom</label>
              <input value={profileForm.lastName} onChange={e => setProfileForm(p => ({ ...p, lastName: e.target.value }))} className="input" required />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email} className="input bg-gray-50 cursor-not-allowed" disabled />
            <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Langue</label>
              <select value={profileForm.language} onChange={e => setProfileForm(p => ({ ...p, language: e.target.value }))} className="input">
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="label">Devise</label>
              <select value={profileForm.currency} onChange={e => setProfileForm(p => ({ ...p, currency: e.target.value }))} className="input">
                <option value="XOF">XOF — Franc CFA</option>
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dollar</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={profileMutation.isPending} className="btn-primary">
            {profileMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Lock className="w-5 h-5" /> Mot de passe</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="label">Mot de passe actuel</label>
            <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} className="input" required />
          </div>
          <div>
            <label className="label">Nouveau mot de passe</label>
            <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} className="input" minLength={8} required />
          </div>
          <div>
            <label className="label">Confirmer le mot de passe</label>
            <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} className="input" required />
          </div>
          <button type="submit" disabled={passwordMutation.isPending} className="btn-primary">
            {passwordMutation.isPending ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>

      {/* Data & Privacy */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-4">Confidentialité & Données</h2>
        <div className="space-y-3">
          <button onClick={handleExportData} className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm text-gray-700">
            <Download className="w-5 h-5 text-gray-400" />
            <div className="text-left">
              <p className="font-medium">Exporter mes données</p>
              <p className="text-xs text-gray-400">Télécharger toutes vos données au format JSON</p>
            </div>
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl border border-red-200 hover:bg-red-50 transition-colors text-sm text-red-600">
            <Trash2 className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Supprimer mon compte</p>
              <p className="text-xs text-red-400">Cette action est irréversible</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
