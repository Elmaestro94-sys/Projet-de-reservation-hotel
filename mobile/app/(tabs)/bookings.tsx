import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Colors, Radius, Shadow } from '@/src/constants/colors';
import { bookingApi } from '@/src/services/api';
import { useAuthStore } from '@/src/store/auth.store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_TABS = [
  { key: '', label: 'Tous' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'CONFIRMED', label: 'Confirmés' },
  { key: 'COMPLETED', label: 'Terminés' },
  { key: 'CANCELLED_BY_USER', label: 'Annulés' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:            { label: 'En attente', color: '#92400e', bg: '#fffbeb' },
  CONFIRMED:          { label: 'Confirmée',  color: '#065f46', bg: '#ecfdf5' },
  COMPLETED:          { label: 'Terminée',   color: Colors.gray600, bg: Colors.gray100 },
  CANCELLED_BY_USER:  { label: 'Annulée',    color: '#991b1b', bg: '#fef2f2' },
  CANCELLED_BY_OWNER: { label: 'Annulée',    color: '#991b1b', bg: '#fef2f2' },
  CANCELLED_BY_ADMIN: { label: 'Annulée',    color: '#991b1b', bg: '#fef2f2' },
  DISPUTED:           { label: 'Litige',     color: '#1e40af', bg: '#eff6ff' },
};

export default function BookingsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings-mobile', tab],
    queryFn: () => bookingApi.myBookings(tab || undefined).then(r => r.data.data || []),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.authPrompt}>
          <Text style={styles.authIcon}>📅</Text>
          <Text style={styles.authTitle}>Vos réservations</Text>
          <Text style={styles.authText}>Connectez-vous pour voir vos séjours</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.pageTitle}>Mes réservations</Text>

      {/* Status tabs */}
      <FlatList
        horizontal data={STATUS_TABS} keyExtractor={t => t.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setTab(item.key)} style={[styles.tabPill, tab === item.key && styles.tabPillActive]}>
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(b: any) => b.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: b }: { item: any }) => {
            const s = STATUS_CONFIG[b.status] || STATUS_CONFIG.CONFIRMED;
            return (
              <TouchableOpacity style={styles.card} onPress={() => router.push(`/booking/${b.id}`)}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.propertyTitle} numberOfLines={1}>{b.property?.title}</Text>
                    <Text style={styles.propertyCity}>{b.property?.city}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>
                <View style={styles.dates}>
                  <Text style={styles.dateText}>📅 {format(new Date(b.checkIn), 'd MMM', { locale: fr })} → {format(new Date(b.checkOut), 'd MMM yyyy', { locale: fr })}</Text>
                  <Text style={styles.nightsText}>{b.nights} nuit{b.nights > 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.amount}>{b.totalAmount?.toLocaleString('fr-SN')} XOF</Text>
                  <Text style={styles.arrow}>Détails →</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🧳</Text>
              <Text style={styles.emptyTitle}>Aucune réservation</Text>
              <Text style={styles.emptyText}>Explorez nos logements et réservez votre prochain séjour</Text>
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
  pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.gray900, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  tabsRow:   { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  tabPill:   { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.gray200 },
  tabPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:   { fontSize: 13, fontWeight: '600', color: Colors.gray600 },
  tabTextActive:{ color: Colors.white },
  loader:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:      { padding: 16, gap: 12 },
  card:      { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 16, ...Shadow.sm },
  cardTop:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  propertyTitle:{ fontSize: 15, fontWeight: '700', color: Colors.gray900 },
  propertyCity: { fontSize: 12, color: Colors.gray500, marginTop: 2 },
  statusBadge:  { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  statusText:   { fontSize: 11, fontWeight: '700' },
  dates:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: Colors.gray100 },
  dateText:     { fontSize: 13, color: Colors.gray600 },
  nightsText:   { fontSize: 13, color: Colors.gray500 },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount:       { fontSize: 16, fontWeight: '800', color: Colors.gray900 },
  arrow:        { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  authPrompt:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  authIcon:     { fontSize: 64, marginBottom: 16 },
  authTitle:    { fontSize: 22, fontWeight: '700', color: Colors.gray900, marginBottom: 8 },
  authText:     { fontSize: 15, color: Colors.gray500, textAlign: 'center', marginBottom: 24 },
  loginBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 32, paddingVertical: 14 },
  loginBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyIcon:    { fontSize: 56, marginBottom: 16 },
  emptyTitle:   { fontSize: 20, fontWeight: '700', color: Colors.gray900, marginBottom: 8 },
  emptyText:    { fontSize: 14, color: Colors.gray500, textAlign: 'center', paddingHorizontal: 40, marginBottom: 24 },
  exploreBtn:   { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 24, paddingVertical: 12 },
  exploreBtnText:{ color: Colors.white, fontWeight: '700' },
});
