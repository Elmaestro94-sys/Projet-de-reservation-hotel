import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors, Radius, Shadow } from '@/src/constants/colors';
import { messageApi } from '@/src/services/api';
import { useAuthStore } from '@/src/store/auth.store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MessagesScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messageApi.conversations().then(r => r.data.data || []),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.authPrompt}>
          <Text style={styles.authIcon}>💬</Text>
          <Text style={styles.authTitle}>Vos messages</Text>
          <Text style={styles.authText}>Connectez-vous pour accéder à vos conversations</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.pageTitle}>Messages</Text>

      {isLoading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: any }) => {
            const other = item.participants?.find((p: any) => p.id !== user?.id);
            const lastMsg = item.lastMessage;
            const unread = item.unreadCount > 0;
            return (
              <TouchableOpacity
                style={styles.convoCard}
                onPress={() => router.push(`/conversation/${other?.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.avatar}>
                  {other?.avatar
                    ? <Image source={{ uri: other.avatar }} style={styles.avatarImg} />
                    : <Text style={styles.avatarText}>{other?.firstName?.[0]}{other?.lastName?.[0]}</Text>
                  }
                  {unread && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.convoBody}>
                  <View style={styles.convoTop}>
                    <Text style={[styles.convoName, unread && styles.convoNameBold]}>
                      {other?.firstName} {other?.lastName}
                    </Text>
                    {lastMsg && (
                      <Text style={styles.convoTime}>
                        {format(new Date(lastMsg.createdAt), 'dd MMM', { locale: fr })}
                      </Text>
                    )}
                  </View>
                  {lastMsg && (
                    <Text style={[styles.convoPreview, unread && styles.convoPreviewBold]} numberOfLines={1}>
                      {lastMsg.senderId === user?.id ? 'Vous : ' : ''}{lastMsg.content}
                    </Text>
                  )}
                  {item.property && (
                    <Text style={styles.convoProperty} numberOfLines={1}>🏠 {item.property.title}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>Aucune conversation</Text>
              <Text style={styles.emptyText}>Vos échanges avec les propriétaires apparaîtront ici</Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/explore')}>
                <Text style={styles.exploreBtnText}>Explorer les logements</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.gray50 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.gray900, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  loader:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:      { paddingHorizontal: 16, paddingBottom: 16 },

  convoCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 14, marginBottom: 10, ...Shadow.sm },
  avatar:      { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12, position: 'relative' },
  avatarImg:   { width: 50, height: 50, borderRadius: 25 },
  avatarText:  { color: Colors.white, fontWeight: '700', fontSize: 16 },
  unreadDot:   { position: 'absolute', top: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.white },
  convoBody:   { flex: 1 },
  convoTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  convoName:   { fontSize: 14, fontWeight: '600', color: Colors.gray700 },
  convoNameBold:{ fontWeight: '800', color: Colors.gray900 },
  convoTime:   { fontSize: 11, color: Colors.gray400 },
  convoPreview:{ fontSize: 13, color: Colors.gray500 },
  convoPreviewBold: { color: Colors.gray700, fontWeight: '600' },
  convoProperty:{ fontSize: 11, color: Colors.primary, marginTop: 3 },

  authPrompt:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  authIcon:     { fontSize: 64, marginBottom: 16 },
  authTitle:    { fontSize: 22, fontWeight: '700', color: Colors.gray900, marginBottom: 8 },
  authText:     { fontSize: 15, color: Colors.gray500, textAlign: 'center', marginBottom: 24 },
  loginBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 32, paddingVertical: 14 },
  loginBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },

  empty:        { alignItems: 'center', paddingTop: 80 },
  emptyIcon:    { fontSize: 56, marginBottom: 16 },
  emptyTitle:   { fontSize: 20, fontWeight: '700', color: Colors.gray900, marginBottom: 8 },
  emptyText:    { fontSize: 14, color: Colors.gray500, textAlign: 'center', paddingHorizontal: 40, marginBottom: 24 },
  exploreBtn:   { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 24, paddingVertical: 12 },
  exploreBtnText:{ color: Colors.white, fontWeight: '700' },
});
