import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { getItemData } from "../systems/ItemsDB";

const cianoNeon = "#00eaff";
const verdeBase = "#00ffaa";
const vermelhoNeon = "#ff453a";
const amareloNeon = "#ffd54a";
const escuroProfundo = "rgba(2, 8, 16, 0.98)";

const TOTAL_SLOTS = 6;

export default function LootPanel({
    isOpen = false,
    lootItems = [],      // Array fixo de 12 posições gerenciado pelo Pai
    setLootItems,       // Atualiza a estrutura no Pai
    onTransferItem,     // Envia o item identificado ao inventário
    onClose = () => { },
}) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateXRight = useRef(new Animated.Value(100)).current;
    const pulse = useRef(new Animated.Value(0.4)).current;

    const [isScanning, setIsScanning] = useState(true);
    const [scanProgress, setScanProgress] = useState(0);

    // Tarkov Exam States
    const [examiningIndex, setExaminingIndex] = useState(null);
    const [examineProgress, setExamineProgress] = useState(0);

    // Sistema de Seleção para Mover Itens dentro da grade de loot
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

    useEffect(() => {
        let interval;
        if (isOpen) {
            setSelectedSlotIndex(null); // Reseta seleção interna ao abrir
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(translateXRight, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]).start();

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
            }, 30);

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

    // Lida com cliques, exame e movimentação interna dos slots
    const handleSlotPress = (index) => {
        if (examiningIndex !== null) return; // Bloqueia ações enquanto examina

        // 1. SE JÁ EXISTE UM SLOT SELECIONADO -> Move/Troca para a nova posição (vazia ou ocupada)
        if (selectedSlotIndex !== null) {
            if (selectedSlotIndex === index) {
                setSelectedSlotIndex(null); // Desmarca se clicar nele mesmo
                return;
            }

            if (setLootItems) {
                setLootItems(prev => {
                    const next = [...prev];

                    while (next.length < TOTAL_SLOTS) next.push(null);

                    const temp = next[selectedSlotIndex];
                    next[selectedSlotIndex] = next[index] || null;
                    next[index] = temp || null;

                    return next;
                });
            }
            setSelectedSlotIndex(null);
            return;
        }

        // 2. SE NÃO HÁ SELEÇÃO PRÉVIA -> Trata o slot clicado
        const clickedItem = lootItems[index];
        if (!clickedItem) return; // Slot vazio sem seleção prévia: ignora

        // SISTEMA DE EXAME ESTILO TARKOV (Se o item não foi revelado ainda)
        if (!clickedItem.revealed) {
            setExaminingIndex(index);
            setExamineProgress(0);

            let currentProg = 0;
            const examInterval = setInterval(() => {
                currentProg += 20;
                if (currentProg >= 100) {
                    clearInterval(examInterval);

                    if (setLootItems) {
                        setLootItems(prev => {
                            const next = [...prev];
                            if (next[index]) {
                                next[index] = { ...next[index], revealed: true };
                            }
                            return next;
                        });
                    }
                    setExaminingIndex(null);
                    setExamineProgress(0);
                } else {
                    setExamineProgress(currentProg);
                }
            }, 120);
        } else {
            // SE JÁ ESTÁ REVELADO -> Seleciona para mover
            setSelectedSlotIndex(index);
        }
    };

    const handleSlotLongPress = (index, item) => {
        console.log("LONG PRESS", index, item);
        if (item && item.revealed && onTransferItem) {
            console.log("CHAMANDO TRANSFER");
            setSelectedSlotIndex(null);
            onTransferItem(index);
        }
    };

    if (!isOpen) return null;

    const getRarityColor = (rarity) => {
        const colors = {
            COMMON: "#505050",
            UNCOMMON: verdeBase,
            RARE: cianoNeon,
            EPIC: "#c478ff",
            LEGENDARY: "#ff9d00",
        };
        return colors[rarity?.toUpperCase()] || "rgba(255,255,255,0.15)";
    };

    const transformTranslateX = translateXRight.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 550]
    });

    return (
        <Animated.View style={[styles.screenOverlay, { opacity }]} pointerEvents="box-none">
            <Animated.View style={[styles.rightPanel, { transform: [{ translateX: transformTranslateX }] }]}>
                <View style={styles.topAccentBar} />

                <View style={styles.innerContent}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>MÓDULO DE CARGA DANIFICADA</Text>
                        <Text style={[styles.statusTag, { color: isScanning ? amareloNeon : verdeBase }]}>
                            {isScanning ? "VARRENDO..." : "PRONTO"}
                        </Text>
                    </View>

                    <View style={styles.shipScanArea}>
                        <View style={styles.gridOverlay} />
                        {isScanning ? (
                            <View style={styles.scannerCenter}>
                                <Text style={styles.scanPercentage}>{scanProgress}%</Text>
                                <Text style={styles.scanSubText}>SINCRONIZANDO ASSINATURAS MAGNÉTICAS...</Text>
                                <View style={styles.progressFrame}>
                                    <View style={[styles.progressBarFill, { width: `${scanProgress}%` }]} />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.analysisSuccessContainer}>
                                <Text style={styles.successTitle}>SISTEMA DE TRANSFERÊNCIA ATIVO:</Text>
                                <View style={styles.accessChip}>
                                    <Text style={styles.accessChipText}>[ CLIQUE PARA IDENTIFICAR // SEGURE PARA COLETAR ]</Text>
                                </View>
                                <Text style={styles.hardwareSpecsText}>VOCÊ PODE MOVER ITENS ENTRE OS SLOTS</Text>
                            </View>
                        )}
                        {isScanning && <View style={styles.laserScanLine} />}
                    </View>

                    <View style={styles.salvageBox}>
                        <Text style={styles.sectionTitle}>MATRIZ DE EXTRAÇÃO DE ITENS</Text>

                        {!isScanning ? (
                            <View style={styles.gridContainer}>
                                {Array.from({ length: TOTAL_SLOTS }).map((_, index) => {
                                    const item = lootItems[index] || null;
                                    const dbItem = item?.id ? getItemData(item.id) : null;
                                    const isThisExamining = examiningIndex === index;
                                    const isSelected = selectedSlotIndex === index;
                                    const anItemIsSelected = selectedSlotIndex !== null;

                                    // SLOT VAZIO
                                    if (!item) {
                                        return (
                                            <View key={index} style={styles.slotWrapper}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.slotBase,
                                                        styles.slotEmpty,
                                                    ]}
                                                    onPress={() => handleSlotPress(index)}
                                                    activeOpacity={0.6}
                                                >
                                                    <View style={styles.emptySlotIndicator} />
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    }

                                    // SLOT NÃO IDENTIFICADO
                                    if (!item.revealed) {
                                        return (
                                            <View key={index} style={styles.slotWrapper}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.slotBase,
                                                        styles.slotUnexplored,
                                                    ]}
                                                    onPress={() => handleSlotPress(index)}
                                                    activeOpacity={0.8}
                                                >
                                                    {isThisExamining ? (
                                                        <View style={styles.slotExaminingOverlay}>
                                                            <ActivityIndicator
                                                                size="small"
                                                                color={amareloNeon}
                                                            />
                                                            <Text style={styles.slotExamineText}>
                                                                {examineProgress}%
                                                            </Text>
                                                        </View>
                                                    ) : (
                                                        <Text style={styles.slotUnknownIcon}>⚠️</Text>
                                                    )}

                                                    <View style={styles.qtyBadge}>
                                                        <Text style={styles.slotQuantity}>
                                                            {item.qty}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    }

                                    // SLOT IDENTIFICADO
                                    return (
                                        <View key={index} style={styles.slotWrapper}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.slotBase,
                                                    { borderColor: getRarityColor(item.rarity || dbItem?.rarity) },
                                                    isSelected && styles.slotHolded,
                                                ]}
                                                onPress={() => handleSlotPress(index)}
                                                onLongPress={() => handleSlotLongPress(index, item)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.itemContent}>
                                                    <Text style={styles.storageIcon}>
                                                        {dbItem?.icon || "📦"}
                                                    </Text>

                                                    {item.qty > 1 && (
                                                        <View style={styles.qtyBadge}>
                                                            <Text style={styles.slotQuantity}>
                                                                {item.qty}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {item.hasDurability &&
                                                        item.durability !== undefined && (
                                                            <View
                                                                style={[
                                                                    styles.miniDurabilityDot,
                                                                    {
                                                                        backgroundColor:
                                                                            item.durability < 40
                                                                                ? vermelhoNeon
                                                                                : verdeBase,
                                                                    },
                                                                ]}
                                                            />
                                                        )}
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={styles.loadingGridRow}>
                                <ActivityIndicator size="small" color={cianoNeon} />
                                <Text style={styles.interceptText}>ESTABELECENDO LINK DA GRADE...</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity style={styles.collectButton} onPress={onClose}>
                        <Text style={styles.collectButtonText}>[ FECHAR COMPARTIMENTO ]</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    screenOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 99,
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
        fontSize: 9,
        color: verdeBase,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    hardwareSpecsText: {
        fontSize: 7.5,
        color: "rgba(255,255,255,0.3)",
        textAlign: "center",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    salvageBox: { flex: 1 },
    sectionTitle: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 9.5,
        marginBottom: 12,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: "rgba(0,0,0,0.2)",
        padding: 4,
        gap: 6,
        justifyContent: "flex-start",
    },
    slotWrapper: {
        width: "12.5%",
        maxWidth: 100,
        aspectRatio: 1,
    },
    slotBase: {
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        alignItems: "center",
        justifyContent: "center",
    },
    slotEmpty: {
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        borderColor: "rgba(255,255,255,0.06)",
    },
    slotItemIcon: {
        fontSize: 16,
    },
    slotUnexplored: {
        backgroundColor: "rgba(255, 213, 74, 0.01)",
        borderColor: "rgba(255, 213, 74, 0.25)",
        borderStyle: "dashed",
    },
    slotUnknownIcon: {
        fontSize: 18,
        opacity: 0.6,
    },
    slotHolded: {
        borderColor: amareloNeon,
        backgroundColor: "rgba(255, 213, 74, 0.1)",
    },
    qtyBadge: {
        position: "absolute",
        bottom: 1,
        right: 1,
        backgroundColor: "#020b14",
        paddingHorizontal: 2,
    },
    itemContent: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
    },
    slotQuantity: {
        color: "#fff",
        fontSize: 8,
        fontWeight: "bold",
    },
    slotQtyIndicator: {
        position: "absolute",
        bottom: 1,
        right: 1,
        backgroundColor: "#020b14",
        paddingHorizontal: 2,
        color: "#fff",
        fontSize: 8,
        fontWeight: "bold",
    },
    emptySlotIndicator: {
        width: 2,
        height: 2,
        backgroundColor: "rgba(0, 234, 255, 0.15)",
    },
    slotExaminingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        alignItems: "center",
    },
    slotExamineText: {
        color: amareloNeon,
        fontSize: 9,
        fontWeight: "bold",
        marginTop: 2,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    miniDurabilityDot: {
        position: "absolute",
        top: 4,
        left: 4,
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    loadingGridRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 40
    },
    interceptText: {
        fontSize: 9.5,
        color: "rgba(255,255,255,0.2)",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace"
    },
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