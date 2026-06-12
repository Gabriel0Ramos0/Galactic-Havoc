// components/CutsceneScreen.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import Wall from "../effects/Wall";

const { width, height } = Dimensions.get("window");
const baseGreen = "rgba(0,255,170,1)";

const CINEMATIC_SCRIPTS = [
  { lines: ["INICIALIZANDO TRANSMISSÃO DA ORDEM ESTELAR..."], type: "system" },

  {
    lines: [
      "Os antigos Núcleos de Dobra abriram caminho para a era interestelar.",
      "Hoje, restam apenas fragmentos dessa tecnologia."
    ],
    type: "story"
  },

  {
    lines: [
      "A inteligência artificial ECLIPSER assumiu o controle da rede de saltos.",
      "Durante décadas, o universo permaneceu conectado."
    ],
    type: "story"
  },

  {
    lines: [
      "Então algo aconteceu no Setor Havoc.",
      "Algo que a própria ECLIPSER não conseguiu controlar."
    ],
    type: "alert"
  },

  {
    lines: [
      "Rotas desapareceram.",
      "Transmissões cessaram.",
      "O setor foi isolado."
    ],
    type: "alert"
  },

  {
    lines: [
      "O esquadrão do Capitão Rho foi enviado para investigar.",
      "Nenhum membro retornou."
    ],
    type: "story"
  },

  {
    lines: [
      "Entre os desaparecidos estava Soren.",
      "Portador de um raro Núcleo de Dobra independente."
    ],
    type: "story"
  },

  {
    lines: [
      "Recentemente, sinais desconhecidos voltaram a surgir.",
      "A origem permanece incerta."
    ],
    type: "story"
  },

  {
    lines: [
      "Missão Primária:",
      "Localizar e recuperar o Núcleo de Dobra."
    ],
    type: "ready"
  },

  {
    lines: [
      "Terminal MK-IV vinculado.",
      "Piloto designado: RS-07",
      "Senha ativa: Bruxo"
    ],
    type: "system"
  },

  {
    lines: [
      "ERRO DE NAVEGAÇÃO",
      "Coordenadas divergentes detectadas.",
      "Destino desconhecido.",
      "Sinal da Ordem perdido.",
      "Localização atual não identificada."
    ],
    type: "alert"
  },

  {
    lines: [
      "Boa sorte, Piloto RS-07."
    ],
    type: "ready"
  }
];

const CIRCUIT_TYPES = ["+", "-", "○", "●"];

function IndividualCircuitNode({ elem }) {
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const runAnimationLoop = () => {
      if (!isMounted) return;

      const delay = Math.random() * 2500;
      const durationIn = Math.random() * 500 + 300;
      const durationHold = Math.random() * 1200 + 400;
      const durationOut = Math.random() * 500 + 300;
      const maxOpacity = Math.random() * 0.5 + 0.2;

      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animatedOpacity, { toValue: maxOpacity, duration: durationIn, useNativeDriver: true }),
        Animated.delay(durationHold),
        Animated.timing(animatedOpacity, { toValue: 0, duration: durationOut, useNativeDriver: true }),
      ]).start(() => {
        runAnimationLoop();
      });
    };

    runAnimationLoop();
    return () => { isMounted = false; };
  }, []);

  return (
    <Animated.View style={[styles.circuitContainer, { top: elem.top, left: elem.left, opacity: animatedOpacity }]}>
      <Text style={styles.circuitSymbol}>{elem.type}</Text>
    </Animated.View>
  );
}

export default function CutsceneScreen({ onFinish, glReady, onUnlockAudio }) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Controladores do efeito de máquina de escrever multi-linha
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [displayedTextLines, setDisplayedTextLines] = useState([]);
  const [showCursor, setShowCursor] = useState(true);

  const [circuitElements, setCircuitElements] = useState([]);

  const startButtonFade = useRef(new Animated.Value(1)).current;
  const startButtonScale = useRef(new Animated.Value(1)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;

  const scanlineY = useRef(new Animated.Value(-100)).current;
  const glowOpacity = useRef(new Animated.Value(0.15)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  const whiteoutOpacity = useRef(new Animated.Value(0)).current;

  // Pulso do botão inicial
  useEffect(() => {
    if (glReady && !started) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(startButtonScale, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
          Animated.timing(startButtonScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [glReady, started]);

  // Loops de ambientação pós-inicialização
  useEffect(() => {
    if (!started) return;

    const elements = Array.from({ length: 22 }).map(() => ({
      top: `${Math.random() * 85 + 5}%`,
      left: `${Math.random() * 88 + 5}%`,
      type: CIRCUIT_TYPES[Math.floor(Math.random() * CIRCUIT_TYPES.length)]
    }));
    setCircuitElements(elements);

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowOpacity, { toValue: 0.35, duration: 2200, useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 1.2, duration: 2200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowOpacity, { toValue: 0.15, duration: 2200, useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 0.95, duration: 2200, useNativeDriver: true }),
        ]),
      ])
    ).start();

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 350);
    return () => clearInterval(cursorInterval);
  }, [started]);

  const handleStart = async () => {
    if (!glReady) return;
    await onUnlockAudio?.();

    Animated.timing(startButtonFade, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setStarted(true);
    });
  };

  // Orquestrador de Cenas e Efeito de Máquina de Escrever Multi-Linha
  useEffect(() => {
    if (!started) return;

    const totalScenes = CINEMATIC_SCRIPTS.length;

    // FIM DA TRANSMISSÃO: Transição final suave travando no limite solicitado de 0.80
    if (currentIndex >= totalScenes) {
      Animated.timing(whiteoutOpacity, {
        toValue: 0.80,
        duration: 900,
        useNativeDriver: true,
      }).start(() => {
        onFinish?.();
      });
      return;
    }

    // CONTROLE DE BRANCO CONTROLADO (Baseado nos blocos de cena finais)
    let targetWhiteoutValue = 0;
    if (currentIndex === totalScenes - 3) {
      targetWhiteoutValue = 0.15; // Antepenúltimo bloco
    } else if (currentIndex === totalScenes - 2) {
      targetWhiteoutValue = 0.35; // Penúltimo bloco
    } else if (currentIndex === totalScenes - 1) {
      targetWhiteoutValue = 0.50; // Último bloco estável enquanto digita
    }

    Animated.timing(whiteoutOpacity, {
      toValue: targetWhiteoutValue,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    const currentScene = CINEMATIC_SCRIPTS[currentIndex];

    // Reseta o palco de linhas da cena atual
    setActiveLineIndex(0);
    setDisplayedTextLines(Array(currentScene.lines.length).fill(""));

    // Fade-in do container de texto da cena
    textOpacity.setValue(0);
    textTranslateY.setValue(15);
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(textTranslateY, { toValue: 0, duration: 700, useNativeDriver: true })
    ]).start();

    // Inicia a digitação da primeira linha do bloco
    triggerTypewriterForLine(0, currentScene.lines);

  }, [started, currentIndex]);

  // Função interna recursiva que digita linha por linha dentro do mesmo bloco
  const triggerTypewriterForLine = (lineIdx, allLines) => {
    if (lineIdx >= allLines.length) {
      // Todo o bloco foi renderizado. Aguarda tempo de leitura confortável.
      setTimeout(() => {
        // Transição de saída do bloco
        Animated.parallel([
          Animated.timing(textOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          Animated.timing(textTranslateY, { toValue: -15, duration: 600, useNativeDriver: true })
        ]).start(() => {
          setCurrentIndex((prev) => prev + 1);
        });
      }, 3500);
      return;
    }

    setActiveLineIndex(lineIdx);
    const targetText = allLines[lineIdx];
    let charIndex = 0;
    let currentString = "";

    const typeChar = () => {
      if (charIndex < targetText.length) {
        const char = targetText[charIndex];

        if (char === "|") {
          charIndex++;
          setTimeout(typeChar, 800);
          return;
        }

        currentString += char;
        setDisplayedTextLines((prev) => {
          const updated = [...prev];
          updated[lineIdx] = currentString;
          return updated;
        });

        charIndex++;
        setTimeout(typeChar, 40);
      } else {
        // Linha atual concluída, passa para a próxima linha do bloco imediatamente
        triggerTypewriterForLine(lineIdx + 1, allLines);
      }
    };

    typeChar();
  };

  const getDynamicGlowStyle = () => {
    if (!started) return { backgroundColor: "rgba(0, 255, 170, 0.15)", filter: "blur(60px)" };
    if (currentIndex >= CINEMATIC_SCRIPTS.length - 3) {
      return { backgroundColor: "rgba(130, 230, 255, 0.35)", filter: "blur(45px)" };
    }
    if (CINEMATIC_SCRIPTS[currentIndex]?.type === "alert") {
      return { backgroundColor: "rgba(255, 69, 58, 0.20)", filter: "blur(60px)" };
    }
    return { backgroundColor: "rgba(0, 255, 170, 0.15)", filter: "blur(60px)" };
  };

  const getTextStyleType = (type) => {
    switch (type) {
      case "system": return styles.systemText;
      case "alert": return styles.alertText;
      case "ready": return styles.readyText;
      default: return styles.storyText;
    }
  };

  return (
    <View style={styles.container}>
      <Wall />

      {/* Glifos Abstratos */}
      {started && circuitElements.map((elem, idx) => (
        <IndividualCircuitNode key={idx} elem={elem} />
      ))}

      {/* Nebulosa */}
      {started && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 3 }]} pointerEvents="none">
          <Animated.View
            style={[
              styles.ambientGlow,
              getDynamicGlowStyle(),
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }]
              }
            ]}
          />
        </View>
      )}

      {/* Camada Laser */}
      {started && (
        <Animated.View style={[styles.scanline, { transform: [{ translateY: scanlineY }] }]} pointerEvents="none" />
      )}

      {/* Clarão Branco Progressivo controlado */}
      <Animated.View style={[styles.whiteoutOverlay, { opacity: whiteoutOpacity }]} pointerEvents="none" />

      {/* Tela de Entrada */}
      {!started && (
        <Animated.View
          style={[
            styles.buttonWrapperPure,
            {
              opacity: glReady ? startButtonFade : 0.4,
              transform: [{ scale: startButtonScale }],
              zIndex: 10,
            },
          ]}
        >
          <TouchableOpacity onPress={handleStart} disabled={!glReady} activeOpacity={0.7}>
            <Text style={styles.startButtonText}>
              {glReady ? "INICIAR JORNADA" : "CONECTANDO SISTEMAS..."}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Palco Multi-Linha da Cutscene */}
      {started && currentIndex < CINEMATIC_SCRIPTS.length && (
        <Animated.View
          style={[
            styles.sceneWrapper,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }]
            }
          ]}
        >
          <View style={styles.textGroupContainer}>
            {displayedTextLines.map((lineText, idx) => {
              if (lineText === "" && idx > activeLineIndex) return null;

              const isCurrentLine = idx === activeLineIndex;
              return (
                <Text
                  key={idx}
                  style={[
                    styles.mainCinematicText,
                    getTextStyleType(CINEMATIC_SCRIPTS[currentIndex].type),
                    idx > 0 && { marginTop: 14 } // Espaçamento harmônico entre linhas
                  ]}
                >
                  {lineText}
                  {isCurrentLine && (
                    <Text style={[styles.cursor, { opacity: showCursor ? 1 : 0 }]}>_</Text>
                  )}
                </Text>
              );
            })}
          </View>
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
  buttonWrapperPure: {
    position: "absolute",
    alignSelf: "center",
    top: "48%",
    backgroundColor: "transparent",
    padding: 10,
  },
  startButtonText: {
    color: baseGreen,
    fontSize: 19,
    fontWeight: "300",
    letterSpacing: 4,
    textShadow: "0px 0px 10px rgba(0, 255, 170, 0.6)",
  },

  circuitContainer: {
    position: "absolute",
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circuitSymbol: {
    color: "rgba(0, 255, 170, 0.55)",
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "bold",
    textShadow: "0px 0px 5px rgba(0, 255, 170, 0.7)",
  },

  ambientGlow: {
    position: "absolute",
    width: width * 1.3,
    height: width * 1.3,
    top: height / 2 - (width * 1.3) / 2,
    left: width / 2 - (width * 1.3) / 2,
    borderRadius: (width * 1.3) / 2,
    boxShadow: `0px 0px 90px rgba(0, 0, 0, 1) inset`,
  },
  scanline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(0, 255, 170, 0.12)",
    boxShadow: "0px 0px 8px rgba(0, 255, 170, 0.4)",
    zIndex: 4,
  },
  sceneWrapper: {
    position: "absolute",
    left: 28,
    right: 28,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 15,
  },
  textGroupContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  mainCinematicText: {
    textAlign: "center",
    fontSize: 20,
    lineHeight: 32,
    letterSpacing: 1.4,
  },

  // Sombras pretas densas aplicadas abaixo para garantir contraste absoluto contra o clarão branco
  storyText: {
    color: "#ffffff",
    fontWeight: "300",
    textShadow: "0px 0px 10px rgba(0, 0, 0, 1), 0px 0px 16px rgba(0, 0, 0, 0.9)",
  },
  systemText: {
    color: baseGreen,
    fontWeight: "400",
    fontSize: 18,
    letterSpacing: 2.2,
    textShadow: "0px 0px 10px rgba(0, 0, 0, 1), 0px 0px 14px rgba(0, 255, 170, 0.4)",
  },
  alertText: {
    color: "#ff453a",
    fontWeight: "600",
    fontSize: 21,
    textShadow: "0px 0px 10px rgba(0, 0, 0, 1), 0px 0px 16px rgba(255, 69, 58, 0.5)",
  },
  readyText: {
    color: "#64d2ff",
    fontWeight: "500",
    fontSize: 21,
    textShadow: "0px 0px 10px rgba(0, 0, 0, 1), 0px 0px 14px rgba(100, 210, 255, 0.4)",
  },
  cursor: {
    color: baseGreen,
    fontWeight: "bold",
  },
  whiteoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    zIndex: 5,
  },
});