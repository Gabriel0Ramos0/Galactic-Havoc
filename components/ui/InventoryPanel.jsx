import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";

const cianoNeon = "#00eaff";
const verdeBase = "#00ffaa";
const vermelhoNeon = "#ff453a";
const amareloNeon = "#ffd54a";

export default function InventoryPanel({
    isOpen = false,
    inventoryItems = [],
    onClose = () => { },
}) {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.95)).current;
    const pulse = useRef(new Animated.Value(0.4)).current;

    // Estados para simulação do Escâner Tático
    const [isScanning, setIsScanning] = useState(true);
    const [scanProgress, setScanProgress] = useState(0);

    // Fallback padrão exigido: Arma Laser com 32% de durabilidade se a lista vier vazia
    const activeLoot = inventoryItems.length > 0 ? inventoryItems : [
        { name: "CANHÃO LASER DE PLASMA // SÉRIE-VX", rarity: "rare", durability: 32, quantity: 1, type: "ARM" }
    ];

    useEffect(() => {
        let interval;
        if (isOpen) {
            // Entrada limpa e performática
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Loop de Pulso de Energia 100% nativo na GPU
            const pulseLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulse, {
                        toValue: 0.4,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseLoop.start();

            // Inicializa sequência de varredura de dados
            setIsScanning(true);
            setScanProgress(0);
            let progress = 0;
            interval = setInterval(() => {
                progress += 4;
                if (progress >= 100) {
                    setScanProgress(100);
                    setIsScanning(false);
                    clearInterval(interval);
                } else {
                    setScanProgress(progress);
                }
            }, 50);

            return () => {
                pulseLoop.stop();
                clearInterval(interval);
            };
        } else {
            // Saída do painel
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 0.95,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

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

    return (
        <Animated.View
            style={[
                styles.overlay,
                {
                    opacity,
                    pointerEvents: isOpen ? "auto" : "none",
                },
            ]}
        >
            {/* Área externa de fechamento */}
            <TouchableOpacity
                style={styles.closeArea}
                onPress={onClose}
                activeOpacity={1}
            />

            <Animated.View
                style={[
                    styles.container,
                    {
                        transform: [{ scale }],
                    },
                ]}
            >
                {/* Camadas Estruturais do Cockpit */}
                <View style={styles.layerBase} />
                <View style={styles.layerCutsTop} />
                <View style={styles.layerCutsBottom} />
                <Animated.View style={[styles.energyBorderGlow, { opacity: pulse }]} />

                <View style={styles.innerContent}>

                    {/* Cabeçalho do Módulo */}
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>MÓDULO // EXTRATOR_SALVAGEM</Text>
                        <Text style={[styles.statusTag, { color: isScanning ? amareloNeon : verdeBase }]}>
                            {isScanning ? "VARRENDO..." : "PRONTO"}
                        </Text>
                    </View>

                    {/* Área de Diagnóstico e Janela de Matriz */}
                    <View style={styles.shipScanArea}>
                        <View style={styles.gridOverlay} />

                        {isScanning ? (
                            <View style={styles.scannerCenter}>
                                <Text style={styles.scanPercentage}>{scanProgress}%</Text>
                                <Text style={styles.scanSubText}>RESOLVENDO ESTRUTURA DE COMPONENTES...</Text>
                                <View style={styles.progressFrame}>
                                    <View style={[styles.progressBarFill, { width: `${scanProgress}%` }]} />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.analysisSuccessContainer}>
                                <Text style={styles.successTitle}>ANÁLISE DE CAMPO CONCLUÍDA</Text>

                                {/* Display Visual das Categorias Encontradas */}
                                <View style={styles.matrixRow}>
                                    {activeLoot.map((item, idx) => (
                                        <View key={idx} style={[styles.specChip, { borderColor: getRarityColor(item.rarity) }]}>
                                            <Text style={[styles.specChipText, { color: getRarityColor(item.rarity) }]}>
                                                {item.type || "GEN"}
                                            </Text>
                                        </View>
                                    ))}
                                    <View style={styles.specChipDisabled}><Text style={styles.specChipTextDisabled}>ENG</Text></View>
                                    <View style={styles.specChipDisabled}><Text style={styles.specChipTextDisabled}>CORE</Text></View>
                                </View>

                                <Text style={styles.hardwareSpecsText}>SINAL ESTÁVEL // ASSINATURA REGISTRADA</Text>
                            </View>
                        )}

                        {/* Linha Laser Horizontal de Varredura */}
                        {isScanning && <View style={styles.laserScanLine} />}
                    </View>

                    {/* Lista de Recursos Extraídos */}
                    <View style={styles.salvageBox}>
                        <Text style={styles.sectionTitle}>COMPONENTES IDENTIFICADOS</Text>

                        <ScrollView style={styles.itemsScroll} showsVerticalScrollIndicator={false}>
                            {!isScanning ? (
                                activeLoot.map((item, index) => (
                                    <View key={index} style={[styles.lootItem, { borderLeftColor: getRarityColor(item.rarity) }]}>
                                        <View style={styles.itemMainInfo}>
                                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>

                                            {/* Barra de Durabilidade Física */}
                                            {item.durability !== undefined && (
                                                <View style={styles.durabilityWrapper}>
                                                    <Text style={styles.durabilityLabel}>INTEGRIDADE_ESTRUTURAL:</Text>
                                                    <View style={styles.durabilityTrack}>
                                                        <View
                                                            style={[
                                                                styles.durabilityFill,
                                                                {
                                                                    width: `${item.durability}%`,
                                                                    backgroundColor: getDurabilityColor(item.durability)
                                                                }
                                                            ]}
                                                        />
                                                    </View>
                                                    <Text style={[styles.durabilityPct, { color: getDurabilityColor(item.durability) }]}>
                                                        {item.durability}%
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        <Text style={[styles.itemQuantity, { color: getRarityColor(item.rarity) }]}>
                                            {item.quantity ? `x${item.quantity}` : "x1"}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.loadingItemsRow}>
                                    <Text style={styles.interceptText}>AGUARDANDO LIBERAÇÃO DO HARDWARE...</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>

                    <TouchableOpacity style={styles.collectButton} onPress={onClose}>
                        <Text style={styles.collectButtonText}>[ COLETAR E ARMAZENAR ]</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    closeArea: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        position: "absolute",
        left: 100,
        width: 380,
        backgroundColor: "rgba(1, 12, 22, 0.96)",
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "rgba(0, 234, 255, 0.2)",
        paddingBottom: 2,
    },
    layerBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(1, 10, 18, 0.95)",
        borderLeftWidth: 3,
        borderLeftColor: cianoNeon,
    },
    layerCutsTop: {
        position: "absolute",
        top: -6,
        left: 25,
        right: 25,
        height: 12,
        backgroundColor: "rgba(0, 234, 255, 0.4)",
        transform: [{ skewX: "-20deg" }],
        opacity: 0.2,
    },
    layerCutsBottom: {
        position: "absolute",
        bottom: -6,
        left: 25,
        right: 25,
        height: 12,
        backgroundColor: "rgba(0, 234, 255, 0.4)",
        transform: [{ skewX: "20deg" }],
        opacity: 0.2,
    },
    energyBorderGlow: {
        ...StyleSheet.absoluteFillObject,
        borderColor: "rgba(0, 234, 255, 0.3)",
        borderWidth: 1,
        margin: -2,
    },
    innerContent: {
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    title: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        letterSpacing: 1,
    },
    statusTag: {
        fontSize: 10,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    shipScanArea: {
        height: 130,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "rgba(0, 234, 255, 0.15)",
        backgroundColor: "rgba(0, 8, 15, 0.9)",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: cianoNeon,
    },
    laserScanLine: {
        position: "absolute",
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: cianoNeon,
        top: "50%", // Idealmente controlado por animação, mas estático centralizado atende bem o clima
    },
    scannerCenter: {
        alignItems: "center",
        paddingHorizontal: 30,
    },
    scanPercentage: {
        fontSize: 26,
        color: cianoNeon,
        fontWeight: "900",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    scanSubText: {
        fontSize: 8,
        color: "rgba(255,255,255,0.4)",
        marginTop: 4,
        textAlign: "center",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    progressFrame: {
        width: 180,
        height: 3,
        backgroundColor: "rgba(255,255,255,0.05)",
        marginTop: 8,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: cianoNeon,
    },
    analysisSuccessContainer: {
        alignItems: "center",
    },
    successTitle: {
        fontSize: 11,
        color: verdeBase,
        fontWeight: "bold",
        letterSpacing: 1,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        marginBottom: 12,
    },
    matrixRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 10,
    },
    specChip: {
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    specChipDisabled: {
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    specChipText: {
        fontSize: 9,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    specChipTextDisabled: {
        fontSize: 9,
        color: "rgba(255,255,255,0.15)",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    hardwareSpecsText: {
        fontSize: 8,
        color: "rgba(255,255,255,0.3)",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    salvageBox: {
        minHeight: 110,
    },
    sectionTitle: {
        color: "rgba(255,255,255,0.3)",
        fontSize: 9,
        marginBottom: 8,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        letterSpacing: 0.5,
    },
    itemsScroll: {
        maxHeight: 160,
    },
    lootItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 6,
        backgroundColor: "rgba(0, 234, 255, 0.03)",
        borderWidth: 1,
        borderColor: "rgba(0, 234, 255, 0.08)",
        borderLeftWidth: 3,
    },
    itemMainInfo: {
        flex: 1,
        marginRight: 10,
    },
    itemName: {
        color: "#ffffff",
        fontSize: 11,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    durabilityWrapper: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
    },
    durabilityLabel: {
        fontSize: 8,
        color: "rgba(255,255,255,0.3)",
        marginRight: 6,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    durabilityTrack: {
        flex: 1,
        height: 4,
        backgroundColor: "rgba(255,255,255,0.05)",
        maxWidth: 100,
        overflow: "hidden",
    },
    durabilityFill: {
        height: "100%",
    },
    durabilityPct: {
        fontSize: 8,
        fontWeight: "bold",
        marginLeft: 6,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    itemQuantity: {
        fontSize: 12,
        fontWeight: "900",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    loadingItemsRow: {
        paddingVertical: 25,
        alignItems: "center",
    },
    interceptText: {
        fontSize: 10,
        color: "rgba(255,255,255,0.25)",
        fontStyle: "italic",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    collectButton: {
        backgroundColor: "rgba(0, 234, 255, 0.12)",
        borderColor: cianoNeon,
        borderWidth: 1,
        paddingVertical: 10,
        alignItems: "center",
        marginTop: 8,
    },
    collectButtonText: {
        color: cianoNeon,
        fontSize: 11,
        fontWeight: "bold",
        letterSpacing: 1,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
});