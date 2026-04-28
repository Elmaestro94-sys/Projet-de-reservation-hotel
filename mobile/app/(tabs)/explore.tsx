import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Colors, Radius, Shadow } from '@/src/constants/colors';
import { propertyApi } from '@/src/services/api';
import PropertyCard from '@/src/components/property/PropertyCard';

const TYPES = [
  { value: '', label: 'Tous' }, { value: 'VILLA', label: 'Villa' },
  { value: 'APARTMENT', label: 'Appart.' }, { value: 'HOUSE', label: 'Maison' },
  { value: 'STUDIO', label: 'Studio' }, { value: 'BUNGALOW', label: 'Bungalow' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ city?: string }>();
  const [city, setCity] = useState(params.city || '');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [page, setPage] = useState(1);

  useEffect(() => { if (params.city) setCity(params.city); }, [params.city]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['explore', city, type, sort, page],
    queryFn: () => propertyApi.list({
      ...(city && { city }),
      ...(type && { type }),
      sort, page, limit: 12,
    }).then(r => r.data),
    keepPreviousData: true,
  } as any);

  const properties: any[] = data?.data || [];
  const meta = data?.meta || { total: 0, pages: 1 };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Ville, destination…"
          placeholderTextColor={Colors.gray400}
          value={city}
          onChangeText={setCity}
          onSubmitEditing={() => setPage(1)}
          returnKeyType="search"
        />
        {city.length > 0 && (
          <TouchableOpacity onPress={() => { setCity(''); setPage(1); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Type pills */}
      <FlatList
        horizontal data={TYPES} keyExtractor={t => t.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => { setType(item.value); setPage(1); }}
            style={[styles.pill, type === item.value && styles.pillActive]}
          >
            <Text style={[styles.pillText, type === item.value && styles.pillTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Sort + count */}
      <View style={styles.headerRow}>
        <Text style={styles.resultCount}>
          {isLoading ? '…' : `${meta.total} logement${meta.total !== 1 ? 's' : ''}`}
        </Text>
        <TouchableOpacity
          onPress={() => setSort(s => s === 'createdAt' ? 'rating' : s === 'rating' ? 'priceAsc' : 'createdAt')}
          style={styles.sortBtn}
        >
          <Text style={styles.sortText}>
            {sort === 'createdAt' ? '📅 Récents' : sort === 'rating' ? '⭐ Notés' : '💰 Prix ↑'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(p: any) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PropertyCard property={item} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyTitle}>Aucun résultat</Text>
              <Text style={styles.emptyText}>Essayez une autre destination ou modifiez vos filtres</Text>
            </View>
          )}
          ListFooterComponent={() => meta.pages > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity disabled={page <= 1} onPress={() => setPage(p => p - 1)} style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}>
                <Text style={styles.pageBtnText}>← Préc.</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{page} / {meta.pages}</Text>
              <TouchableOpacity disabled={page >= meta.pages} onPress={() => setPage(p => p + 1)} style={[styles.pageBtn, page >= meta.pages && styles.pageBtnDisabled]}>
                <Text style={styles.pageBtnText}>Suiv. →</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.gray50 },
  searchBar:    { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: Colors.white, borderRadius: Radius.xl, paddingHorizontal: 14, paddingVertical: 12, ...Shadow.sm },
  searchIcon:   { fontSize: 16, marginRight: 8 },
  searchInput:  { flex: 1, fontSize: 15, color: Colors.gray900 },
  clearBtn:     { fontSize: 14, color: Colors.gray400, padding: 4 },
  pillsRow:     { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  pill:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.gray200 },
  pillActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText:     { fontSize: 13, fontWeight: '600', color: Colors.gray600 },
  pillTextActive:{ color: Colors.white },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  resultCount:  { fontSize: 13, color: Colors.gray500, fontWeight: '500' },
  sortBtn:      { backgroundColor: Colors.white, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 7, ...Shadow.sm },
  sortText:     { fontSize: 12, fontWeight: '600', color: Colors.gray700 },
  loaderWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:         { paddingHorizontal: 16, paddingBottom: 16 },
  row:          { gap: 16, justifyContent: 'space-between' },
  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyIcon:    { fontSize: 56, marginBottom: 16 },
  emptyTitle:   { fontSize: 20, fontWeight: '700', color: Colors.gray900, marginBottom: 8 },
  emptyText:    { fontSize: 14, color: Colors.gray500, textAlign: 'center', paddingHorizontal: 40 },
  pagination:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 16 },
  pageBtn:      { backgroundColor: Colors.white, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 9, ...Shadow.sm },
  pageBtnDisabled:{ opacity: 0.4 },
  pageBtnText:  { fontSize: 13, fontWeight: '600', color: Colors.gray700 },
  pageInfo:     { fontSize: 13, color: Colors.gray500 },
});
