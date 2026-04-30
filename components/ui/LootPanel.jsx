import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

export default function LootPanel({
    isOpen = false,
    lootItems = [],
    onClose = () => { },
}) {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.95)).current;
    const scaleY = useRef(new Animated.Value(0)).current;

    const glow = useRef(new Animated.Value(1)).current;
    const glowLoop = useRef(null);

    // ANIMAÇÕES
    useEffect(() => {
        if (isOpen) {
            // Entrada com fade vertical
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleY, {
                    toValue: 1,
                    duration: 450,
                    useNativeDriver: true,
                }),
            ]).start();

            // Iniciar loop de glow
            glowLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(glow, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: false,
                    }),
                    Animated.timing(glow, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: false,
                    }),
                ])
            );
            glowLoop.current.start();
        } else {
            // Saída com fade vertical
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 0.95,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleY, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                if (glowLoop.current) glowLoop.current.stop();
            });
        }

        return () => {
            if (glowLoop.current) glowLoop.current.stop();
        };
    }, [isOpen]);

    const glowColor = glow.interpolate({
        inputRange: [0, 1],
        outputRange: [
            "rgba(130,200,255,0.25)",
            "rgba(100,255,218,0.85)",
        ],
    });

    if (!isOpen && opacity._value === 0) return null;

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
            <TouchableOpacity
                style={styles.closeArea}
                onPress={onClose}
                activeOpacity={1}
            />

            <Animated.View
                style={[
                    styles.container,
                    {
                        opacity,
                        transform: [
                            { scale },
                            { scaleY }
                        ],
                    },
                ]}
            >
                {/* BASE */}
                <View style={styles.layerBase} />
                <View style={styles.layerCutsTop} />
                <View style={styles.layerCutsBottom} />

                {/* BORDA DE ENERGIA */}
                <Animated.View
                    style={[
                        styles.energyBorder,
                        { borderColor: glowColor },
                    ]}
                />

                {/* LUZ INTERNA */}
                <Animated.View
                    style={[
                        styles.innerPulse,
                    ]}
                />

                <View style={styles.innerContent}>
                    <Text style={styles.title}>LOOT</Text>

                    {lootItems && lootItems.length > 0 ? (
                        <ScrollView
                            style={styles.itemsScroll}
                            scrollEnabled={lootItems.length > 4}
                            showsVerticalScrollIndicator={false}
                        >
                            {lootItems.map((item, index) => (
                                <View key={index} style={styles.lootItem}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={[
                                        styles.itemRarity,
                                        {
                                            color: getRarityColor(item.rarity),
                                        }
                                    ]}>
                                        {item.quantity ? `x${item.quantity}` : ""}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <Text style={styles.emptyText}>Nenhum item encontrado</Text>
                    )}

                    <Text style={styles.closeHint}>Pressione I para fechar</Text>
                </View>
            </Animated.View>
        </Animated.View>
    );
}

function getRarityColor(rarity) {
    const colors = {
        common: "#a0a0a0",
        uncommon: "#3cff75",
        rare: "#3cfaff",
        epic: "#c478ff",
        legendary: "#ff9d00",
    };
    return colors[rarity] || "#ffffff";
}

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
    },

    closeArea: {
        ...StyleSheet.absoluteFillObject,
    },

    container: {
        position: "absolute",
        top: "30%",
        left: "70%",
        width: 360,
        maxHeight: 500,
        transform: [{ translateX: -180 }, { translateY: -250 }],
    },

    layerBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(5,10,30,0.97)",
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "rgba(100,200,255,0.35)",
    },

    layerCutsTop: {
        position: "absolute",
        top: -8,
        left: 20,
        right: 20,
        height: 14,
        backgroundColor: "rgba(100,200,255,0.5)",
        transform: [{ skewX: "-25deg" }],
        borderRadius: 2,
        opacity: 0.4,
    },

    layerCutsBottom: {
        position: "absolute",
        bottom: -8,
        left: 20,
        right: 20,
        height: 14,
        backgroundColor: "rgba(100,200,255,0.5)",
        transform: [{ skewX: "25deg" }],
        borderRadius: 2,
        opacity: 0.4,
    },

    energyBorder: {
        ...StyleSheet.absoluteFillObject,
        top: -5,
        left: -5,
        right: -5,
        bottom: -5,
        borderWidth: 2,
        borderRadius: 10,
    },

    innerPulse: {
        position: "absolute",
        top: 4,
        left: 4,
        right: 4,
        bottom: 4,
        backgroundColor: "rgba(100,255,218,0.08)",
        borderRadius: 6,
    },

    innerContent: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        zIndex: 20,
    },

    title: {
        color: "#64ffda",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 16,
        fontFamily: "monospace",
        letterSpacing: 2,
    },

    itemsScroll: {
        maxHeight: 280,
        marginBottom: 12,
    },

    lootItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 6,
        backgroundColor: "rgba(100,200,255,0.1)",
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: "rgba(100,255,218,0.6)",
    },

    itemName: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "500",
        flex: 1,
    },

    itemRarity: {
        fontSize: 12,
        fontWeight: "bold",
        fontFamily: "monospace",
    },

    emptyText: {
        color: "#888888",
        fontSize: 14,
        textAlign: "center",
        paddingVertical: 40,
        fontStyle: "italic",
    },

    closeHint: {
        color: "#666666",
        fontSize: 11,
        textAlign: "center",
        marginTop: 12,
        fontFamily: "monospace",
        fontStyle: "italic",
    },
});
