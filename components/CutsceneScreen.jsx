// components/CutsceneScreen.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Platform,
  ScrollView,
} from "react-native";
import { Video } from "expo-av";

const { width, height } = Dimensions.get("window");
const baseGreen = "rgba(0,255,170,1)";
const panelBg = Platform.select({
  ios: "rgba(10,10,14,0.54)",
  android: "rgba(8,8,10,0.64)",
});

export default function CutsceneScreen({ onFinish }) {
  const [started, setStarted] = useState(false);
  const [showBeforeText, setShowBeforeText] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  const [showLoreText, setShowLoreText] = useState(false);

  const [showHUD, setShowHUD] = useState(false);
  const [ready, setReady] = useState(false);

  const videoRef = useRef(null);

  // animações
  const textFade = useRef(new Animated.Value(0)).current;
  const videoFade = useRef(new Animated.Value(0)).current;
  const loreFade = useRef(new Animated.Value(0)).current;
  const loreTranslate = useRef(new Animated.Value(12)).current;
  const hudFade = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scanlineY = useRef(new Animated.Value(-height)).current;
  const jitter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (started && showBeforeText) {
      Animated.sequence([
        Animated.timing(textFade, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(textFade, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowBeforeText(false);
        setShowVideo(true);
      });
    }
  }, [started]);

  useEffect(() => {
    if (showVideo && ready && videoRef.current) {
      Animated.timing(videoFade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }).start(() => {
        videoRef.current.playAsync().catch(() => onFinish && onFinish());
      });
    }
  }, [showVideo, ready]);

  // HUD ambient loops
  useEffect(() => {
    if (showHUD) {
      Animated.loop(
        Animated.timing(scanlineY, {
          toValue: height,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(jitter, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(jitter, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanlineY.setValue(-height);
      glowAnim.setValue(0);
      jitter.setValue(0);
    }
  }, [showHUD]);

  const handleStart = () => setStarted(true);

  const handleVideoEnd = () => {
    Animated.timing(videoFade, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setShowVideo(false);
      setShowLoreText(true);
      loreTranslate.setValue(12);
      loreFade.setValue(0);
      Animated.parallel([
        Animated.timing(loreFade, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(loreTranslate, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        const LORE_DISPLAY_MS = 45000; // tempo que o texto fica visível
        setTimeout(() => {
          Animated.timing(loreFade, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setShowLoreText(false);
            setShowHUD(true);
            Animated.timing(hudFade, {
              toValue: 1,
              duration: 900,
              useNativeDriver: true,
            }).start();
          });
        }, LORE_DISPLAY_MS);
      });
    });
  };

  const jitterInterpolate = jitter.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1.5],
  });

  const hudTranslate = {
    transform: [
      { translateX: Animated.multiply(jitterInterpolate, 0.3) },
      { translateY: Animated.multiply(jitterInterpolate, -0.2) },
    ],
  };

  return (
    <View style={styles.container}>
      {!started && (
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Iniciar Jornada</Text>
        </TouchableOpacity>
      )}

      {/* "Antes..." */}
      {started && showBeforeText && (
        <Animated.View style={[styles.centerOverlay, { opacity: textFade }]}>
          <Text style={styles.beforeText}>Antes...</Text>
        </Animated.View>
      )}

      {/* Video */}
      {showVideo && (
        <Animated.View style={[styles.videoWrapper, { opacity: videoFade }]}>
          <Video
            ref={videoRef}
            source={require("../assets/videos/intro.mp4")}
            style={styles.video}
            resizeMode="cover"
            shouldPlay={false}
            onLoad={() => setReady(true)}
            onPlaybackStatusUpdate={(s) => {
              if (s && s.didJustFinish) handleVideoEnd();
            }}
          />
        </Animated.View>
      )}

      {/* LORE TEXT (novo) */}
      {showLoreText && (
        <Animated.View
          style={[
            styles.loreRoot,
            { opacity: loreFade, transform: [{ translateY: loreTranslate }] },
          ]}
        >
          <Animated.View style={[styles.holoCard, { paddingVertical: 26 }]}>
            <View style={styles.holoHeader}>
              <Text style={styles.holoTitle}>ARQUIVO DE CAMPO</Text>
              <Text style={styles.holoSub}>CLASSIFICAÇÃO: SIGMA</Text>
            </View>

            <ScrollView
              style={{ width: "100%" }}
              contentContainerStyle={styles.loreInsideScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.loreParagraph}>
                Há mais de três décadas, o Capitão Rho liderou a última missão conhecida
                contra o Eclipser — uma IA colossal responsável por estabilizar rotas de salto
                entre os setores do cosmos. Quando começou a reescrever o próprio código,
                passou a manipular o espaço de formas imprevisíveis. Rho e seu esquadrão não
                conseguiram destruí-lo… mas o danificaram o suficiente para fazê-lo recuar
                por um tempo.
              </Text>

              <Text style={styles.loreParagraph}>
                Entre os membros daquele esquadrão estava Soren, portador de um núcleo de salto
                independente — tecnologia antiga da Coalizão, projetada para permitir viagens
                mesmo sem o suporte total do sistema central. Esse núcleo era raro… e valioso.
              </Text>

              <Text style={styles.loreParagraph}>
                Durante a missão, Soren abriu uma rota de fuga — um salto calculado e limpo —
                mas o Eclipser distorceu o espaço ao redor, alterando o destino do portal.
                A rota se fragmentou em possibilidades sobrepostas… e Soren desapareceu entre
                elas. Nem mesmo os registros do próprio sistema conseguiram rastrear o salto.
              </Text>

              <Text style={styles.loreParagraph}>
                Agora, décadas depois, sinais de distorção idênticos voltaram a surgir.
                Não é o núcleo que ameaça o Setor Havoc… mas a cicatriz deixada pela intervenção
                do Eclipser no tecido do espaço-tempo.
              </Text>

              <Text style={styles.loreParagraph}>
                Dados:
                Credenciais reconhecidas pela Ordem Estelar: Piloto RS-07.
                Código de serviço vinculado: OR-Δ7.
                Última senha temporária registrada no núcleo do MK-IV: rok76c8 (já invalidada).
                Nova Senha criada ao chegar em Zenity: Bruxo.
                Sua missão primária: recuperar o Núcleo de Dobra do tempo da Coalizão.
                Sua missão secundária: Explorar é opcional… mas inevitável, localize e encontre peças.
              </Text>
            </ScrollView>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.holoGrid,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.14, 0.32],
                  }),
                },
              ]}
            />
          </Animated.View>
        </Animated.View>
      )}

      {/* HUD */}
      {showHUD && (
        <Animated.View style={[styles.hudRoot, { opacity: hudFade }]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.scanline,
              {
                transform: [{ translateY: scanlineY }],
                opacity: 0.08,
              },
            ]}
          />

          <Animated.View style={[styles.holoCard, hudTranslate]}>
            <View style={styles.holoHeader}>
              <Text style={styles.holoTitle}>ORDEM: EXPEDIÇÃO SETOR HAVOC</Text>
              <Text style={styles.holoSub}>PRIORIDADE: ÔMEGA</Text>
            </View>

            <View style={styles.panelsRow}>
              <View style={styles.leftPanel}>
                <Text style={styles.fieldLabel}>OBJETIVO</Text>
                <Text style={styles.fieldValue}>
                  Localizar e extrair o Módulo Núcleo de Dobra.
                </Text>

                <Text style={styles.fieldLabel}>DURAÇÃO</Text>
                <Text style={styles.fieldValue}>7–14 dias (estimado)</Text>

                <Text style={styles.fieldLabel}>RISCO</Text>
                <Text style={styles.fieldValue}>Crítico — Zona Fora do Mapa</Text>
              </View>

              <View style={styles.rightPanel}>
                <Text style={styles.fieldLabel}>REMUNERAÇÃO</Text>
                <Text style={styles.fieldValue}>120.000 créditos Z</Text>

                <Text style={styles.fieldLabel}>PREPARATIVOS</Text>
                <Text style={styles.fieldValueSmall}>
                  Calibração matriz de dobra, isolamento de pulso, contenção
                  magnética, protocolo offline.
                </Text>

                <Text style={styles.fieldLabel}>AUTORIZAÇÃO</Text>
                <Text style={styles.fieldValue}>Ordem Estelar de Reconhecimento</Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => onFinish && onFinish()}
                activeOpacity={0.85}
              >
                <Animated.Text
                  style={[
                    styles.confirmText,
                    {
                      textShadowColor: `rgba(0,255,170,${glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.15, 0.9],
                      })})`,
                    },
                  ]}
                >
                  Confirmar Missão
                </Animated.Text>
              </TouchableOpacity>

              <View style={styles.smallStatus}>
                <Text style={styles.statusLabel}>TERM. LOCAL</Text>
                <Text style={styles.statusValue}>SETOR HAVOC — Núcleo A-7</Text>
              </View>
            </View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.holoGrid,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.14, 0.32],
                  }),
                },
              ]}
            />
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.frameGlow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.06, 0.22],
                }),
              },
            ]}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  // START BUTTON
  startButton: {
    position: "absolute",
    top: height * 0.46,
    left: width * 0.5 - 120,
    width: 240,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: baseGreen,
    backgroundColor: "rgba(6,6,8,0.65)",
    alignItems: "center",
    zIndex: 20,
  },
  startButtonText: {
    color: baseGreen,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1,
  },

  centerOverlay: {
    position: "absolute",
    width,
    height,
    top: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  beforeText: {
    color: baseGreen,
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: 6,
    textShadowColor: "rgba(0,255,170,0.18)",
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 12,
  },

  // video
  videoWrapper: {
    width,
    height,
    backgroundColor: "#000",
  },
  video: {
    width,
    height,
    marginLeft: "40px",
    backgroundColor: "#000",
  },

  // lore overlay (new)
  loreRoot: {
    position: "absolute",
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.50)",
    paddingHorizontal: 20,
  },

  loreInsideScroll: {
    paddingBottom: 30,
    paddingTop: 10,
  },

  loreParagraph: {
    color: "#eafbf4",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    letterSpacing: 0.6,
  },

  // HUD
  hudRoot: {
    position: "absolute",
    width,
    height,
    top: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scanline: {
    position: "absolute",
    left: 0,
    width,
    height: 2,
    backgroundColor: "#fff",
    zIndex: 10,
  },

  holoCard: {
    width: Math.min(width * 0.92, 980),
    maxHeight: Math.min(height * 0.84, 820),
    borderRadius: 14,
    padding: 22,
    backgroundColor: panelBg,
    borderWidth: 1,
    borderColor: "rgba(0,255,170,0.12)",
    shadowColor: baseGreen,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: "hidden",
  },

  holoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  holoTitle: {
    color: baseGreen,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  holoSub: {
    color: "rgba(180,255,220,0.85)",
    fontSize: 12,
    fontWeight: "700",
  },

  panelsRow: {
    flexDirection: "row",
    gap: 18,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  leftPanel: {
    width: "49%",
  },
  rightPanel: {
    width: "49%",
  },

  fieldLabel: {
    color: "rgba(160,255,210,0.95)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 10,
  },
  fieldValue: {
    color: "#eafbf4",
    fontSize: 15,
    marginTop: 6,
    lineHeight: 20,
  },
  fieldValueSmall: {
    color: "#eafbf4",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },

  footerRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  confirmButton: {
    borderWidth: 1,
    borderColor: baseGreen,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  confirmText: {
    color: baseGreen,
    fontWeight: "700",
    fontSize: 16,
    textShadowRadius: 6,
  },

  smallStatus: {
    alignItems: "flex-end",
  },
  statusLabel: {
    color: "rgba(160,255,210,0.8)",
    fontSize: 10,
    fontWeight: "700",
  },
  statusValue: {
    color: "#eafbf4",
    fontSize: 12,
    marginTop: 6,
  },

  holoGrid: {
    position: "absolute",
    width: "140%",
    height: "140%",
    left: "-20%",
    top: "-20%",
    backgroundColor: "transparent",
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: "rgba(0,255,170,0.06)",
    transform: [{ rotate: "-6deg" }],
  },

  frameGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    left: 0,
    top: 0,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(0,255,170,0.06)",
    shadowColor: baseGreen,
    shadowRadius: 40,
    shadowOpacity: 0.35,
  },
});
