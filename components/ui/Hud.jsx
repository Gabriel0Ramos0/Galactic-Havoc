import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from "react-native";
import Tutorial from "@/components/ui/Tutorial";
import FloatingScoreBalloon from "@/components/ui/FloatingScoreBalloon";
import LootPanel from "@/components/ui/LootPanel";
import InventoryPanel from "@/components/ui/InventoryPanel";

const { width } = Dimensions.get("window");
const verdeBase = "#00ffaa";
const cianoNeon = "#00eaff";
const vermelhoNeon = "#ff453a";
const amareloNeon = "#ffd54a";

export default function Hud({
  shipHP,
  maxHP = 500,
  energy = 100,
  isRecharging,
  score = 0,
  coords = { x: 0, y: 0, z: 0 },
  speed = 0,
  onMenuPress,
  setTutorialStep,
  initialTutorialStep = 0,
  markerCoords = null,
  lootItems = [],
  setLootItems,
  onTakeLootItem,
  lootPanelOpen = false,
  onLootPanelClose = () => { },
  inventoryItems = [],
  inventoryOpen = false,
  onInventoryClose = () => { },
  isNearbyInteraction = false
}) {

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
      {/* PAINEL SUPERIOR DO HUD */}
      <View style={styles.topContainer}>

        {/* COLUNA ESQUERDA: BARRAS VITAIS EMPILHADAS E LOCALIZAÇÃO */}
        <View style={styles.leftColumn}>

          {/* MÓDULO 1: INTEGRIDADE DO CASCO */}
          <View style={styles.statBlock}>
            <Text style={styles.hudLabel}>INTEGRIDADE DA NAVE</Text>
            <View style={styles.barModule}>
              <View style={styles.barFrame}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(0, Math.min(hpPercent, 100))}%`,
                      backgroundColor:
                        hpPercent > 60 ? verdeBase :
                          hpPercent > 30 ? amareloNeon : vermelhoNeon,
                    },
                  ]}
                />
              </View>
              <Text style={styles.statValue}>{shipHP} / {maxHP} GW</Text>
            </View>
          </View>

          {/* MÓDULO 2: ENERGIA DO NÚCLEO (AGORA LOGO ABAIXO DA VIDA) */}
          <View style={[styles.statBlock, { marginTop: 8 }]}>
            <View style={styles.rowLabelWithIcon}>
              <Text style={[styles.hudLabel, { color: cianoNeon }]}>ENERGIA</Text>
              {isRecharging && <Text style={styles.miniLightning}>RECARREGANDO</Text>}
            </View>
            <View style={styles.barModule}>
              <View style={[styles.barFrame, { borderColor: "rgba(0, 234, 255, 0.25)" }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(0, Math.min(energy, 100))}%`,
                      backgroundColor: isRecharging ? amareloNeon : cianoNeon,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.statValue, { color: cianoNeon }]}>{energy}%</Text>
            </View>
          </View>

          {/* TELEMETRIA DE COORDENADAS */}
          <View style={styles.coordsBox}>
            <Text style={styles.coordsText}>
              EIXO_X: <Text style={styles.whiteMono}>{coords.x.toFixed(0)}</Text>  Y: <Text style={styles.whiteMono}>{coords.y.toFixed(0)}</Text>  Z: <Text style={styles.whiteMono}>{coords.z.toFixed(0)}</Text>
            </Text>

            {markerCoords && (
              <Text style={styles.markerCoordsText}>
                ⌖ ALVO TRAVADO → X: {markerCoords.x.toFixed(0)} Y: {markerCoords.y.toFixed(0)} Z: {markerCoords.z.toFixed(0)}
              </Text>
            )}
          </View>

          <Tutorial
            onComplete={() => { }}
            onStepChange={(s) => setTutorialStep(s)}
            initialStep={initialTutorialStep}
          />
        </View>

        {/* PROCESSO CENTRAL: PONTUAÇÃO */}
        <View style={styles.centerScorePanel}>
          <Text style={styles.panelTitle}>NÚCLEO DE DADOS</Text>
          <Text style={styles.scoreText}>{String(score).padStart(6, "0")}</Text>

          {/* SINALIZADORES FLUTUANTES */}
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

        {/* COLUNA DIREITA: SISTEMA DO MENU */}
        <View style={styles.rightColumn}>
          <TouchableOpacity style={styles.abortMenuButton} onPress={onMenuPress}>
            <Text style={styles.abortMenuText}>[ MENU ]</Text>
          </TouchableOpacity>
        </View>

      </View >

      {/* PAINEL INFERIOR ESQUERDO: VETOR DE VELOCIDADE */}
      <View style={styles.speedModule}>
        <Text style={styles.speedLabel}>VELOCIDADE</Text>
        <View style={styles.speedContainer}>
          <Text style={styles.speedBigNumber}>
            {speed.toFixed(2)} <Text style={styles.speedUnit}>M/S</Text>
          </Text>
          <View style={styles.speedFrame}>
            <View
              style={[
                styles.speedFill,
                {
                  width: `${Math.min((speed / 5) * 100, 100)}%`,
                  backgroundColor: speed > 4.2 ? vermelhoNeon : cianoNeon,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* DETECTOR DE ESCANER DE PROXIMIDADE */}
      {isNearbyInteraction && (
        <View style={styles.interactionModule}>
          <View style={styles.blinkScanner} />
          <Text style={styles.interactionText}>⬢ [E] Inspecionar</Text>
        </View>
      )}

      <LootPanel
        isOpen={lootPanelOpen}
        lootItems={lootItems}
        setLootItems={setLootItems}
        onTransferItem={onTakeLootItem}
        onClose={onLootPanelClose}
      />

      <InventoryPanel
        isOpen={inventoryOpen}
        Items={inventoryItems}
        onClose={onInventoryClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    zIndex: 10,
  },
  leftColumn: {
    alignItems: "flex-start",
    width: "25%",
  },
  rightColumn: {
    alignItems: "flex-end",
    width: "25%",
  },
  statBlock: {
    width: 230,
  },
  hudLabel: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.4)",
    marginBottom: 3,
    fontWeight: "bold",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  rowLabelWithIcon: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miniLightning: {
    fontSize: 8,
    color: amareloNeon,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  /* CONTROLES UNIFICADOS DE BARRAS */
  barModule: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  barFrame: {
    flex: 1,
    height: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 170, 0.25)",
    backgroundColor: "rgba(0, 12, 20, 0.8)",
    transform: [{ skewX: "-12deg" }],
    overflow: "hidden",
    marginRight: 10,
  },
  barFill: {
    height: "100%",
  },
  statValue: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "bold",
    minWidth: 75,
    textAlign: "right",
  },
  /* PROCESSO CENTRAL */
  centerScorePanel: {
    alignItems: "center",
    backgroundColor: "rgba(0, 15, 25, 0.7)",
    borderColor: "rgba(0, 234, 255, 0.15)",
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 20,
    height: 55,
    minWidth: 200,
  },
  panelTitle: {
    fontSize: 9,
    color: cianoNeon,
    marginBottom: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1.5,
  },
  scoreText: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 2,
  },
  coordsBox: {
    marginTop: 12,
    backgroundColor: "rgba(1, 10, 18, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(0, 255, 170, 0.4)",
    width: 230,
  },
  coordsText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  whiteMono: {
    color: "#fff",
    fontWeight: "bold",
  },
  markerCoordsText: {
    color: cianoNeon,
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 3,
    fontWeight: "bold",
  },
  /* INTERFACE DE MENU DO COCKPIT */
  abortMenuButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    transform: [{ skewX: "-10deg" }],
  },
  abortMenuText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  /* INDICADOR DE VELOCIDADE */
  speedModule: {
    position: "absolute",
    left: 20,
    bottom: 25,
    zIndex: 10,
  },
  speedLabel: {
    fontSize: 9,
    color: "rgba(0, 234, 255, 0.6)",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1,
    marginBottom: 4,
  },
  speedContainer: {
    backgroundColor: "rgba(1, 12, 22, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 234, 255, 0.15)",
    width: 170,
  },
  speedBigNumber: {
    fontSize: 24,
    color: "#ffffff",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "900",
    marginBottom: 4,
  },
  speedUnit: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "normal",
  },
  speedFrame: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  speedFill: {
    height: "100%",
  },
  /* CENTRALIZADOR DE CRÉDITOS */
  balloonsContainer: {
    position: "absolute",
    top: 60,
    width: 120,
    height: 150,
    alignItems: "center",
  },
  /* BANNER DE AVISO DE INTERAÇÃO */
  interactionModule: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
    backgroundColor: "rgba(1, 18, 22, 0.95)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: verdeBase,
    alignItems: "center",
    zIndex: 15,
  },
  blinkScanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: verdeBase,
    opacity: 0.4,
  },
  interactionText: {
    fontSize: 12,
    color: verdeBase,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1.5,
  },
});