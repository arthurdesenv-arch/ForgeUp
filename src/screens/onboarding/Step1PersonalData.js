import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { colors } from '../../theme/colors';

export default function Step1PersonalData({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [genero, setGenero] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  function handleContinuar() {
    if (!nome || !email || !telefone || !nascimento || !genero || !senha || !confirmarSenha) {
      alert('Preencha todos os campos!');
      return;
    }
    if (senha.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres!');
      return;
    }
    if (senha !== confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }
    navigation.navigate('Step2Body', { nome, email, telefone, nascimento, genero, senha });
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        {/* Progresso */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '25%' }]} />
          </View>
          <Text style={styles.progressText}>Passo 1 de 4</Text>
        </View>

        <Text style={styles.title}>Dados pessoais</Text>
        <Text style={styles.subtitle}>Vamos te conhecer melhor</Text>

        {/* Formulário */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput style={styles.input} placeholder="Seu nome" placeholderTextColor={colors.gray400} value={nome} onChangeText={setNome} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor={colors.gray400} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput style={styles.input} placeholder="(11) 9 0000-0000" placeholderTextColor={colors.gray400} keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Data de nascimento</Text>
            <TextInput style={styles.input} placeholder="DD/MM/AAAA" placeholderTextColor={colors.gray400} keyboardType="numeric" value={nascimento} onChangeText={setNascimento} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Gênero</Text>
            <View style={styles.generoContainer}>
              {['Masculino', 'Feminino', 'Outro'].map((op) => (
                <TouchableOpacity
                  key={op}
                  style={[styles.generoBtn, genero === op && styles.generoBtnActive]}
                  onPress={() => setGenero(op)}
                >
                  <Text style={[styles.generoBtnText, genero === op && styles.generoBtnTextActive]}>{op}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Senha (mínimo 6 caracteres)</Text>
            <TextInput style={styles.input} placeholder="••••••" placeholderTextColor={colors.gray400} secureTextEntry value={senha} onChangeText={setSenha} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirmar senha</Text>
            <TextInput style={styles.input} placeholder="••••••" placeholderTextColor={colors.gray400} secureTextEntry value={confirmarSenha} onChangeText={setConfirmarSenha} />
          </View>

          <TouchableOpacity style={styles.buttonPrimary} onPress={handleContinuar}>
            <Text style={styles.buttonPrimaryText}>Continuar →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
  },
  progressContainer: {
    marginBottom: 28,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.gray400,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray400,
    marginTop: 6,
    marginBottom: 28,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray500,
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
  generoContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  generoBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
  },
  generoBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  generoBtnText: {
    color: colors.gray400,
    fontSize: 13,
    fontWeight: '600',
  },
  generoBtnTextActive: {
    color: colors.white,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});