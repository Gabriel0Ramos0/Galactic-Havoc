import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ImageBackground,
    Animated,
    Dimensions,
    Platform,
    Pressable
} from "react-native";
import { playSfx } from "@/components/controllers/AudioController";

const { width, height } = Dimensions.get("window");
const cyanNeon = "#00eaff";
const redNeon = "#ff453a";

export default function Credits({ visible, onClose }) {
    if (!visible) return null;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0.4)).current;
    const backScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entrada cinematográfica dos créditos
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        // Loop de pulsação do radar/HUD
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.4, duration: 1800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const handleBack = () => {
        playSfx("textDigital");
        onClose();
    };

    // Animação simples do botão voltar
    const pressIn = () => Animated.timing(backScale, { toValue: 0.95, duration: 100, useNativeDriver: true }).start();
    const pressOut = () => Animated.timing(backScale, { toValue: 1, duration: 100, useNativeDriver: true }).start();

    return (
        <ImageBackground
            source={require("@/assets/images/Game.jpg")}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.overlay} />

            <Animated.View style={[styles.hudContainer, { opacity: fadeAnim }]}>

                {/* TOPO: TELEMETRIA E TÍTULO DA TELA */}
                <View style={styles.headerTelemetry}>
                    <View style={styles.row}>
                        <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
                        <Text style={styles.telemetryText}>ARQUIVO_LOG // MANIFESTO_DE_DESENVOLVIMENTO</Text>
                    </View>
                    <Text style={styles.screenTitle}>CRÉDITOS DO SISTEMA</Text>
                    <View style={styles.bracketLine} />
                </View>

                {/* CONTEÚDO CENTRAL: OS SETORES DE CRÉDITO */}
                <View style={styles.creditsCenterBlock}>

                    {/* CARD SEU (DIRETOR / DESIGN / DEV) */}
                    <View style={styles.creditBox}>
                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>DIRETOR DE COMANDO / DEV PRINCIPAL</Text>
                        </View>
                        <View style={styles.contentRow}>
                            <Text style={styles.primaryName}>GABRIEL RAMOS CORRÊA</Text>
                            <Text style={styles.roleDescription}>
                // Engenharia de Sistemas de Dobra, Arquitetura TypeScript, Interface HUD Sci-Fi e IA de Combate.
                            </Text>
                        </View>
                    </View>

                    {/* CARD DO GUSTAVO WARMELING */}
                    <View style={[styles.creditBox, styles.highlightBox]}>
                        <View style={[styles.tagBadge, styles.tagHighlight]}>
                            <Text style={styles.tagTextHighlight}>MODELAGEM TRIDIMENSIONAL</Text>
                        </View>
                        <View style={styles.contentRow}>
                            <Text style={styles.secondaryName}>GUSTAVO WARMELING</Text>
                            <Text style={styles.roleDescription}>
                // Engenharia de Malha e Texturização do Campo de Asteroides Cósmicos. Responsável pelo design dos detritos de alta densidade.
                            </Text>
                        </View>
                    </View>

                    {/* CARD DE AGRADECIMENTOS ESPECIAIS */}
                    <View style={styles.creditBox}>
                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>AGRADECIMENTOS ESPECIAIS</Text>
                        </View>
                        <View style={styles.contentRow}>
                            <Text style={styles.thanksText}>
                                A todos os pilotos que cruzaram a fenda espacial de <Text style={{ color: cyanNeon, fontWeight: 'bold' }}>GALACTIC HAVOC</Text> e sobreviveram para relatar os dados.
                            </Text>
                        </View>
                    </View>

                </View>

                {/* RODAPÉ: BOTÃO VOLTAR REATIVO */}
                <View style={styles.footerBar}>
                    <Animated.View style={{ transform: [{ scale: backScale }] }}>
                        <Pressable
                            onPressIn={pressIn}
                            onPressOut={pressOut}
                            onPress={handleBack}
                            style={styles.backButton}
                        >
                            <Text style={styles.backButtonText}>{"< VOLTAR_AO_MENU"}</Text>
                        </Pressable>
                    </Animated.View>
                    <Text style={styles.versionText}>V1.0.4 // PROTOCOLO_HAVOC</Text>
                </View>

            </Animated.View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
        elevation: 100,
        height: "",
        width: "",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(3, 12, 24, 0.85)",
    },
    hudContainer: {
        flex: 1,
        paddingHorizontal: 50,
        paddingVertical: 40,
        justifyContent: "space-between",
        backgroundColor: "transparent", // Evita que limpe contextos visuais
    },
    headerTelemetry: {
        alignSelf: "flex-start",
        marginTop: 10,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: cyanNeon,
        marginRight: 8,
        boxShadow: `0px 0px 6px ${cyanNeon}`,
    },
    telemetryText: {
        color: cyanNeon,
        fontSize: 9,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        letterSpacing: 2,
        opacity: 0.8,
    },
    screenTitle: {
        color: "#fff",
        fontSize: 38,
        fontWeight: "900",
        letterSpacing: 4,
        textShadow: "0px 0px 12px rgba(0, 234, 255, 0.6)",
    },
    bracketLine: {
        width: 300,
        height: 2,
        backgroundColor: cyanNeon,
        marginTop: 6,
        opacity: 0.5,
    },
    /* BLOCO CENTRAL DE CRÉDITOS */
    creditsCenterBlock: {
        flex: 1,
        justifyContent: "center",
        maxWidth: 700,
        width: "100%",
        alignSelf: "center",
        marginVertical: 20,
    },
    creditBox: {
        backgroundColor: "rgba(0, 25, 40, 0.4)",
        borderColor: "rgba(0, 234, 255, 0.2)",
        borderWidth: 1,
        borderLeftWidth: 4,
        borderLeftColor: cyanNeon,
        padding: 16,
        marginVertical: 10,
        transform: [{ skewX: "-8deg" }], // Mantém a inclinação militar/sci-fi do menu principal
    },
    highlightBox: {
        backgroundColor: "rgba(0, 40, 55, 0.55)",
        borderColor: "rgba(0, 234, 255, 0.4)",
        borderLeftColor: "#ffffff", // Destaque na borda do Gustavo
    },
    tagBadge: {
        backgroundColor: "rgba(0, 234, 255, 0.15)",
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 2,
        marginBottom: 8,
        transform: [{ skewX: "8deg" }], // Desfaz a inclinação para o texto ficar reto
    },
    tagHighlight: {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
    tagText: {
        color: cyanNeon,
        fontSize: 9,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        letterSpacing: 1,
    },
    tagTextHighlight: {
        color: "#ffffff",
        fontSize: 9,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        letterSpacing: 1,
    },
    contentRow: {
        transform: [{ skewX: "8deg" }], // Retifica o texto interno
    },
    primaryName: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "900",
        letterSpacing: 2,
        textShadow: "0px 0px 6px rgba(255, 255, 255, 0.3)",
    },
    secondaryName: {
        color: cyanNeon,
        fontSize: 20,
        fontWeight: "900",
        letterSpacing: 2,
        textShadow: "0px 0px 8px rgba(0, 234, 255, 0.4)",
    },
    roleDescription: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 11,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        lineHeight: 16,
        marginTop: 4,
    },
    thanksText: {
        color: "rgba(255, 255, 255, 0.85)",
        fontSize: 12,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        lineHeight: 18,
    },
    /* RODAPÉ */
    footerBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "rgba(0, 234, 255, 0.2)",
        paddingTop: 15,
    },
    backButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: "rgba(0, 234, 255, 0.05)",
        borderColor: cyanNeon,
        borderWidth: 1,
        borderRadius: 2,
        ...Platform.select({
            web: { cursor: "pointer" }
        })
    },
    backButtonText: {
        color: cyanNeon,
        fontSize: 11,
        fontWeight: "bold",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        letterSpacing: 1.5,
    },
    versionText: {
        color: "rgba(255, 255, 255, 0.4)",
        fontSize: 10,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        letterSpacing: 1.5,
    },
});