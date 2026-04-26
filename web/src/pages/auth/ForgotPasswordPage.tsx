import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { authApi } from '@/services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Erreur. Réessayez dans quelques instants.');
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
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email envoyé</h2>
              <p className="text-gray-500 text-sm">Si votre email existe, vous recevrez un lien de réinitialisation dans quelques instants.</p>
              <Link to="/login" className="btn-primary inline-block mt-6">Retour à la connexion</Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Mot de passe oublié</h2>
                <p className="text-gray-500 text-sm mt-1">Entrez votre email pour recevoir un lien de réinitialisation.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="vous@exemple.com" required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
              </form>
              <Link to="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mt-4 justify-center">
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
