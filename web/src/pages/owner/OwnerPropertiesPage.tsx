import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Eye, Trash2, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { propertyApi } from '@/services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; style: string }> = {
  DRAFT: { label: 'Brouillon', icon: <Clock className="w-4 h-4" />, style: 'bg-gray-100 text-gray-600' },
  PENDING_REVIEW: { label: 'En validation', icon: <Clock className="w-4 h-4" />, style: 'bg-yellow-100 text-yellow-700' },
  PUBLISHED: { label: 'Publiée', icon: <CheckCircle className="w-4 h-4" />, style: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: 'Suspendue', icon: <AlertCircle className="w-4 h-4" />, style: 'bg-orange-100 text-orange-700' },
  REJECTED: { label: 'Refusée', icon: <XCircle className="w-4 h-4" />, style: 'bg-red-100 text-red-700' },
};

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Appartement', HOUSE: 'Maison', VILLA: 'Villa',
  BUNGALOW: 'Bungalow', STUDIO: 'Studio', ROOM: 'Chambre',
  GUESTHOUSE: 'Guesthouse', HOTEL: 'Hôtel',
};

export default function OwnerPropertiesPage() {
  const queryClient = useQueryClient();

  const { data: properties, isLoading } = useQuery({
    queryKey: ['owner-properties'],
    queryFn: () => propertyApi.myProperties().then(r => r.data.data),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => propertyApi.submit(id),
    onSuccess: () => {
      toast.success('Annonce soumise pour validation !');
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur');
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes annonces</h1>
        <Link to="/proprietaire/annonces/nouvelle" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle annonce
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-200" />)}
        </div>
      ) : !properties || properties.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="font-bold text-gray-900 mb-2">Aucune annonce</h3>
          <p className="text-gray-500 text-sm mb-6">Créez votre première annonce et commencez à recevoir des réservations.</p>
          <Link to="/proprietaire/annonces/nouvelle" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Créer une annonce
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property: Property) => {
            const status = STATUS_CONFIG[property.status] || STATUS_CONFIG.DRAFT;
            return (
              <div key={property.id} className="card p-4 flex gap-4 items-center">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  {property.photos?.[0]?.url && (
                    <img src={property.photos[0].url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>
                      <p className="text-sm text-gray-500">{TYPE_LABELS[property.type] || property.type} · {property.city}</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{property.pricePerNight?.toLocaleString('fr-SN')} XOF/nuit</p>
                    </div>
                    <span className={`badge flex items-center gap-1 flex-shrink-0 ${status.style}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>

                  {property.status === 'REJECTED' && property.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                      <strong>Refus :</strong> {property.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {property.status === 'PUBLISHED' && (
                    <Link to={`/logements/${property.slug}`} className="btn-ghost p-2" title="Voir l'annonce">
                      <Eye className="w-4 h-4" />
                    </Link>
                  )}
                  <Link to={`/proprietaire/annonces/${property.id}/modifier`} className="btn-ghost p-2" title="Modifier">
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  {property.status === 'DRAFT' && (
                    <button
                      onClick={() => submitMutation.mutate(property.id)}
                      disabled={submitMutation.isPending}
                      className="btn-primary text-xs py-2 px-3"
                    >
                      Soumettre
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface Property {
  id: string;
  slug: string;
  title: string;
  type: string;
  city: string;
  status: string;
  pricePerNight: number;
  rejectionReason?: string;
  photos?: { url: string }[];
}
