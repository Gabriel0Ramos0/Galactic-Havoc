import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Platform, Dimensions } from "react-native";

const cianoNeon = "#00eaff";
const verdeBase = "#00ffaa";

export default function MessageBox({
    message = "",
    position = "bottom-left",
    duration = 8000,
    onHidden = () => { },
}) {
    const slide = useRef(new Animated.Value(40)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(0.3)).current;

    // Ancoragem pelo topo top
    const getPositionStyle = () => {
        return {
            position: "absolute",
            top: 20,
            left: 0
        };
    };

    useEffect(() => {
        if (!message) return;

        // Resetar valores para reiniciar a animação a cada nova string de texto
        slide.setValue(40);
        opacity.setValue(0);

        Animated.parallel([
            Animated.timing(slide, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0.3,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        );
        pulseLoop.start();

        const timer = setTimeout(() => hideBox(), duration);

        return () => {
            clearTimeout(timer);
            pulseLoop.stop();
        };
    }, [message]);

    const hideBox = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slide, {
                toValue: -20,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => onHidden());
    };

    if (!message) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                getPositionStyle(),
                {
                    opacity,
                    transform: [{ translateY: slide }],
                },
            ]}
        >
            <View style={styles.layerBase} />
            <View style={styles.cornerBracketTopLeft} />
            <View style={styles.cornerBracketBottomRight} />

            <Animated.View style={[styles.energyBorderGlow, { opacity: pulse }]} />

            <View style={styles.innerContent}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>COM_LINK // CANAL_REDE</Text>
                    <Animated.View style={[styles.blinkDot, { opacity: pulse }]} />
                </View>
                <Text style={styles.messageText}>{message}</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 280,
        minHeight: 75,
        zIndex: 999,
    },
    layerBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(1, 10, 18, 0.95)",
        borderColor: "rgba(0, 234, 255, 0.25)",
        borderWidth: 1,
        borderLeftWidth: 3,
        borderLeftColor: cianoNeon,
    },
    energyBorderGlow: {
        ...StyleSheet.absoluteFillObject,
        borderColor: "rgba(0, 234, 255, 0.4)",
        borderWidth: 1,
        margin: -2,
    },
    cornerBracketTopLeft: {
        position: "absolute",
        top: 0,
        left: 0,
        width: 8,
        height: 2,
        backgroundColor: verdeBase,
    },
    cornerBracketBottomRight: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 2,
        height: 8,
        backgroundColor: cianoNeon,
    },
    innerContent: {
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.08)",
        paddingBottom: 3,
    },
    headerTitle: {
        fontSize: 9,
        color: cianoNeon,
        fontWeight: "bold",
        letterSpacing: 1,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    blinkDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: verdeBase,
    },
    messageText: {
        color: "#dfefff",
        fontSize: 13,
        fontWeight: "500",
        lineHeight: 18,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
});