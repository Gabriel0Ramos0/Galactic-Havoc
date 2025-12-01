import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

export default function MessageBox({
    message = "Mensagem...",
    position = "bottom-left",
    duration = 10000, // tempo visível em ms
    onHidden = () => { },
}) {
    const fade = useRef(new Animated.Value(0)).current;
    const [visible, setVisible] = useState(Boolean(message));

    useEffect(() => {
        if (!message) {
            setVisible(false);
            return;
        }

        setVisible(true);
        // fade-in
        Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();

        const t = setTimeout(() => {
            // fade-out
            Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
                setVisible(false);
                onHidden();
            });
        }, duration);

        return () => clearTimeout(t);
    }, [message]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.wrapper, styles[position], { opacity: fade }]}>
            <View style={styles.boxOuter}>
                <View style={styles.boxInner}>
                    <Text style={styles.text}>{message}</Text>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: { position: "absolute", zIndex: 20 },
    "bottom-left": { top: 50 }, // seu ajuste
    boxOuter: {
        padding: 2,
        backgroundColor: "rgba(0,180,255,0.35)",
        borderRadius: 10,
        shadowColor: "#00cfff",
        shadowOpacity: 0.9,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
    },
    boxInner: {
        minWidth: 250,
        maxWidth: 300,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: "rgba(5,20,40,0.78)",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(0,240,255,0.12)",
    },
    text: {
        color: "#c8f6ff",
        fontSize: 14,
        fontWeight: "600",
    },
});
