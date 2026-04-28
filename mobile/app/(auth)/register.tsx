import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors, Radius } from '@/src/constants/colors';
import { authApi } from '@/src/services/api';
import { useAuthStore } from '@/src/store/auth.store';

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'TENANT' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Prénom requis';
    if (!form.lastName.trim())  e.lastName  = 'Nom requis';
    if (!form.email.trim())     e.email     = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
    if (form.password.length < 8) e.password = '8 caractères minimum';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await authApi.register({
        ...form, email: form.email.trim(),
        ...(form.phone && { phone: form.phone }),
      });
      await setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'inscription';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez des milliers de voyageurs au Sénégal</Text>

          {/* Role selector */}
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.rolePill, form.role === 'TENANT' && styles.rolePillActive]}
              onPress={() => set('role', 'TENANT')}
            >
              <Text style={[styles.rolePillText, form.role === 'TENANT' && styles.rolePillTextActive]}>🧳 Voyageur</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rolePill, form.role === 'OWNER' && styles.rolePillActive]}
              onPress={() => set('role', 'OWNER')}
            >
              <Text style={[styles.rolePillText, form.role === 'OWNER' && styles.rolePillTextActive]}>🏠 Propriétaire</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.fieldWrap, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Prénom</Text>
                <TextInput style={[styles.input, errors.firstName && styles.inputError]} placeholder="Prénom" placeholderTextColor={Colors.gray400} value={form.firstName} onChangeText={t => set('firstName', t)} autoCapitalize="words" />
                {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.label}>Nom</Text>
                <TextInput style={[styles.input, errors.lastName && styles.inputError]} placeholder="Nom" placeholderTextColor={Colors.gray400} value={form.lastName} onChangeText={t => set('lastName', t)} autoCapitalize="words" />
                {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Adresse email</Text>
              <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="exemple@email.com" placeholderTextColor={Colors.gray400} value={form.email} onChangeText={t => set('email', t)} keyboardType="email-address" autoCapitalize="none" />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Téléphone (optionnel)</Text>
              <TextInput style={styles.input} placeholder="+221 77 000 00 00" placeholderTextColor={Colors.gray400} value={form.phone} onChangeText={t => set('phone', t)} keyboardType="phone-pad" />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                  placeholder="8 caractères minimum"
                  placeholderTextColor={Colors.gray400}
                  value={form.password}
                  onChangeText={t => set('password', t)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(s => !s)}>
                  <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password
                ? <Text style={styles.errorText}>{errors.password}</Text>
                : <Text style={styles.hint}>Au moins 8 caractères, une majuscule et un chiffre</Text>
              }
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.submitBtnText}>Créer mon compte</Text>
              }
            </TouchableOpacity>

            <Text style={styles.terms}>
              En vous inscrivant, vous acceptez nos{' '}
              <Text style={styles.termsLink}>Conditions d'utilisation</Text>
              {' '}et notre{' '}
              <Text style={styles.termsLink}>Politique de confidentialité</Text>
            </Text>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.switchLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.white },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  backBtn:{ paddingTop: 8, paddingBottom: 16 },
  backText:{ fontSize: 14, color: Colors.primary, fontWeight: '600' },
  title:    { fontSize: 28, fontWeight: '800', color: Colors.gray900, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.gray500, marginBottom: 20 },

  roleRow:  { flexDirection: 'row', gap: 12, marginBottom: 24 },
  rolePill: { flex: 1, borderWidth: 2, borderColor: Colors.gray200, borderRadius: Radius.lg, paddingVertical: 12, alignItems: 'center' },
  rolePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rolePillText:   { fontSize: 14, fontWeight: '700', color: Colors.gray500 },
  rolePillTextActive: { color: Colors.white },

  form:        { gap: 4 },
  row:         { flexDirection: 'row' },
  fieldWrap:   { marginBottom: 16 },
  label:       { fontSize: 13, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  input:       { backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.gray900 },
  inputError:  { borderColor: Colors.error },
  passwordWrap:{ position: 'relative' },
  passwordInput:{ paddingRight: 48 },
  eyeBtn:      { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  eyeText:     { fontSize: 18 },
  errorText:   { fontSize: 12, color: Colors.error, marginTop: 4 },
  hint:        { fontSize: 12, color: Colors.gray400, marginTop: 4 },

  submitBtn:         { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { color: Colors.white, fontWeight: '800', fontSize: 16 },

  terms:     { fontSize: 12, color: Colors.gray400, textAlign: 'center', marginTop: 14, lineHeight: 18 },
  termsLink: { color: Colors.primary, fontWeight: '600' },

  switchRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText: { fontSize: 14, color: Colors.gray500 },
  switchLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
});
