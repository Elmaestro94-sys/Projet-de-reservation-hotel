import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, Trash2, EyeOff, MessageSquare, Star } from 'lucide-react';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

interface ReportedReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: { firstName: string; lastName: string; email: string };
  property: { title: string; slug: string };
}

interface ReportedMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: { firstName: string; lastName: string; email: string };
  receiver: { firstName: string; lastName: string; email: string };
}

export default function AdminModerationPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'reviews' | 'messages'>('reviews');

  const { data: reviewsData } = useQuery({
    queryKey: ['admin-reported-reviews'],
    queryFn: () => api.get('/admin/reported-reviews').then(r => r.data),
  });

  const { data: messagesData } = useQuery({
    queryKey: ['admin-reported-messages'],
    queryFn: () => api.get('/admin/reported-messages').then(r => r.data),
  });

  const unpublishReview = useMutation({
    mutationFn: (id: string) => api.post(`/admin/reviews/${id}/unpublish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reported-reviews'] });
      toast.success('Avis masqué');
    },
  });

  const deleteMessage = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/messages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reported-messages'] });
      toast.success('Message supprimé');
    },
  });

  const reviews: ReportedReview[] = reviewsData?.data || [];
  const messages: ReportedMessage[] = messagesData?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modération</h1>
          <p className="text-gray-500 text-sm mt-1">Contenus signalés par les utilisateurs</p>
        </div>
        <Flag className="w-8 h-8 text-red-500" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        <button
          onClick={() => setTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'reviews' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Star className="w-4 h-4" />
          Avis signalés
          {reviews.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {reviews.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('messages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'messages' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Messages signalés
          {messages.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun avis signalé</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{review.reviewer.firstName} {review.reviewer.lastName}</span>
                      <span className="text-gray-400 text-xs">{review.reviewer.email}</span>
                      <span className="text-yellow-500 text-sm">{'★'.repeat(review.rating)}</span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
                    <p className="text-gray-400 text-xs">Logement : {review.property.title} · {new Date(review.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => unpublishReview.mutate(review.id)}
                      disabled={unpublishReview.isPending}
                      className="btn-secondary text-sm flex items-center gap-1 text-orange-600 hover:bg-orange-50"
                    >
                      <EyeOff className="w-4 h-4" /> Masquer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'messages' && (
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun message signalé</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-medium text-gray-900">{msg.sender.firstName} {msg.sender.lastName}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-900">{msg.receiver.firstName} {msg.receiver.lastName}</span>
                      <span className="text-gray-400 text-xs">{new Date(msg.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3">{msg.content}</p>
                  </div>
                  <button
                    onClick={() => deleteMessage.mutate(msg.id)}
                    disabled={deleteMessage.isPending}
                    className="btn-secondary text-sm flex items-center gap-1 text-red-600 hover:bg-red-50 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
