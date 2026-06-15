import React, {
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
    useEffect,
} from "react";
import { View, Animated, StyleSheet, Dimensions, Text, Easing, Platform } from "react-native";

const { height, width } = Dimensions.get("window");
const cyanNeon = "#00eaff";

const BOOT_STATUSES = [
    "INICIALIZANDO MOTOR DE DOBRA...",
    "CONECTANDO AO TERMINAL MK-IV...",
    "CALIBRANDO COORDENADAS DA SEED...",
    "SINCRONIZANDO SISTEMAS DE TELEMETRIA...",
    "ABRINDO PORTAL QUANTUM...",
    "ESTABILIZANDO ESCUDOS DEFLETORES..."
];

const TransitionController = forwardRef((props, ref) => {
    const anim = useRef(new Animated.Value(0)).current;
    const [visible, setVisible] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const isRunningRef = useRef(false);
    const [statusText, setStatusText] = useState(BOOT_STATUSES[0]);
    const letters = "CARREGANDO SISTEMA".split("");
    const letterAnims = useRef(letters.map(() => new Animated.Value(1))).current;
    const progressBarAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let isMounted = true;

        const animateLetters = async () => {
            while (isMounted) {
                const randomIndex = Math.floor(Math.random() * letters.length);

                Animated.sequence([
                    Animated.timing(letterAnims[randomIndex], {
                        toValue: 0.2,
                        duration: 50,
                        useNativeDriver: true,
                    }),
                    Animated.timing(letterAnims[randomIndex], {
                        toValue: 1,
                        duration: 50,
                        useNativeDriver: true,
                    }),
                ]).start();

                await new Promise(res => setTimeout(res, 200));
            }
        };

        const animateProgressBar = () => {
            progressBarAnim.setValue(0);
            Animated.loop(
                Animated.timing(progressBarAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: false, 
                })
            ).start();
        };

        let statusIndex = 0;
        const statusInterval = setInterval(() => {
            if (isMounted) {
                statusIndex = (statusIndex + 1) % BOOT_STATUSES.length;
                setStatusText(BOOT_STATUSES[statusIndex]);
            }
        }, 1200);

        if (showLoader) {
            animateLetters();
            animateProgressBar();
        }

        return () => {
            isMounted = false;
            clearInterval(statusInterval);
        };
    }, [showLoader]);

    useImperativeHandle(ref, () => ({
        async start(callback) {
            if (isRunningRef.current) return;
            isRunningRef.current = true;

            setVisible(true);

            await new Promise((resolve) => {
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }).start(resolve);
            });

            let showLoaderTimeout;

            try {
                if (callback) {
                    const callbackPromise = callback();

                    showLoaderTimeout = setTimeout(() => {
                        setShowLoader(true);
                    }, 100);

                    await callbackPromise;
                }
            } catch (err) {
                console.warn("Erro na transição:", err);
            }

            if (showLoaderTimeout) {
                clearTimeout(showLoaderTimeout);
            }

            setShowLoader(false);

            await new Promise((resolve) => {
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }).start(resolve);
            });

            setVisible(false);
            isRunningRef.current = false;
        },
    }));

    if (!visible) return null;

    const barWidth = progressBarAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"]
    });

    return (
        <View style={styles.container} pointerEvents="auto">

            {/* ELEMENTOS VISUAIS DO LOADER SCI-FI */}
            {showLoader && (
                <View style={styles.loaderWrapper}>
                    {/* Texto com Glitch */}
                    <View style={styles.loaderContainer}>
                        {letters.map((l, i) => (
                            <Animated.Text
                                key={i}
                                style={[
                                    styles.letter,
                                    { opacity: letterAnims[i] }
                                ]}
                            >
                                {l === " " ? "\u00A0" : l}
                            </Animated.Text>
                        ))}
                    </View>

                    {/* Linha/Barra de progresso Tech */}
                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressBar, { width: barWidth }]} />
                    </View>

                    {/* Console Log piscando textos fictícios */}
                    <Text style={styles.telemetryStatus}>{statusText}</Text>
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
        backgroundColor: "#020813", 
        zIndex: 5,
    },
    loaderWrapper: {
        position: "absolute",
        zIndex: 10, 
        alignItems: "center",
        justifyContent: "center",
        width: 320,
    },
    loaderContainer: {
        flexDirection: "row",
        marginBottom: 12,
    },
    letter: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "900",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        letterSpacing: 3,
        textShadowColor: "rgba(0, 234, 255, 0.6)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    progressTrack: {
        width: "100%",
        height: 2,
        backgroundColor: "rgba(0, 234, 255, 0.15)",
        overflow: "hidden",
        marginBottom: 10,
        borderRadius: 1,
    },
    progressBar: {
        height: "100%",
        backgroundColor: cyanNeon,
        shadowColor: cyanNeon,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    telemetryStatus: {
        color: cyanNeon,
        fontSize: 9,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        letterSpacing: 1.5,
        opacity: 0.6,
        textAlign: "center",
    },
});