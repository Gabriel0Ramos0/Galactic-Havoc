// app/components/Tutorial.jsx
import React, { useState, useEffect } from "react";
import { View } from "react-native";
import MessageBox from "@/components/MessageBox";

export default function Tutorial({ onComplete, onStepChange }) {
    const [step, setStep] = useState(0);

    const [keysPressed, setKeysPressed] = useState({
        w: false,
        a: false,
        s: false,
        d: false,
        up: false,
        down: false,
        shift: false,
        i: false,
        tab: false,
        space: false,
    });

    const [sequenceIndex, setSequenceIndex] = useState(0);
    const sequence = ["d", "w", "a", "s"];

    const steps = [
        "Piloto… detectamos instabilidade severa nos giroscópios. O campo gravitacional local distorceu os eixos da nave.",
        "A queda durante o salto dimensional desalinhou o núcleo de navegação. Precisamos recalibrar manualmente.",
        "Prepare-se. Vamos executar o protocolo de Estabilização Primária.",
        "Ajuste os propulsores na seguinte ordem: D → W → A → S.",
        "Bom trabalho. Vetores laterais restaurados. Agora mova-se com W, A, S e D.",
        "Excelente. Ajuste a altitude com ↑ e ↓.",
        "Perfeito. Ative o BOOST mantendo W pressionado e acionando SHIFT.",
        "Um sinal desconhecido foi detectado… analisando origem.",
        "Aproximando-se do ponto de energia. Vá até o brilho azul para identificá-lo.",
        "É uma nave abandonada… use I para inspecionar.",
        "Suprimentos encontrados. Abra a Interface da Nave com TAB para equipar os módulos.",
        "Atenção… duas naves piratas estão se aproximando!",
        "Prepare o sistema de armas. Pressione ESPAÇO para disparar.",
        "Boa sorte, piloto… e cuidado com o que pode estar te observando.",
    ];

    useEffect(() => {
        if (step >= 0 && step <= 2) {
            const t = setTimeout(() => setStep(s => s + 1), 5000);
            return () => clearTimeout(t);
        }
    }, [step]);

    // Notifica o Sandbox quando o step muda
    useEffect(() => {
        if (typeof onStepChange === "function") {
            onStepChange(step);
        }
    }, [step]);

    //                   KEYBOARD LISTENER
    // ---------------------------------------------------
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = (e.key || "").toLowerCase();

            if (step <= 2) return;

            // DWAS sequence
            if (step === 3) {
                setSequenceIndex((prev) => {
                    if (key === sequence[prev]) {
                        const next = prev + 1;
                        if (next >= sequence.length) {
                            setTimeout(() => {
                                setSequenceIndex(0);
                                setStep(4);
                            }, 150);
                            return 0;
                        }
                        return next;
                    }
                    return 0;
                });
                return;
            }

            // General keys
            if (["w", "a", "s", "d"].includes(key)) {
                setKeysPressed((p) => ({ ...p, [key]: true }));
            }
            if (key === "arrowup") {
                setKeysPressed((p) => ({ ...p, up: true }));
            }
            if (key === "arrowdown") {
                setKeysPressed((p) => ({ ...p, down: true }));
            }
            if (key === "shift") {
                setKeysPressed((p) => ({ ...p, shift: true }));
            }
            if (key === "i") {
                setKeysPressed((p) => ({ ...p, i: true }));
            }
            if (key === "tab") {
                e.preventDefault();
                setKeysPressed((p) => ({ ...p, tab: true }));
            }
            if (key === " ") {
                setKeysPressed((p) => ({ ...p, space: true }));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [step]);

    // ---------------------------------------------------
    //                STEP PROGRESSION
    // ---------------------------------------------------
    useEffect(() => {
        // Step 4 → require WASD
        if (step === 4) {
            const { w, a, s, d } = keysPressed;
            if (w && a && s && d) setStep(5);
        }

        // Step 5 → ArrowUp + ArrowDown
        if (step === 5) {
            if (keysPressed.up && keysPressed.down) setStep(6);
        }

        // Step 6 → Boost
        if (step === 6) {
            if (keysPressed.shift) setStep(7);
        }

        // Step 7 → auto advance
        if (step === 7) {
            const t = setTimeout(() => setStep(8), 4000);
            return () => clearTimeout(t);
        }

        // Step 8 → waiting for in-game event (go to marker)
        if (step === 8) {
            const onReached = (ev) => {
                setStep((currentStep) => {
                    if (currentStep === 8) return 9;
                    return currentStep;
                });
            };

            window.addEventListener("blueMarkerReached", onReached);
            return () => window.removeEventListener("blueMarkerReached", onReached);
        }

        // Step 9 → Inspect with I
        if (step === 9) {
            if (keysPressed.i) setStep(10);
        }

        // Step 10 → Open Ship Interface (TAB)
        if (step === 10) {
            if (keysPressed.tab) setStep(11);
        }

        // Step 11 → auto advance to combat
        if (step === 11) {
            const t = setTimeout(() => setStep(12), 3000);
            return () => clearTimeout(t);
        }

        // Step 12 → Fire with SPACE
        if (step === 12) {
            if (keysPressed.space) setStep(13);
        }

        // Step 13 → finish tutorial
        if (step === 13) {
            const t = setTimeout(() => onComplete && onComplete(), 2500);
            return () => clearTimeout(t);
        }

    }, [step, keysPressed]);

    // Reset sequence if not in sequence step
    useEffect(() => {
        if (step !== 3) setSequenceIndex(0);
    }, [step]);

    if (step > steps.length - 1) return null;

    return (
        <View pointerEvents="none">
            <MessageBox
                message={steps[step]}
                position="bottom-left"
                duration={10000}
            />
        </View>
    );
}
