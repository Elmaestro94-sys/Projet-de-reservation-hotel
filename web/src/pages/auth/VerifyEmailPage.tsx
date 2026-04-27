import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { authApi } from '@/services/api';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token manquant.');
      return;
    }
    authApi.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.data?.message || 'Email vérifié avec succès.');
      })
      .catch((e) => {
        setStatus('error');
        setMessage(e.response?.data?.error || 'Lien invalide ou expiré.');
      });
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Vérification en cours…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email vérifié !</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link to="/login" className="btn-primary">Se connecter</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Vérification échouée</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link to="/" className="btn-secondary">Retour à l'accueil</Link>
          </>
        )}
      </div>
    </div>
  );
}
