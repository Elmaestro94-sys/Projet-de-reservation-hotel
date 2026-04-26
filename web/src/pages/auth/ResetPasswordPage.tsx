import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/services/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error('Lien invalide');
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      toast.success('Mot de passe réinitialisé !');
      navigate('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Lien invalide ou expiré';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-xl">Séjour <span className="text-primary-600">Sénégal</span></span>
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Nouveau mot de passe</h2>
          <p className="text-gray-500 text-sm mb-6">Choisissez un mot de passe sécurisé.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="Minimum 8 caractères"
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
