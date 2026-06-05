import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { auth, db } from '../firebaseConfig';
import { colors } from '../theme/colors';
import WeeklyProgress from '../components/WeeklyProgress';

const periodoSaudacao = () => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
};

const exerciciosPorDivisao = {
  A: { nome: 'Peito / Tríceps / Ombro', icone: '💪' },
  B: { nome: 'Costas / Bíceps', icone: '🔙' },
  C: { nome: 'Pernas', icone: '🦵' },
  D: { nome: 'Ombros / Abdômen', icone: '🎯' },
  E: { nome: 'Braços', icone: '💪' },
  F: { nome: 'Full Body', icone: '🔥' },
  G: { nome: 'Cardio / Recuperação', icone: '🏃' },
};

function calcularTreinoDoDia(divisaoTreino) {
  if (!divisaoTreino) return 'A';
  const letras = divisaoTreino.split('');
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const indice = diaSemana % letras.length;
  return letras[indice];
}

function calcularStreak(criadoEm) {
  if (!criadoEm) return 0;
  const dataInicio = new Date(criadoEm);
  const hoje = new Date();
  const diffMs = hoje - dataInicio;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDias + 1);
}

export default function HomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      try {
        const snapshot = await get(ref(db, 'usuarios/' + user.uid));
        if (snapshot.exists()) {
          setUserData(snapshot.val());
        }
      } catch (error) {
        console.log('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const nome = userData?.nome || user?.displayName || 'Atleta';
  const saudacao = periodoSaudacao();
  const streak = calcularStreak(userData?.criadoEm);
  const treinoDoDia = calcularTreinoDoDia(userData?.divisaoTreino);
  const treinoInfo = exerciciosPorDivisao[treinoDoDia] || { nome: 'Treino do dia', icone: '🏋️' };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{saudacao},</Text>
          <Text style={styles.userName}>{nome}</Text>
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{userData?.nivel || 'Iniciante'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.streakInfo}>
          <Text style={styles.streakIcon}>🔥</Text>
          <View>
            <Text style={styles.streakCount}>{streak}</Text>
            <Text style={styles.streakLabel}>{streak === 1 ? 'dia de streak' : 'dias de streak'}</Text>
          </View>
        </View>
        <Text style={styles.streakMotivation}>
          {streak === 0 ? 'Comece seu primeiro treino hoje!' :
           streak < 3 ? 'Continue assim! Cada dia conta.' :
           streak < 7 ? 'Sequência incrível! Mantenha o ritmo.' :
           'Você está forjando sua força! 🔥'}
        </Text>
      </View>

      <WeeklyProgress userData={userData} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Treino do dia</Text>
        <Text style={styles.treinoDivisao}>Divisão {userData?.divisaoTreino || 'ABC'}</Text>
      </View>

      <TouchableOpacity style={styles.treinoCard} onPress={() => navigation.navigate('Treino')}>
        <View style={styles.treinoCardTop}>
          <Text style={styles.treinoCardIcon}>{treinoInfo.icone}</Text>
          <View style={styles.treinoCardInfo}>
            <Text style={styles.treinoCardLabel}>Treino {treinoDoDia}</Text>
            <Text style={styles.treinoCardName}>{treinoInfo.nome}</Text>
          </View>
          <Text style={styles.treinoCardArrow}>→</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Acesso rápido</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('IA')}>
          <Text style={styles.quickIcon}>🤖</Text>
          <Text style={styles.quickTitle}>Assistente IA</Text>
          <Text style={styles.quickDesc}>Tire dúvidas sobre treinos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Nutrição')}>
          <Text style={styles.quickIcon}>🥗</Text>
          <Text style={styles.quickTitle}>Nutrição</Text>
          <Text style={styles.quickDesc}>Dicas para sua dieta</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
    scroll: {
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: colors.gray400,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
    marginTop: 2,
    marginBottom: 8,
  },
  levelRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  levelBadge: {
    backgroundColor: '#1A0A00',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: 'flex-start',
  },
  levelText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  settingsIcon: {
    fontSize: 20,
  },
  streakCard: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  streakIcon: {
    fontSize: 32,
  },
  streakCount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
  },
  streakLabel: {
    fontSize: 13,
    color: colors.gray400,
  },
  streakMotivation: {
    fontSize: 13,
    color: colors.gray500,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 12,
    marginTop: 4,
  },
  treinoDivisao: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: '#1A0A00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  treinoCard: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
  },
  treinoCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  treinoCardIcon: {
    fontSize: 36,
  },
  treinoCardInfo: {
    flex: 1,
  },
  treinoCardLabel: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  treinoCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  treinoCardArrow: {
    fontSize: 20,
    color: colors.gray400,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  quickIcon: {
    fontSize: 28,
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  quickDesc: {
    fontSize: 12,
    color: colors.gray400,
    lineHeight: 16,
  },
});
