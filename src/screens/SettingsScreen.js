import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

export default function SettingsScreen({ navigation }) {
  const user = auth.currentUser;

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.log('Erro ao sair:', e);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Configurações</Text>
      <Text style={styles.subtitle}>Gerencie suas preferências do ForgeUp</Text>

      {/* Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perfil</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>👤</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Nome</Text>
              <Text style={styles.cardValue}>{user?.displayName || '--'}</Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>📧</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>E-mail</Text>
              <Text style={styles.cardValue}>{user?.email || '--'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferências</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardRow}>
            <Text style={styles.cardIcon}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Notificações</Text>
              <Text style={styles.cardHint}>Em breve</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.cardDivider} />
          <TouchableOpacity style={styles.cardRow}>
            <Text style={styles.cardIcon}>🎨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Tema</Text>
              <Text style={styles.cardHint}>Em breve</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.cardDivider} />
          <TouchableOpacity style={styles.cardRow}>
            <Text style={styles.cardIcon}>📏</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Unidades de medida</Text>
              <Text style={styles.cardHint}>Em breve</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardRow}>
            <Text style={styles.cardIcon}>📖</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Termos de uso</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.cardDivider} />
          <TouchableOpacity style={styles.cardRow}>
            <Text style={styles.cardIcon}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Privacidade</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.cardDivider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>ℹ️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Versão</Text>
              <Text style={styles.cardValue}>1.0.0</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sair */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  header: { marginBottom: 20 },
  backText: { color: colors.primary, fontSize: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.white, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.gray400, marginBottom: 28 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  card: { backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray300, borderRadius: 14, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  cardIcon: { fontSize: 20 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: colors.white, marginBottom: 2 },
  cardValue: { fontSize: 13, color: colors.gray400 },
  cardHint: { fontSize: 12, color: colors.gray500 },
  cardArrow: { fontSize: 16, color: colors.gray400 },
  cardDivider: { height: 1, backgroundColor: colors.gray300, marginLeft: 52 },
  logoutBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.error, marginTop: 8 },
  logoutText: { color: colors.error, fontSize: 16, fontWeight: '600' },
});
