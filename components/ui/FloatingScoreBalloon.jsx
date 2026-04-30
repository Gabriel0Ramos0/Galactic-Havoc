import React, { useEffect, useState } from "react";
import { Text, StyleSheet, Animated } from "react-native";

export default function FloatingScoreBalloon({ amount, onComplete }) {
    const [translateY] = useState(new Animated.Value(0));
    const [translateX] = useState(new Animated.Value(0));
    const [opacity] = useState(new Animated.Value(0));

    useEffect(() => {
        const horizontalOffset = Math.random() > 0.5 ? 30 : -30;

        Animated.sequence([
            Animated.parallel([
                // Fade in no início
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                // Sobe
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                // Move para esquerda ou direita
                Animated.timing(translateX, {
                    toValue: horizontalOffset,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                // Fade out no final
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 1000,
                    delay: 2000,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            onComplete();
        });
    }, []);

    return (
        <Animated.Text
            style={[
                styles.text,
                {
                    transform: [{ translateY }, { translateX }],
                    opacity,
                },
            ]}
        >
            +{amount}
        </Animated.Text>
    );
}

const styles = StyleSheet.create({
    text: {
        position: "absolute",
        fontSize: 18,
        fontWeight: "bold",
        color: "#2ecc71",
        fontFamily: "monospace",
    },
});
