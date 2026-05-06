// app/components/Hud.jsx
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Tutorial from "@/components/ui/Tutorial";
import FloatingScoreBalloon from "@/components/ui/FloatingScoreBalloon";
import LootPanel from "@/components/ui/LootPanel";

export default function Hud({ shipHP, maxHP = 500, energy = 100, isRecharging, score = 0,
  coords = { x: 0, y: 0, z: 0 }, speed = 0, onMenuPress, setTutorialStep, initialTutorialStep = 0,
  markerCoords = null, lootItems = [], lootPanelOpen = false, onLootPanelClose = () => { },
  isNearbyInteraction = false }) {
    
  const hpPercent = (shipHP / maxHP) * 100;
  const [floatingBalloons, setFloatingBalloons] = useState([]);
  const prevScoreRef = useRef(0);
  const balloonIdRef = useRef(0);

  useEffect(() => {
    if (score > prevScoreRef.current) {
      const scoreGain = score - prevScoreRef.current;
      const balloonId = balloonIdRef.current++;

      setFloatingBalloons(prev => [...prev, { id: balloonId, amount: scoreGain }]);
    }
    prevScoreRef.current = score;
  }, [score]);

  const handleBalloonComplete = (id) => {
    setFloatingBalloons(prev => prev.filter(balloon => balloon.id !== id));
  };
  return (
    <>
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
                    width: `${hpPercent}%`,
                    backgroundColor:
                      hpPercent > 60 ? "#3cff75" :
                        hpPercent > 45 ? "#ffd54a" :
                          "#ff3b3b",
                  },
                ]}
              />
            </View>

            <Text style={styles.hpValue}>{shipHP} / {maxHP}</Text>
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
            onComplete={() => { }}
            onStepChange={(s) => setTutorialStep(s)}
            initialStep={initialTutorialStep}
          />
        </View>

        {/* Coluna central: Pontuação */}
        <View style={styles.centerPanelAbsolute}>
          <Text style={styles.panelTitle}>SCORE</Text>
          <Text style={styles.score}>{score}</Text>

          {/* Container para balões flutuantes */}
          <View style={styles.balloonsContainer}>
            {floatingBalloons.map(balloon => (
              <FloatingScoreBalloon
                key={balloon.id}
                amount={balloon.amount}
                onComplete={() => handleBalloonComplete(balloon.id)}
              />
            ))}
          </View>
        </View>

        {/* Coluna direita: Menu */}
        <View style={styles.column}>
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <Text style={styles.menuText}>Menu</Text>
          </TouchableOpacity>
        </View>
      </View >
      {/* Energia */}
      <View style={styles.energyModule}>
        <Text style={styles.label}>ENERGIA</Text>
        {isRecharging && (
          <Text style={styles.energyIcon}>⚡</Text>
        )}
        <View style={styles.energyFrame}>
          <View
            style={[
              styles.energyFill,
              {
                height: `${energy}%`,
                backgroundColor:
                  energy > 60 ? "#3cfaff" :
                    energy > 30 ? "#4ac6ff" :
                      "#1b6cff",
              },
            ]}
          />
        </View>
        <Text style={styles.energyValue}>{energy}%</Text>
      </View>
      {/* Velocidade */}
      <View style={styles.speedModule}>
        <Text style={styles.speedLabel}>VELOCIDADE</Text>
        <View style={styles.speedContainer}>
          <Text style={styles.speedBig}>
            {speed.toFixed(2)}
          </Text>
          <View style={styles.speedFrame}>
            <View
              style={[
                styles.speedFill,
                {
                  width: `${Math.min((speed / 5) * 100, 100)}%`,
                  backgroundColor:
                    speed > 4.5 ? "#ff3b3b" :
                      speed > 2.4 ? "#ffd54a" :
                        "#3cfaff",
                },
              ]}
            />
          </View>
        </View>
      </View>
      {/* Interação */}
      {isNearbyInteraction && (
        <View style={styles.interactionModule}>
          <Text style={styles.interactionText}>[ i ] INSPECIONAR</Text>
        </View>
      )}
      <LootPanel
        isOpen={lootPanelOpen}
        lootItems={lootItems}
        onClose={onLootPanelClose}
      />
    </>
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
    boxshadowColor: "#00ffff",
    boxshadowOpacity: 0.6,
    boxshadowRadius: 8,
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

  energyModule: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: [{ translateY: -60 }],
    alignItems: "center",
  },

  energyFrame: {
    width: 14,
    height: 120,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(150,200,255,0.35)",
    backgroundColor: "rgba(10,20,30,0.8)",
    overflow: "hidden",
    justifyContent: "flex-end",
  },

  energyFill: {
    width: "100%",
    boxshadowColor: "#00ffff",
    boxshadowOpacity: 0.7,
    boxshadowRadius: 10,
  },

  energyValue: {
    marginTop: 4,
    fontSize: 11,
    color: "#dfefff",
    fontFamily: "monospace",
  },

  energyIcon: {
    position: "absolute",
    top: "50%",
    left: "70%",
    transform: [
      { translateX: -8 },
      { translateY: -8 }
    ],
    fontSize: 16,
    color: "#00ffff",
    zIndex: 2,
  },

  speedModule: {
    position: "absolute",
    left: 10,
    bottom: 20,
  },

  speedLabel: {
    fontSize: 10,
    color: "#7fcaff",
    fontFamily: "monospace",
    letterSpacing: 1,
    marginBottom: 4,
  },

  speedContainer: {
    backgroundColor: "rgba(5,10,20,0.85)",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(100,180,255,0.25)",
    width: 180,
  },

  speedBig: {
    fontSize: 22,
    color: "#ffffff",
    fontFamily: "monospace",
    marginBottom: 6,
  },

  speedFrame: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    overflow: "hidden",
  },

  speedFill: {
    height: "100%",
    boxshadowColor: "#00ffff",
    boxshadowOpacity: 0.9,
    boxshadowRadius: 12,
  },

  balloonsContainer: {
    position: "absolute",
    top: 50,
    left: -50,
    width: 100,
    height: 200,
    alignItems: "center",
  },

  interactionModule: {
    position: "absolute",
    top: 100,
    left: "60%",
    transform: [{ translateX: -70 }],
    backgroundColor: "rgba(5,20,30,0.95)",
    padding: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(100,255,200,0.6)",
    alignItems: "center",
  },

  interactionText: {
    fontSize: 14,
    color: "#64ffda",
    fontWeight: "bold",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
});
