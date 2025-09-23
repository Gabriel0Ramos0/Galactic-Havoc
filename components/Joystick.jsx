// app/components/Joystick.jsx
import React, { useRef } from "react";
import { View, PanResponder, Animated, TouchableOpacity, Text, Platform } from "react-native";
import styles from "@/app/screens/style";

export default function Joystick({ onMove }) {
    const outerSize = 120;
    const innerSize = 60;
    const maxDistance = outerSize / 2;

    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const dragging = useRef(false);

    const updateDelta = (dx, dy) => {
        // Normaliza o delta para -1 a 1
        let deltaX = Math.max(-maxDistance, Math.min(maxDistance, dx));
        let deltaY = Math.max(-maxDistance, Math.min(maxDistance, dy));
        pan.setValue({ x: deltaX, y: deltaY });

        onMove({
            x: deltaX / maxDistance,
            y: -deltaY / maxDistance, // invertido para frente ser positivo
        });
    };

    const resetJoystick = () => {
        dragging.current = false;
        Animated.timing(pan, {
            toValue: { x: 0, y: 0 },
            duration: 150,
            useNativeDriver: false,
        }).start();
        onMove({ x: 0, y: 0 });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                dragging.current = true;
            },
            onPanResponderMove: (_, gestureState) => {
                if (dragging.current) {
                    updateDelta(gestureState.dx, gestureState.dy);
                }
            },
            onPanResponderRelease: () => resetJoystick(),
            onPanResponderTerminate: () => resetJoystick(),
        })
    ).current;

    // Botões de subir/descida
    const upButton = () => onMove({ up: true });
    const downButton = () => onMove({ down: true });

    if (Platform.OS === "web") return null;

    return (
        <>
            <View style={styles.joystickOuter} {...panResponder.panHandlers}>
                <Animated.View style={[styles.joystickInner, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]} />
            </View>

            <TouchableOpacity style={styles.upButton} onPressIn={() => onMove({ y: 1 })} onPressOut={() => onMove({ y: 0 })}>
                <Text>▲</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.downButton} onPressIn={() => onMove({ y: -1 })} onPressOut={() => onMove({ y: 0 })}>
                <Text>▼</Text>
            </TouchableOpacity>
        </>
    );
}
