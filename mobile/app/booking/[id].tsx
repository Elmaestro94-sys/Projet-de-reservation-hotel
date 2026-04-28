import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Radius, Shadow } from '@/src/constants/colors';
import { bookingApi, paymentApi } from '@/src/services/api';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:            { label: 'En attente de confirmation', color: '#92400e', bg: '#fffbeb', icon: '⏳' },
  CONFIRMED:          { label: 'Réservation confirmée',      color: '#065f46', bg: '#ecfdf5', icon: '✅' },
  COMPLETED:          { label: 'Séjour terminé',             color: Colors.gray600, bg: Colors.gray100, icon: '🏁' },
  CANCELLED_BY_USER:  { label: 'Annulée par vous',           color: '#991b1b', bg: '#fef2f2', icon: '❌' },
  CANCELLED_BY_OWNER: { label: 'Annulée par le propriétaire',color: '#991b1b', bg: '#fef2f2', icon: '❌' },
  CANCELLED_BY_ADMIN: { label: 'Annulée par l\'admin',       color: '#991b1b', bg: '#fef2f2', icon: '❌' },
  DISPUTED:           { label: 'Litige en cours',            color: '#1e40af', bg: '#eff6ff', icon: '⚠️' },
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.get(id).then(r => r.data.data),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => bookingApi.cancel(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['my-bookings-mobile'] });
      Alert.alert('Réservation annulée', 'Votre réservation a été annulée avec succès.');
    },
    onError: (err: any) => Alert.alert('Erreur', err.response?.data?.message || 'Impossible d\'annuler'),
  });

  const handleCancel = () => {
    Alert.alert('Annuler la réservation', 'Êtes-vous sûr de vouloir annuler cette réservation ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui, annuler', style: 'destructive', onPress: () => cancelMutation.mutate('Annulation par l\'utilisateur') },
    ]);
  };

  const handlePayStripe = async () => {
    try {
      const { data } = await paymentApi.createStripeSession(id);
      Alert.alert('Paiement Stripe', 'Redirection vers Stripe (intégration web requise sur mobile).\nURL: ' + data.data.url);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible de créer la session de paiement');
    }
  };

  const handlePayPaytech = async () => {
    try {
      const { data } = await paymentApi.createPaytechSession(id);
      Alert.alert('Paiement PayTech', 'Redirection vers PayTech (intégration web requise sur mobile).\nURL: ' + data.data.redirectUrl);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible de créer la session de paiement');
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.gray500 }}>Réservation introuvable</Text>
      </View>
    );
  }

  const s = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const nights = differenceInDays(new Date(booking.checkOut), new Date(booking.checkIn));
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);
  const canPay = booking.status === 'CONFIRMED' && !booking.isPaid;
  const photo = booking.property?.photos?.[0]?.url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Réservation</Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>

        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: s.bg }]}>
          <Text style={styles.statusIcon}>{s.icon}</Text>
          <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
        </View>

        {/* Property card */}
        <TouchableOpacity style={styles.propertyCard} onPress={() => router.push(`/property/${booking.property?.slug}`)}>
          <Image source={{ uri: photo }} style={styles.propertyPhoto} />
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle} numberOfLines={2}>{booking.property?.title}</Text>
            <Text style={styles.propertyCity}>{booking.property?.city}</Text>
            <Text style={styles.propertyLink}>Voir le logement →</Text>
          </View>
        </TouchableOpacity>

        {/* Dates + summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails du séjour</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Arrivée</Text>
            <Text style={styles.detailValue}>{format(new Date(booking.checkIn), 'EEEE d MMMM yyyy', { locale: fr })}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Départ</Text>
            <Text style={styles.detailValue}>{format(new Date(booking.checkOut), 'EEEE d MMMM yyyy', { locale: fr })}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Durée</Text>
            <Text style={styles.detailValue}>{nights} nuit{nights > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Voyageurs</Text>
            <Text style={styles.detailValue}>{booking.guests} personne{booking.guests > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Price breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Prix</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{booking.property?.pricePerNight?.toLocaleString('fr-SN')} XOF × {nights} nuit{nights > 1 ? 's' : ''}</Text>
            <Text style={styles.detailValue}>{(booking.property?.pricePerNight * nights)?.toLocaleString('fr-SN')} XOF</Text>
          </View>
          {booking.cleaningFee > 0 && <>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Frais de ménage</Text>
              <Text style={styles.detailValue}>{booking.cleaningFee?.toLocaleString('fr-SN')} XOF</Text>
            </View>
          </>}
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, styles.total]}>Total</Text>
            <Text style={[styles.detailValue, styles.total]}>{booking.totalAmount?.toLocaleString('fr-SN')} XOF</Text>
          </View>
          <View style={[styles.paidBadge, { backgroundColor: booking.isPaid ? '#ecfdf5' : '#fef9c3' }]}>
            <Text style={{ color: booking.isPaid ? '#065f46' : '#92400e', fontWeight: '700', fontSize: 13 }}>
              {booking.isPaid ? '✅ Payé' : '⏳ Paiement en attente'}
            </Text>
          </View>
        </View>

        {/* Reference */}
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Référence</Text>
            <Text style={[styles.detailValue, { fontFamily: 'monospace' }]}>{booking.reference || booking.id?.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date de réservation</Text>
            <Text style={styles.detailValue}>{format(new Date(booking.createdAt), 'd MMM yyyy', { locale: fr })}</Text>
          </View>
        </View>

        {/* Payment buttons */}
        {canPay && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payer maintenant</Text>
            <TouchableOpacity style={styles.stripeBtn} onPress={handlePayStripe}>
              <Text style={styles.stripeBtnText}>💳 Payer par carte (Stripe)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paytechBtn} onPress={handlePayPaytech}>
              <Text style={styles.paytechBtnText}>📱 Payer avec PayTech (Mobile Money)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel */}
        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelBtn, cancelMutation.isPending && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending
              ? <ActivityIndicator color={Colors.error} />
              : <Text style={styles.cancelBtnText}>Annuler la réservation</Text>
            }
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSafe:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.gray100 },
  backBtn:       { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:      { fontSize: 24, color: Colors.gray700 },
  headerTitle:   { fontSize: 17, fontWeight: '700', color: Colors.gray900 },

  statusBanner:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, marginHorizontal: 16, marginTop: 16, borderRadius: Radius.xl },
  statusIcon:    { fontSize: 22 },
  statusLabel:   { fontSize: 14, fontWeight: '700' },

  propertyCard:  { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.xl, margin: 16, overflow: 'hidden', ...Shadow.sm },
  propertyPhoto: { width: 100, height: 100, resizeMode: 'cover' },
  propertyInfo:  { flex: 1, padding: 12, justifyContent: 'space-between' },
  propertyTitle: { fontSize: 14, fontWeight: '700', color: Colors.gray900, lineHeight: 20 },
  propertyCity:  { fontSize: 12, color: Colors.gray500 },
  propertyLink:  { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  card:          { backgroundColor: Colors.white, borderRadius: Radius.xl, margin: 16, marginTop: 0, padding: 16, ...Shadow.sm },
  cardTitle:     { fontSize: 16, fontWeight: '700', color: Colors.gray900, marginBottom: 14 },
  detailRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 },
  detailDivider: { height: 1, backgroundColor: Colors.gray100, marginVertical: 8 },
  detailLabel:   { fontSize: 13, color: Colors.gray500, flex: 1 },
  detailValue:   { fontSize: 13, fontWeight: '600', color: Colors.gray800, flex: 1, textAlign: 'right' },
  total:         { fontSize: 15, fontWeight: '800', color: Colors.gray900 },
  paidBadge:     { borderRadius: Radius.lg, padding: 10, alignItems: 'center', marginTop: 12 },

  stripeBtn:     { backgroundColor: '#635bff', borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  stripeBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  paytechBtn:    { backgroundColor: '#f59e0b', borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  paytechBtnText:{ color: Colors.white, fontWeight: '700', fontSize: 15 },

  cancelBtn:     { marginHorizontal: 16, backgroundColor: '#fef2f2', borderRadius: Radius.xl, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
