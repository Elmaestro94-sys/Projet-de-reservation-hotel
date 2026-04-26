import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, ArrowLeft, Upload, X } from 'lucide-react';
import { propertyApi } from '@/services/api';
import toast from 'react-hot-toast';

const PROPERTY_TYPES = ['VILLA', 'APARTMENT', 'HOUSE', 'STUDIO', 'BUNGALOW', 'ROOM', 'GUESTHOUSE', 'HOTEL'];
const AMENITY_OPTIONS = ['wifi', 'piscine', 'climatisation', 'cuisine', 'parking', 'terrasse', 'barbecue', 'lave-linge', 'sèche-linge', 'télévision', 'ascenseur', 'sécurité', 'jardin'];
const CANCELLATION_POLICIES = [
  { value: 'FLEXIBLE', label: 'Flexible — Remboursement 24h avant' },
  { value: 'MODERATE', label: 'Modérée — Remboursement 5j avant' },
  { value: 'STRICT', label: 'Stricte — Remboursement 7j avant' },
];

interface PropertyFormData {
  title: string;
  description: string;
  type: string;
  address: string;
  city: string;
  district: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  instantBooking: boolean;
  cancellationPolicy: string;
  rules: string[];
  amenities: string[];
}

const DEFAULT_FORM: PropertyFormData = {
  title: '', description: '', type: 'APARTMENT', address: '', city: '', district: '',
  maxGuests: 2, bedrooms: 1, bathrooms: 1, pricePerNight: 25000,
  cleaningFee: 0, serviceFee: 0, minNights: 1,
  checkInTime: '14:00', checkOutTime: '11:00',
  instantBooking: false, cancellationPolicy: 'FLEXIBLE',
  rules: [], amenities: [],
};

export default function PropertyFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState<PropertyFormData>(DEFAULT_FORM);
  const [newRule, setNewRule] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<{ id: string; url: string; isCover: boolean }[]>([]);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

  const { isLoading: loadingProperty } = useQuery({
    queryKey: ['property-edit', id],
    queryFn: () => propertyApi.get(id!).then(r => {
      const p = r.data.data;
      setForm({
        title: p.title, description: p.description, type: p.type,
        address: p.address, city: p.city, district: p.district || '',
        maxGuests: p.maxGuests, bedrooms: p.bedrooms, bathrooms: p.bathrooms,
        pricePerNight: p.pricePerNight, cleaningFee: p.cleaningFee, serviceFee: p.serviceFee,
        minNights: p.minNights, checkInTime: p.checkInTime, checkOutTime: p.checkOutTime,
        instantBooking: p.instantBooking, cancellationPolicy: p.cancellationPolicy,
        rules: p.rules, amenities: p.amenities,
      });
      setUploadedPhotos(p.photos || []);
      return p;
    }),
    enabled: isEdit,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return propertyApi.update(id!, form);
      } else {
        const { data } = await propertyApi.create(form);
        setCreatedPropertyId(data.data.id);
        return data;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Annonce mise à jour !' : 'Annonce créée ! Ajoutez des photos puis soumettez-la.');
      if (isEdit) navigate('/proprietaire/annonces');
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur de sauvegarde');
    },
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: async () => {
      const propId = createdPropertyId || id;
      if (!propId) return;
      for (let i = 0; i < photos.length; i++) {
        const { data } = await propertyApi.uploadPhoto(propId, photos[i], i === 0 && uploadedPhotos.length === 0);
        setUploadedPhotos(prev => [...prev, data.data]);
      }
      setPhotos([]);
      toast.success('Photos uploadées !');
    },
    onError: () => toast.error('Erreur d\'upload'),
  });

  const toggleAmenity = (amenity: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    setForm(prev => ({ ...prev, rules: [...prev.rules, newRule.trim()] }));
    setNewRule('');
  };

  if (loadingProperty) return <div className="p-8 animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/3 mb-6" /></div>;

  const propertyId = createdPropertyId || id;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/proprietaire/annonces')} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Remplissez tous les champs pour créer une annonce complète</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic info */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Informations générales</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Titre de l'annonce *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="Ex: Villa avec piscine aux Almadies" required />
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input min-h-[120px]" placeholder="Décrivez votre logement en détail..." required />
            </div>
            <div>
              <label className="label">Type de logement *</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="input">
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Localisation</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Adresse complète *</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="input" placeholder="Rue, numéro..." required />
            </div>
            <div>
              <label className="label">Ville *</label>
              <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className="input" placeholder="Dakar" list="cities" required />
              <datalist id="cities">
                {['Dakar', 'Saly', 'Saint-Louis', 'Thiès', 'Somone', 'Cap Skirring', 'Ziguinchor', 'Mbour'].map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Quartier</label>
              <input value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} className="input" placeholder="Almadies, Plateau..." />
            </div>
          </div>
        </div>

        {/* Capacity & Pricing */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Capacité & Prix</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Voyageurs max *</label>
              <input type="number" min="1" max="20" value={form.maxGuests} onChange={e => setForm(p => ({ ...p, maxGuests: parseInt(e.target.value) }))} className="input" />
            </div>
            <div>
              <label className="label">Chambres *</label>
              <input type="number" min="0" max="20" value={form.bedrooms} onChange={e => setForm(p => ({ ...p, bedrooms: parseInt(e.target.value) }))} className="input" />
            </div>
            <div>
              <label className="label">Salles de bain *</label>
              <input type="number" min="1" max="10" value={form.bathrooms} onChange={e => setForm(p => ({ ...p, bathrooms: parseInt(e.target.value) }))} className="input" />
            </div>
            <div>
              <label className="label">Prix / nuit (XOF) *</label>
              <input type="number" min="1000" value={form.pricePerNight} onChange={e => setForm(p => ({ ...p, pricePerNight: parseInt(e.target.value) }))} className="input" />
            </div>
            <div>
              <label className="label">Frais de ménage (XOF)</label>
              <input type="number" min="0" value={form.cleaningFee} onChange={e => setForm(p => ({ ...p, cleaningFee: parseInt(e.target.value) }))} className="input" />
            </div>
            <div>
              <label className="label">Nuits minimum</label>
              <input type="number" min="1" value={form.minNights} onChange={e => setForm(p => ({ ...p, minNights: parseInt(e.target.value) }))} className="input" />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Paramètres</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Check-in</label>
              <input type="time" value={form.checkInTime} onChange={e => setForm(p => ({ ...p, checkInTime: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Check-out</label>
              <input type="time" value={form.checkOutTime} onChange={e => setForm(p => ({ ...p, checkOutTime: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Politique d'annulation</label>
            <select value={form.cancellationPolicy} onChange={e => setForm(p => ({ ...p, cancellationPolicy: e.target.value }))} className="input mb-4">
              {CANCELLATION_POLICIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.instantBooking} onChange={e => setForm(p => ({ ...p, instantBooking: e.target.checked }))} className="w-4 h-4 text-primary-600 rounded" />
            <div>
              <span className="font-medium text-gray-900">Réservation instantanée</span>
              <p className="text-xs text-gray-500">Les voyageurs peuvent réserver sans approbation préalable</p>
            </div>
          </label>
        </div>

        {/* Amenities */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Équipements</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map(amenity => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
                  form.amenities.includes(amenity)
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-primary-300'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Règles du logement</h2>
          <div className="flex gap-2 mb-3">
            <input value={newRule} onChange={e => setNewRule(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRule())} className="input flex-1" placeholder="Ex: Non-fumeur" />
            <button type="button" onClick={addRule} className="btn-primary px-4">Ajouter</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.rules.map((rule, i) => (
              <span key={i} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                {rule}
                <button type="button" onClick={() => setForm(p => ({ ...p, rules: p.rules.filter((_, ri) => ri !== i) }))} className="text-gray-400 hover:text-red-500 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Photos */}
        {(isEdit || createdPropertyId) && (
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">Photos (min. 3)</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {uploadedPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  {photo.isCover && <span className="absolute top-2 left-2 badge bg-primary-600 text-white">Principale</span>}
                </div>
              ))}
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-2">Glissez vos photos ou cliquez pour les sélectionner</p>
              <input type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files || []))} className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload" className="btn-secondary text-sm cursor-pointer inline-block">Choisir des photos</label>
            </div>
            {photos.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">{photos.length} photo(s) sélectionnée(s)</p>
                <button onClick={() => uploadPhotosMutation.mutate()} disabled={uploadPhotosMutation.isPending} className="btn-primary text-sm">
                  {uploadPhotosMutation.isPending ? 'Upload...' : 'Uploader les photos'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Sauvegarde...' : isEdit ? 'Sauvegarder les modifications' : 'Créer l\'annonce'}
          </button>
          <button onClick={() => navigate('/proprietaire/annonces')} className="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  );
}
