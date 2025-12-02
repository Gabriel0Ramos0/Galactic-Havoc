import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Dimensions } from "react-native";

export default function MessageBox({
    message = "",
    position = "bottom-left",
    duration = 10000, // tempo visível em ms
    onHidden = () => { },
}) {
    const slide = useRef(new Animated.Value(60)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const glow = useRef(new Animated.Value(1)).current;
    const pulse = useRef(new Animated.Value(0)).current;

    const glowLoop = useRef(null);
    const pulseLoop = useRef(null);

    // POSIÇÃO
    const getPositionStyle = () => {
        const pos = {
            "bottom-left": { top: 25, left: -50 },
            "bottom-right": { bottom: 25, right: 25 },
            "top-left": { top: 25, left: 25 },
            "top-right": { top: 25, right: 25 },
        };
        return pos[position] || pos["bottom-left"];
    };

    // ANIMAÇÕES
    useEffect(() => {
        if (!message) return;

        // entrada
        Animated.parallel([
            Animated.timing(slide, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();

        // iniciar loops de energia UMA VEZ por component mount
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

        pulseLoop.current = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: false,
                }),
                Animated.timing(pulse, {
                    toValue: 0,
                    duration: 900,
                    useNativeDriver: false,
                }),
            ])
        );
        pulseLoop.current.start();

        // auto-hide
        const timer = setTimeout(() => hideBox(), duration);

        // cleanup
        return () => {
            clearTimeout(timer);

            if (glowLoop.current) glowLoop.current.stop();
            if (pulseLoop.current) pulseLoop.current.stop();
        };
    }, [message]);

    const hideBox = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(slide, {
                toValue: 80,
                duration: 350,
                useNativeDriver: true,
            }),
        ]).start(() => onHidden());
    };

    const glowColor = glow.interpolate({
        inputRange: [0, 1],
        outputRange: [
            "rgba(130,0,255,0.25)",
            "rgba(255,0,190,0.85)",
        ],
    });

    const pulseOpacity = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.15, 0.45],
    });

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
            {/* BASE */}
            <View style={styles.layerBase} />

            {/* CORTES SOLO-LEVELING */}
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
                    { opacity: pulseOpacity },
                ]}
            />

            <View style={styles.innerContent}>
                <Text style={styles.text}>{message}</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        width: 300,
        minHeight: 80,
    },

    layerBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(5,5,20,0.95)",
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: "rgba(120,0,255,0.35)",
    },

    layerCutsTop: {
        position: "absolute",
        top: -6,
        left: 18,
        right: 18,
        height: 12,
        backgroundColor: "rgba(120,0,255,0.6)",
        transform: [{ skewX: "-25deg" }],
        borderRadius: 2,
        opacity: 0.35,
    },

    layerCutsBottom: {
        position: "absolute",
        bottom: -6,
        left: 18,
        right: 18,
        height: 12,
        backgroundColor: "rgba(120,0,255,0.6)",
        transform: [{ skewX: "25deg" }],
        borderRadius: 2,
        opacity: 0.35,
    },

    energyBorder: {
        ...StyleSheet.absoluteFillObject,
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderWidth: 2,
        borderRadius: 8,
    },

    innerPulse: {
        position: "absolute",
        top: 4,
        left: 4,
        right: 4,
        bottom: 4,
        backgroundColor: "rgba(255,0,200,0.15)",
        borderRadius: 5,
    },

    innerContent: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        zIndex: 20,
    },

    text: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "500",
    },
});
