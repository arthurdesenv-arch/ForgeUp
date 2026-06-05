import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function IAScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🤖</Text>
      <Text style={styles.title}>Assistente IA</Text>
      <Text style={styles.subtitle}>Em breve você poderá conversar com a IA para tirar dúvidas sobre treinos e evolução.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray400,
    textAlign: 'center',
    lineHeight: 20,
  },
});
