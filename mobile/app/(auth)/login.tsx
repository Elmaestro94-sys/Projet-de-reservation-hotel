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

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email invalide';
    if (!password) e.password = 'Mot de passe requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await authApi.login({ email: email.trim(), password });
      await setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Email ou mot de passe incorrect';
      Alert.alert('Erreur de connexion', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>🌴</Text>
            </View>
            <Text style={styles.brand}>Séjour Sénégal</Text>
          </View>

          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Bienvenue ! Connectez-vous à votre compte</Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Adresse email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="exemple@email.com"
                placeholderTextColor={Colors.gray400}
                value={email}
                onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                  placeholder="Votre mot de passe"
                  placeholderTextColor={Colors.gray400}
                  value={password}
                  onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: '' })); }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(s => !s)}>
                  <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.submitBtnText}>Se connecter</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.switchLink}>S'inscrire</Text>
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

  logoWrap:  { alignItems: 'center', marginTop: 8, marginBottom: 24 },
  logoIcon:  { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logoEmoji: { fontSize: 32 },
  brand:     { fontSize: 18, fontWeight: '800', color: Colors.gray900 },

  title:    { fontSize: 28, fontWeight: '800', color: Colors.gray900, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.gray500, marginBottom: 28 },

  form:        { gap: 4 },
  fieldWrap:   { marginBottom: 16 },
  label:       { fontSize: 13, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  input:       { backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.gray900 },
  inputError:  { borderColor: Colors.error },
  passwordWrap:{ position: 'relative' },
  passwordInput:{ paddingRight: 48 },
  eyeBtn:      { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  eyeText:     { fontSize: 18 },
  errorText:   { fontSize: 12, color: Colors.error, marginTop: 4 },
  forgotWrap:  { alignSelf: 'flex-end', marginBottom: 8 },
  forgotText:  { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  submitBtn:         { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { color: Colors.white, fontWeight: '800', fontSize: 16 },

  switchRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  switchText: { fontSize: 14, color: Colors.gray500 },
  switchLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
});
