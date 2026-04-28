import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadow } from '@/src/constants/colors';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '@/src/services/api';
import { useAuthStore } from '@/src/store/auth.store';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 48) / 2;

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Appartement', HOUSE: 'Maison', VILLA: 'Villa',
  BUNGALOW: 'Bungalow', STUDIO: 'Studio', ROOM: 'Chambre',
  GUESTHOUSE: "Maison d'hôtes", HOTEL: 'Hôtel', RESORT: 'Resort',
};

interface Property {
  id: string; slug: string; title: string;
  city: string; district?: string; type: string;
  pricePerNight: number; avgRating: number; reviewCount: number;
  isPremium?: boolean; instantBooking?: boolean;
  maxGuests: number; bedrooms: number;
  photos?: { url: string }[];
}

export default function PropertyCard({ property, isFavorited = false, horizontal = false }: {
  property: Property; isFavorited?: boolean; horizontal?: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [fav, setFav] = useState(isFavorited);
  const qc = useQueryClient();

  const favMutation = useMutation({
    mutationFn: () => propertyApi.toggleFavorite(property.id),
    onSuccess: (res) => {
      setFav(res.data.data.isFavorite);
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const photo = property.photos?.[0]?.url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600';

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.hCard} onPress={() => router.push(`/property/${property.slug}`)}>
        <Image source={{ uri: photo }} style={styles.hImage} />
        <View style={styles.hContent}>
          <Text style={styles.typeLabel}>{TYPE_LABELS[property.type] || property.type}</Text>
          <Text style={styles.hTitle} numberOfLines={2}>{property.title}</Text>
          <Text style={styles.location}>{[property.district, property.city].filter(Boolean).join(', ')}</Text>
          <View style={styles.row}>
            <Text style={styles.price}>{property.pricePerNight.toLocaleString('fr-SN')} <Text style={styles.perNight}>XOF/nuit</Text></Text>
            {property.avgRating > 0 && (
              <View style={styles.ratingRow}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.ratingText}>{property.avgRating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { width: CARD_W }]}
      onPress={() => router.push(`/property/${property.slug}`)}
      activeOpacity={0.92}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: photo }} style={styles.image} />
        {property.isPremium && (
          <View style={styles.premiumBadge}><Text style={styles.premiumText}>✦ Premium</Text></View>
        )}
        {isAuthenticated && (
          <TouchableOpacity style={[styles.favBtn, fav && styles.favActive]} onPress={() => favMutation.mutate()}>
            <Text style={{ color: fav ? Colors.white : Colors.gray500, fontSize: 14 }}>♥</Text>
          </TouchableOpacity>
        )}
        {property.avgRating > 0 && (
          <View style={styles.ratingPill}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingPillText}>{property.avgRating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.typeLabel}>{TYPE_LABELS[property.type] || property.type}</Text>
        <Text style={styles.title} numberOfLines={2}>{property.title}</Text>
        <Text style={styles.location} numberOfLines={1}>
          {[property.district, property.city].filter(Boolean).join(', ')}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{property.pricePerNight.toLocaleString('fr-SN')}</Text>
          <Text style={styles.perNight}> XOF/nuit</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    ...Shadow.md, overflow: 'hidden', marginBottom: 16,
  },
  imageWrap: { position: 'relative' },
  image:     { width: '100%', height: 140, resizeMode: 'cover' },
  premiumBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  premiumText:  { color: Colors.white, fontSize: 10, fontWeight: '700' },
  favBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  favActive:    { backgroundColor: Colors.error },
  ratingPill: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 3,
  },
  ratingPillText: { fontSize: 11, fontWeight: '700', color: Colors.gray900 },
  star:          { color: Colors.primaryLight, fontSize: 11, marginRight: 2 },
  content:       { padding: 10 },
  typeLabel:     { fontSize: 10, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  title:         { fontSize: 13, fontWeight: '600', color: Colors.gray900, marginTop: 3, marginBottom: 3, lineHeight: 18 },
  location:      { fontSize: 11, color: Colors.gray400, marginBottom: 6 },
  footer:        { flexDirection: 'row', alignItems: 'baseline' },
  price:         { fontSize: 14, fontWeight: '700', color: Colors.gray900 },
  perNight:      { fontSize: 11, color: Colors.gray500 },

  // Horizontal card
  hCard: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: Radius.xl, ...Shadow.md,
    overflow: 'hidden', marginBottom: 12,
  },
  hImage:   { width: 110, height: 110 },
  hContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  hTitle:   { fontSize: 14, fontWeight: '600', color: Colors.gray900, lineHeight: 20 },
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingRow:{ flexDirection: 'row', alignItems: 'center' },
  ratingText:{ fontSize: 12, fontWeight: '700', color: Colors.gray700 },
});
