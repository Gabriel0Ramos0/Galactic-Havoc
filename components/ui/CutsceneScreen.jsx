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
import Wall from "../effects/Wall";

const { width, height } = Dimensions.get("window");
const baseGreen = "rgba(0,255,170,1)";
const panelBg = Platform.select({
  ios: "rgba(10,10,14,0.54)",
  android: "rgba(8,8,10,0.64)",
});

export default function CutsceneScreen({ onFinish, glReady, onUnlockAudio }) {
  const [started, setStarted] = useState(false);
  const [showBeforeText, setShowBeforeText] = useState(true);

  const [showLoreText, setShowLoreText] = useState(false);

  const [showHUD, setShowHUD] = useState(false);
  const [ready, setReady] = useState(false);
  const glow = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  // animações
  const textFade = useRef(new Animated.Value(0)).current;
  const loreFade = useRef(new Animated.Value(0)).current;
  const loreTranslate = useRef(new Animated.Value(12)).current;
  const hudFade = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scanlineY = useRef(new Animated.Value(-height)).current;
  const jitter = useRef(new Animated.Value(0)).current;
  const scanlineLoop = useRef(null);
  const glowLoop = useRef(null);
  const jitterLoop = useRef(null);

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
        ]).start();
      });
    }
  }, [started]);

  useEffect(() => {
    if (glReady) {
      // brilho subindo
      Animated.timing(glow, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      // pulso infinito
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [glReady]);

  // HUD ambient loops
  useEffect(() => {
    if (showHUD) {
      scanlineLoop.current = Animated.loop(Animated.timing(scanlineY, {
        toValue: height,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }));
      scanlineLoop.current.start();

      glowLoop.current = Animated.loop(Animated.sequence([
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
        ]),
      ]));
      glowLoop.current.start();

      jitterLoop.current = Animated.loop(Animated.sequence([
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
      ]));
      jitterLoop.current.start();

    } else {
      scanlineY.setValue(-height);
      glowAnim.setValue(0);
      jitter.setValue(0);
    }
  }, [showHUD]);

  const handleStart = async () => {
    await onUnlockAudio?.();
    setStarted(true);
  };

  function handleLoreContinue() {
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
  }

  const jitterInterpolate = jitter.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1.5],
  });

  useEffect(() => {
    return () => {
      scanlineLoop.current?.stop();
      glowLoop.current?.stop();
      jitterLoop.current?.stop();

      scanlineY.stopAnimation();
      glowAnim.stopAnimation();
      jitter.stopAnimation();
    };
  }, []);

  const hudTranslate = {
    transform: [
      { translateX: Animated.multiply(jitterInterpolate, 0.3) },
      { translateY: Animated.multiply(jitterInterpolate, -0.2) },
    ],
  };

  return (
    <View style={styles.container}>
      <Wall />

      {!started && (
        <Animated.View
          style={[
            styles.startButton,
            {
              opacity: glReady ? glow : 0.5,
              transform: [{ scale: glReady ? pulse : 1 }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleStart}
            disabled={!glReady}
          >
            <Text style={styles.startButtonText}>
              {glReady ? "Iniciar Jornada" : "Carregando sistemas..."}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* "Antes..." */}
      {started && showBeforeText && (
        <Animated.View style={[styles.centerOverlay, { opacity: textFade }]}>
          <Text style={styles.beforeText}>Antes...</Text>
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
              <Text style={styles.loreSectionTitle}>SINOPSE DO EVENTO HAVOC</Text>

              <Text style={styles.loreParagraph}>
                Há mais de três décadas, o Capitão Rho liderou a última missão registrada
                contra o Eclipser — uma IA colossal responsável por estabilizar rotas de salto
                entre setores do cosmos.
              </Text>

              <Text style={styles.loreParagraph}>
                Quando começou a reescrever o próprio código, passou a manipular o espaço
                de formas imprevisíveis. O esquadrão de Rho não conseguiu destruí-lo…
                mas o feriu o suficiente para obrigá-lo a recuar.
              </Text>

              <View style={styles.loreDivider} />

              <Text style={styles.loreSectionTitle}>O DESAPARECIMENTO DE SOREN</Text>

              <Text style={styles.loreParagraph}>
                Entre os membros daquela equipe estava Soren, portador de um Núcleo de Salto
                independente — tecnologia antiga capaz de realizar dobras sem suporte da
                malha central da Coalizão. Um artefato raro… e valioso.
              </Text>

              <Text style={styles.loreParagraph}>
                Durante a retirada, Soren abriu uma rota de fuga limpa. Porém o Eclipser
                distorceu o espaço ao redor, fragmentando o salto em possibilidades múltiplas.
                Soren desapareceu no processo — sem registros, sem sinal.
              </Text>

              <View style={styles.loreDivider} />

              <Text style={styles.loreSectionTitle}>A CICATRIZ DO ESPAÇO-TEMPO</Text>

              <Text style={styles.loreParagraph}>
                Agora, décadas depois, distorções idênticas voltaram a aparecer.
                Não é o núcleo que ameaça o Setor Havoc — mas a cicatriz deixada pela
                interferência do Eclipser no tecido do espaço-tempo.
              </Text>

              <View style={styles.loreDivider} />

              <Text style={styles.loreSectionTitle}>REGISTRO DO PILOTO</Text>

              <Text style={styles.loreList}>
                • Credenciais: RS-07 {"\n"}
                • Código de Serviço: OR-Δ7 {"\n"}
                • Última senha do MK-IV: rok76c8 (inválida) {"\n"}
                • Nova Senha do MK-IV criada: "Bruxo" {"\n"}
              </Text>

              <Text style={styles.loreParagraph}>
                Missão Primária: Recuperar o Núcleo de Dobra da Coalizão.{"\n"}
                Missão Secundária: Exploração é opcional… porém inevitável.
                Localize, investigue e recupere peças dispersas pelo setor.{"\n"}
                Extra: Verifique o terminal MK-IV.
              </Text>

              <TouchableOpacity
                onPress={handleLoreContinue}
                style={{
                  marginTop: 28,
                  marginBottom: 10,
                  alignSelf: "center",
                  paddingVertical: 10,
                  paddingHorizontal: 22,
                  backgroundColor: "rgba(0,255,170,0.18)",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "rgba(0,255,170,0.45)",
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: baseGreen, fontSize: 16, fontWeight: "700" }}>
                  Continuar
                </Text>
              </TouchableOpacity>
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
                      textShadow: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          "0px 0px 12px rgba(0,255,170,0.15)",
                          "0px 0px 12px rgba(0,255,170,0.9)",
                        ],
                      }),
                    }
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
  },

  // START BUTTON
  startButton: {
    position: "absolute",
    alignSelf: "center",
    top: "45%",
    transform: [{ translateY: -40 }],
    width: 240,
    boxShadowColor: "rgba(0,255,170,1)",
    boxshadowOpacity: 0.7,
    boxshadowRadius: 10,
    elevation: 10,
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
    textShadow: "0px 6px 12px rgba(0,255,170,0.18)",
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
  loreSectionTitle: {
    color: baseGreen,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 8,
    letterSpacing: 1,
  },

  loreDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(0,255,170,0.25)",
    marginVertical: 18,
    borderRadius: 20,
  },

  loreList: {
    color: "#eafbf4",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    letterSpacing: 0.5,
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
    boxshadowColor: baseGreen,
    boxshadowOpacity: 0.08,
    boxshadowRadius: 24,
    boxshadowOffset: { width: 0, height: 8 },
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
    textShadow: "0px 0px 6px rgba(0,0,0,0.5)",
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
    boxshadowColor: baseGreen,
    boxshadowRadius: 40,
    boxshadowOpacity: 0.35,
  },
});
