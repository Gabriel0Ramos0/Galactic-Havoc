// app/components/Hud.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Tutorial from "@/components/Tutorial";

export default function Hud({ shipHP = 100, score = 0, coords = { x: 0, y: 0, z: 0 }, onMenuPress, setTutorialStep, markerCoords = null }) {

  return (
    <View style={styles.container}>
      {/* Coluna esquerda: Vida */}
      <View style={styles.column}>
        <Text style={styles.label}>Vida</Text>
        <View style={styles.hpBarBackground}>
          <View style={[styles.hpBarFill, { width: `${shipHP}%` }]} />
        </View>
        <Text style={styles.hpText}>{shipHP} HP</Text>
        {/* Coordenadas */}
        <Text style={styles.coords}>
          X: {coords.x.toFixed(0)} Y: {coords.y.toFixed(0)} Z: {coords.z.toFixed(0)}
        </Text>
        {markerCoords && (
          <Text style={[styles.coords, { color: "#66ddff", marginTop: 6 }]}>
            Alvo → X: {markerCoords.x.toFixed(0)} Y: {markerCoords.y.toFixed(0)} Z: {markerCoords.z.toFixed(0)}
          </Text>
        )}
        <Tutorial
          onComplete={() => console.log("Tutorial finalizado")}
          onStepChange={(s) => setTutorialStep(s)}
        />
      </View>

      {/* Coluna central: Pontuação */}
      <View style={styles.column}>
        <Text style={styles.label}>Pontuação</Text>
        <Text style={styles.score}>{score}</Text>
      </View>

      {/* Coluna direita: Menu */}
      <View style={styles.column}>
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <Text style={styles.menuText}>Menu</Text>
        </TouchableOpacity>
      </View>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 15,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  column: {
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 4,
    fontWeight: "bold",
  },
  hpBarBackground: {
    width: 80,
    height: 12,
    backgroundColor: "#555",
    borderRadius: 6,
    overflow: "hidden",
  },
  coords: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 4,
    fontFamily: "monospace",
  },
  hpBarFill: {
    height: "100%",
    backgroundColor: "#f00",
  },
  hpText: {
    fontSize: 12,
    color: "#fff",
    marginTop: 2,
  },
  score: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  menuButton: {
    backgroundColor: "#222",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  menuText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
