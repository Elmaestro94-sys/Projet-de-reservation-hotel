import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Home, ArrowRight } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success(`Bienvenue, ${data.data.user.firstName} !`);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Connexion échouée';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'owner' | 'user') => {
    const creds = {
      admin: { email: 'admin@sejoursenegal.sn', password: 'Admin@123456' },
      owner: { email: 'proprietaire@sejoursenegal.sn', password: 'Owner@123456' },
      user: { email: 'utilisateur@sejoursenegal.sn', password: 'User@123456' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=1200&q=90"
          alt="Sénégal"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900/80 via-dark-900/50 to-primary-900/40" />
        <div className="relative flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg">
              Séjour <span className="text-primary-400">Sénégal</span>
            </span>
          </Link>
          <div>
            <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
              Votre prochain séjour<br />commence ici
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed max-w-sm">
              Des centaines de logements premium vous attendent à Dakar, Saly, Saint-Louis et partout au Sénégal.
            </p>
            <div className="flex items-center gap-6 mt-8 text-sm text-white/60">
              <span>280+ logements</span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span>15 villes</span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span>4.9★ moyen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-gray-900 text-lg">
                Séjour <span className="text-primary-600">Sénégal</span>
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-gray-900">Connexion</h1>
            <p className="text-gray-500 mt-2">Accédez à votre espace personnel</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Adresse email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="vous@exemple.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="label mb-0">Mot de passe</label>
                  <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Connexion…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Se connecter <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-gray-400 bg-white">Pas encore de compte ?</span>
              </div>
            </div>

            <Link
              to="/register"
              className="btn-secondary w-full text-center py-3 text-sm font-semibold"
            >
              Créer un compte gratuitement
            </Link>
          </div>

          {/* Demo credentials */}
          <div className="mt-5 bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-blue-800 mb-3 uppercase tracking-wide">
              Comptes de démonstration
            </p>
            <div className="space-y-2">
              {[
                { role: 'admin' as const, label: 'Administrateur', color: 'text-purple-700 bg-purple-50 border-purple-200' },
                { role: 'owner' as const, label: 'Propriétaire', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { role: 'user' as const, label: 'Voyageur', color: 'text-blue-700 bg-blue-50 border-blue-200' },
              ].map(({ role, label, color }) => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all hover:shadow-sm ${color}`}
                >
                  <span className="font-bold">{label}</span>
                  <span className="text-[10px] ml-2 opacity-70">cliquez pour remplir</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
