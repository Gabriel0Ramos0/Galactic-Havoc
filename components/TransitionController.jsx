import {
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
    useEffect,
} from "react";
import { View, Animated, StyleSheet, Dimensions, Text, Easing } from "react-native";

const { height } = Dimensions.get("window");

const TransitionController = forwardRef((props, ref) => {
    const anim = useRef(new Animated.Value(0)).current;
    const [visible, setVisible] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const isRunningRef = useRef(false);

    // Animação das letras
    const letters = "LOADING".split("");
    const letterAnims = useRef(letters.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        let isMounted = true;

        const animateSequence = async () => {
            while (isMounted) {
                for (let i = 0; i < letterAnims.length; i++) {
                    Animated.sequence([
                        Animated.timing(letterAnims[i], {
                            toValue: -10,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(letterAnims[i], {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ]).start();

                    await new Promise(res => setTimeout(res, 100));
                }
            }
        };
        animateSequence();

        return () => {
            isMounted = false;
        };
    }, []);

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

            let showLoaderTimeout;

            try {
                if (callback) {
                    const callbackPromise = callback();

                    // só mostra loader se demorar
                    showLoaderTimeout = setTimeout(() => {
                        setShowLoader(true);
                    }, 150);

                    await callbackPromise;
                }
            } catch (err) {
                console.warn("Erro na transição:", err);
            }

            if (showLoaderTimeout) {
                clearTimeout(showLoaderTimeout);
            }

            setShowLoader(false);

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

            {/* LOADER */}
            {showLoader && (
                <View style={styles.loaderContainer}>
                    {letters.map((l, i) => (
                        <Animated.Text
                            key={i}
                            style={[
                                styles.letter,
                                {
                                    transform: [{ translateY: letterAnims[i] }],
                                },
                            ]}
                        >
                            {l}
                        </Animated.Text>
                    ))}
                </View>
            )}

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

    loaderContainer: {
        flexDirection: "row",
        gap: 8,
        zIndex: 10,
    },

    letter: {
        color: "#f5f5f5",
        fontSize: 18,
        fontWeight: "600",
        fontFamily: "monospace",
        letterSpacing: 4,
    },
});