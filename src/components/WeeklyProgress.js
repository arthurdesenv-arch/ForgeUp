import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { ref, get } from 'firebase/database';
import { auth, db } from '../firebaseConfig';
import { colors } from '../theme/colors';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_KEYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export default function WeeklyProgress({ userData }) {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);
  const animValues = useRef(DIAS_SEMANA.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }
      try {
        const [treinoSnap, userSnap] = await Promise.all([
          get(ref(db, 'treinos/' + uid)),
          get(ref(db, 'usuarios/' + uid)),
        ]);
        const trainingData = treinoSnap.exists() ? treinoSnap.val() : {};
        const userVal = userSnap.exists() ? userSnap.val() : {};

        const diasTreinoConfig = userVal.diasTreinoConfig || {};

        const hoje = new Date();
        const hojeStr = hoje.toDateString();
        const data = [];

        for (let i = 0; i < 7; i++) {
          const date = new Date(hoje);
          date.setDate(hoje.getDate() - 6 + i);

          const dayIndex = date.getDay();
          const dayKey = DIAS_KEYS[dayIndex];
          const letter = diasTreinoConfig[dayKey] || null;
          const isToday = date.toDateString() === hojeStr;
          const isFuture = date > hoje;

          if (letter) {
            const diaData = trainingData[letter] || {};
            const tipo = diaData.tipoAtivo || 'recomendado';
            const sub = diaData[tipo] || diaData.recomendado || {};
            const ex = sub.exercicios || [];
            const total = ex.length;
            const done = ex.filter((e) => e.concluido).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const grupos = sub.grupos || userVal.configuracaoTreinos?.[letter] || [];

            data.push({
              label: DIAS_SEMANA[dayIndex],
              letter,
              total,
              done,
              pct,
              isToday,
              isFuture,
              isRest: false,
              date,
              grupos,
              seriesDone: ex.reduce((s, e) => s + (e.concluido ? (parseInt(e.series, 10) || 0) : 0), 0),
              seriesTotal: ex.reduce((s, e) => s + (parseInt(e.series, 10) || 0), 0),
            });
          } else {
            data.push({
              label: DIAS_SEMANA[dayIndex],
              letter: null,
              total: 0,
              done: 0,
              pct: 0,
              isToday,
              isFuture,
              isRest: true,
              date,
              grupos: [],
              seriesDone: 0,
              seriesTotal: 0,
            });
          }
        }
        setWeeklyData(data);

        // Animate
        const animations = data.map((d, i) =>
          Animated.timing(animValues[i], {
            toValue: d.isRest || d.isFuture ? 0.15 : Math.max(d.pct / 100, d.total > 0 ? 0.12 : 0),
            duration: 400,
            delay: i * 60,
            useNativeDriver: false,
          })
        );
        Animated.parallel(animations).start();
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <View style={[styles.card, styles.cardLoading]}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  if (weeklyData.length === 0) return null;

  const diasComTreino = weeklyData.filter((d) => !d.isRest);
  const diasConcluidos = diasComTreino.filter((d) => d.pct === 100);
  const diasParciais = diasComTreino.filter((d) => d.pct > 0 && d.pct < 100);
  const diasNaoFeitos = diasComTreino.filter((d) => d.pct === 0 && !d.isFuture);
  const todosConcluidos = diasComTreino.length > 0 && diasConcluidos.length === diasComTreino.length;
  const totalSeries = diasComTreino.reduce((s, d) => s + d.seriesDone, 0);
  const maxSeries = diasComTreino.reduce((s, d) => s + d.seriesTotal, 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{todosConcluidos ? '🏆' : '📊'}</Text>
          <View>
            <Text style={styles.title}>Progresso semanal</Text>
            <Text style={styles.subtitle}>
              {diasComTreino.length > 0
                ? `${diasConcluidos.length} de ${diasComTreino.length} treinos`
                : diasNaoFeitos.length > 0
                  ? `${diasNaoFeitos.length} pendentes`
                  : 'Nenhum treino na semana'}
            </Text>
          </View>
        </View>
        {diasComTreino.length > 0 && (
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeText}>
              {Math.round((diasConcluidos.length / Math.max(diasComTreino.length, 1)) * 100)}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chart}>
        {weeklyData.map((day, i) => {
          const isRest = day.isRest;
          const isFuture = day.isFuture;
          const isTrainingDay = !isRest && !isFuture;
          const isNotDone = isTrainingDay && day.pct === 0;
          const isComplete = isTrainingDay && day.pct === 100;

          return (
            <TouchableOpacity
              key={i}
              style={styles.barColumn}
              activeOpacity={0.7}
              onPress={() => {
                if (isRest) {
                  setTooltip({ i, text: `Descanso — ${day.grupos.length ? 'sem treino agendado' : 'dia livre'}` });
                } else if (isTrainingDay) {
                  const status = isComplete ? 'Concluído' : day.pct > 0 ? `${day.pct}%` : 'Pendente';
                  setTooltip({ i, text: `Treino ${day.letter} · ${day.grupos.join('/') || '---'} · ${status}` });
                }
                setTimeout(() => setTooltip(null), 2000);
              }}
            >
              {/* Bar area */}
              <View style={styles.barContainer}>
                {isRest ? (
                  <View style={[styles.barRest, day.isToday && styles.barRestToday]} />
                ) : isFuture ? (
                  <View style={styles.barFuture} />
                ) : (
                  <View style={[styles.barBg, day.isToday && styles.barBgToday]}>
                    <Animated.View
                      style={[
                        styles.barFill,
                        {
                          height: animValues[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                        isComplete && styles.barFillComplete,
                        isNotDone && styles.barFillNotDone,
                      ]}
                    />
                  </View>
                )}

                {/* Tooltip */}
                {tooltip?.i === i && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>{tooltip.text}</Text>
                  </View>
                )}
              </View>

              {/* Day label */}
              <Text style={[styles.barLabel, day.isToday && styles.barLabelToday]}>
                {day.label}
              </Text>

              {/* Letter / indicator */}
              {isRest ? (
                <Text style={styles.barLetter}>—</Text>
              ) : (
                <Text style={[styles.barLetter, day.isToday && styles.barLetterToday, isNotDone && styles.barLetterNotDone]}>
                  {day.letter}
                </Text>
              )}

              {/* Today dot */}
              {day.isToday && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Volume summary */}
      {totalSeries > 0 && (
        <View style={styles.volumeRow}>
          <Text style={styles.volumeIcon}>💪</Text>
          <Text style={styles.volumeText}>
            Volume semanal: <Text style={styles.volumeBold}>{totalSeries}</Text>
            {maxSeries > 0 ? ` de ${maxSeries}` : ''} séries realizadas
          </Text>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Concluído</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Parcial</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.gray300 }]} />
          <Text style={styles.legendText}>Pendente</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotRest]} />
          <Text style={styles.legendText}>Descanso</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray300, borderRadius: 16, padding: 18, marginBottom: 28 },
  cardLoading: { minHeight: 120, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { fontSize: 24 },
  title: { fontSize: 16, fontWeight: '700', color: colors.white },
  subtitle: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  weekBadge: { backgroundColor: '#1A0A00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.primary },
  weekBadgeText: { fontSize: 14, fontWeight: '800', color: colors.primary },

  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, paddingBottom: 4 },

  barColumn: { flex: 1, alignItems: 'center', gap: 4, position: 'relative' },

  barContainer: { width: '100%', alignItems: 'center', justifyContent: 'flex-end', height: 62 },

  barBg: { width: 28, height: '100%', backgroundColor: colors.gray200, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barBgToday: { borderWidth: 1.5, borderColor: colors.primary },

  barFill: { width: '100%', backgroundColor: colors.primary, borderRadius: 8, minHeight: 0 },
  barFillComplete: { backgroundColor: colors.success },
  barFillNotDone: { backgroundColor: colors.gray300, minHeight: 12 },

  barRest: { width: 28, height: 8, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.gray300, borderRadius: 8, borderStyle: 'dashed' },
  barRestToday: { borderColor: colors.primary },

  barFuture: { width: 28, height: 8, backgroundColor: colors.gray200, borderRadius: 8, opacity: 0.4 },

  // Tooltip
  tooltip: {
    position: 'absolute', top: -28, left: -20, right: -20,
    backgroundColor: colors.gray200, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8,
    borderWidth: 1, borderColor: colors.primary, zIndex: 10, alignItems: 'center',
  },
  tooltipText: { fontSize: 9, color: colors.white, fontWeight: '600', textAlign: 'center' },

  // Labels
  barLabel: { fontSize: 11, fontWeight: '600', color: colors.gray400 },
  barLabelToday: { color: colors.primary, fontWeight: '700' },

  barLetter: { fontSize: 10, fontWeight: '700', color: colors.gray500 },
  barLetterToday: { color: colors.primary },
  barLetterNotDone: { color: colors.gray400 },

  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },

  // Volume summary
  volumeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 16, paddingVertical: 10,
    backgroundColor: '#1A0A00', borderRadius: 10, borderWidth: 1, borderColor: colors.gray300,
  },
  volumeIcon: { fontSize: 14 },
  volumeText: { fontSize: 12, color: colors.gray400 },
  volumeBold: { fontWeight: '800', color: colors.primary },

  // Legend
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.gray300, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 4 },
  legendDotRest: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.gray300, borderStyle: 'dashed' },
  legendText: { fontSize: 11, color: colors.gray400, fontWeight: '500' },
});
