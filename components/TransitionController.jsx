import React, {
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from "react";
import { View, Animated, StyleSheet, Dimensions, Easing } from "react-native";

const { height } = Dimensions.get("window");

const TransitionController = forwardRef((props, ref) => {
    const anim = useRef(new Animated.Value(0)).current;
    const [visible, setVisible] = useState(false);
    const isRunningRef = useRef(false);

    useImperativeHandle(ref, () => ({
        async start(callback) {
            if (isRunningRef.current) return;
            isRunningRef.current = true;

            setVisible(true);

            // Fechar
            await new Promise((resolve) => {
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }).start(resolve);
            });

            // Executa ação no meio da transição
            try {
                if (callback) {
                    await callback();
                }
            } catch (err) {
                console.warn("Erro na transição:", err);
            }

            // Abrir
            await new Promise((resolve) => {
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }).start(resolve);
            });

            setVisible(false);
            isRunningRef.current = false;
        },
    }));

    if (!visible) return null;

    return (
        <View style={styles.container} pointerEvents="auto">
            {/* CORTINA SUPERIOR */}
            <Animated.View
                style={[
                    styles.curtain,
                    {
                        top: 0,
                        transform: [
                            {
                                translateY: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-height / 2, 0],
                                }),
                            },
                        ],
                    },
                ]}
            />

            {/* CORTINA INFERIOR */}
            <Animated.View
                style={[
                    styles.curtain,
                    {
                        bottom: 0,
                        transform: [
                            {
                                translateY: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [height / 2, 0],
                                }),
                            },
                        ],
                    },
                ]}
            />
        </View>
    );
});

export default TransitionController;

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: "center",
        alignItems: "center",
    },

    curtain: {
        position: "absolute",
        width: "100%",
        height: height / 2,
        backgroundColor: "#000",
    },
});