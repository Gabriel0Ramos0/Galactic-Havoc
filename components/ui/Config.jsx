import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
  Platform,
  Dimensions
} from "react-native";
import Slider from "@react-native-community/slider";
import {
  getPlaylist,
  playTrack,
  getCurrentTrackIndex,
  setMusicVolume,
  getMusicVolume,
  playSfx
} from "@/components/controllers/AudioController";

const { width, height } = Dimensions.get("window");
const baseGreen = "#00ffaa";
const cyanNeon = "#00eaff";
const redNeon = "#ff453a";

export default function Config({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState("audio");
  const [volume, setVolume] = useState(getMusicVolume());
  const [volumeInput, setVolumeInput] = useState("50");
  const [playlist, setPlaylist] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (visible) {
      const vol = getMusicVolume();
      setVolume(vol);
      setVolumeInput(String(Math.round(vol * 100)));
      setPlaylist(getPlaylist());
      setCurrent(getCurrentTrackIndex());
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      const index = getCurrentTrackIndex();
      setCurrent((prev) => (prev !== index ? index : prev));
    }, 500);

    return () => clearInterval(interval);
  }, [visible]);

  const changeTab = (tab) => {
    playSfx("textDigital");
    setActiveTab(tab);
  };

  const handleVolumeChange = async (value) => {
    setVolume(value);
    setVolumeInput(String(Math.round(value * 100)));
    await setMusicVolume(value);
  };

  const handleVolumeInput = async (text) => {
    setVolumeInput(text);
    const num = Math.min(100, Math.max(0, Number(text)));
    const normalized = num / 100;
    setVolume(normalized);
    await setMusicVolume(normalized);
  };

  const handlePlay = async (index) => {
    playSfx("textDigital");
    await playTrack(index);
    setCurrent(index);
  };

  const handleClose = () => {
    playSfx("textDigital");
    onClose();
  };

  const renderTrackItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.trackItem,
        current === index && styles.activeTrack
      ]}
      onPress={() => handlePlay(index)}
    >
      <Text style={[styles.trackText, current === index && styles.activeTrackText]}>
        {current === index ? "⬢ REPRODUZINDO // " : "⬡ CORRENTE // "}{item.name.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "geral":
        return (
          <View style={styles.tabContentWrapper}>
            <Text style={styles.sectionTitle}>SISTEMA // PARÂMETROS GERAIS</Text>

            <View style={styles.card}>
              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={styles.hudOptionText}>IDIOMA DO TERMINAL</Text>
                <Text style={styles.hudOptionValue}>[ PT-BR ]</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={styles.hudOptionText}>NOTIFICAÇÕES DE DIRETRIZ</Text>
                <Text style={styles.hudOptionValue}>[ ATIVADO ]</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={styles.hudOptionText}>REGISTRO AUTOMÁTICO (AUTOSAVE)</Text>
                <Text style={styles.hudOptionValue}>[ NÚCLEO_ATIVO ]</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case "audio":
        return (
          <View style={styles.tabContentWrapper}>
            <Text style={styles.sectionTitle}>ÁUDIO // MATRIZ DE FREQUÊNCIA</Text>

            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>VOLUME DO SINAL SÔNICO</Text>
                <TextInput
                  style={styles.inputInline}
                  value={`${volumeInput}%`}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    const clean = text.replace("%", "");
                    handleVolumeInput(clean);
                  }}
                />
              </View>

              <Slider
                style={{ width: "100%", height: 40, marginTop: 10 }}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor={cyanNeon}
                maximumTrackTintColor="rgba(255, 255, 255, 0.1)"
                thumbTintColor={cyanNeon}
              />
            </View>

            <Text style={styles.sectionTitle}>RECEPTOR // TRANSMISSÕES DE ÁUDIO</Text>

            <View style={styles.card}>
              <FlatList
                data={playlist}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderTrackItem}
                style={{ maxHeight: 220 }}
                showsVerticalScrollIndicator={true}
              />
            </View>
          </View>
        );

      case "gameplay":
        return (
          <View style={styles.tabContentWrapper}>
            <Text style={styles.sectionTitle}>CONTROLES // MAPEAMENTO TELEMÉTRICO</Text>

            <View style={styles.card}>
              {[
                ["IMPULSO_DIRETRIZ ↑", "W"],
                ["REVERSO_DIRETRIZ ↓", "S"],
                ["ESTRUTURA_BORDA ←", "A"],
                ["ESTRUTURA_BORDA →", "D"],
                ["DISPARAR_CANHÃO", "SPACE"],
                ["SOBRECARGA_DOBRA", "SHIFT"],
              ].map(([label, key]) => (
                <View style={styles.rowControl} key={label}>
                  <Text style={styles.controlLabel}>{label}</Text>
                  <View style={styles.keyContainer}>
                    <Text style={styles.keyText}>{key}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>DIRETRIZES DE FLUXO</Text>

            <View style={styles.card}>
              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={styles.hudOptionText}>NÍVEL DE AMBIENTE (DIFICULDADE)</Text>
                <Text style={styles.hudOptionValue}>[ HAVOC_CRÍTICO ]</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={styles.hudOptionText}>TRAVAMENTO DE MIRA CINÉTICA</Text>
                <Text style={styles.hudOptionValue}>[ ASSISTIDO ]</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={styles.hudOptionText}>INTERFACE DINÂMICA DE CABINE</Text>
                <Text style={styles.hudOptionValue}>[ GLOBAL_HUD ]</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "video":
        return (
          <View style={styles.tabContentWrapper}>
            <Text style={styles.sectionTitle}>VÍDEO // MATRIZ HOLOGRÁFICA</Text>

            <View style={styles.card}>
              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={styles.hudOptionText}>RESOLUÇÃO DE PROJEÇÃO</Text>
                <Text style={styles.hudOptionValue}>[ NATIVA ]</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={styles.hudOptionText}>DIMENSÃO DO MONITOR</Text>
                <Text style={styles.hudOptionValue}>[ TELA CHEIA ]</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={styles.hudOptionText}>QUALIDADE DE RENDERIZADORES</Text>
                <Text style={styles.hudOptionValue}>[ ULTRA_PROCESSO ]</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={styles.hudOptionText}>SINCRONIZAÇÃO VERTICAL (VSYNC)</Text>
                <Text style={styles.hudOptionValue}>[ BLOQUEADO ]</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "outros":
        return (
          <View style={styles.tabContentWrapper}>
            <Text style={styles.sectionTitle}>SISTEMAS AUXILIARES</Text>

            <View style={styles.card}>
              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={styles.hudOptionText}>CRÉDITOS DE DESENVOLVIMENTO</Text>
                <Text style={styles.hudOptionValue}>// LER_</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={[styles.hudOptionText, { color: redNeon }]}>EXPURGAR DADOS (RESET COMPLETE)</Text>
                <Text style={[styles.hudOptionValue, { color: redNeon }]}>[ PERIGO ]</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hudOptionButton}>
                <Text style={styles.hudOptionText}>REGISTROS CRIPTOGRAFADOS (LOGS)</Text>
                <Text style={styles.hudOptionValue}>// COPIA_MK-IV</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.vignette} pointerEvents="none" />

        <View style={styles.container}>

          {/* HEADER DO CAPACETE */}
          <View style={styles.hudHeaderContainer}>
            <Text style={styles.telemetryHeader}>SYS.CONFIG // PROTOCOLO_DE_SISTEMA_V.46</Text>
            <Text style={styles.title}>CONFIGURAÇÕES_</Text>
            <View style={styles.bracketLine} />
          </View>

          {/* PAINEL DIVIDIDO: ABAS NA ESQUERDA, CONTEÚDO NA DIREITA */}
          <View style={styles.panelBody}>

            {/* ABAS INCLINADAS ESTILO HUD COCKPIT */}
            <View style={styles.tabsSidebar}>
              {["geral", "gameplay", "audio", "video", "outros"].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tabButton,
                      isActive && styles.activeTabButton
                    ]}
                    onPress={() => changeTab(tab)}
                  >
                    <View style={styles.unskewContent}>
                      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                        {`// ${tab.toUpperCase()}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* BOTÃO DE ABORTO/FECHAR INTEGRADO AO MENU LATERAL */}
              <TouchableOpacity style={styles.abortButton} onPress={handleClose}>
                <View style={styles.unskewContent}>
                  <Text style={styles.abortText}>✕ FECHAR</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* PAINEL DE CONTEÚDO OPERACIONAL */}
            <View style={styles.contentPanel}>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderTabContent()}
              </ScrollView>
            </View>

          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 12, 0.88)",
    justifyContent: "center",
    alignItems: "center",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 20,
    borderColor: "rgba(0,0,0,0.5)",
    backgroundColor: "transparent",
  },
  container: {
    width: "85%",
    height: "80%",
    backgroundColor: "rgba(3, 14, 24, 0.9)",
    borderColor: "rgba(0, 234, 255, 0.25)",
    borderWidth: 1,
    padding: 25,
    borderRadius: 2,
  },
  /* TELEMETRIA HEADER */
  hudHeaderContainer: {
    marginBottom: 20,
  },
  telemetryHeader: {
    color: cyanNeon,
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 2,
  },
  bracketLine: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(0, 234, 255, 0.2)",
    marginTop: 8,
  },
  /* DIVISÃO DE PAINEL */
  panelBody: {
    flex: 1,
    flexDirection: "row",
  },
  /* MENU DE ABAS LATERAL (SKEWED HUD) */
  tabsSidebar: {
    width: "25%",
    paddingRight: 15,
    justifyContent: "flex-start",
    marginTop: 15,
  },
  tabButton: {
    backgroundColor: "rgba(0, 25, 40, 0.4)",
    borderColor: "rgba(0, 234, 255, 0.15)",
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 5,
    transform: [{ skewX: "-8deg" }],
    borderLeftWidth: 4,
    borderLeftColor: "rgba(0, 234, 255, 0.3)",
  },
  activeTabButton: {
    backgroundColor: "rgba(0, 234, 255, 0.12)",
    borderColor: cyanNeon,
    borderLeftColor: cyanNeon,
    borderLeftWidth: 6,
  },
  unskewContent: {
    transform: [{ skewX: "8deg" }],
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  activeTabText: {
    color: "#fff",
    textShadowColor: "rgba(0, 234, 255, 0.5)",
    textShadowRadius: 6,
  },
  abortButton: {
    backgroundColor: "rgba(255, 69, 58, 0.05)",
    borderColor: "rgba(255, 69, 58, 0.2)",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: "auto",
    transform: [{ skewX: "-8deg" }],
    borderLeftWidth: 4,
    borderLeftColor: redNeon,
  },
  abortText: {
    color: redNeon,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  /* PAINEL CONTEÚDO */
  contentPanel: {
    flex: 1,
    backgroundColor: "rgba(1, 8, 15, 0.5)",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(0, 234, 255, 0.1)",
    paddingLeft: 20,
  },
  scrollContent: {
    paddingVertical: 10,
    paddingRight: 10,
  },
  sectionTitle: {
    color: baseGreen,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 10,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "rgba(0, 18, 30, 0.4)",
    padding: 14,
    borderRadius: 2,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 234, 255, 0.1)",
    borderLeftWidth: 3,
    borderLeftColor: "rgba(0, 234, 255, 0.4)",
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: "600",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputInline: {
    backgroundColor: "rgba(0,0,0,0.6)",
    color: cyanNeon,
    borderWidth: 1,
    borderColor: "rgba(0, 234, 255, 0.4)",
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    width: 65,
    textAlign: "center",
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 12,
  },
  /* LISTA DE MÚSICAS ESTILIZADA */
  trackItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  activeTrack: {
    backgroundColor: "rgba(0, 234, 255, 0.08)",
    borderLeftWidth: 2,
    borderLeftColor: cyanNeon,
  },
  trackText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1,
  },
  activeTrackText: {
    color: cyanNeon,
    fontWeight: "bold",
  },
  /* LINHAS DE BOTÕES ESTILO TERMINAL SCI-FI */
  hudOptionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  hudOptionText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    letterSpacing: 1,
  },
  hudOptionValue: {
    color: cyanNeon,
    fontWeight: "bold",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  /* CONTROLES / TECLADO DE BOTÕES */
  rowControl: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  controlLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  keyContainer: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderColor: "rgba(0, 234, 255, 0.3)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 3,
    minWidth: 60,
    alignItems: "center",
  },
  keyText: {
    color: cyanNeon,
    fontWeight: "bold",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});