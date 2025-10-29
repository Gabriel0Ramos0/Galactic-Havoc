// app/components/Hud.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function Hud({ shipHP = 100, score = 0, onMenuPress }) {
  return (
    <View style={styles.container}>
      {/* Coluna esquerda: Vida */}
      <View style={styles.column}>
        <Text style={styles.label}>Vida</Text>
        <View style={styles.hpBarBackground}>
          <View style={[styles.hpBarFill, { width: `${shipHP}%` }]} />
        </View>
        <Text style={styles.hpText}>{shipHP} HP</Text>
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
    </View>
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
