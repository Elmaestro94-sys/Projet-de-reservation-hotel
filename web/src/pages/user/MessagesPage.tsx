import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageSquare } from 'lucide-react';
import { messageApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messageApi.conversations().then(r => r.data.data),
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedConv],
    queryFn: () => messageApi.conversation(selectedConv!).then(r => r.data.data),
    enabled: !!selectedConv,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: () => messageApi.send({ receiverId: selectedConv, content: newMessage }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConv] });
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

      <div className="card h-[600px] flex overflow-hidden">
        {/* Conversation list */}
        <div className="w-72 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 text-sm">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(!conversations || conversations.length === 0) ? (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Aucune conversation</p>
              </div>
            ) : (
              conversations.map((conv: Conversation) => {
                const other = conv.senderId === user?.id ? conv.receiver : conv.sender;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(other?.id || null)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left ${selectedConv === other?.id ? 'bg-primary-50' : ''}`}
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 text-sm font-bold">{other?.firstName?.[0]}{other?.lastName?.[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{other?.firstName} {other?.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{conv.content}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message thread */}
        <div className="flex-1 flex flex-col">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Sélectionnez une conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages || []).map((msg: Message) => {
                  const isMe = msg.sender?.id === user?.id;
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {msg.content}
                        <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                          {format(new Date(msg.createdAt), 'HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-gray-100">
                <form
                  onSubmit={e => { e.preventDefault(); if (newMessage.trim()) sendMutation.mutate(); }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Votre message..."
                    className="flex-1 input py-2.5"
                  />
                  <button type="submit" disabled={!newMessage.trim() || sendMutation.isPending} className="btn-primary py-2.5 px-4">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface Conversation {
  id: string;
  senderId: string;
  content: string;
  sender?: { id: string; firstName: string; lastName: string };
  receiver?: { id: string; firstName: string; lastName: string };
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender?: { id: string; firstName: string };
}
