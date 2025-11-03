import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from "react-native";

export default function Menu({ onStart, onConfig, onCredits, onExit }) {
  return (
    <ImageBackground
      source={require("@/assets/images/Game.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <Text style={styles.title}>🚀 GALACTIC HAVOC 🚀</Text>

      <TouchableOpacity style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>Iniciar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onConfig}>
        <Text style={styles.buttonText}>Configurações</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onCredits}>
        <Text style={styles.buttonText}>Créditos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.exitButton]} onPress={onExit}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  title: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 40,
    textShadowColor: "#0ff",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  button: {
    backgroundColor: "#111",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#0ff",
  },
  buttonText: {
    color: "#0ff",
    fontSize: 18,
    fontWeight: "bold",
  },
  exitButton: {
    borderColor: "#f00",
  },
});
