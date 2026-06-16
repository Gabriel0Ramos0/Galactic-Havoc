import React, { useEffect, useRef, useState, memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
  Dimensions,
  Platform
} from "react-native";
import { playSfx } from "@/components/controllers/AudioController";

const { width, height } = Dimensions.get("window");
const cyanNeon = "#00eaff";
const redNeon = "#ff453a";

// Subcomponente de Botão Reativo para os itens principais do Menu HUD
const MenuButton = memo(({ style, onPress, children, active }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.98, duration: 100, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 1, duration: 100, useNativeDriver: false })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: false })
    ]).start();
  };

  // Interpolação para criar uma reação de cor vibrante ao toque
  const backgroundColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: active ? ["rgba(0, 234, 255, 0.18)", "rgba(0, 234, 255, 0.4)"] : ["rgba(0, 35, 50, 0.45)", "rgba(0, 234, 255, 0.25)"]
  });

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: active ? [cyanNeon, "#ffffff"] : ["rgba(0, 234, 255, 0.35)", cyanNeon]
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View style={[styles.skewButton, style, { backgroundColor, borderColor }]}>
          <View style={styles.unskewContent}>
            {children}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function Menu({ onStart, hasSession, onConfig, onCredits, onHistory, onExit, onLogin }) {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState("");

  const hudFade = useRef(new Animated.Value(0)).current;
  const leaderboardHeight = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Entrada cinematográfica suave
    Animated.timing(hudFade, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Loop de pulsação para elementos com energia neon viva
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const toggleLeaderboard = () => {
    playSfx("textDigital");
    const toValue = open ? 0 : 130;
    setOpen(!open);

    Animated.timing(leaderboardHeight, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleButtonPress = (action) => {
    playSfx("textDigital");
    action();
  };

  return (
    <ImageBackground
      source={require("@/assets/images/Game.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      {/* Detalhe estético: Linhas de varredura sutis para dar o visual de visor holográfico */}
      <View style={styles.hologramGrid} pointerEvents="none" />

      <Animated.View style={[styles.hudContainer, { opacity: hudFade }]}>

        {/* TOPO ESQUERDO: INFOBAR E TÍTULO INTEGRADO AO HUD */}
        <View style={styles.headerTelemetry}>
          <View style={styles.systemStatusRow}>
            <Animated.View style={[styles.onlineIndicator, { opacity: pulseAnim }]} />
            <Text style={styles.telemetryText}>SISTEMAS DA SIRIUS MARROW INICIALIZADOS!</Text>
          </View>
          <Text style={styles.gameTitle}>GALACTIC HAVOC</Text>
          <View style={styles.bracketLine} />
        </View>

        {/* CENTRO ESQUERDO: INTERFACE E BOTÕES PRINCIPAIS */}
        <View style={styles.diagonalMenuContainer}>

          {hasSession && (
            <MenuButton
              active={true}
              style={styles.buttonContinue}
              onPress={() => handleButtonPress(() => onStart({ mode: "continue" }))}
            >
              <Text style={[styles.skewButtonText, styles.neonText]}>VOLTAR AO JOGO</Text>
              <Text style={styles.buttonSubText}>REASSUMIR COMANDO</Text>
            </MenuButton>
          )}

          <MenuButton
            active={!hasSession}
            style={!hasSession ? styles.buttonContinue : null}
            onPress={() => handleButtonPress(() => onStart({ mode: "new", seed }))}
          >
            <Text style={styles.skewButtonText}>JOGAR</Text>
            <Text style={styles.buttonSubText}>INICIAR NOVO ESPAÇO</Text>
          </MenuButton>

          <MenuButton onPress={() => handleButtonPress(onHistory)}>
            <Text style={styles.skewButtonText}>TERMINAL DE DADOS MK-IV</Text>
            <Text style={styles.buttonSubText}>ARQUIVOS E LOGS</Text>
          </MenuButton>

          <MenuButton onPress={() => handleButtonPress(onConfig)}>
            <Text style={styles.skewButtonText}>CONFIGURAÇÕES</Text>
            <Text style={styles.buttonSubText}>PARÂMETROS DO SISTEMA</Text>
          </MenuButton>

          {/* BOTÕES SECUNDÁRIOS REMODELADOS (Sem textos brutos soltos) */}
          <View style={styles.compactRow}>
            <TouchableOpacity style={styles.flatTextButton} onPress={() => handleButtonPress(onLogin)}>
              <Text style={styles.flatTextButtonText}>// AUTENTICAR PILOTO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.flatTextButton} onPress={() => handleButtonPress(onCredits)}>
              <Text style={styles.flatTextButtonText}>// CRÉDITOS</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* RODAPÉ DO HUD: INPUT DE COORDENADAS */}
        <View style={styles.bottomHudBar}>
          <View style={styles.seedInjectorContainer}>
            <View style={styles.injectorTag}>
              <Text style={styles.injectorTagText}>HYPERDRIVE SEED</Text>
            </View>
            <TextInput
              style={styles.seedInput}
              placeholder="[ INSIRA A SEED DO UNIVERSO ]"
              placeholderTextColor="rgba(0, 234, 255, 0.25)"
              value={seed}
              onChangeText={setSeed}
              autoCapitalize="characters"
            />
          </View>

          {onExit && (
            <TouchableOpacity style={styles.abortButton} onPress={() => handleButtonPress(onExit)}>
              <Text style={styles.abortText}>LOGOUT</Text>
            </TouchableOpacity>
          )}
        </View>

      </Animated.View>

      {/* CANTO SUPERIOR DIREITO: WIDGET HOLOGRÁFICO DE PILOTOS */}
      <View style={styles.leaderboardWidget}>
        <TouchableOpacity onPress={toggleLeaderboard} style={styles.leaderboardHeader} activeOpacity={0.8}>
          <View style={styles.pulseDot} />
          <Text style={styles.scoreTitle}>SINAIS_DE_PILOTOS.LOG</Text>
          <Text style={styles.scoreArrow}>{open ? " [-]" : " [+]"}</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.itemsContainer, { height: leaderboardHeight }]}>
          <View style={styles.itemsInner}>
            {[
              { name: "Gabriel Ramos", score: 1200 },
              { name: "Gu", score: 980 },
              { name: "PlayerX", score: 730 },
            ].map((player, index) => (
              <View key={index} style={styles.scoreRow}>
                <Text style={styles.scoreName}>{`ID_0${index + 1} // ${player.name.toUpperCase()}`}</Text>
                <Text style={styles.scoreValue}>{player.score} LY</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "",
    width: "",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 10, 20, 0.55)", // Azul espacial sutil no lugar do cinza escuro opaco
  },
  hologramGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    opacity: 0.03,
    // Cria pequenos traços horizontais se seu asset/suporte permitir, senão mantém puramente transparente e limpo sem bordas.
  },
  hudContainer: {
    flex: 1,
    paddingHorizontal: 40,
    paddingVertical: 35,
    justifyContent: "space-between",
  },
  /* TELEMETRIA SUPERIOR */
  headerTelemetry: {
    alignSelf: "flex-start",
    marginTop: 10,
  },
  systemStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  onlineIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: cyanNeon,
    marginRight: 8,
    boxShadow: `0px 0px 6px ${cyanNeon}`,
  },
  telemetryText: {
    color: cyanNeon,
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1.5,
    opacity: 0.75,
  },
  gameTitle: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 5,
    textShadow: "0px 0px 15px rgba(0, 234, 255, 0.75)",
  },
  bracketLine: {
    width: 250,
    height: 2,
    backgroundColor: cyanNeon,
    marginTop: 6,
    opacity: 0.6,
  },
  /* MENU DIAGONAL E BOTÕES REATIVOS */
  diagonalMenuContainer: {
    alignSelf: "flex-start",
    width: 380,
    marginVertical: 20,
  },
  skewButton: {
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 25,
    marginVertical: 6,
    transform: [{ skewX: "-10deg" }],
    borderLeftWidth: 5,
    borderLeftColor: cyanNeon,
    boxShadow: "0px 0px 4px rgba(0, 234, 255, 0.2)",
  },
  buttonContinue: {
    borderLeftColor: "#ffffff",
    borderLeftWidth: 6,
  },
  unskewContent: {
    transform: [{ skewX: "10deg" }],
  },
  skewButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },
  neonText: {
    color: cyanNeon,
    textShadow: "0px 0px 8px rgba(0, 234, 255, 0.5)",
  },
  buttonSubText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 8,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1.2,
    marginTop: 3,
  },
  /* ESTILIZAÇÃO DOS BOTÕES COMPACTOS SECUNDÁRIOS */
  compactRow: {
    flexDirection: "row",
    marginTop: 18,
    paddingLeft: 5,
  },
  flatTextButton: {
    marginRight: 15,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0, 234, 255, 0.05)",
    borderColor: "rgba(0, 234, 255, 0.25)",
    borderWidth: 1,
    borderRadius: 2,
  },
  flatTextButtonText: {
    color: cyanNeon,
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  /* BARRA INFERIOR DE COMANDO */
  bottomHudBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 234, 255, 0.2)",
    paddingTop: 15,
  },
  seedInjectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 12, 20, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(0, 234, 255, 0.3)",
    borderRadius: 2,
    flex: 1,
    maxWidth: 390,
    height: 40,
  },
  injectorTag: {
    backgroundColor: "rgba(0, 234, 255, 0.12)",
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: "rgba(0, 234, 255, 0.3)",
  },
  injectorTagText: {
    color: cyanNeon,
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  seedInput: {
    flex: 1,
    color: "#fff",
    fontSize: 11,
    paddingHorizontal: 12,
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  abortButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 69, 58, 0.25)",
    backgroundColor: "rgba(255, 69, 58, 0.05)",
    borderRadius: 2,
  },
  abortText: {
    color: redNeon,
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 2,
    fontWeight: "700",
    textShadow: "0px 0px 6px rgba(255, 69, 58, 0.4)",
  },
  /* WIDGET RANKING HOLOGRÁFICO */
  leaderboardWidget: {
    position: "absolute",
    right: 40,
    top: 45,
    width: 250,
    backgroundColor: "rgba(0, 10, 15, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(0, 234, 255, 0.3)",
    boxShadow: "0px 0px 8px rgba(0, 234, 255, 0.15)",
  },
  leaderboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(0, 234, 255, 0.08)",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: redNeon,
    marginRight: 8,
  },
  scoreTitle: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    flex: 1,
  },
  scoreArrow: {
    color: cyanNeon,
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  itemsContainer: {
    overflow: "hidden",
  },
  itemsInner: {
    padding: 12,
    backgroundColor: "rgba(0, 5, 10, 0.6)",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 234, 255, 0.05)",
  },
  scoreName: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  scoreValue: {
    color: cyanNeon,
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});