import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { colors } from '../../theme/colors';

const divisoesSugeridas = {
  2: { nome: 'AB', descricao: 'Treino A e B alternados' },
  3: { nome: 'ABC', descricao: 'Peito/Tríceps · Costas/Bíceps · Pernas/Ombros' },
  4: { nome: 'ABCD', descricao: 'Peito · Costas · Pernas · Ombros/Braços' },
  5: { nome: 'ABCDE', descricao: 'Peito · Costas · Pernas · Ombros · Braços' },
  6: { nome: 'ABCDEF', descricao: '6 grupos musculares separados' },
  7: { nome: 'ABCDEFG', descricao: 'Treino todos os dias — avançado' },
};

export default function Step4Training({ navigation, route }) {
  const dadosAnteriores = route.params;
  const [dias, setDias] = useState(3);
  const [divisaoPersonalizada, setDivisaoPersonalizada] = useState(false);

  const divisao = divisoesSugeridas[dias];

  function handleFinalizar() {
    const dadosCompletos = {
      ...dadosAnteriores,
      diasTreino: dias,
      divisaoTreino: divisao.nome,
    };
    console.log('Dados completos do usuário:', dadosCompletos);
    alert(`Bem-vindo ao ForgeUp, ${dadosAnteriores.nome}! 🔥`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      {/* Progresso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
        <Text style={styles.progressText}>Passo 4 de 4 — Último passo! 🎉</Text>
      </View>

      <Text style={styles.title}>Divisão de treino</Text>
      <Text style={styles.subtitle}>Quantos dias por semana você vai treinar?</Text>

      {/* Seletor de dias */}
      <View style={styles.diasContainer}>
        {[2, 3, 4, 5, 6, 7].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.diaBtn, dias === d && styles.diaBtnActive]}
            onPress={() => setDias(d)}
          >
            <Text style={[styles.diaBtnNum, dias === d && styles.diaBtnNumActive]}>{d}x</Text>
            <Text style={[styles.diaBtnLabel, dias === d && styles.diaBtnLabelActive]}>
              {d <= 5 ? '✓' : d === 6 ? '⚡' : '🔥'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recomendação */}
      {dias <= 5 && (
        <View style={styles.recomendadoBadge}>
          <Text style={styles.recomendadoText}>✓ Recomendado para {dadosAnteriores.nivel}s</Text>
        </View>
      )}
      {dias === 6 && (
        <View style={[styles.recomendadoBadge, styles.alertaBadge]}>
          <Text style={styles.recomendadoText}>⚡ Exige boa recuperação</Text>
        </View>
      )}
      {dias === 7 && (
        <View style={[styles.recomendadoBadge, styles.alertaBadge]}>
          <Text style={styles.recomendadoText}>🔥 Apenas para avançados — sem dia de descanso</Text>
        </View>
      )}

      {/* Divisão sugerida */}
      <View style={styles.divisaoCard}>
        <View style={styles.divisaoHeader}>
          <Text style={styles.divisaoLabel}>Divisão sugerida</Text>
          <TouchableOpacity onPress={() => setDivisaoPersonalizada(!divisaoPersonalizada)}>
            <Text style={styles.divisaoAjustar}>Ajustar ▾</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.divisaoNome}>{divisao.nome}</Text>
        <Text style={styles.divisaoDesc}>{divisao.descricao}</Text>
      </View>

      {divisaoPersonalizada && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>💡 A personalização completa da divisão estará disponível na tela de treinos após o cadastro.</Text>
        </View>
      )}

      <TouchableOpacity style={styles.buttonPrimary} onPress={handleFinalizar}>
        <Text style={styles.buttonPrimaryText}>Criar minha conta 🔥</Text>
      </TouchableOpacity>

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
  diasContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  diaBtn: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  diaBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  diaBtnNum: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray400,
  },
  diaBtnNumActive: { color: colors.white },
  diaBtnLabel: { fontSize: 10, color: colors.gray400 },
  diaBtnLabelActive: { color: colors.white },
  recomendadoBadge: {
    backgroundColor: '#0A1A0A',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  alertaBadge: {
    backgroundColor: '#1A0A00',
    borderColor: colors.primary,
  },
  recomendadoText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  divisaoCard: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  divisaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  divisaoLabel: {
    fontSize: 12,
    color: colors.gray400,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  divisaoAjustar: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  divisaoNome: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 4,
    marginBottom: 6,
  },
  divisaoDesc: {
    fontSize: 13,
    color: colors.gray400,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray400,
    lineHeight: 20,
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