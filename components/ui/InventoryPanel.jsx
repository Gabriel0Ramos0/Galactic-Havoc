import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { getItemData } from "../systems/ItemsDB";

const cianoNeon = "#00eaff";
const verdeBase = "#00ffaa";
const amareloNeon = "#ffd54a";
const vermelhoAlerta = "#ff4a4a";
const escuroProfundo = "rgba(2, 8, 16, 0.98)";

const TOTAL_STORAGE_SLOTS = 20;

export default function InventorySystem({ isOpen = false }) {
    const animLeftPanel = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const [activeTab, setActiveTab] = useState("inventory");
    const [hoveredName, setHoveredName] = useState("SELECIONE UM ITEM");

    // --- ESTADOS DO JOGADOR ---
    const [storageSlots, setStorageSlots] = useState(() => {
        const slots = Array(TOTAL_STORAGE_SLOTS).fill(null);
        slots[0] = { id: "scrap_metal", qty: 14 };
        slots[1] = { id: "iron_plate", qty: 6 };
        slots[2] = { id: "copper_wire", qty: 22 };
        return slots;
    });

    const [shipHardware, setShipHardware] = useState({
        "WPN-L": { slot: "WPN-L", allowedType: "WPN", id: null, durability: 0, active: false },
        "WPN-R": { slot: "WPN-R", allowedType: "WPN", id: "laser_vx", durability: 32, active: true },
        "POW-1": { slot: "POW-1", allowedType: "POW", id: "cell_alpha", durability: 94, active: true },
        "POW-2": { slot: "POW-2", allowedType: "POW", id: null, durability: 0, active: false },
        "NAV": { slot: "NAV", allowedType: "NAV", id: null, durability: 0, active: false },
        "WRP": { slot: "WRP", allowedType: "WRP", id: "null", durability: 0, active: false },
        "THR": { slot: "THR", allowedType: "THR", id: "ion_thruster", durability: 78, active: true }
    });

    const [draggedItem, setDraggedItem] = useState(null);

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(animLeftPanel, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
                Animated.timing(animLeftPanel, { toValue: -100, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSlotPress = (index, type = "storage", hardwareKey = null) => {
        if (type === "storage") {
            const clickedItem = storageSlots[index];

            if (draggedItem) {
                if (draggedItem.origin === "hardware") {
                    const hwItemData = getItemData(draggedItem.id);
                    const updatedHardware = { ...shipHardware };
                    const updatedStorage = [...storageSlots];

                    if (!clickedItem) {
                        updatedHardware[draggedItem.key] = {
                            ...updatedHardware[draggedItem.key],
                            id: null, active: false, durability: 0
                        };
                        updatedStorage[index] = { id: draggedItem.id, qty: 1 };
                        setHoveredName(`DESEQUIPADO: ${hwItemData.name}`);
                    } else {
                        const targetStorageItemData = getItemData(clickedItem.id);
                        if (targetStorageItemData.slotType === updatedHardware[draggedItem.key].allowedType) {
                            updatedHardware[draggedItem.key] = {
                                ...updatedHardware[draggedItem.key],
                                id: clickedItem.id, active: true, durability: 100
                            };
                            updatedStorage[index] = { id: draggedItem.id, qty: 1 };
                            setHoveredName(`REMANEJADO: ${hwItemData.name} <=> ${targetStorageItemData.name}`);
                        } else {
                            setHoveredName(`❌ EXIGE TAG [${updatedHardware[draggedItem.key].allowedType}]`);
                            setDraggedItem(null);
                            return;
                        }
                    }
                    setShipHardware(updatedHardware);
                    setStorageSlots(updatedStorage);
                    setDraggedItem(null);
                    return;
                }

                const updatedStorage = [...storageSlots];
                updatedStorage[draggedItem.index] = clickedItem;
                updatedStorage[index] = { id: draggedItem.id, qty: draggedItem.qty };
                setStorageSlots(updatedStorage);
                setDraggedItem(null);
            } else if (clickedItem) {
                setDraggedItem({ id: clickedItem.id, qty: clickedItem.qty, index, origin: "storage" });
                setHoveredName(`SELECIONADO: ${getItemData(clickedItem.id).name}`);
            }
        }
        else if (type === "hardware" && hardwareKey) {
            const currentHardwareSlot = shipHardware[hardwareKey];

            if (draggedItem) {
                if (draggedItem.origin === "hardware") {
                    if (draggedItem.key === hardwareKey) { setDraggedItem(null); return; }
                    const globalItemData = getItemData(draggedItem.id);
                    if (globalItemData.slotType !== currentHardwareSlot.allowedType) {
                        setHoveredName(`❌ REQUER TAG [${currentHardwareSlot.allowedType}]`);
                        setDraggedItem(null);
                        return;
                    }
                    const updatedHardware = { ...shipHardware };
                    const targetOldId = currentHardwareSlot.id;
                    const targetOldActive = currentHardwareSlot.active;
                    const targetOldDurability = currentHardwareSlot.durability;

                    updatedHardware[hardwareKey] = {
                        ...currentHardwareSlot,
                        id: draggedItem.id, active: true, durability: draggedItem.durability || 100
                    };
                    updatedHardware[draggedItem.key] = {
                        ...updatedHardware[draggedItem.key],
                        id: targetOldId, active: targetOldActive, durability: targetOldDurability
                    };
                    setShipHardware(updatedHardware);
                    setDraggedItem(null);
                    return;
                }

                if (draggedItem.origin === "storage") {
                    const globalItemData = getItemData(draggedItem.id);
                    if (globalItemData.slotType !== currentHardwareSlot.allowedType) {
                        setHoveredName(`❌ EXIGE TAG [${currentHardwareSlot.allowedType}]`);
                        setDraggedItem(null);
                        return;
                    }
                    const updatedHardware = { ...shipHardware };
                    const updatedStorage = [...storageSlots];
                    const oldHardwareId = currentHardwareSlot.id;

                    updatedHardware[hardwareKey] = { ...currentHardwareSlot, id: draggedItem.id, active: true, durability: 100 };
                    updatedStorage[draggedItem.index] = oldHardwareId ? { id: oldHardwareId, qty: 1 } : null;

                    setShipHardware(updatedHardware);
                    setStorageSlots(updatedStorage);
                    setHoveredName(`EQUIPADO: ${globalItemData.name}`);
                    setDraggedItem(null);
                }
            }
            else if (currentHardwareSlot.active) {
                setDraggedItem({ id: currentHardwareSlot.id, key: hardwareKey, origin: "hardware", durability: currentHardwareSlot.durability });
                setHoveredName(`MOVER: ${getItemData(currentHardwareSlot.id).name}`);
            }
        }
    };

    const translateXLeft = animLeftPanel.interpolate({ inputRange: [-100, 0], outputRange: [-550, 0] });

    return (
        <Animated.View style={[styles.screenOverlay, { opacity }]}>
            <Animated.View style={[styles.leftPanel, { transform: [{ translateX: translateXLeft }] }]}>
                <View style={styles.topAccentBar} />

                {/* INTERFACE DE ABAS SUPERIORES */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.tabButton, activeTab === "status" && styles.tabButtonActive]}
                        onPress={() => setActiveTab("status")}
                    >
                        <Text style={[styles.tabText, activeTab === "status" && styles.tabTextActive]}>
                            [ Informações da Nave ]
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.tabButton, activeTab === "inventory" && styles.tabButtonActive]}
                        onPress={() => setActiveTab("inventory")}
                    >
                        <Text style={[styles.tabText, activeTab === "inventory" && styles.tabTextActive]}>
                            [ Inventário ]
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* --- ABA 1: SÓ DADOS (NÃO EXIBE CONSOLE HUD) --- */}
                {activeTab === "status" && (
                    <View style={styles.tabContentContainer}>
                        <View style={styles.statsPanel}>

                            {/* SEÇÃO 1: STATUS GERAL */}
                            <Text style={styles.subSectionLabel}>// 01. INTEGRALIDADE E DANOS GERAIS</Text>
                            <View style={styles.statGroup}>
                                <View style={styles.statRow}>
                                    <Text style={styles.statLabel}>INTEGRIDADE GERAL DO CASCO</Text>
                                    <Text style={styles.statValue}>98.4%</Text>
                                </View>
                                <View style={styles.statRow}>
                                    <Text style={styles.statLabel}>DANO GLOBAL ESTIMADO</Text>
                                    <Text style={[styles.statValue, { color: vermelhoAlerta }]}>10.0%</Text>
                                </View>
                                <View style={styles.statRow}>
                                    <Text style={styles.statLabel}>   ↳ ESCUDO DEFLETOR</Text>
                                    <Text style={[styles.statValue, { color: vermelhoAlerta }]}>0% [OFFAIR]</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* SEÇÃO 2: MUDANÇA RÁPIDA / DINÂMICOS */}
                            <Text style={styles.subSectionLabel}>// 02. VARIÁVEIS DE MUDANÇA RÁPIDA</Text>
                            <View style={styles.statGroup}>
                                <View style={styles.statRow}>
                                    <Text style={styles.statLabel}>POTÊNCIA LADO ESQUERDO</Text>
                                    <Text style={styles.statValue}>0</Text>
                                </View>
                                <View style={styles.statRow}>
                                    <Text style={styles.statLabel}>POTÊNCIA LADO DIREITO</Text>
                                    <Text style={[styles.statValue, { color: amareloNeon }]}>10</Text>
                                </View>
                                <View style={styles.statRow}>
                                    <Text style={styles.statLabel}>CONSUMO ATUAL DE ENERGIA</Text>
                                    <Text style={[styles.statValue, { color: amareloNeon }]}>5 MW/s</Text>
                                </View>
                                <View style={styles.statRow}>
                                    <Text style={styles.statLabel}>SUPRESSÃO DE CALOR</Text>
                                    <Text style={styles.statValue}>42%</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* SEÇÃO 3: OUTROS DADOS / SISTEMAS */}
                            <Text style={styles.subSectionLabel}>// 03. TELEMETRIA DO REATOR E ENERGIA</Text>
                            <View style={styles.statGroup}>
                                <View style={styles.statRow}>
                                    <Text style={styles.statLabel}>ENERGIA MÁXIMA SUPORTADA</Text>
                                    <Text style={styles.statValue}>100 MW</Text>
                                </View>
                                <View style={styles.statRow}>
                                    <Text style={styles.statLabel}>NÍVEL DO REATOR ATIVO</Text>
                                    <Text style={[styles.statValue, { color: amareloNeon }]}>LVL 03</Text>
                                </View>
                                <View style={styles.statRow}>
                                    <Text style={styles.statLabel}>EFICIÊNCIA TÉRMICA</Text>
                                    <Text style={styles.statValue}>94.2%</Text>
                                </View>
                            </View>

                        </View>
                    </View>
                )}

                {/* --- ABA 2: ESQUEMA + INVENTÁRIO + CONSOLE HUD FIXO NA BASE --- */}
                {activeTab === "inventory" && (
                    <View style={styles.tabContentContainer}>

                        {/* ESQUEMA DA NAVE */}
                        <Text style={styles.sectionLabel}>EQUIPAMENTO INTEGRADO</Text>
                        <View style={styles.shipSchemaContainer}>
                            <View style={styles.wingColumn}>
                                {renderActiveSlot(shipHardware["WPN-L"], "WPN-L", handleSlotPress, draggedItem, setHoveredName)}
                            </View>
                            <View style={styles.coreColumn}>
                                <View style={styles.coreRow}>
                                    {renderActiveSlot(shipHardware["POW-1"], "POW-1", handleSlotPress, draggedItem, setHoveredName)}
                                    {renderActiveSlot(shipHardware["POW-2"], "POW-2", handleSlotPress, draggedItem, setHoveredName)}
                                </View>
                                <View style={styles.coreRow}>
                                    {renderActiveSlot(shipHardware["NAV"], "NAV", handleSlotPress, draggedItem, setHoveredName)}
                                    {renderActiveSlot(shipHardware["WRP"], "WRP", handleSlotPress, draggedItem, setHoveredName)}
                                </View>
                                {renderActiveSlot(shipHardware["THR"], "THR", handleSlotPress, draggedItem, setHoveredName)}
                            </View>
                            <View style={styles.wingColumn}>
                                {renderActiveSlot(shipHardware["WPN-R"], "WPN-R", handleSlotPress, draggedItem, setHoveredName)}
                            </View>
                        </View>

                        {/* COMPARTIMENTO DE CARGA */}
                        <Text style={styles.sectionLabel}>COMPARTIMENTO DE CARGA SECUNDÁRIO</Text>
                        <View style={styles.gridContainer}>
                            {storageSlots.map((slot, index) => {
                                const isBeingDragged = draggedItem?.origin === "storage" && draggedItem?.index === index;
                                const itemData = slot ? getItemData(slot.id) : null;
                                return (
                                    <View key={index} style={styles.slotWrapper}>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => handleSlotPress(index, "storage")}
                                            onPressIn={() => itemData && setHoveredName(itemData.name)}
                                            style={[styles.storageSlot, isBeingDragged && styles.slotHolded]}
                                        >
                                            {itemData ? (
                                                <View style={styles.itemContent}>
                                                    <Text style={styles.storageIcon}>{itemData.icon}</Text>
                                                    {slot.qty > 1 && (
                                                        <View style={styles.qtyBadge}>
                                                            <Text style={styles.slotQuantity}>{slot.qty}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            ) : <View style={styles.emptySlotIndicator} />}
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>

                        {/* CONSOLE HUD TRAVADO APENAS AQUI NA BASE DO INVENTÁRIO */}
                        <View style={styles.consoleDisplay}>
                            <Text style={styles.consoleText}>&gt; {hoveredName.toUpperCase()}</Text>
                        </View>
                    </View>
                )}

            </Animated.View>
        </Animated.View>
    );
}

const renderActiveSlot = (item, key, onPress, draggedItem, setHoveredName) => {
    const isBeingDragged = draggedItem?.origin === "hardware" && draggedItem?.key === key;
    const currentItemData = item.active ? getItemData(item.id) : null;

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPress(null, "hardware", key)}
            onPressIn={() => setHoveredName(currentItemData ? `${currentItemData.name}` : `SLOT DISPONÍVEL [${key}]`)}
            style={[styles.hardwareSlot, !item.active && styles.slotDisabled, isBeingDragged && styles.slotHolded]}
        >
            <Text style={styles.slotLabelHeader}>{key}</Text>
            <Text style={[styles.itemIcon, !item.active && styles.iconNull]}>
                {currentItemData ? currentItemData.icon : "•"}
            </Text>
            {item.active && (
                <View style={styles.durabilityTrack}>
                    <View style={[styles.durabilityFill, { width: `${item.durability}%` }]} />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    screenOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 15,
        backgroundColor: "transparent",
    },
    leftPanel: {
        position: "absolute",
        top: 0, bottom: 0, left: 0,
        width: "40%",
        backgroundColor: escuroProfundo,
        borderRightWidth: 2,
        borderColor: "rgba(0, 234, 255, 0.2)",
        padding: 14,
    },
    topAccentBar: {
        height: 4,
        backgroundColor: cianoNeon,
        position: "absolute",
        top: 0, left: 0, right: 0,
    },
    /* --- DESIGN DE ABAS CONTIDAS --- */
    tabsContainer: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        marginBottom: 14,
        marginTop: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    tabButtonActive: {
        backgroundColor: "rgba(0, 234, 255, 0.06)",
        borderBottomWidth: 2,
        borderBottomColor: cianoNeon,
    },
    tabText: {
        color: "rgba(255, 255, 255, 0.4)",
        fontSize: 11,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    tabTextActive: {
        color: cianoNeon,
    },
    tabContentContainer: {
        flex: 1,
        justifyContent: "flex-start",
    },
    /* --- ESQUEMA DA NAVE CONTROLADO --- */
    shipSchemaContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        paddingVertical: 12,
        gap: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.02)",
    },
    wingColumn: { justifyContent: "center" },
    coreColumn: { alignItems: "center", gap: 6 },
    coreRow: { flexDirection: "row", gap: 6 },
    hardwareSlot: {
        width: 48, height: 48, // Ajustado para tamanho equilibrado na grid lateral
        backgroundColor: "rgba(1, 4, 8, 0.9)",
        borderWidth: 1,
        borderColor: "rgba(0, 234, 255, 0.25)",
        alignItems: "center",
        justifyContent: "center",
    },
    slotLabelHeader: {
        position: "absolute",
        top: 3, left: 4,
        fontSize: 7.5,
        fontWeight: "bold",
        color: "rgba(0, 234, 255, 0.6)",
    },
    slotDisabled: { backgroundColor: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.03)" },
    slotHolded: { borderColor: amareloNeon, backgroundColor: "rgba(255, 213, 74, 0.1)" },
    durabilityTrack: {
        position: "absolute",
        bottom: 3, left: 4, right: 4, height: 2,
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    durabilityFill: { height: "100%", backgroundColor: amareloNeon },
    itemIcon: { fontSize: 20 },
    iconNull: { color: "rgba(255,255,255,0.05)" },
    sectionLabel: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 10,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        marginBottom: 6,
    },
    /* --- GRID PROPORCIONAL À TELA DA ESQUERDA --- */
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: "rgba(0,0,0,0.2)",
        padding: 4,
        gap: 6, // Margem controlada entre slots
        justifyContent: "flex-start",
    },
    slotWrapper: {
        width: "12.5%", // Alinhado perfeitamente para 7 colunas seguras na metade da tela
        maxWidth: 44,   // Garante que não vai esticar infinitamente em telas largas
        aspectRatio: 1,
    },
    storageSlot: {
        width: "100%", height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
        alignItems: "center",
        justifyContent: "center",
    },
    itemContent: { alignItems: "center", justifyContent: "center", width: "100%", height: "100%" },
    storageIcon: { fontSize: 16 },
    qtyBadge: { position: "absolute", bottom: 1, right: 1, backgroundColor: "#020b14", paddingHorizontal: 2 },
    slotQuantity: { color: "#fff", fontSize: 8, fontWeight: "bold" },
    emptySlotIndicator: { width: 2, height: 2, backgroundColor: "rgba(0, 234, 255, 0.15)" },
    /* --- CONSOLE FIXO NA BASE DA ABA --- */
    consoleDisplay: {
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: 10,
        borderLeftWidth: 3,
        borderColor: cianoNeon,
        marginTop: "auto", // Joga o painel de texto fixo no fim do container vertical
        marginBottom: 4,
    },
    consoleText: {
        color: cianoNeon,
        fontSize: 11,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace"
    },
    /* --- TELEMETRIA PURA (SEM CONSOLE) --- */
    subSectionLabel: {
        color: cianoNeon,
        fontSize: 9.5,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    statGroup: {
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 2,
    },
    statsPanel: {
        backgroundColor: "rgba(1, 5, 10, 0.6)",
        padding: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.04)",
    },
    statRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 3
    },
    statLabel: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 11.5,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace"
    },
    statValue: {
        color: verdeBase,
        fontSize: 12.5,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace"
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.08)",
        marginVertical: 10,
    }
});