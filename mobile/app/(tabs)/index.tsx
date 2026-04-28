import { ScrollView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors, Radius, Shadow } from '@/src/constants/colors';
import { propertyApi, destinationApi } from '@/src/services/api';
import { useAuthStore } from '@/src/store/auth.store';
import PropertyCard from '@/src/components/property/PropertyCard';
import { useState } from 'react';

const { width: SW } = Dimensions.get('window');

const DESTINATIONS = [
  { name: 'Dakar',       image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400', count: '120+' },
  { name: 'Saly',        image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400', count: '85+' },
  { name: 'Saint-Louis', image: 'https://images.unsplash.com/photo-1578469645742-46cae010e5d4?w=400', count: '45+' },
  { name: 'Cap Skirring',image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400', count: '30+' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: featured, refetch } = useQuery({
    queryKey: ['featured-mobile'],
    queryFn: () => propertyApi.list({ limit: 6, sort: 'rating' }).then(r => r.data.data || []),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (search.trim()) router.push(`/explore?city=${search}`);
    else router.push('/explore');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour{user ? `, ${user.firstName}` : ''} 👋</Text>
            <Text style={styles.subtitle}>Trouvez votre séjour idéal</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}>
            {user?.avatar
              ? <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
              : <Text style={styles.avatarInitials}>{user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Hero image + search */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800' }}
            style={styles.heroImg}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Votre séjour{'\n'}<Text style={styles.heroAccent}>premium</Text> au Sénégal</Text>
          </View>
          {/* Search bar floating over hero */}
          <View style={styles.searchCard}>
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>📍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Dakar, Saly, Saint-Louis…"
                placeholderTextColor={Colors.gray400}
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                <Text style={styles.searchBtnText}>Chercher</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[['280+', 'Logements'], ['15', 'Villes'], ['4.9★', 'Note'], ['98%', 'Satisfaits']].map(([val, label]) => (
            <View key={label} style={styles.statItem}>
              <Text style={styles.statValue}>{val}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Destinations populaires</Text>
            <TouchableOpacity onPress={() => router.push('/explore')}>
              <Text style={styles.sectionLink}>Voir tout →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destScroll}>
            {DESTINATIONS.map(d => (
              <TouchableOpacity
                key={d.name}
                style={styles.destCard}
                onPress={() => router.push(`/explore?city=${d.name}`)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: d.image }} style={styles.destImg} />
                <View style={styles.destOverlay} />
                <View style={styles.destInfo}>
                  <Text style={styles.destName}>{d.name}</Text>
                  <Text style={styles.destCount}>{d.count} logements</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Logements en vedette</Text>
            <TouchableOpacity onPress={() => router.push('/explore')}>
              <Text style={styles.sectionLink}>Tous →</Text>
            </TouchableOpacity>
          </View>
          {(featured || []).map((p: any) => (
            <PropertyCard key={p.id} property={p} horizontal />
          ))}
          {!featured && (
            <View style={styles.skeleton}>
              {[1,2,3].map(i => <View key={i} style={styles.skeletonCard} />)}
            </View>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaTitle}>Vous avez un logement ?</Text>
          <Text style={styles.ctaSubtitle}>Publiez gratuitement et recevez des réservations</Text>
          <View style={styles.ctaBtn}><Text style={styles.ctaBtnText}>Devenir propriétaire →</Text></View>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.gray50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.gray900 },
  subtitle:  { fontSize: 14, color: Colors.gray500, marginTop: 2 },
  avatar:    { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 42, height: 42 },
  avatarInitials: { color: Colors.white, fontWeight: '700', fontSize: 15 },

  heroWrap:    { marginHorizontal: 16, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: 0 },
  heroImg:     { width: '100%', height: 220 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  heroContent: { position: 'absolute', top: 24, left: 20 },
  heroTitle:   { fontSize: 26, fontWeight: '700', color: Colors.white, lineHeight: 34 },
  heroAccent:  { color: Colors.primaryLight },

  searchCard:  { marginHorizontal: 12, marginTop: -20, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 12, ...Shadow.lg },
  searchRow:   { flexDirection: 'row', alignItems: 'center' },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.gray900 },
  searchBtn:   { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10 },
  searchBtnText:{ color: Colors.white, fontWeight: '700', fontSize: 13 },

  statsRow:    { flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 20, borderRadius: Radius.xl, paddingVertical: 16, ...Shadow.sm },
  statItem:    { flex: 1, alignItems: 'center' },
  statValue:   { fontSize: 18, fontWeight: '800', color: Colors.primary },
  statLabel:   { fontSize: 11, color: Colors.gray500, marginTop: 2 },

  section:     { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray900 },
  sectionLink:  { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  destScroll:  { marginHorizontal: -4 },
  destCard:    { width: 140, height: 180, borderRadius: Radius.xl, marginHorizontal: 4, overflow: 'hidden' },
  destImg:     { width: '100%', height: '100%' },
  destOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  destInfo:    { position: 'absolute', bottom: 12, left: 12 },
  destName:    { color: Colors.white, fontWeight: '700', fontSize: 15 },
  destCount:   { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },

  skeleton:    { gap: 12 },
  skeletonCard:{ height: 100, backgroundColor: Colors.gray100, borderRadius: Radius.xl },

  ctaCard: {
    marginHorizontal: 16, marginTop: 24,
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: 24,
  },
  ctaTitle:   { fontSize: 20, fontWeight: '800', color: Colors.white, marginBottom: 6 },
  ctaSubtitle:{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 16 },
  ctaBtn:     { backgroundColor: Colors.white, borderRadius: Radius.md, paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start' },
  ctaBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});
