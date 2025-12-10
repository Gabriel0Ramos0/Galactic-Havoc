// app/components/Hud.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Tutorial from "@/components/Tutorial";

export default function Hud({ shipHP = 100, score = 0, coords = { x: 0, y: 0, z: 0 }, onMenuPress, setTutorialStep, markerCoords = null }) {

  return (
    <View style={styles.container}>
      {/* Coluna esquerda: Vida */}
      <View style={styles.column}>
        <Text style={styles.label}>INTEGRIDADE</Text>

        <View style={styles.hpModule}>
          <View style={styles.hpFrame}>
            <View
              style={[
                styles.hpFill,
                {
                  width: `${shipHP}%`,
                  backgroundColor:
                    shipHP > 60 ? "#3cff75" :
                      shipHP > 30 ? "#ffd54a" :
                        "#ff3b3b",
                },
              ]}
            />
          </View>

          <Text style={styles.hpValue}>{shipHP}%</Text>
        </View>
        {/* Coordenadas */}
        <View style={styles.coordsBox}>
          <Text style={styles.coords}>
            X: {coords.x.toFixed(0)} Y: {coords.y.toFixed(0)} Z: {coords.z.toFixed(0)}
          </Text>

          {markerCoords && (
            <Text style={[styles.coords, styles.markerCoords]}>
              Alvo → X: {markerCoords.x.toFixed(0)} Y: {markerCoords.y.toFixed(0)} Z: {markerCoords.z.toFixed(0)}
            </Text>
          )}
        </View>
        <Tutorial
          onComplete={() => console.log("Tutorial finalizado")}
          onStepChange={(s) => setTutorialStep(s)}
        />
      </View>

      {/* Coluna central: Pontuação */}
      <View style={styles.centerPanelAbsolute}>
        <Text style={styles.panelTitle}>SCORE</Text>
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
  centerPanelAbsolute: {
    position: "absolute",
    top: 0,
    left: "50%",
    alignItems: "center",
  },
  panelTitle: {
    fontSize: 11,
    color: "#7fcaff",
    marginBottom: 6,
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  coordsBox: {
    marginTop: 6,
    minWidth: 210,
    alignItems: "flex-start",
  },
  coords: {
    fontSize: 12,
    color: "#aaa",
    fontFamily: "monospace",
  },
  markerCoords: {
    color: "#66ddff",
    marginTop: 2,
  },
  hpModule: {
    width: 210,
  },
  hpFrame: {
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(150,200,255,0.35)",
    backgroundColor: "rgba(10,20,30,0.8)",
    overflow: "hidden",
  },
  hpFill: {
    height: "100%",
    shadowColor: "#00ffff",
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  hpValue: {
    marginTop: 2,
    fontSize: 11,
    color: "#dfefff",
    fontFamily: "monospace",
    textAlign: "right",
  },
  score: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "monospace",
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
