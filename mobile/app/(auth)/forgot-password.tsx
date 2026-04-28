import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors, Radius } from '@/src/constants/colors';
import { authApi } from '@/src/services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'email de réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <Text style={styles.successIcon}>📧</Text>
          <Text style={styles.successTitle}>Email envoyé !</Text>
          <Text style={styles.successText}>Vérifiez votre boîte mail et cliquez sur le lien de réinitialisation.</Text>
          <TouchableOpacity style={styles.backToLogin} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.backToLoginText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.wrap}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>Entrez votre email pour recevoir un lien de réinitialisation</Text>
        <Text style={styles.label}>Adresse email</Text>
        <TextInput
          style={styles.input}
          placeholder="exemple@email.com"
          placeholderTextColor={Colors.gray400}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSend} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Envoyer le lien</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.white },
  wrap:    { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  backBtn: { paddingBottom: 24 },
  backText:{ fontSize: 14, color: Colors.primary, fontWeight: '600' },
  title:   { fontSize: 26, fontWeight: '800', color: Colors.gray900, marginBottom: 8 },
  subtitle:{ fontSize: 15, color: Colors.gray500, marginBottom: 28, lineHeight: 22 },
  label:   { fontSize: 13, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  input:   { backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.gray900, marginBottom: 20 },
  submitBtn:         { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { color: Colors.white, fontWeight: '800', fontSize: 16 },
  successWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successIcon:   { fontSize: 72, marginBottom: 20 },
  successTitle:  { fontSize: 24, fontWeight: '700', color: Colors.gray900, marginBottom: 12 },
  successText:   { fontSize: 15, color: Colors.gray500, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  backToLogin:   { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 32, paddingVertical: 14 },
  backToLoginText:{ color: Colors.white, fontWeight: '700', fontSize: 16 },
});
