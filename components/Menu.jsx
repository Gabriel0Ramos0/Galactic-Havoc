import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Animated } from "react-native";

export default function Menu({ onStart, onConfig, onCredits, onHistory, onExit, onLogin }) {
  // Animação do título
  const titleAnim = useRef(new Animated.Value(0)).current;
  const [open, setOpen] = useState(false);
  const animHeight = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(titleAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const toggleOpen = () => {
    const finalHeight = open ? 40 : 160;
    Animated.timing(animHeight, {
      toValue: finalHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setOpen(!open);
  };

  const titleStyle = {
    transform: [
      {
        scale: titleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.05],
        }),
      },
    ],
    textShadow: titleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [
        "0px 0px 10px rgba(0,255,170,0.5)",
        "0px 0px 20px rgba(0,255,170,0.5)",
      ],
    }),
  };

  return (
    <ImageBackground
      source={require("@/assets/images/Game.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      {/* Título com efeito neon */}
      <Animated.Text style={[styles.title, titleStyle]}>GALACTIC HAVOC</Animated.Text>

      {/* Botões centrais */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={onStart}>
            <Text style={styles.buttonText}>Iniciar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={onConfig}>
            <Text style={styles.buttonText}>Configurações</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={onHistory}>
            <Text style={styles.buttonText}>Terminal MK-IV</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={onCredits}>
            <Text style={styles.buttonText}>Créditos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={onLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Placar animado com colunas */}
      <View style={styles.topRight}>
        <TouchableOpacity onPress={toggleOpen}>
          <Text style={styles.scoreTitle}>
            Melhores Jogadores {open ? "▲" : "▼"}
          </Text>
        </TouchableOpacity>

        {open && (
          <View style={styles.items}>
            {[
              { name: "Gabriel Ramos", score: 1200 },
              { name: "Gu", score: 980 },
              { name: "PlayerX", score: 730 },
            ].map((player, index) => (
              <View key={index} style={styles.scoreRow}>
                <Text style={styles.scoreName}>{`${index + 1}. ${player.name}`}</Text>
                <Text style={styles.scoreValue}>{player.score}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "",
    width: "",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  title: {
    fontSize: 48,
    color: "#0ff",
    fontWeight: "bold",
    marginBottom: 50,
    textShadow: "2px 2px 15px #0ff",
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 5,
  },
  button: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#0ff",
  },
  buttonText: {
    color: "#0ff",
    fontSize: 16,
    fontWeight: "bold",
  },
  exitButton: {
    borderColor: "#f00",
  },
  topRight: {
    position: "absolute",
    right: 20,
    top: 20,
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 200, 255, 0.4)",
    boxshadowColor: "#00eaff",
    boxshadowOpacity: 0.3,
    boxshadowOffset: { width: 0, height: 2 },
    boxshadowRadius: 5,
  },
  scoreTitle: {
    color: "#00eaff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  items: {
    width: 180,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    padding: 5,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingVertical: 4,
  },
  scoreName: {
    color: "#fff",
    fontSize: 14,
  },
  scoreValue: {
    color: "#00eaff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
