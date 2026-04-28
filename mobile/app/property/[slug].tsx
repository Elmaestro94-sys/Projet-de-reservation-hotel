import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Colors, Radius, Shadow } from '@/src/constants/colors';
import { propertyApi, bookingApi } from '@/src/services/api';
import { useAuthStore } from '@/src/store/auth.store';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const { width: SW } = Dimensions.get('window');

const AMENITY_ICONS: Record<string, string> = {
  wifi: '📶', parking: '🚗', pool: '🏊', ac: '❄️', tv: '📺',
  kitchen: '🍳', washer: '🫧', gym: '💪', balcony: '🌅', garden: '🌿',
  bbq: '🔥', elevator: '🛗', security: '🔐', pets: '🐾', breakfast: '🍳',
};

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Appartement', HOUSE: 'Maison', VILLA: 'Villa',
  BUNGALOW: 'Bungalow', STUDIO: 'Studio', ROOM: 'Chambre',
  GUESTHOUSE: "Maison d'hôtes", HOTEL: 'Hôtel', RESORT: 'Resort',
};

export default function PropertyDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState(1);
  const [showBooking, setShowBooking] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['property', slug],
    queryFn: () => propertyApi.get(slug).then(r => r.data.data),
    enabled: !!slug,
  });

  const bookingMutation = useMutation({
    mutationFn: (d: object) => bookingApi.create(d),
    onSuccess: (res) => {
      const bookingId = res.data.data?.id;
      Alert.alert('Réservation créée !', 'Votre demande a été envoyée au propriétaire.', [
        { text: 'Voir ma réservation', onPress: () => router.push(`/booking/${bookingId}`) },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible de créer la réservation');
    },
  });

  const handleBook = () => {
    if (!isAuthenticated) { router.push('/(auth)/login'); return; }
    if (!checkIn || !checkOut) { Alert.alert('Dates requises', 'Choisissez vos dates de séjour'); return; }
    const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
    if (nights < 1) { Alert.alert('Dates invalides', 'La date de départ doit être après la date d\'arrivée'); return; }
    bookingMutation.mutate({ propertyId: data.id, checkIn, checkOut, guests });
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.gray500 }}>Logement introuvable</Text>
      </View>
    );
  }

  const photos: string[] = data.photos?.map((p: any) => p.url) || ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'];
  const nights = checkIn && checkOut ? differenceInDays(new Date(checkOut), new Date(checkIn)) : 0;
  const totalPrice = nights > 0 ? nights * data.pricePerNight : 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo gallery */}
        <View style={styles.gallery}>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={e => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SW))}
            renderItem={({ item }) => <Image source={{ uri: item }} style={styles.photo} />}
          />
          <View style={styles.photoDots}>
            {photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <Text style={styles.backCircleText}>←</Text>
          </TouchableOpacity>
          {data.isPremium && (
            <View style={styles.premiumBadge}><Text style={styles.premiumText}>✦ Premium</Text></View>
          )}
        </View>

        <View style={styles.content}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.type}>{TYPE_LABELS[data.type] || data.type}</Text>
              <Text style={styles.title}>{data.title}</Text>
              <Text style={styles.location}>📍 {[data.district, data.city, data.country].filter(Boolean).join(', ')}</Text>
            </View>
            {data.avgRating > 0 && (
              <View style={styles.rating}>
                <Text style={styles.ratingValue}>★ {data.avgRating?.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({data.reviewCount})</Text>
              </View>
            )}
          </View>

          {/* Specs */}
          <View style={styles.specs}>
            <View style={styles.specItem}><Text style={styles.specIcon}>👥</Text><Text style={styles.specText}>{data.maxGuests} pers.</Text></View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}><Text style={styles.specIcon}>🛏️</Text><Text style={styles.specText}>{data.bedrooms} ch.</Text></View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}><Text style={styles.specIcon}>🚿</Text><Text style={styles.specText}>{data.bathrooms} sdb.</Text></View>
            {data.instantBooking && <>
              <View style={styles.specDivider} />
              <View style={styles.specItem}><Text style={styles.specIcon}>⚡</Text><Text style={styles.specText}>Instant</Text></View>
            </>}
          </View>

          {/* Description */}
          {data.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>À propos</Text>
              <Text style={styles.description}>{data.description}</Text>
            </View>
          )}

          {/* Amenities */}
          {data.amenities?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Équipements</Text>
              <View style={styles.amenitiesGrid}>
                {data.amenities.slice(0, 12).map((a: string) => (
                  <View key={a} style={styles.amenityItem}>
                    <Text style={styles.amenityIcon}>{AMENITY_ICONS[a] || '✓'}</Text>
                    <Text style={styles.amenityLabel}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Owner */}
          {data.owner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Votre hôte</Text>
              <View style={styles.ownerRow}>
                <View style={styles.ownerAvatar}>
                  {data.owner.avatar
                    ? <Image source={{ uri: data.owner.avatar }} style={styles.ownerAvatarImg} />
                    : <Text style={styles.ownerAvatarText}>{data.owner.firstName?.[0]}{data.owner.lastName?.[0]}</Text>
                  }
                </View>
                <View>
                  <Text style={styles.ownerName}>{data.owner.firstName} {data.owner.lastName}</Text>
                  <Text style={styles.ownerJoined}>Membre depuis {format(new Date(data.owner.createdAt || Date.now()), 'MMMM yyyy', { locale: fr })}</Text>
                </View>
                <TouchableOpacity style={styles.msgBtn} onPress={() => isAuthenticated ? router.push(`/conversation/${data.owner.id}`) : router.push('/(auth)/login')}>
                  <Text style={styles.msgBtnText}>💬 Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Reviews */}
          {data.reviews?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Avis ({data.reviewCount})</Text>
              {data.reviews.slice(0, 3).map((r: any) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{r.author?.firstName} {r.author?.lastName?.[0]}.</Text>
                    <Text style={styles.reviewRating}>{'★'.repeat(r.rating)}</Text>
                  </View>
                  <Text style={styles.reviewText}>{r.comment}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Booking footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerInner}>
          <View>
            <Text style={styles.priceLabel}>par nuit</Text>
            <Text style={styles.price}>{data.pricePerNight?.toLocaleString('fr-SN')} <Text style={styles.currency}>XOF</Text></Text>
          </View>
          <TouchableOpacity style={styles.bookBtn} onPress={() => setShowBooking(true)} activeOpacity={0.85}>
            <Text style={styles.bookBtnText}>Réserver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Inline booking panel */}
      {showBooking && (
        <View style={styles.bookingPanel}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Choisir vos dates</Text>
              <TouchableOpacity onPress={() => setShowBooking(false)}><Text style={styles.panelClose}>✕</Text></TouchableOpacity>
            </View>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Arrivée</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor={Colors.gray400}
                  value={checkIn}
                  onChangeText={setCheckIn}
                />
              </View>
              <View style={styles.dateSep}><Text style={styles.dateSepText}>→</Text></View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Départ</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor={Colors.gray400}
                  value={checkOut}
                  onChangeText={setCheckOut}
                />
              </View>
            </View>
            <View style={styles.guestsRow}>
              <Text style={styles.guestsLabel}>Voyageurs</Text>
              <View style={styles.guestsStepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => setGuests(g => Math.max(1, g - 1))}>
                  <Text style={styles.stepText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.guestsCount}>{guests}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => setGuests(g => Math.min(data.maxGuests, g + 1))}>
                  <Text style={styles.stepText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            {nights > 0 && (
              <View style={styles.priceSummary}>
                <Text style={styles.priceSummaryText}>{data.pricePerNight?.toLocaleString('fr-SN')} × {nights} nuit{nights > 1 ? 's' : ''}</Text>
                <Text style={styles.priceSummaryTotal}>{totalPrice.toLocaleString('fr-SN')} XOF</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.confirmBtn, bookingMutation.isPending && styles.confirmBtnDisabled]}
              onPress={handleBook}
              disabled={bookingMutation.isPending}
            >
              {bookingMutation.isPending
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.confirmBtnText}>Confirmer la réservation</Text>
              }
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gallery:    { height: 300, position: 'relative' },
  photo:      { width: SW, height: 300, resizeMode: 'cover' },
  photoDots:  { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive:  { backgroundColor: Colors.white, width: 18 },
  backCircle: { position: 'absolute', top: 52, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  backCircleText: { color: Colors.white, fontSize: 18, fontWeight: '600' },
  premiumBadge:   { position: 'absolute', top: 52, right: 16, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  premiumText:    { color: Colors.white, fontSize: 12, fontWeight: '700' },

  content:    { padding: 20 },
  titleRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  type:       { fontSize: 11, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  title:      { fontSize: 22, fontWeight: '800', color: Colors.gray900, marginTop: 4, marginBottom: 4, lineHeight: 28 },
  location:   { fontSize: 13, color: Colors.gray500 },
  rating:     { alignItems: 'flex-end', paddingTop: 20 },
  ratingValue:{ fontSize: 16, fontWeight: '800', color: Colors.gray900 },
  ratingCount:{ fontSize: 11, color: Colors.gray400 },

  specs:      { flexDirection: 'row', backgroundColor: Colors.gray50, borderRadius: Radius.xl, padding: 14, marginBottom: 20, alignItems: 'center' },
  specItem:   { flex: 1, alignItems: 'center' },
  specIcon:   { fontSize: 18, marginBottom: 4 },
  specText:   { fontSize: 12, fontWeight: '600', color: Colors.gray700 },
  specDivider:{ width: 1, height: 32, backgroundColor: Colors.gray200 },

  section:     { marginBottom: 24 },
  sectionTitle:{ fontSize: 18, fontWeight: '700', color: Colors.gray900, marginBottom: 12 },
  description: { fontSize: 15, color: Colors.gray600, lineHeight: 24 },

  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityItem:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray50, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  amenityIcon:   { fontSize: 16 },
  amenityLabel:  { fontSize: 13, color: Colors.gray700, fontWeight: '500', textTransform: 'capitalize' },

  ownerRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ownerAvatar:   { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ownerAvatarImg:{ width: 50, height: 50 },
  ownerAvatarText:{ color: Colors.white, fontWeight: '700', fontSize: 18 },
  ownerName:     { fontSize: 15, fontWeight: '700', color: Colors.gray900 },
  ownerJoined:   { fontSize: 12, color: Colors.gray400, marginTop: 2 },
  msgBtn:        { marginLeft: 'auto', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 8 },
  msgBtnText:    { fontSize: 13, fontWeight: '700', color: Colors.primary },

  reviewCard:    { backgroundColor: Colors.gray50, borderRadius: Radius.xl, padding: 14, marginBottom: 10 },
  reviewHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewAuthor:  { fontSize: 13, fontWeight: '700', color: Colors.gray900 },
  reviewRating:  { fontSize: 12, color: Colors.primaryLight },
  reviewText:    { fontSize: 13, color: Colors.gray600, lineHeight: 20 },

  footer:       { backgroundColor: Colors.white, borderTopWidth: 1, borderColor: Colors.gray100, ...Shadow.lg },
  footerInner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  priceLabel:   { fontSize: 12, color: Colors.gray400 },
  price:        { fontSize: 22, fontWeight: '800', color: Colors.gray900 },
  currency:     { fontSize: 14, fontWeight: '600', color: Colors.gray500 },
  bookBtn:      { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 28, paddingVertical: 14 },
  bookBtnText:  { color: Colors.white, fontWeight: '800', fontSize: 16 },

  bookingPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: 20, ...Shadow.lg, borderTopWidth: 1, borderColor: Colors.gray100 },
  panelHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  panelTitle:   { fontSize: 18, fontWeight: '700', color: Colors.gray900 },
  panelClose:   { fontSize: 20, color: Colors.gray400, padding: 4 },
  dateRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dateField:    { flex: 1 },
  dateLabel:    { fontSize: 12, fontWeight: '600', color: Colors.gray500, marginBottom: 4 },
  dateInput:    { backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.lg, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.gray900 },
  dateSep:      { paddingHorizontal: 10, paddingTop: 20 },
  dateSepText:  { fontSize: 18, color: Colors.gray400 },
  guestsRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  guestsLabel:  { fontSize: 15, fontWeight: '600', color: Colors.gray700 },
  guestsStepper:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn:      { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: Colors.gray200, alignItems: 'center', justifyContent: 'center' },
  stepText:     { fontSize: 20, color: Colors.gray700, lineHeight: 24 },
  guestsCount:  { fontSize: 18, fontWeight: '700', color: Colors.gray900, minWidth: 24, textAlign: 'center' },
  priceSummary: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.gray50, borderRadius: Radius.lg, padding: 12, marginBottom: 12 },
  priceSummaryText: { fontSize: 14, color: Colors.gray600 },
  priceSummaryTotal:{ fontSize: 15, fontWeight: '800', color: Colors.gray900 },
  confirmBtn:         { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText:     { color: Colors.white, fontWeight: '800', fontSize: 16 },
});
