import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { auth, db } from '../firebaseConfig';
import { colors } from '../theme/colors';
import {
  exerciciosPorGrupo, todosGrupos, gruposIcones, gruposPadrao,
  volumeConfig, volumeLabels, gerarExercicios, getExerciciosCount,
  getSeriesRepsValue, getCardioRecomendacao,
} from '../data/exercises';

const DIAS_SEMANA_KEYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
const DIAS_SEMANA_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function migrarGrupos(grupos) {
  return (grupos || []).flatMap((g) => {
    if (g === 'Pernas') return ['Quadríceps', 'Posterior/Glúteos'];
    return [g];
  });
}

function migrarTreinoData(raw, userConfig) {
  if (!raw) return {};
  const out = {};
  for (const dia of Object.keys(raw)) {
    const e = raw[dia];
    if (e.recomendado !== undefined || e.personalizado !== undefined) {
      out[dia] = e;
      continue;
    }
    const tipo = e.tipo || 'recomendado';
    const gruposRec = tipo === 'recomendado' ? migrarGrupos(e.grupos || []) : migrarGrupos(userConfig?.[dia] || []);
    const gruposPer = tipo === 'personalizado' ? migrarGrupos(e.grupos || []) : [];
    out[dia] = {
      tipoAtivo: tipo,
      recomendado: { grupos: gruposRec, exercicios: tipo === 'recomendado' ? (e.exercicios || []) : [] },
      personalizado: { grupos: gruposPer, exercicios: tipo === 'personalizado' ? (e.exercicios || []) : [] },
    };
  }
  return out;
}

export default function TrainingScreen() {
  const user = auth.currentUser;
  const uid = user?.uid;

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [configured, setConfigured] = useState(false);

  const [setupStep, setSetupStep] = useState('volume');
  const [setupVolume, setSetupVolume] = useState(null);
  const [setupDiaAtual, setSetupDiaAtual] = useState(0);
  const [setupGrupos, setSetupGrupos] = useState({});
  const [setupDiasSemana, setSetupDiasSemana] = useState({});

  const [trainingData, setTrainingData] = useState({});
  const [activeTab, setActiveTab] = useState('A');
  const [editingId, setEditingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addGrupo, setAddGrupo] = useState(null);
  const [saving, setSaving] = useState(false);

  const [editSeries, setEditSeries] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editCarga, setEditCarga] = useState('');
  const [editDuracao, setEditDuracao] = useState('');
  const [editIntensidade, setEditIntensidade] = useState('');
  const [showSwap, setShowSwap] = useState(false);

  const divisao = userData?.divisaoTreino || 'ABC';
  const dias = divisao.split('');
  const volume = userData?.volumePreferido || 'medio';
  const nivel = userData?.nivel || 'Iniciante';
  const objective = userData?.objetivo;

  // --- ACTIVE DATA HELPER ---
  function getActiveData(dia) {
    const d = trainingData[dia] || {};
    const tipo = d.tipoAtivo || 'recomendado';
    return d[tipo] || { grupos: [], exercicios: [] };
  }

  function getActiveTipo(dia) {
    return (trainingData[dia] || {}).tipoAtivo || 'recomendado';
  }

  function getGruposDia(dia) {
    return getActiveData(dia).grupos || userData?.configuracaoTreinos?.[dia] || [];
  }

  function getExercicios(dia) {
    return getActiveData(dia).exercicios || [];
  }

  function getCardioDia(dia) {
    return (trainingData[dia] || {}).cardio || null;
  }

  function getProgresso(dia) {
    const ex = getExercicios(dia);
    if (!ex.length) return { concluidos: 0, total: 0 };
    return { total: ex.length, concluidos: ex.filter((e) => e.concluido).length };
  }

  // --- LOAD ---
  useEffect(() => {
    if (!uid) return;
    async function loadAll() {
      try {
        const userSnap = await get(ref(db, 'usuarios/' + uid));
        const userVal = userSnap.exists() ? userSnap.val() : {};

        if (userVal.configuracaoTreinos) {
          for (const dia of Object.keys(userVal.configuracaoTreinos)) {
            userVal.configuracaoTreinos[dia] = migrarGrupos(userVal.configuracaoTreinos[dia]);
          }
          await set(ref(db, 'usuarios/' + uid + '/configuracaoTreinos'), userVal.configuracaoTreinos);
        }

        if (userVal.volumePreferido) {
          setUserData(userVal);
          setConfigured(true);

          const treinoSnap = await get(ref(db, 'treinos/' + uid));
          const raw = treinoSnap.exists() ? treinoSnap.val() : {};
          const migrated = migrarTreinoData(raw, userVal.configuracaoTreinos);
          setTrainingData(migrated);

          // Save migrated structure back
          for (const dia of Object.keys(migrated)) {
            const d = migrated[dia];
            await set(ref(db, 'treinos/' + uid + '/' + dia + '/recomendado'), d.recomendado || { grupos: [], exercicios: [] });
            await set(ref(db, 'treinos/' + uid + '/' + dia + '/personalizado'), d.personalizado || { grupos: [], exercicios: [] });
            await set(ref(db, 'treinos/' + uid + '/' + dia + '/tipoAtivo'), d.tipoAtivo || 'recomendado');
          }
        } else {
          setUserData(userVal);
          setConfigured(false);
          setSetupStep('volume');

          const divisaoStr = userVal.divisaoTreino || 'ABC';
          const diasArr = divisaoStr.split('');
          const padrao = gruposPadrao[diasArr.length] || {};
          const gruposIniciais = {};
          diasArr.forEach((d) => { gruposIniciais[d] = padrao[d] || []; });
          setSetupGrupos(gruposIniciais);
          const diasIniciais = {};
          diasArr.forEach((d) => { diasIniciais[d] = null; });
          setSetupDiasSemana(diasIniciais);
        }
      } catch (error) {
        console.log('Erro ao carregar:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // --- SAVE ---
  async function saveDia(dia, updates) {
    if (!uid) return;
    try {
      for (const key of Object.keys(updates)) {
        await set(ref(db, 'treinos/' + uid + '/' + dia + '/' + key), updates[key]);
      }
      setTrainingData((prev) => {
        const current = { ...(prev[dia] || {}) };
        for (const key of Object.keys(updates)) {
          current[key] = updates[key];
        }
        return { ...prev, [dia]: current };
      });
    } catch (error) {
      console.log('Erro ao salvar:', error);
    }
  }

  // --- TOGGLE CONCLUIDO ---
  async function toggleConcluido(dia, exId) {
    const tipo = getActiveTipo(dia);
    const active = getActiveData(dia);
    const newEx = active.exercicios.map((ex) =>
      ex.id === exId ? { ...ex, concluido: !ex.concluido } : ex
    );
    await saveDia(dia, { [tipo]: { ...active, exercicios: newEx } });
  }

  // --- SAVE EDIT ---
  async function salvarEdicao(dia, exId, exTipo) {
    const tipo = getActiveTipo(dia);
    const active = getActiveData(dia);

    if (exTipo === 'cardio') {
      const cardio = {
        ...((trainingData[dia] || {}).cardio || { id: 'cardio-main' }),
        duracao: editDuracao,
        intensidade: editIntensidade,
      };
      await saveDia(dia, { cardio });
    } else {
      const newEx = active.exercicios.map((ex) =>
        ex.id === exId
          ? { ...ex, series: parseInt(editSeries, 10) || ex.series, reps: editReps, carga: editCarga }
          : ex
      );
      await saveDia(dia, { [tipo]: { ...active, exercicios: newEx } });
    }
    setEditingId(null);
    setShowSwap(false);
  }

  // --- REMOVE ---
  async function removerExercicio(dia, exId) {
    const tipo = getActiveTipo(dia);
    const active = getActiveData(dia);
    const newEx = active.exercicios.filter((ex) => ex.id !== exId);
    await saveDia(dia, { [tipo]: { ...active, exercicios: newEx } });
    setEditingId(null);
    setShowSwap(false);
  }

  async function removerCardio(dia) {
    await saveDia(dia, { cardio: null });
    setEditingId(null);
  }

  // --- SWAP ---
  async function trocarExercicio(dia, exId, novo) {
    const tipo = getActiveTipo(dia);
    const active = getActiveData(dia);
    const seriesVal = getSeriesRepsValue(volume, nivel, 'series');
    const config = volumeConfig[volume]?.[nivel];
    const newEx = active.exercicios.map((ex) =>
      ex.id === exId
        ? { ...ex, id: dia + '-' + Date.now(), nome: novo.nome, grupoMuscular: novo.grupoMuscular || ex.grupoMuscular, series: seriesVal, reps: config?.reps || '12', carga: '', concluido: false }
        : ex
    );
    await saveDia(dia, { [tipo]: { ...active, exercicios: newEx } });
    setEditingId(null);
    setShowSwap(false);
  }

  // --- ADD ---
  async function adicionarExercicio(dia, exercicio) {
    const tipo = getActiveTipo(dia);
    const active = getActiveData(dia);
    const grupo = exercicio.grupoMuscular || addGrupo;

    if (grupo === 'Cardio') {
      const cardio = {
        id: 'cardio-' + Date.now(),
        nome: exercicio.nome,
        grupoMuscular: 'Cardio',
        tipo: 'cardio',
        duracao: getCardioRecomendacao(objective).duracao,
        intensidade: exercicio.intensidadeSugerida || 'Moderada',
        concluido: false,
      };
      await saveDia(dia, { cardio });
    } else {
      const seriesVal = getSeriesRepsValue(volume, nivel, 'series');
      const config = volumeConfig[volume]?.[nivel];
      const novo = {
        id: dia + '-' + Date.now(),
        nome: exercicio.nome,
        grupoMuscular: grupo,
        tipo: 'forca',
        series: seriesVal,
        reps: config?.reps || '12',
        carga: '',
        concluido: false,
      };
      await saveDia(dia, { [tipo]: { ...active, exercicios: [...active.exercicios, novo] } });
    }
    setShowAddModal(false);
    setAddGrupo(null);
  }

  // --- TOGGLE MODO ---
  async function toggleModo(dia) {
    const current = trainingData[dia] || {};
    const novoAtivo = current.tipoAtivo === 'recomendado' ? 'personalizado' : 'recomendado';

    // If switching to personalizado and it's empty, set it empty
    const persData = current.personalizado || { grupos: [], exercicios: [] };
    const recData = current.recomendado || { grupos: [], exercicios: [] };

    if (novoAtivo === 'recomendado' && recData.exercicios.length === 0) {
      const grupos = recData.grupos.length > 0 ? recData.grupos : userData?.configuracaoTreinos?.[dia] || [];
      const exercicios = gerarExercicios(volume, nivel, grupos, dia);
      await saveDia(dia, {
        tipoAtivo: novoAtivo,
        recomendado: { grupos, exercicios },
        personalizado: persData,
      });
    } else {
      await saveDia(dia, { tipoAtivo: novoAtivo });
    }
  }

  // --- RESET ---
  async function handleResetTreino(dia) {
    const tipo = getActiveTipo(dia);
    const grupos = getGruposDia(dia);
    Alert.alert(
      'Resetar treino',
      `Deseja restaurar o treino ${dia} para os exercícios recomendados? Os exercícios atuais deste modo serão substituídos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar',
          style: 'destructive',
          onPress: async () => {
            const exercicios = gerarExercicios(volume, nivel, grupos, dia);
            await saveDia(dia, { [tipo]: { grupos, exercicios } });
          },
        },
      ]
    );
  }

  // --- SETUP FINALIZE ---
  async function finalizarSetup() {
    setSaving(true);
    try {
      await set(ref(db, 'usuarios/' + uid + '/volumePreferido'), setupVolume);
      await set(ref(db, 'usuarios/' + uid + '/configuracaoTreinos'), setupGrupos);

      const diasTreinoConfig = { segunda: null, terca: null, quarta: null, quinta: null, sexta: null, sabado: null, domingo: null };
      for (const [letra, dia] of Object.entries(setupDiasSemana)) {
        if (dia) diasTreinoConfig[dia] = letra;
      }
      await set(ref(db, 'usuarios/' + uid + '/diasTreinoConfig'), diasTreinoConfig);

      for (const dia of Object.keys(setupGrupos)) {
        const grupos = setupGrupos[dia];
        const exercicios = grupos.length > 0 ? gerarExercicios(setupVolume, nivel, grupos, dia) : [];
        await saveDia(dia, {
          tipoAtivo: 'recomendado',
          recomendado: { grupos, exercicios },
          personalizado: { grupos: [], exercicios: [] },
        });
      }

      setUserData((prev) => ({ ...prev, volumePreferido: setupVolume, configuracaoTreinos: setupGrupos }));
      setConfigured(true);
    } catch (error) {
      console.log('Erro ao salvar setup:', error);
    } finally {
      setSaving(false);
    }
  }

  // --- EDITING HELPERS ---
  function startEditing(ex) {
    setEditingId(ex.id);
    setShowSwap(false);
    if (ex.tipo === 'cardio') {
      setEditDuracao(ex.duracao || '');
      setEditIntensidade(ex.intensidade || '');
    } else {
      setEditSeries(String(ex.series || ''));
      setEditReps(String(ex.reps || ''));
      setEditCarga(ex.carga || '');
    }
  }

  function toggleCardioConcluido(dia) {
    const cardio = (trainingData[dia] || {}).cardio;
    if (!cardio) return;
    saveDia(dia, { cardio: { ...cardio, concluido: !cardio.concluido } });
  }

  // --- RENDER ---
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!configured) {
    return renderSetup();
  }

  return renderMain();

  // ===============================================
  //  SETUP
  // ===============================================
  function renderSetup() {
    if (setupStep === 'volume') {
      return (
        <View style={styles.container}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: '33%' }]} /></View>
              <Text style={styles.progressText}>Passo 1 de 3 — Volume</Text>
            </View>

            <Text style={styles.setupTitle}>Qual seu volume de treino?</Text>
            <Text style={styles.setupSubtitle}>Base científica: Schoenfeld et al. (2017-2018)</Text>

            {Object.entries(volumeLabels).map(([key, info]) => (
              <TouchableOpacity key={key} style={[styles.volumeCard, setupVolume === key && styles.volumeCardActive]} onPress={() => setSetupVolume(key)}>
                <View style={styles.volumeHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.volumeRadio}>{setupVolume === key ? '●' : '○'}</Text>
                    <Text style={[styles.volumeNome, setupVolume === key && styles.volumeNomeActive]}>{info.nome}</Text>
                  </View>
                  <Text style={[styles.volumeTempo, setupVolume === key && styles.volumeTempoActive]}>{info.tempo}</Text>
                </View>
                <Text style={[styles.volumeDesc, setupVolume === key && styles.volumeDescActive]}>{info.descricao}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.buttonPrimary, !setupVolume && styles.buttonDisabled]} onPress={() => { setSetupStep('grupos'); setSetupDiaAtual(0); }} disabled={!setupVolume}>
              <Text style={styles.buttonPrimaryText}>Continuar</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      );
    }

    if (setupStep === 'dias') {
      const diaAtual = dias[setupDiaAtual];
      const diaSelecionado = setupDiasSemana[diaAtual] || null;
      const diasOcupados = dias.filter((d) => d !== diaAtual).map((d) => setupDiasSemana[d]).filter(Boolean);

      function selecionarDia(key) {
        setSetupDiasSemana((prev) => {
          const next = { ...prev };
          for (const k of Object.keys(next)) {
            if (next[k] === key) next[k] = null;
          }
          next[diaAtual] = key;
          return next;
        });
      }

      return (
        <View style={styles.container}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: '100%' }]} /></View>
              <Text style={styles.progressText}>Passo 3 de 3 — Dias da semana</Text>
            </View>

            <View style={styles.diaTabs}>
              {dias.map((d, i) => {
                const sel = setupDiasSemana[d];
                const label = sel ? DIAS_SEMANA_LABELS[DIAS_SEMANA_KEYS.indexOf(sel)] : null;
                return (
                  <TouchableOpacity key={d} style={[styles.diaTab, i === setupDiaAtual && styles.diaTabActive]} onPress={() => setSetupDiaAtual(i)}>
                    <Text style={[styles.diaTabText, i === setupDiaAtual && styles.diaTabTextActive]} numberOfLines={1}>Treino {d}</Text>
                    {label && <Text style={[styles.diaTabBadge, i === setupDiaAtual && styles.diaTabBadgeActive]}>{label}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.setupTitle}>Treino {diaAtual}</Text>
            <Text style={styles.setupSubtitle}>Em qual dia da semana você vai fazer o treino {diaAtual}?</Text>
            <Text style={styles.diaGroupsHint}>
              {gruposIcones[setupGrupos[diaAtual]?.[0]] || '🏋️'} {(setupGrupos[diaAtual] || []).join(', ') || 'Nenhum grupo'}
            </Text>

            <View style={styles.diasGrid}>
              {DIAS_SEMANA_KEYS.map((key, i) => {
                const ocupado = diasOcupados.includes(key);
                const selected = diaSelecionado === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.diaBtn,
                      selected && styles.diaBtnActive,
                      ocupado && styles.diaBtnDisabled,
                    ]}
                    onPress={() => !ocupado && selecionarDia(key)}
                    disabled={ocupado}
                  >
                    <Text style={[styles.diaBtnText, selected && styles.diaBtnTextActive, ocupado && styles.diaBtnTextDisabled]}>
                      {DIAS_SEMANA_LABELS[i]}
                    </Text>
                    <Text style={[styles.diaBtnSub, selected && styles.diaBtnSubActive, ocupado && styles.diaBtnSubDisabled]}>
                      {selected ? '✓' : ocupado ? dias.find((d) => setupDiasSemana[d] === key) || '' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!diaSelecionado && (
              <View style={styles.infoBox}><Text style={styles.infoText}>Selecione um dia da semana para este treino.</Text></View>
            )}

            <View style={styles.setupNav}>
              <TouchableOpacity style={styles.buttonSecondary} onPress={() => { if (setupDiaAtual > 0) setSetupDiaAtual(setupDiaAtual - 1); else setSetupStep('grupos'); }}>
                <Text style={styles.buttonSecondaryText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonPrimary, { flex: 1, marginLeft: 12 }]}
                onPress={() => {
                  if (setupDiaAtual < dias.length - 1) setSetupDiaAtual(setupDiaAtual + 1);
                  else finalizarSetup();
                }}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonPrimaryText}>{setupDiaAtual < dias.length - 1 ? 'Próximo' : 'Finalizar'}</Text>}
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      );
    }

    // GRUPOS STEP
    const diaAtual = dias[setupDiaAtual];
    const gruposSelecionados = setupGrupos[diaAtual] || [];

    function toggleGrupo(grupo) {
      const novos = gruposSelecionados.includes(grupo) ? gruposSelecionados.filter((g) => g !== grupo) : [...gruposSelecionados, grupo];
      setSetupGrupos((prev) => ({ ...prev, [diaAtual]: novos }));
    }

    return (
      <View style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: '66%' }]} /></View>
            <Text style={styles.progressText}>Passo 2 de 3 — Grupos</Text>
          </View>

          <View style={styles.diaTabs}>
            {dias.map((d, i) => {
              const cnt = (setupGrupos[d] || []).length;
              return (
                <TouchableOpacity key={d} style={[styles.diaTab, i === setupDiaAtual && styles.diaTabActive]} onPress={() => setSetupDiaAtual(i)}>
                  <Text style={[styles.diaTabText, i === setupDiaAtual && styles.diaTabTextActive]} numberOfLines={1}>Treino {d}</Text>
                  {cnt > 0 && <Text style={[styles.diaTabBadge, i === setupDiaAtual && styles.diaTabBadgeActive]}>{cnt}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.setupTitle}>Treino {diaAtual}</Text>
          <Text style={styles.setupSubtitle}>Quais grupos musculares você quer treinar neste dia?</Text>

          <View style={styles.gruposGrid}>
            {todosGrupos.filter((g) => g !== 'Cardio').map((grupo) => {
              const selected = gruposSelecionados.includes(grupo);
              const c = getExerciciosCount(setupVolume || 'medio', grupo);
              const hint = c ? `${c.min}-${c.max} ex` : '';
              return (
                <TouchableOpacity key={grupo} style={[styles.grupoBtn, selected && styles.grupoBtnActive]} onPress={() => toggleGrupo(grupo)}>
                  <Text style={styles.grupoBtnIcon}>{gruposIcones[grupo] || '🏋️'}</Text>
                  <Text style={[styles.grupoBtnLabel, selected && styles.grupoBtnLabelActive]}>{grupo}</Text>
                  {hint ? <Text style={[styles.grupoBtnHint, selected && styles.grupoBtnHintActive]}>{hint}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {gruposSelecionados.length === 0 && (
            <View style={styles.infoBox}><Text style={styles.infoText}>Selecione pelo menos 1 grupo muscular para este dia.</Text></View>
          )}

          <View style={styles.setupNav}>
            <TouchableOpacity style={styles.buttonSecondary} onPress={() => { if (setupDiaAtual > 0) setSetupDiaAtual(setupDiaAtual - 1); else setSetupStep('volume'); }}>
              <Text style={styles.buttonSecondaryText}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buttonPrimary, { flex: 1, marginLeft: 12 }]} onPress={() => { if (setupDiaAtual < dias.length - 1) setSetupDiaAtual(setupDiaAtual + 1); else { setSetupStep('dias'); setSetupDiaAtual(0); } }}>
              <Text style={styles.buttonPrimaryText}>{setupDiaAtual < dias.length - 1 ? 'Próximo' : 'Continuar'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ===============================================
  //  MAIN VIEW
  // ===============================================
  function renderMain() {
    const progresso = getProgresso(activeTab);
    const pct = progresso.total > 0 ? Math.round((progresso.concluidos / progresso.total) * 100) : 0;
    const modo = getActiveTipo(activeTab);
    const exercicios = getExercicios(activeTab);
    const gruposDia = getGruposDia(activeTab);
    const cardio = getCardioDia(activeTab);

    return (
      <View style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.mainHeader}>
            <View>
              <Text style={styles.mainDivision}>Divisão {divisao}</Text>
              <Text style={styles.mainVolume}>Volume {volumeLabels[volume]?.nome || 'Médio'} · {nivel}</Text>
            </View>
            <TouchableOpacity style={styles.regenerateBtn} onPress={() => handleResetTreino(activeTab)}>
              <Text style={styles.regenerateBtnText}>↻</Text>
            </TouchableOpacity>
          </View>

          {/* Day Tabs */}
          <View style={styles.diaTabs}>
            {dias.map((d) => {
              const dEx = getExercicios(d);
              const dCardio = getCardioDia(d);
              const total = dEx.length + (dCardio ? 1 : 0);
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.diaTab, d === activeTab && styles.diaTabActive]}
                  onPress={() => { setActiveTab(d); setEditingId(null); setShowSwap(false); }}
                >
                  <Text style={[styles.diaTabText, d === activeTab && styles.diaTabTextActive]} numberOfLines={1}>
                    Treino {d}
                  </Text>
                  {total > 0 && <Text style={[styles.diaTabBadge, d === activeTab && styles.diaTabBadgeActive]}>{total}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Toggle */}
          <Text style={styles.toggleHint}>
            {modo === 'recomendado' ? 'Treino pré-montado com base no seu perfil' : 'Monte seu treino do zero'}
          </Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity style={[styles.toggleBtn, modo === 'recomendado' && styles.toggleBtnActive]} onPress={() => { if (modo !== 'recomendado') toggleModo(activeTab); }}>
              <Text style={[styles.toggleText, modo === 'recomendado' && styles.toggleTextActive]}>Recomendado</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, modo === 'personalizado' && styles.toggleBtnActive]} onPress={() => { if (modo !== 'personalizado') toggleModo(activeTab); }}>
              <Text style={[styles.toggleText, modo === 'personalizado' && styles.toggleTextActive]}>Personalizado</Text>
            </TouchableOpacity>
          </View>

          {/* Groups */}
          <Text style={styles.gruposLabel}>
            {gruposDia.length > 0 ? gruposDia.map((g) => gruposIcones[g] + ' ' + g).join('  •  ') : 'Nenhum grupo definido'}
          </Text>

          {/* Progress */}
          {progresso.total > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>{progresso.concluidos} de {progresso.total} concluídos</Text>
                <Text style={styles.progressPct}>{pct}%</Text>
              </View>
              <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: pct + '%' }]} /></View>
            </View>
          )}

          {/* Empty state */}
          {exercicios.length === 0 && !cardio && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>{modo === 'personalizado' ? '📋' : '📋'}</Text>
              <Text style={styles.emptyTitle}>{modo === 'personalizado' ? 'Treino vazio' : 'Nenhum exercício'}</Text>
              <Text style={styles.emptyText}>
                {modo === 'personalizado' ? 'Monte seu treino do zero adicionando exercícios.' : 'Toque em ↻ para gerar os exercícios recomendados.'}
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => (modo === 'personalizado' ? setShowAddModal(true) : handleResetTreino(activeTab))}>
                <Text style={styles.emptyBtnText}>{modo === 'personalizado' ? '+ Adicionar exercício' : 'Gerar treino recomendado'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Exercise list */}
          {exercicios.map((ex) => {
            const isEditing = editingId === ex.id;
            const isCardio = ex.tipo === 'cardio';
            return (
              <View key={ex.id} style={[styles.exerciseCard, isCardio && styles.cardioCard]}>
                <View style={styles.exerciseRow}>
                  <TouchableOpacity style={styles.checkbox} onPress={() => toggleConcluido(activeTab, ex.id)}>
                    <View style={[styles.checkboxBox, ex.concluido && styles.checkboxBoxChecked]}>
                      {ex.concluido && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, ex.concluido && styles.exerciseNameDone]}>{ex.nome}</Text>
                    <View style={styles.exerciseMeta}>
                      {isCardio ? (
                        <><Text style={styles.exerciseMetaText}>{ex.duracao || '--'}</Text><Text style={styles.exerciseMetaText}> · {ex.intensidade || '--'}</Text></>
                      ) : (
                        <><Text style={styles.exerciseMetaText}>{ex.series} séries × {ex.reps} reps</Text>{ex.carga ? <Text style={styles.exerciseMetaText}> · {ex.carga}</Text> : null}</>
                      )}
                      <Text style={styles.exerciseMetaText}> · {ex.grupoMuscular}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.editBtn} onPress={() => { if (isEditing) { setEditingId(null); setShowSwap(false); } else startEditing(ex); }}>
                    <Text style={styles.editBtnText}>{isEditing ? '✕' : '✎'}</Text>
                  </TouchableOpacity>
                </View>

                {isEditing && (
                  <View style={styles.editPanel}>
                    {isCardio ? (
                      <>
                        <View style={styles.editFields}>
                          <View style={styles.editField}><Text style={styles.editLabel}>Duração</Text><TextInput style={styles.editInput} value={editDuracao} onChangeText={setEditDuracao} placeholder="20-30 min" placeholderTextColor={colors.gray400} /></View>
                          <View style={styles.editField}><Text style={styles.editLabel}>Intensidade</Text><TextInput style={styles.editInput} value={editIntensidade} onChangeText={setEditIntensidade} placeholder="Moderada" placeholderTextColor={colors.gray400} /></View>
                        </View>
                        <View style={styles.editActions}>
                          <TouchableOpacity style={styles.editActionBtn} onPress={() => salvarEdicao(activeTab, ex.id, 'cardio')}><Text style={styles.editActionSave}>Salvar</Text></TouchableOpacity>
                          <TouchableOpacity style={styles.editActionBtnDanger} onPress={() => removerExercicio(activeTab, ex.id)}><Text style={styles.editActionDanger}>Remover</Text></TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.editFields}>
                          <View style={styles.editField}><Text style={styles.editLabel}>Séries</Text><TextInput style={styles.editInput} keyboardType="numeric" value={editSeries} onChangeText={setEditSeries} placeholderTextColor={colors.gray400} /></View>
                          <View style={styles.editField}><Text style={styles.editLabel}>Reps</Text><TextInput style={styles.editInput} value={editReps} onChangeText={setEditReps} placeholderTextColor={colors.gray400} /></View>
                          <View style={styles.editField}><Text style={styles.editLabel}>Carga</Text><TextInput style={styles.editInput} value={editCarga} onChangeText={setEditCarga} placeholder="kg" placeholderTextColor={colors.gray400} /></View>
                        </View>
                        <View style={styles.editActions}>
                          <TouchableOpacity style={styles.editActionBtn} onPress={() => salvarEdicao(activeTab, ex.id, 'forca')}><Text style={styles.editActionSave}>Salvar</Text></TouchableOpacity>
                          <TouchableOpacity style={styles.editActionBtnOutline} onPress={() => setShowSwap(!showSwap)}><Text style={styles.editActionOutline}>Trocar</Text></TouchableOpacity>
                          <TouchableOpacity style={styles.editActionBtnDanger} onPress={() => removerExercicio(activeTab, ex.id)}><Text style={styles.editActionDanger}>Remover</Text></TouchableOpacity>
                        </View>
                        {showSwap && (
                          <View style={styles.swapPanel}>
                            <Text style={styles.swapTitle}>Trocar por:</Text>
                            {(exerciciosPorGrupo[ex.grupoMuscular] || []).map((alt) => (
                              <TouchableOpacity key={alt.id} style={styles.swapItem} onPress={() => trocarExercicio(activeTab, ex.id, { ...alt, grupoMuscular: ex.grupoMuscular })}>
                                <Text style={styles.swapItemText}>{alt.nome}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {/* Cardio block */}
          {cardio && (
            <View style={[styles.exerciseCard, styles.cardioCard]}>
              <View style={styles.exerciseRow}>
                <TouchableOpacity style={styles.checkbox} onPress={() => toggleCardioConcluido(activeTab)}>
                  <View style={[styles.checkboxBox, cardio.concluido && styles.checkboxBoxChecked]}>{cardio.concluido && <Text style={styles.checkMark}>✓</Text>}</View>
                </TouchableOpacity>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, cardio.concluido && styles.exerciseNameDone]}>{cardio.nome || 'Cardio'}</Text>
                  <View style={styles.exerciseMeta}>
                    <Text style={styles.exerciseMetaText}>{cardio.duracao || '--'}</Text>
                    <Text style={styles.exerciseMetaText}> · {cardio.intensidade || '--'}</Text>
                    <Text style={styles.exerciseMetaText}> · Cardio</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => {
                  if (editingId === 'cardio-main') { setEditingId(null); } else { setEditingId('cardio-main'); setEditDuracao(cardio.duracao || ''); setEditIntensidade(cardio.intensidade || ''); }
                }}><Text style={styles.editBtnText}>{editingId === 'cardio-main' ? '✕' : '✎'}</Text></TouchableOpacity>
              </View>
              {editingId === 'cardio-main' && (
                <View style={styles.editPanel}>
                  <View style={styles.editFields}>
                    <View style={styles.editField}><Text style={styles.editLabel}>Duração</Text><TextInput style={styles.editInput} value={editDuracao} onChangeText={setEditDuracao} placeholder="20-30 min" placeholderTextColor={colors.gray400} /></View>
                    <View style={styles.editField}><Text style={styles.editLabel}>Intensidade</Text><TextInput style={styles.editInput} value={editIntensidade} onChangeText={setEditIntensidade} placeholder="Moderada" placeholderTextColor={colors.gray400} /></View>
                  </View>
                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.editActionBtn} onPress={() => salvarEdicao(activeTab, 'cardio-main', 'cardio')}><Text style={styles.editActionSave}>Salvar</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.editActionBtnDanger} onPress={() => removerCardio(activeTab)}><Text style={styles.editActionDanger}>Remover</Text></TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Cardio suggestion */}
          {!cardio && getCardioRecomendacao(objective) && (
            <View style={styles.cardioRecBar}>
              <View style={styles.cardioRecInfo}>
                <Text style={styles.cardioRecIcon}>🏃</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardioRecTitle}>Adicionar cardio?</Text>
                  <Text style={styles.cardioRecText}>{getCardioRecomendacao(objective).duracao} · {getCardioRecomendacao(objective).intensidade}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.cardioRecAdd} onPress={() => {
                const rec = getCardioRecomendacao(objective);
                saveDia(activeTab, { cardio: { id: 'cardio-' + Date.now(), nome: 'Cardio', grupoMuscular: 'Cardio', tipo: 'cardio', duracao: rec.duracao, intensidade: rec.intensidade, concluido: false } });
              }}><Text style={styles.cardioRecAddText}>+</Text></TouchableOpacity>
            </View>
          )}

          {/* Add button */}
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addBtnText}>+ Adicionar exercício</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Add Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Adicionar exercício</Text>
                <TouchableOpacity onPress={() => { setShowAddModal(false); setAddGrupo(null); }}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
              </View>
              {!addGrupo ? (
                <View style={styles.modalGruposGrid}>
                  {todosGrupos.map((grupo) => (
                    <TouchableOpacity key={grupo} style={styles.modalGrupoBtn} onPress={() => setAddGrupo(grupo)}>
                      <Text style={styles.modalGrupoIcon}>{gruposIcones[grupo] || '🏋️'}</Text>
                      <Text style={styles.modalGrupoLabel}>{grupo}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View>
                  <TouchableOpacity style={styles.modalBack} onPress={() => setAddGrupo(null)}><Text style={styles.modalBackText}>← Voltar</Text></TouchableOpacity>
                  <Text style={styles.modalGrupoTitle}>{gruposIcones[addGrupo] || ''} {addGrupo}</Text>
                  <ScrollView style={styles.modalExList}>
                    {(exerciciosPorGrupo[addGrupo] || []).map((ex) => (
                      <TouchableOpacity key={ex.id} style={styles.modalExItem} onPress={() => adicionarExercicio(activeTab, { ...ex, grupoMuscular: addGrupo })}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modalExText}>{ex.nome}</Text>
                          <Text style={styles.modalExMeta}>{ex.equipamento} · {ex.dificuldade}</Text>
                        </View>
                        <Text style={styles.modalExPlus}>+</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },

  progressContainer: { marginBottom: 24 },
  progressBarBg: { height: 4, backgroundColor: colors.gray200, borderRadius: 2, marginBottom: 8 },
  progressBarFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  progressText: { fontSize: 12, color: colors.gray400 },

  setupTitle: { fontSize: 26, fontWeight: '800', color: colors.white, letterSpacing: -0.5, marginBottom: 6 },
  setupSubtitle: { fontSize: 13, color: colors.gray400, marginBottom: 24, lineHeight: 18 },

  volumeCard: { backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray300, borderRadius: 16, padding: 18, marginBottom: 12 },
  volumeCardActive: { borderColor: colors.primary, backgroundColor: '#1A0A00' },
  volumeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  volumeRadio: { fontSize: 16, color: colors.gray400 },
  volumeNome: { fontSize: 18, fontWeight: '700', color: colors.white },
  volumeNomeActive: { color: colors.primary },
  volumeTempo: { fontSize: 13, color: colors.gray400, fontWeight: '600' },
  volumeTempoActive: { color: colors.primary },
  volumeDesc: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
  volumeDescActive: { color: colors.gray300 },

  buttonPrimary: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  buttonPrimaryText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  buttonSecondary: { backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.gray300 },
  buttonSecondaryText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.4 },

  diaTabs: { flexDirection: 'row', marginBottom: 20, gap: 6 },
  diaTab: {
    flex: 1, flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 14,
    backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray300,
    alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden',
  },
  diaTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  diaTabText: { fontSize: 13, fontWeight: '600', color: colors.gray400, flexShrink: 1 },
  diaTabTextActive: { color: colors.white },
  diaTabBadge: { fontSize: 10, fontWeight: '700', color: colors.gray400, backgroundColor: colors.gray200, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8, overflow: 'hidden', minWidth: 18, textAlign: 'center' },
  diaTabBadgeActive: { color: colors.white, backgroundColor: 'rgba(255,255,255,0.2)' },

  gruposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  grupoBtn: { backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray300, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, alignItems: 'center', gap: 4, width: '30%', flexGrow: 1, minWidth: 100 },
  grupoBtnActive: { borderColor: colors.primary, backgroundColor: '#1A0A00' },
  grupoBtnIcon: { fontSize: 22 },
  grupoBtnLabel: { fontSize: 12, fontWeight: '600', color: colors.gray400, textAlign: 'center' },
  grupoBtnLabelActive: { color: colors.primary },
  grupoBtnHint: { fontSize: 10, color: colors.gray500 },
  grupoBtnHintActive: { color: colors.primary },

  infoBox: { backgroundColor: colors.gray100, borderRadius: 12, padding: 14, marginBottom: 16 },
  infoText: { fontSize: 13, color: colors.gray400, lineHeight: 20, textAlign: 'center' },
  setupNav: { flexDirection: 'row', marginTop: 8 },

  // Dias da semana step
  diaGroupsHint: { fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: 24 },
  diasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  diaBtn: {
    backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray300,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 4,
    width: '13%', flexGrow: 1, minWidth: 44,
  },
  diaBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  diaBtnDisabled: { opacity: 0.3 },
  diaBtnText: { fontSize: 13, fontWeight: '600', color: colors.gray400 },
  diaBtnTextActive: { color: colors.white },
  diaBtnTextDisabled: { color: colors.gray500 },
  diaBtnSub: { fontSize: 10, color: colors.gray500 },
  diaBtnSubActive: { color: colors.white },
  diaBtnSubDisabled: { fontSize: 10, color: colors.gray500 },

  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  mainDivision: { fontSize: 24, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  mainVolume: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 2 },
  regenerateBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray200, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.gray300 },
  regenerateBtnText: { fontSize: 20, color: colors.gray400 },

  toggleHint: { fontSize: 12, color: colors.gray500, marginBottom: 8, textAlign: 'center' },
  toggleContainer: { flexDirection: 'row', backgroundColor: colors.gray100, borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: colors.gray300 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: 13, fontWeight: '600', color: colors.gray400 },
  toggleTextActive: { color: colors.white },

  gruposLabel: { fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: 14, lineHeight: 20 },

  progressSection: { marginBottom: 18 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle: { fontSize: 13, color: colors.gray400, fontWeight: '600' },
  progressPct: { fontSize: 18, fontWeight: '800', color: colors.white },

  exerciseCard: { backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray300, borderRadius: 14, marginBottom: 8, overflow: 'hidden' },
  cardioCard: { borderColor: '#006666', borderLeftWidth: 3 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  checkbox: { padding: 2 },
  checkboxBox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  checkboxBoxChecked: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { color: colors.white, fontSize: 13, fontWeight: '800' },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '600', color: colors.white, marginBottom: 3 },
  exerciseNameDone: { color: colors.gray400, textDecorationLine: 'line-through' },
  exerciseMeta: { flexDirection: 'row', flexWrap: 'wrap' },
  exerciseMetaText: { fontSize: 11, color: colors.gray400, fontWeight: '500', marginRight: 4 },
  editBtn: { padding: 4 },
  editBtnText: { fontSize: 16, color: colors.gray400 },

  editPanel: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.gray300 },
  editFields: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  editField: { flex: 1 },
  editLabel: { fontSize: 11, color: colors.gray400, marginBottom: 4, fontWeight: '600' },
  editInput: { backgroundColor: colors.gray200, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: colors.white, fontSize: 14, borderWidth: 1, borderColor: colors.gray300 },

  editActions: { flexDirection: 'row', gap: 8 },
  editActionBtn: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  editActionSave: { color: colors.white, fontSize: 13, fontWeight: '700' },
  editActionBtnOutline: { backgroundColor: 'transparent', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.gray300 },
  editActionOutline: { color: colors.gray400, fontSize: 13, fontWeight: '600' },
  editActionBtnDanger: { backgroundColor: 'transparent', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.error },
  editActionDanger: { color: colors.error, fontSize: 13, fontWeight: '600' },

  swapPanel: { marginTop: 12, padding: 12, backgroundColor: colors.gray200, borderRadius: 12 },
  swapTitle: { fontSize: 12, color: colors.gray400, fontWeight: '600', marginBottom: 8 },
  swapItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.gray300 },
  swapItemText: { fontSize: 13, color: colors.white },

  addBtn: { paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: colors.gray300, borderStyle: 'dashed', alignItems: 'center', marginTop: 8 },
  addBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },

  emptyBox: { backgroundColor: colors.gray100, borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 12 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.white, marginBottom: 6 },
  emptyText: { fontSize: 13, color: colors.gray400, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  emptyBtn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  emptyBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },

  cardioRecBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray100, borderWidth: 1, borderColor: '#006666', borderRadius: 14, padding: 14, marginBottom: 8 },
  cardioRecInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardioRecIcon: { fontSize: 24 },
  cardioRecTitle: { fontSize: 14, fontWeight: '700', color: colors.white, marginBottom: 2 },
  cardioRecText: { fontSize: 11, color: colors.gray400 },
  cardioRecAdd: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#006666', alignItems: 'center', justifyContent: 'center' },
  cardioRecAddText: { color: colors.white, fontSize: 20, fontWeight: '700', marginTop: -1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.gray100, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.white },
  modalClose: { fontSize: 20, color: colors.gray400, padding: 4 },
  modalGruposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 20 },
  modalGrupoBtn: { backgroundColor: colors.gray200, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', gap: 6, width: '30%', flexGrow: 1, minWidth: 95, borderWidth: 1, borderColor: colors.gray300 },
  modalGrupoIcon: { fontSize: 24 },
  modalGrupoLabel: { fontSize: 11, fontWeight: '600', color: colors.white, textAlign: 'center' },
  modalBack: { marginBottom: 12 },
  modalBackText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  modalGrupoTitle: { fontSize: 18, fontWeight: '700', color: colors.white, marginBottom: 12 },
  modalExList: { maxHeight: 350 },
  modalExItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.gray300 },
  modalExText: { fontSize: 14, color: colors.white, fontWeight: '500' },
  modalExMeta: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  modalExPlus: { fontSize: 18, color: colors.primary, fontWeight: '700' },
});
