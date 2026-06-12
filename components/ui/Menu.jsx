import React, { useEffect, useRef, useState } from "react";
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

export default function Menu({ onStart, hasSession, onConfig, onCredits, onHistory, onExit, onLogin }) {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState("");

  // Animações de HUD
  const hudFade = useRef(new Animated.Value(0)).current;
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const leaderboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrada cinematográfica dos elementos do HUD
    Animated.timing(hudFade, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Loop sutil de ruído/brilho no fundo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glitchAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glitchAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
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
      <View style={styles.vignette} pointerEvents="none" />

      {/* RENDER DO HUD PRINCIPAL (ESTILO NO MAN'S SKY) */}
      <Animated.View style={[styles.hudContainer, { opacity: hudFade }]}>

        {/* TOPO ESQUERDO: INFOBAR E TÍTULO INTEGRADO AO HUD */}
        <View style={styles.headerTelemetry}>
          <Text style={styles.telemetryText}>SYS.LOC // SECTOR_HAVOC_MK4 // ONLINE</Text>
          <Text style={styles.gameTitle}>GALACTIC HAVOC</Text>
          <View style={styles.bracketLine} />
        </View>

        {/* CANTO ESQUERDO CENTRAL: O MENU DIAGONAL (SKEWED INTERFACE) */}
        <View style={styles.diagonalMenuContainer}>

          {hasSession && (
            <TouchableOpacity
              style={[styles.skewButton, styles.buttonContinue]}
              onPress={() => handleButtonPress(() => onStart({ mode: "continue" }))}
            >
              <View style={styles.unskewContent}>
                <Text style={styles.skewButtonText}>REASSUMIR COMANDO</Text>
                <Text style={styles.buttonSubText}>CONTINUE SESSÃO</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.skewButton, !hasSession && styles.buttonContinue]}
            onPress={() => handleButtonPress(() => onStart({ mode: "new", seed }))}
          >
            <View style={styles.unskewContent}>
              <Text style={styles.skewButtonText}>INICIAR DIRETRIZ HIPERESPAÇO</Text>
              <Text style={styles.buttonSubText}>NOVO COMEÇO</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skewButton} onPress={() => handleButtonPress(onHistory)}>
            <View style={styles.unskewContent}>
              <Text style={styles.skewButtonText}>TERMINAL DE DADOS MK-IV</Text>
              <Text style={styles.buttonSubText}>ARQUIVOS E GRAVAÇÕES</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skewButton} onPress={() => handleButtonPress(onConfig)}>
            <View style={styles.unskewContent}>
              <Text style={styles.skewButtonText}>PARÂMETROS DO SISTEMA</Text>
              <Text style={styles.buttonSubText}>CONFIGURAÇÕES</Text>
            </View>
          </TouchableOpacity>

          {/* BOTÕES SECUNDÁRIOS COMPACTOS */}
          <View style={styles.compactRow}>
            <TouchableOpacity style={styles.flatTextButton} onPress={() => handleButtonPress(onLogin)}>
              <Text style={styles.flatTextButtonText}>// AUTENTICAR PILOTO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.flatTextButton} onPress={() => handleButtonPress(onCredits)}>
              <Text style={styles.flatTextButtonText}>// CRÉDITOS</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* RODAPÉ DO HUD: INPUT ESTILIZADO COMO INJETOR DE COORDENADAS */}
        <View style={styles.bottomHudBar}>
          <View style={styles.seedInjectorContainer}>
            <View style={styles.injectorTag}>
              <Text style={styles.injectorTagText}>HYPERDRIVE SEED CORE</Text>
            </View>
            <TextInput
              style={styles.seedInput}
              placeholder="[ INSIRA UMA SEED MANUAL DO UNIVERSO ]"
              placeholderTextColor="rgba(0, 234, 255, 0.3)"
              value={seed}
              onChangeText={setSeed}
              autoCapitalize="characters"
            />
          </View>

          {onExit && (
            <TouchableOpacity style={styles.abortButton} onPress={() => handleButtonPress(onExit)}>
              <Text style={styles.abortText}>DESCONECTAR_</Text>
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
    backgroundColor: "rgba(2, 6, 12, 0.65)",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    // Efeito de escurecimento de borda clássico de cockpit/capacete
    borderWidth: 24,
    borderColor: "rgba(0,0,0,0.4)",
    backgroundColor: "transparent",
  },
  hudContainer: {
    flex: 1,
    paddingHorizontal: 50,
    paddingVertical: 40,
    justifyContent: "space-between",
  },
  /* TELEMETRIA SUPERIOR */
  headerTelemetry: {
    alignSelf: "flex-start",
    marginTop: 20,
  },
  telemetryText: {
    color: cyanNeon,
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 2,
    opacity: 0.6,
  },
  gameTitle: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: 4,
    marginTop: 5,
    textShadowColor: "rgba(0, 234, 255, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  bracketLine: {
    width: 200,
    height: 1,
    backgroundColor: cyanNeon,
    marginTop: 8,
    opacity: 0.4,
  },
  /* MENU DIAGONAL ESTILO SCI-FI HUD */
  diagonalMenuContainer: {
    alignSelf: "flex-start",
    width: 360,
    marginLeft: 10,
    marginVertical: 30,
  },
  skewButton: {
    backgroundColor: "rgba(0, 35, 50, 0.4)",
    borderColor: "rgba(0, 234, 255, 0.3)",
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginVertical: 6,
    // ESSA PROPRIEDADE FAZ A CAIXA FICAR INCLINADA NA DIAGONAL ÉPICA
    transform: [{ skewX: "-12deg" }],
    borderLeftWidth: 5,
    borderLeftColor: "rgba(0, 234, 255, 0.6)",
  },
  buttonContinue: {
    backgroundColor: "rgba(0, 234, 255, 0.15)",
    borderColor: cyanNeon,
    borderLeftColor: cyanNeon,
    borderLeftWidth: 7,
  },
  unskewContent: {
    // Desfaz o skew no texto para ele não ficar deformado/ilegível
    transform: [{ skewX: "12deg" }],
  },
  skewButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
  },
  buttonSubText: {
    color: cyanNeon,
    fontSize: 8,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1.5,
    opacity: 0.6,
    marginTop: 2,
  },
  /* SUBMENUS PLANOS */
  compactRow: {
    flexDirection: "row",
    marginTop: 15,
    marginLeft: 10,
  },
  flatTextButton: {
    marginRight: 25,
    paddingVertical: 5,
  },
  flatTextButtonText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1.5,
  },
  /* BARRA INFERIOR DE COMANDO */
  bottomHudBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 234, 255, 0.15)",
    paddingTop: 20,
  },
  seedInjectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 15, 25, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(0, 234, 255, 0.2)",
    borderRadius: 4,
    flex: 1,
    maxWidth: 500,
    height: 38,
  },
  injectorTag: {
    backgroundColor: "rgba(0, 234, 255, 0.15)",
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: "rgba(0, 234, 255, 0.2)",
  },
  injectorTagText: {
    color: cyanNeon,
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
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
  },
  abortText: {
    color: redNeon,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 2,
    fontWeight: "bold",
    opacity: 0.8,
  },
  /* WIDGET RANKING HOLOGRÁFICO */
  leaderboardWidget: {
    position: "absolute",
    right: 40,
    top: 55,
    width: 240,
    backgroundColor: "rgba(0, 8, 12, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(0, 234, 255, 0.2)",
  },
  leaderboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(0, 234, 255, 0.05)",
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: redNeon,
    marginRight: 8,
  },
  scoreTitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
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
    padding: 10,
    backgroundColor: "rgba(0, 5, 10, 0.5)",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  scoreName: {
    color: "rgba(255,255,255,0.5)",
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