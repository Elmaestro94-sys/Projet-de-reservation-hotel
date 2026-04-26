import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Home } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'USER' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Compte créé avec succès !');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Inscription échouée';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-xl">Séjour <span className="text-primary-600">Sénégal</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-500 mt-1">Rejoignez la communauté Séjour Sénégal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} className="input" placeholder="Aminata" required />
              </div>
              <div>
                <label className="label">Nom</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} className="input" placeholder="Diallo" required />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="vous@exemple.com" required />
            </div>

            <div>
              <label className="label">Téléphone (optionnel)</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="+221 77 000 00 00" />
            </div>

            <div>
              <label className="label">Type de compte</label>
              <select name="role" value={form.role} onChange={handleChange} className="input">
                <option value="USER">Voyageur — Je cherche un hébergement</option>
                <option value="OWNER">Propriétaire — Je propose un hébergement</option>
              </select>
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
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
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            En créant un compte, vous acceptez nos{' '}
            <a href="#" className="text-primary-600 hover:underline">CGU</a>{' '}
            et notre{' '}
            <a href="#" className="text-primary-600 hover:underline">politique de confidentialité</a>.
          </p>

          <p className="text-center text-sm text-gray-500 mt-4">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
