import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Home, ArrowRight, User, Building2 } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', role: 'USER',
  });
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
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=90"
          alt="Sénégal"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900/80 via-dark-900/55 to-primary-800/30" />
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
              Rejoignez notre<br />communauté
            </h2>
            <p className="text-gray-300 text-base leading-relaxed max-w-xs">
              Voyageurs et propriétaires confondus — créez votre compte en moins de 2 minutes.
            </p>
            <div className="mt-8 space-y-3">
              {[
                'Accès à 280+ logements vérifiés',
                'Paiements sécurisés (Stripe & PayTech)',
                'Support dédié 7j/7',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="w-5 h-5 bg-primary-500/30 rounded-full flex items-center justify-center flex-shrink-0 text-primary-300 text-xs">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50 overflow-y-auto">
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
            <h1 className="font-display text-3xl font-bold text-gray-900">Créer un compte</h1>
            <p className="text-gray-500 mt-2">Gratuit · Sans engagement · En 2 minutes</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8">
            {/* Account type selector */}
            <div className="mb-6">
              <label className="label">Type de compte</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'USER', label: 'Voyageur', desc: 'Je cherche un hébergement', Icon: User },
                  { value: 'OWNER', label: 'Propriétaire', desc: 'Je propose mon logement', Icon: Building2 },
                ].map(({ value, label, desc, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, role: value }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      form.role === value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${form.role === value ? 'text-primary-600' : 'text-gray-400'}`} />
                    <p className={`font-semibold text-sm ${form.role === value ? 'text-primary-700' : 'text-gray-800'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Prénom</label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="input"
                    placeholder="Aminata"
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="input"
                    placeholder="Diallo"
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="vous@exemple.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="label">
                  Téléphone
                  <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="+221 77 000 00 00"
                  autoComplete="tel"
                />
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
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength */}
                {form.password && (
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          form.password.length >= level * 2
                            ? level <= 2 ? 'bg-red-400' : level === 3 ? 'bg-amber-400' : 'bg-emerald-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-base mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Création du compte…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Créer mon compte <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              En créant un compte, vous acceptez nos{' '}
              <a href="#" className="text-primary-600 hover:underline">CGU</a> et notre{' '}
              <a href="#" className="text-primary-600 hover:underline">politique de confidentialité</a>.
            </p>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-gray-400 bg-white">Déjà un compte ?</span>
              </div>
            </div>

            <Link
              to="/login"
              className="btn-secondary w-full text-center py-3 text-sm font-semibold"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
