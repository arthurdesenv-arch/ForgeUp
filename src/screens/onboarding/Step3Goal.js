import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { colors } from '../../theme/colors';

const objetivos = [
  { id: 'Emagrecer', emoji: '🔥', desc: 'Perder gordura e reduzir peso' },
  { id: 'Ganhar massa', emoji: '💪', desc: 'Aumentar músculos e força' },
  { id: 'Definição', emoji: '⚡', desc: 'Manter massa e reduzir gordura' },
  { id: 'Condicionamento', emoji: '🏃', desc: 'Melhorar resistência e fôlego' },
  { id: 'Saúde geral', emoji: '❤️', desc: 'Qualidade de vida e bem-estar' },
];

export default function Step3Goal({ navigation, route }) {
  const dadosAnteriores = route.params;
  const [objetivo, setObjetivo] = useState('');

  function handleContinuar() {
    if (!objetivo) {
      alert('Selecione um objetivo!');
      return;
    }
    navigation.navigate('Step4Training', { ...dadosAnteriores, objetivo });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      {/* Progresso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '75%' }]} />
        </View>
        <Text style={styles.progressText}>Passo 3 de 4</Text>
      </View>

      <Text style={styles.title}>Seu objetivo</Text>
      <Text style={styles.subtitle}>Isso define como o app vai te ajudar</Text>

      <View style={styles.form}>
        {objetivos.map((op) => (
          <TouchableOpacity
            key={op.id}
            style={[styles.card, objetivo === op.id && styles.cardActive]}
            onPress={() => setObjetivo(op.id)}
          >
            <Text style={styles.cardEmoji}>{op.emoji}</Text>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, objetivo === op.id && styles.cardTitleActive]}>{op.id}</Text>
              <Text style={styles.cardDesc}>{op.desc}</Text>
            </View>
            <View style={[styles.radio, objetivo === op.id && styles.radioActive]}>
              {objetivo === op.id && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.buttonPrimary} onPress={handleContinuar}>
          <Text style={styles.buttonPrimaryText}>Continuar →</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
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
  form: { gap: 12 },
  card: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardActive: {
    borderColor: colors.primary,
    backgroundColor: '#1A0A00',
  },
  cardEmoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  cardTitleActive: { color: colors.primary },
  cardDesc: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 2,
  },
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