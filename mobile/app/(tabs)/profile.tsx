import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors, Radius, Shadow } from '@/src/constants/colors';
import { notificationApi } from '@/src/services/api';
import { useAuthStore } from '@/src/store/auth.store';

const MENU_ITEMS = [
  { icon: '📋', label: 'Mes réservations', route: '/(tabs)/bookings' },
  { icon: '❤️', label: 'Mes favoris', route: '/favorites' },
  { icon: '💬', label: 'Mes messages', route: '/(tabs)/messages' },
  { icon: '⭐', label: 'Mes avis', route: '/my-reviews' },
  { icon: '🏠', label: 'Mes logements', route: '/owner/properties' },
  { icon: '💳', label: 'Paiements', route: '/my-payments' },
  { icon: '🔔', label: 'Notifications', route: '/notifications' },
  { icon: '⚙️', label: 'Paramètres', route: '/settings' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const { data: unreadData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => notificationApi.unreadCount().then(r => r.data.data?.count || 0),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.guestWrap}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>Mon profil</Text>
          <Text style={styles.guestText}>Connectez-vous pour accéder à votre compte et gérer vos réservations</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerBtnText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {user?.avatar
              ? <Image source={{ uri: user.avatar }} style={styles.avatar} />
              : <Text style={styles.avatarInitials}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
            }
            {!user?.isVerified && <View style={styles.unverifiedBadge}><Text style={styles.unverifiedText}>!</Text></View>}
          </View>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.role === 'OWNER' && <View style={styles.roleBadge}><Text style={styles.roleText}>Propriétaire</Text></View>}
          {user?.role === 'ADMIN' && <View style={[styles.roleBadge, styles.adminBadge]}><Text style={styles.roleText}>Admin</Text></View>}
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
            <Text style={styles.editBtnText}>✏️ Modifier le profil</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {user?.role === 'OWNER' && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Logements</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Réservations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>—</Text>
              <Text style={styles.statLabel}>Note moy.</Text>
            </View>
          </View>
        )}

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.route === '/notifications' && (unreadData || 0) > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{unreadData}</Text></View>
              )}
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Séjour Sénégal</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.gray50 },

  header:  { alignItems: 'center', padding: 24, backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.gray100 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar:  { width: 90, height: 90, borderRadius: 45 },
  avatarInitials: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary, textAlign: 'center', lineHeight: 90, color: Colors.white, fontSize: 32, fontWeight: '700', overflow: 'hidden' },
  unverifiedBadge: { position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.warning, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  unverifiedText:  { color: Colors.white, fontSize: 12, fontWeight: '800' },
  name:    { fontSize: 20, fontWeight: '700', color: Colors.gray900 },
  email:   { fontSize: 13, color: Colors.gray500, marginTop: 2, marginBottom: 8 },
  roleBadge: { backgroundColor: Colors.primaryLight + '30', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  adminBadge: { backgroundColor: '#fef3c7' },
  roleText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  editBtn: { borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.lg, paddingHorizontal: 20, paddingVertical: 8 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: Colors.gray700 },

  statsRow: { flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 16, borderRadius: Radius.xl, paddingVertical: 16, ...Shadow.sm },
  statItem: { flex: 1, alignItems: 'center' },
  statValue:{ fontSize: 20, fontWeight: '800', color: Colors.primary },
  statLabel:{ fontSize: 11, color: Colors.gray500, marginTop: 2 },
  statDivider:{ width: 1, backgroundColor: Colors.gray100 },

  menuSection: { backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 16, borderRadius: Radius.xl, ...Shadow.sm, overflow: 'hidden' },
  menuItem:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderColor: Colors.gray100 },
  menuIcon:    { fontSize: 20, marginRight: 14, width: 26, textAlign: 'center' },
  menuLabel:   { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.gray800 },
  menuArrow:   { fontSize: 20, color: Colors.gray400 },
  badge:       { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2, marginRight: 8 },
  badgeText:   { color: Colors.white, fontSize: 11, fontWeight: '700' },

  appInfo:     { alignItems: 'center', marginTop: 24, marginBottom: 8 },
  appName:     { fontSize: 13, fontWeight: '700', color: Colors.gray400 },
  appVersion:  { fontSize: 11, color: Colors.gray300, marginTop: 2 },

  logoutBtn:   { marginHorizontal: 16, marginTop: 8, backgroundColor: '#fef2f2', borderRadius: Radius.xl, paddingVertical: 16, alignItems: 'center' },
  logoutText:  { fontSize: 15, fontWeight: '700', color: '#dc2626' },

  guestWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  guestIcon:   { fontSize: 72, marginBottom: 16 },
  guestTitle:  { fontSize: 24, fontWeight: '700', color: Colors.gray900, marginBottom: 8 },
  guestText:   { fontSize: 15, color: Colors.gray500, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  loginBtn:    { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 40, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  loginBtnText:{ color: Colors.white, fontWeight: '700', fontSize: 16 },
  registerBtn: { borderWidth: 2, borderColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 40, paddingVertical: 14, width: '100%', alignItems: 'center' },
  registerBtnText:{ color: Colors.primary, fontWeight: '700', fontSize: 16 },
});
