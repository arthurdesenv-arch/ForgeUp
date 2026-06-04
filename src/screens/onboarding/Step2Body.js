import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { colors } from '../../theme/colors';

export default function Step2Body({ navigation, route }) {
  const dadosAnteriores = route.params;

  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [nivel, setNivel] = useState('');

  function handleContinuar() {
    if (!peso || !altura || !nivel) {
      alert('Preencha todos os campos!');
      return;
    }
    navigation.navigate('Step3Goal', { ...dadosAnteriores, peso, altura, nivel });
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
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>Passo 2 de 4</Text>
        </View>

        <Text style={styles.title}>Seu corpo</Text>
        <Text style={styles.subtitle}>Usamos isso para personalizar seus treinos</Text>

        <View style={styles.form}>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Peso atual (kg)</Text>
              <TextInput style={styles.input} placeholder="70" placeholderTextColor={colors.gray400} keyboardType="numeric" value={peso} onChangeText={setPeso} />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Altura (cm)</Text>
              <TextInput style={styles.input} placeholder="175" placeholderTextColor={colors.gray400} keyboardType="numeric" value={altura} onChangeText={setAltura} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nível de experiência</Text>
            <Text style={styles.hint}>Há quanto tempo você treina?</Text>
            {[
              { id: 'Iniciante', desc: 'Menos de 1 ano' },
              { id: 'Intermediário', desc: '1 a 3 anos' },
              { id: 'Avançado', desc: 'Mais de 3 anos' },
            ].map((op) => (
              <TouchableOpacity
                key={op.id}
                style={[styles.nivelBtn, nivel === op.id && styles.nivelBtnActive]}
                onPress={() => setNivel(op.id)}
              >
                <View>
                  <Text style={[styles.nivelBtnTitle, nivel === op.id && styles.nivelBtnTitleActive]}>{op.id}</Text>
                  <Text style={[styles.nivelBtnDesc, nivel === op.id && styles.nivelBtnDescActive]}>{op.desc}</Text>
                </View>
                <View style={[styles.radio, nivel === op.id && styles.radioActive]}>
                  {nivel === op.id && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
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
  backButton: { marginBottom: 24 },
  backText: { color: colors.primary, fontSize: 16 },
  progressContainer: { marginBottom: 28 },
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
  progressText: { fontSize: 12, color: colors.gray400 },
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
  form: { gap: 20 },
  row: { flexDirection: 'row', gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  hint: { fontSize: 12, color: colors.gray400, marginBottom: 8 },
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
  nivelBtn: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nivelBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#1A0A00',
  },
  nivelBtnTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  nivelBtnTitleActive: { color: colors.primary },
  nivelBtnDesc: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  nivelBtnDescActive: { color: colors.gray500 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPrimaryText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});