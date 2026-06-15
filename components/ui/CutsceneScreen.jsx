import React, { useState, useRef, useEffect, memo, useMemo } from "react";
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
import { playSfx } from "@/components/controllers/AudioController";

const { width, height } = Dimensions.get("window");
const baseGreen = "rgba(0,255,170,1)";
const cyanNeon = "#00eaff";

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

const IndividualCircuitNode = memo(({ elem }) => {
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const runAnimationLoop = () => {
      if (!isMounted) return;

      const isGlitch = elem.isGlitch;
      const delay = isGlitch ? Math.random() * 400 : Math.random() * 2500;
      const durationIn = isGlitch ? Math.random() * 150 + 50 : Math.random() * 500 + 300;
      const durationHold = isGlitch ? Math.random() * 300 + 100 : Math.random() * 1200 + 400;
      const durationOut = isGlitch ? Math.random() * 150 + 50 : Math.random() * 500 + 300;
      const maxOpacity = isGlitch ? Math.random() * 0.8 + 0.2 : Math.random() * 0.5 + 0.2;

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
  }, [elem.isGlitch]);

const getGlitchStyle = () => {
  if (elem.isGlitch) {
    return {
      color: elem.glitchColor,
      textShadow: "0px 0px 8px rgba(255, 69, 58, 0.9)",
      fontSize: elem.glitchSize,
    };
  }
  return styles.circuitSymbol;
};

return (
  <Animated.View style={[styles.circuitContainer, { top: elem.top, left: elem.left, opacity: animatedOpacity }]}>
    <Text style={[styles.circuitSymbol, getGlitchStyle()]}>{elem.type}</Text>
  </Animated.View>
);
});

export default function CutsceneScreen({ onFinish, glReady, onUnlockAudio }) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [displayedTextLines, setDisplayedTextLines] = useState([]);
  const [showCursor, setShowCursor] = useState(true);

  const startButtonFade = useRef(new Animated.Value(1)).current;
  const startButtonScale = useRef(new Animated.Value(1)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;

  const scanlineY = useRef(new Animated.Value(-100)).current;
  const glowOpacity = useRef(new Animated.Value(0.15)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  const whiteoutOpacity = useRef(new Animated.Value(0)).current;
  const componentAudioTime = useRef(0);

  const skipTimer = useRef(null);
  const typewriterTimerRef = useRef(null); // Ref adicionada para controlar o timer da digitação
  const skipAnimWidth = useRef(new Animated.Value(0)).current;
  const [isSkipping, setIsSkipping] = useState(false);

  const staticCircuitPool = useMemo(() => {
    return Array.from({ length: 180 }).map((_, i) => {
      const pseudoRandomTop = ((Math.sin(i * 4321.43) + 1) / 2) * 88 + 6;
      const pseudoRandomLeft = ((Math.cos(i * 1234.56) + 1) / 2) * 88 + 6;

      return {
        id: i,
        top: `${pseudoRandomTop}%`,
        left: `${pseudoRandomLeft}%`,
        type: CIRCUIT_TYPES[i % CIRCUIT_TYPES.length],
        glitchColor: ((i * 7) % 10) > 4 ? "#ff453a" : "#64d2ff",
        glitchSize: (i % 3 === 0) ? 18 : 13,
      };
    });
  }, []);

  const circuitElements = useMemo(() => {
    if (!started) return [];

    const totalScenes = CINEMATIC_SCRIPTS.length;
    let visibleCount = 22;
    let isGlitchActive = false;

    if (currentIndex === totalScenes - 3) {
      visibleCount = 50;
      isGlitchActive = true;
    } else if (currentIndex === totalScenes - 2) {
      visibleCount = 100;
      isGlitchActive = true;
    } else if (currentIndex === totalScenes - 1) {
      visibleCount = 180;
      isGlitchActive = true;
    }

    return staticCircuitPool.slice(0, visibleCount).map(elem => ({
      ...elem,
      isGlitch: isGlitchActive
    }));
  }, [started, currentIndex, staticCircuitPool]);

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

  useEffect(() => {
    if (!started) return;

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

  // Limpa os timers pendentes caso o componente seja desmontado inesperadamente
  useEffect(() => {
    return () => {
      if (skipTimer.current) clearTimeout(skipTimer.current);
      if (typewriterTimerRef.current) clearTimeout(typewriterTimerRef.current);
    };
  }, []);

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

  useEffect(() => {
    if (!started) return;

    const totalScenes = CINEMATIC_SCRIPTS.length;

    if (currentIndex >= totalScenes) {
      executeForceQuit();
      return;
    }

    const currentScene = CINEMATIC_SCRIPTS[currentIndex];

    setActiveLineIndex(0);
    setDisplayedTextLines(Array(currentScene.lines.length).fill(""));

    textOpacity.setValue(0);
    textTranslateY.setValue(15);
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(textTranslateY, { toValue: 0, duration: 700, useNativeDriver: true })
    ]).start();

    triggerTypewriterForLine(0, currentScene.lines);

  }, [started, currentIndex]);

  useEffect(() => {
    if (!started) return;

    const handleKeyDown = (e) => {

      if (e.repeat) return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        startSkipPress();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        cancelSkipPress();
      }
    };

    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    }

    return () => {
      if (typeof window !== "undefined" && window.removeEventListener) {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      }
    };
  }, [started]);

  const triggerTypewriterForLine = (lineIdx, allLines) => {
    if (lineIdx >= allLines.length) {
      typewriterTimerRef.current = setTimeout(() => {
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
          typewriterTimerRef.current = setTimeout(typeChar, 800);
          return;
        }

        if (char.trim() !== "") {
          const now = Date.now();
          if (now - componentAudioTime.current > 120) {
            playSfx("textDigital");
            componentAudioTime.current = now;
          }
        }

        currentString += char;
        setDisplayedTextLines((prev) => {
          const updated = [...prev];
          updated[lineIdx] = currentString;
          return updated;
        });

        charIndex++;
        typewriterTimerRef.current = setTimeout(typeChar, 40);
      } else {
        triggerTypewriterForLine(lineIdx + 1, allLines);
      }
    };

    typeChar();
  };

  const executeForceQuit = () => {
    // CRUCIAL: Cancela qualquer loop de digitação pendente imediatamente ao pular
    if (typewriterTimerRef.current) {
      clearTimeout(typewriterTimerRef.current);
    }

    Animated.timing(whiteoutOpacity, {
      toValue: 1.0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      onFinish?.();
    });
  };

  const startSkipPress = () => {
    setIsSkipping(true);
    playSfx("textDigital");

    Animated.timing(skipAnimWidth, {
      toValue: 130,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    skipTimer.current = setTimeout(() => {
      executeForceQuit();
    }, 3000);
  };

  const cancelSkipPress = () => {
    setIsSkipping(false);
    if (skipTimer.current) {
      clearTimeout(skipTimer.current);
    }

    Animated.timing(skipAnimWidth, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const getDynamicGlowStyle = () => {
    if (!started) return { backgroundColor: "rgba(0, 255, 170, 0.15)", filter: "blur(60px)" };
    if (currentIndex >= CINEMATIC_SCRIPTS.length - 3) {
      return { backgroundColor: "rgba(255, 69, 58, 0.25)", filter: "blur(50px)" };
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

      {/* Glifos Estáveis — Mapeados pelo ID estável e único */}
      {started && circuitElements.map((elem) => (
        <IndividualCircuitNode key={elem.id} elem={elem} />
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

      {/* Clarão Branco Puramente na Mudança de Tela Final */}
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
                    idx > 0 && { marginTop: 14 }
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

      {/* BOTÃO ÉPICO: HOLD TO SKIP (CANTO INFERIOR DIREITO) */}
      {started && (
        <View
          style={styles.skipContainer}
          onTouchStart={startSkipPress}
          onTouchEnd={cancelSkipPress}
          onMouseDown={startSkipPress}
          onMouseUp={cancelSkipPress}
          onMouseLeave={cancelSkipPress}
        >
          <Text style={[styles.skipText, isSkipping && styles.skipTextActive]}>
            {isSkipping ? "IGNORANDO..." : "SEGURE PARA PULAR"}
          </Text>
          <View style={styles.skipBarTrack}>
            <Animated.View style={[styles.skipBarFill, { width: skipAnimWidth }]} />
          </View>
        </View>
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
    zIndex: 20,
  },
  
  /* ESTILOS DO SKIP BUTTON HUD */
  skipContainer: {
    position: "absolute",
    bottom: 45,
    right: 40,
    width: 150,
    zIndex: 30,
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    cursor: "pointer",
    borderColor: "rgba(0, 255, 170, 0.15)",
  },
  skipText: {
    color: "rgba(0, 255, 170, 0.45)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 5,
  },
  skipTextActive: {
    color: cyanNeon,
    textShadow: "0px 0px 8px rgba(0, 234, 255, 0.6)",
  },
  skipBarTrack: {
    width: 130,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  skipBarFill: {
    height: "100%",
    backgroundColor: cyanNeon,
    boxShadow: "0px 0px 5px rgba(0, 234, 255, 0.8)",
  },
});