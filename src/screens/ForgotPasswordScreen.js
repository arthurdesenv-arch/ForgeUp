import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { colors } from '../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSendReset() {
    if (!email) {
      setErrorMessage('Informe seu e-mail.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('Nenhuma conta encontrada com este e-mail.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('E-mail inválido.');
      } else {
        setErrorMessage('Erro ao enviar e-mail. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.checkIcon}>📧</Text>
          <Text style={styles.sentTitle}>E-mail enviado!</Text>
          <Text style={styles.sentText}>
            Enviamos um link de redefinição de senha para{' '}
            <Text style={styles.sentEmail}>{email}</Text>.
          </Text>
          <Text style={styles.sentHint}>
            Verifique sua caixa de entrada e siga as instruções para criar uma nova senha.
          </Text>
          <TouchableOpacity style={styles.buttonPrimary} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonPrimaryText}>Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.subtitle}>
          Digite seu e-mail cadastrado para receber o link de redefinição.
        </Text>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor={colors.gray400}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => { setEmail(text); setErrorMessage(''); }}
          editable={!loading}
        />

        <TouchableOpacity style={styles.buttonPrimary} onPress={handleSendReset} disabled={loading}>
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.buttonPrimaryText}>Enviar link de recuperação</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 32,
  },
  backText: { color: colors.primary, fontSize: 16 },
  content: { gap: 12 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.white,
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: '#1A0A0A',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonPrimaryText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  card: { alignItems: 'center', gap: 12 },
  checkIcon: { fontSize: 48 },
  sentTitle: { fontSize: 24, fontWeight: '800', color: colors.white, marginTop: 8 },
  sentText: { fontSize: 14, color: colors.gray400, textAlign: 'center', lineHeight: 20 },
  sentHint: { fontSize: 13, color: colors.gray500, textAlign: 'center', lineHeight: 18, marginTop: 4 },
  sentEmail: { color: colors.primary, fontWeight: '600' },
});
