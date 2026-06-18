import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { getItemData } from "../systems/ItemsDB"; // Utilizando a mesma base do inventário

const cianoNeon = "#00eaff";
const verdeBase = "#00ffaa";
const vermelhoNeon = "#ff453a";
const amareloNeon = "#ffd54a";
const escuroProfundo = "rgba(2, 8, 16, 0.98)";

export default function LootPanel({
    isOpen = false,
    onClose = () => { },
}) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateXRight = useRef(new Animated.Value(100)).current;
    const pulse = useRef(new Animated.Value(0.4)).current;

    // Escâner geral do contêiner externo
    const [isScanning, setIsScanning] = useState(true);
    const [scanProgress, setScanProgress] = useState(0);

    // Lista fixa exigida mapeando IDs do seu ItemsDB + mecânica Tarkov
    const [discoveredItems, setDiscoveredItems] = useState([]);
    const [examiningIndex, setExaminingIndex] = useState(null);
    const [examineProgress, setExamineProgress] = useState(0);

    const fixedLoot = [
        { id: "laser_vx", rarity: "rare", durability: 32, qty: 1, hasDurability: true },
        { id: "scrap_metal", rarity: "common", qty: 3, hasDurability: false },
        { id: "copper_wire", rarity: "common", qty: 1, hasDurability: false }
    ];

    useEffect(() => {
        let interval;
        if (isOpen) {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(translateXRight, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]).start();

            setDiscoveredItems(fixedLoot.map(item => ({ ...item, revealed: false })));

            const pulseLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulse, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
                ])
            );
            pulseLoop.start();

            setIsScanning(true);
            setScanProgress(0);
            let progress = 0;
            interval = setInterval(() => {
                progress += 5;
                if (progress >= 100) {
                    setScanProgress(100);
                    setIsScanning(false);
                    clearInterval(interval);
                } else {
                    setScanProgress(progress);
                }
            }, 40);

            return () => {
                pulseLoop.stop();
                clearInterval(interval);
            };
        } else {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(translateXRight, { toValue: 100, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [isOpen]);

    const handleExamineItem = (index) => {
        if (discoveredItems[index].revealed || examiningIndex !== null) return;

        setExaminingIndex(index);
        setExamineProgress(0);

        let currentProg = 0;
        const examInterval = setInterval(() => {
            currentProg += 10;
            if (currentProg >= 100) {
                clearInterval(examInterval);
                setDiscoveredItems(prev => {
                    const next = [...prev];
                    next[index].revealed = true;
                    return next;
                });
                setExaminingIndex(null);
                setExamineProgress(0);
            } else {
                setExamineProgress(currentProg);
            }
        }, 120);
    };

    if (!isOpen) return null;

    const getRarityColor = (rarity) => {
        const colors = {
            common: "#a0a0a0",
            uncommon: verdeBase,
            rare: cianoNeon,
            epic: "#c478ff",
            legendary: "#ff9d00",
        };
        return colors[rarity] || "#ffffff";
    };

    const getDurabilityColor = (pct) => {
        if (pct < 35) return vermelhoNeon;
        if (pct < 70) return amareloNeon;
        return verdeBase;
    };

    const transformTranslateX = translateXRight.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 550]
    });

    return (
        // pointerEvents="box-none" garante que cliques fora passem direto, mas o painel capture os seus próprios
        <Animated.View style={[styles.screenOverlay, { opacity }]} pointerEvents="box-none">

            <Animated.View style={[styles.rightPanel, { transform: [{ translateX: transformTranslateX }] }]}>
                <View style={styles.topAccentBar} />

                <View style={styles.innerContent}>
                    {/* Cabeçalho do Módulo */}
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>MÓDULO // EXTRATOR_SALVAGEM</Text>
                        <Text style={[styles.statusTag, { color: isScanning ? amareloNeon : verdeBase }]}>
                            {isScanning ? "VARRENDO..." : "PRONTO"}
                        </Text>
                    </View>

                    {/* Área de Diagnóstico e Dificuldade de Acesso */}
                    <View style={styles.shipScanArea}>
                        <View style={styles.gridOverlay} />

                        {isScanning ? (
                            <View style={styles.scannerCenter}>
                                <Text style={styles.scanPercentage}>{scanProgress}%</Text>
                                <Text style={styles.scanSubText}>VERIFICANDO SEGURANÇA DO COMPARTIMENTO...</Text>
                                <View style={styles.progressFrame}>
                                    <View style={[styles.progressBarFill, { width: `${scanProgress}%` }]} />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.analysisSuccessContainer}>
                                <Text style={styles.successTitle}>NÍVEL DE ACESSO AOS RECURSOS:</Text>
                                <View style={styles.accessChip}>
                                    <Text style={styles.accessChipText}>[ CRIPTO-SEGURANÇA: LIVRE ]</Text>
                                </View>
                                <Text style={styles.hardwareSpecsText}>ESTRUTURA DE DADOS DESBLOQUEADA SEM RESTRIÇÕES</Text>
                            </View>
                        )}
                        {isScanning && <View style={styles.laserScanLine} />}
                    </View>

                    {/* Lista de Itens com Mecânica Tarkov */}
                    <View style={styles.salvageBox}>
                        <Text style={styles.sectionTitle}>RECURSOS EM COMPARTIMENTO EXTERNO</Text>

                        <ScrollView style={styles.itemsScroll} showsVerticalScrollIndicator={false}>
                            {!isScanning ? (
                                discoveredItems.map((item, index) => {
                                    const dbItem = getItemData(item.id);
                                    const isThisExamining = examiningIndex === index;

                                    if (!item.revealed) {
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[styles.lootItem, styles.itemUnexplored]}
                                                onPress={() => handleExamineItem(index)}
                                                activeOpacity={0.8}
                                            >
                                                <View style={styles.itemMainInfo}>
                                                    {isThisExamining ? (
                                                        <View style={styles.examiningContainer}>
                                                            <ActivityIndicator size="small" color={amareloNeon} style={{ marginRight: 8 }} />
                                                            <Text style={styles.examineText}>IDENTIFICANDO... {examineProgress}%</Text>
                                                        </View>
                                                    ) : (
                                                        <Text style={styles.itemNameHidden}>[ ⚠️ COMPONENTE NÃO IDENTIFICADO ]</Text>
                                                    )}
                                                    <Text style={styles.actionPrompt}>{!isThisExamining && "CLIQUE PARA EXAMINAR HARDWARE"}</Text>
                                                </View>
                                                <Text style={[styles.itemQuantity, { color: "rgba(255,255,255,0.2)" }]}>x{item.qty}</Text>
                                            </TouchableOpacity>
                                        );
                                    }

                                    return (
                                        <View key={index} style={[styles.lootItem, { borderLeftColor: getRarityColor(item.rarity) }]}>
                                            <Text style={styles.itemEmojiIcon}>{dbItem?.icon || "📦"}</Text>
                                            <View style={styles.itemMainInfo}>
                                                <Text style={styles.itemName} numberOfLines={1}>{dbItem?.name.toUpperCase() || "ITEM_DESCONHECIDO"}</Text>

                                                {/* Condicional correta: Apenas armas/equipamentos exibem integridade */}
                                                {item.hasDurability && item.durability !== undefined && (
                                                    <View style={styles.durabilityWrapper}>
                                                        <Text style={styles.durabilityLabel}>INTEGRIDADE:</Text>
                                                        <View style={styles.durabilityTrack}>
                                                            <View style={[styles.durabilityFill, { width: `${item.durability}%`, backgroundColor: getDurabilityColor(item.durability) }]} />
                                                        </View>
                                                        <Text style={[styles.durabilityPct, { color: getDurabilityColor(item.durability) }]}>{item.durability}%</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[styles.itemQuantity, { color: getRarityColor(item.rarity) }]}>x{item.qty}</Text>
                                        </View>
                                    );
                                })
                            ) : (
                                <View style={styles.loadingItemsRow}>
                                    <Text style={styles.interceptText}>RECONECTANDO BARRAMENTO DE SALVAGEM...</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>

                    <TouchableOpacity style={styles.collectButton} onPress={onClose}>
                        <Text style={styles.collectButtonText}>[ COMPARTIMENTAR TUDO E RETORNAR ]</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    screenOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 99, // Z-index alto para ficar acima do HUD base e gerenciar cliques de forma isolada
    },
    rightPanel: {
        position: "absolute",
        top: 0, bottom: 0, right: 0,
        width: "40%",
        backgroundColor: escuroProfundo,
        borderLeftWidth: 2,
        borderColor: "rgba(0, 234, 255, 0.2)",
    },
    topAccentBar: {
        height: 4,
        backgroundColor: cianoNeon,
        position: "absolute",
        top: 0, left: 0, right: 0,
    },
    innerContent: {
        paddingHorizontal: 16,
        paddingVertical: 18,
        flex: 1,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        marginTop: 4,
    },
    title: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    statusTag: {
        fontSize: 10,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    shipScanArea: {
        height: 100,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(0, 234, 255, 0.15)",
        backgroundColor: "rgba(0, 8, 15, 0.9)",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.03,
        borderWidth: 1,
        borderColor: cianoNeon,
    },
    laserScanLine: {
        position: "absolute",
        left: 0, right: 0, height: 1.5,
        backgroundColor: cianoNeon,
        top: "50%",
    },
    scannerCenter: { alignItems: "center" },
    scanPercentage: {
        fontSize: 22,
        color: cianoNeon,
        fontWeight: "900",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    scanSubText: {
        fontSize: 8,
        color: "rgba(255,255,255,0.4)",
        marginTop: 2,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    progressFrame: {
        width: 140, height: 2,
        backgroundColor: "rgba(255,255,255,0.05)",
        marginTop: 6,
        overflow: "hidden",
    },
    progressBarFill: { height: "100%", backgroundColor: cianoNeon },
    analysisSuccessContainer: { alignItems: "center" },
    successTitle: {
        fontSize: 10,
        color: "rgba(255,255,255,0.4)",
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        marginBottom: 4,
    },
    accessChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: "rgba(0, 255, 170, 0.05)",
        borderWidth: 1,
        borderColor: verdeBase,
        marginBottom: 8,
    },
    accessChipText: {
        fontSize: 11,
        color: verdeBase,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    hardwareSpecsText: {
        fontSize: 8,
        color: "rgba(255,255,255,0.3)",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    salvageBox: { flex: 1 },
    sectionTitle: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 9.5,
        marginBottom: 8,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    itemsScroll: { flex: 1 },
    lootItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 6,
        backgroundColor: "rgba(0, 234, 255, 0.02)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.04)",
        borderLeftWidth: 3,
    },
    itemUnexplored: {
        backgroundColor: "rgba(255, 213, 74, 0.01)",
        borderLeftColor: "rgba(255, 213, 74, 0.2)",
        borderStyle: "dashed",
    },
    examiningContainer: { flexDirection: "row", alignItems: "center" },
    examineText: {
        color: amareloNeon,
        fontSize: 10.5,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    itemEmojiIcon: { fontSize: 16, marginRight: 10 },
    itemMainInfo: { flex: 1 },
    itemName: {
        color: "#ffffff",
        fontSize: 11,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    itemNameHidden: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 11,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    actionPrompt: {
        color: "rgba(255, 213, 74, 0.5)",
        fontSize: 7.5,
        marginTop: 2,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    durabilityWrapper: { flexDirection: "row", alignItems: "center", marginTop: 4 },
    durabilityLabel: { fontSize: 7.5, color: "rgba(255,255,255,0.3)", marginRight: 4, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
    durabilityTrack: { flex: 1, height: 3, backgroundColor: "rgba(255,255,255,0.05)", maxWidth: 80 },
    durabilityFill: { height: "100%" },
    durabilityPct: { fontSize: 7.5, fontWeight: "bold", marginLeft: 4, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
    itemQuantity: {
        fontSize: 12,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        marginLeft: 8,
    },
    loadingItemsRow: { paddingVertical: 20, alignItems: "center" },
    interceptText: { fontSize: 9.5, color: "rgba(255,255,255,0.2)", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
    collectButton: {
        backgroundColor: "rgba(0, 234, 255, 0.08)",
        borderColor: cianoNeon,
        borderWidth: 1,
        paddingVertical: 10,
        alignItems: "center",
        marginTop: "auto",
    },
    collectButtonText: {
        color: cianoNeon,
        fontSize: 11,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
});