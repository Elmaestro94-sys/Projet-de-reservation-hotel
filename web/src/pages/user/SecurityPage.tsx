import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldCheck, ShieldOff, QrCode } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';

import toast from 'react-hot-toast';

export default function SecurityPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [step, setStep] = useState<'idle' | 'setup' | 'disable'>('idle');

  const { data: meData, refetch: refetchMe } = useQuery({
    queryKey: ['me-security'],
    queryFn: () => authApi.me().then(r => r.data.data),
  });

  const twoFactorEnabled = meData?.twoFactorEnabled ?? user?.twoFactorEnabled ?? false;

  const setupMutation = useMutation({
    mutationFn: () => authApi.setup2FA(),
    onSuccess: (res) => {
      setQrCode(res.data.data.qrCode);
      setSecret(res.data.data.secret);
      setStep('setup');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur';
      toast.error(msg);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (token: string) => authApi.verify2FA(token),
    onSuccess: async () => {
      toast.success('2FA activé avec succès !');
      setStep('idle');
      setVerifyToken('');
      setQrCode('');
      setSecret('');
      await refetchMe();
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Code invalide';
      toast.error(msg);
    },
  });

  const disableMutation = useMutation({
    mutationFn: (token: string) => authApi.disable2FA(token),
    onSuccess: () => {
      toast.success('2FA désactivé');
      setStep('idle');
      setDisableToken('');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Code invalide';
      toast.error(msg);
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-7 h-7 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sécurité du compte</h1>
          <p className="text-gray-500 text-sm mt-0.5">Authentification à deux facteurs (2FA)</p>
        </div>
      </div>

      <div className="card p-6">
        {/* Current status */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-gray-50">
          {twoFactorEnabled ? (
            <>
              <ShieldCheck className="w-8 h-8 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-700">2FA activé</p>
                <p className="text-sm text-gray-500">Votre compte est protégé par un second facteur d'authentification.</p>
              </div>
            </>
          ) : (
            <>
              <ShieldOff className="w-8 h-8 text-gray-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-700">2FA désactivé</p>
                <p className="text-sm text-gray-500">Activez la 2FA pour renforcer la sécurité de votre compte.</p>
              </div>
            </>
          )}
        </div>

        {/* Setup flow */}
        {!twoFactorEnabled && step === 'idle' && (
          <button
            onClick={() => setupMutation.mutate()}
            disabled={setupMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            {setupMutation.isPending ? 'Génération...' : 'Activer la 2FA'}
          </button>
        )}

        {step === 'setup' && qrCode && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Scannez ce QR code</h3>
              <p className="text-sm text-gray-500 mb-3">
                Utilisez une application comme <strong>Google Authenticator</strong>, <strong>Authy</strong> ou <strong>Microsoft Authenticator</strong>.
              </p>
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48 border border-gray-200 rounded-xl" />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Ou entrez ce code manuellement :</p>
              <code className="block bg-gray-100 text-gray-800 font-mono text-sm px-3 py-2 rounded-lg break-all">{secret}</code>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Entrez le code de confirmation</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="000000"
                  value={verifyToken}
                  onChange={e => setVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input w-40 font-mono text-lg text-center tracking-widest"
                  maxLength={6}
                />
                <button
                  onClick={() => verifyMutation.mutate(verifyToken)}
                  disabled={verifyToken.length !== 6 || verifyMutation.isPending}
                  className="btn-primary"
                >
                  {verifyMutation.isPending ? 'Vérification...' : 'Confirmer'}
                </button>
              </div>
            </div>
            <button onClick={() => { setStep('idle'); setQrCode(''); setSecret(''); }} className="text-sm text-gray-500 hover:text-gray-700">
              Annuler
            </button>
          </div>
        )}

        {/* Disable flow */}
        {twoFactorEnabled && step === 'idle' && (
          <button
            onClick={() => setStep('disable')}
            className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <ShieldOff className="w-4 h-4" /> Désactiver la 2FA
          </button>
        )}

        {step === 'disable' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Entrez le code de votre application pour désactiver la 2FA :</p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="000000"
                value={disableToken}
                onChange={e => setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input w-40 font-mono text-lg text-center tracking-widest"
                maxLength={6}
              />
              <button
                onClick={() => disableMutation.mutate(disableToken)}
                disabled={disableToken.length !== 6 || disableMutation.isPending}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                {disableMutation.isPending ? 'Désactivation...' : 'Désactiver'}
              </button>
            </div>
            <button onClick={() => { setStep('idle'); setDisableToken(''); }} className="text-sm text-gray-500 hover:text-gray-700">
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
