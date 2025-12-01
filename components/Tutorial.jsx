// app/components/Tutorial.jsx
import React, { useState, useEffect } from "react";
import { View } from "react-native";
import MessageBox from "@/components/MessageBox";

export default function Tutorial({ onComplete }) {
    const [step, setStep] = useState(0);

    // teclas gerais (W A S D, setas, SHIFT)
    const [keysPressed, setKeysPressed] = useState({
        w: false,
        a: false,
        s: false,
        d: false,
        up: false,
        down: false,
        shift: false,
    });

    // sequência DWAS
    const [sequenceIndex, setSequenceIndex] = useState(0);
    const sequence = ["d", "w", "a", "s"];

    const steps = [
        "Piloto… detectamos instabilidade severa nos giroscópios. O campo gravitacional local distorceu os eixos da nave.",
        "A queda durante o salto dimensional desalinhou o núcleo de navegação. Precisamos recalibrar manualmente.",
        "Prepare-se. Vamos executar o protocolo de Estabilização Primária.",
        "Ajuste os propulsores na seguinte ordem para restaurar o eixo da câmera: D → W → A → S.",
        "Bom trabalho. Os vetores laterais foram restaurados. Agora mova a nave com W, A, S e D para sincronizar o escopo.",
        "Excelente. Ajuste a altitude com ↑ e ↓ para completar a calibração do eixo vertical.",
        "Ótimo! Para desbloquear o canal de impulso, mantenha W pressionado e acione o BOOST com SHIFT.",
        "Sistemas estabilizados. Um sinal desconhecido foi detectado. Siga o brilho azul para identificá-lo.",
        "Calibração finalizada. Boa sorte, piloto… e cuidado com o que pode estar te observando.",
    ];

    // --- 1) Cinematic messages (0..2) auto-advance every 10s ---
    useEffect(() => {
        if (step >= 0 && step <= 2) {
            const t = setTimeout(() => {
                setStep((s) => s + 1);
            }, 5000);
            return () => clearTimeout(t);
        }
    }, [step]);

    // --- 2) Keyboard listener ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = (e.key || "").toLowerCase();

            // Ignore keys during cinematic
            if (step <= 2) return;

            // --- DWAS SEQUENCE (step 3) ---
            if (step === 3) {
                setSequenceIndex((prevIndex) => {
                    const expected = sequence[prevIndex];
                    if (key === expected) {
                        const next = prevIndex + 1;

                        if (next >= sequence.length) {
                            // Complete sequence → go to WASD free movement
                            setTimeout(() => {
                                setSequenceIndex(0);
                                setKeysPressed({
                                    w: false, a: false, s: false, d: false,
                                    up: false, down: false, shift: false
                                });
                                setStep(4);
                            }, 120);
                            return 0;
                        }
                        return next;
                    } else {
                        return 0; // wrong → reset
                    }
                });
                return;
            }

            // --- GENERAL KEYS ---
            if (["w", "a", "s", "d"].includes(key)) {
                setKeysPressed((prev) => ({ ...prev, [key]: true }));
            }
            if (key === "arrowup") {
                setKeysPressed((prev) => ({ ...prev, up: true }));
            }
            if (key === "arrowdown") {
                setKeysPressed((prev) => ({ ...prev, down: true }));
            }

            // BOOST (SHIFT)
            if (key === "shift") {
                setKeysPressed((prev) => ({ ...prev, shift: true }));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [step, sequence]);

    // --- 3) Step progression ---
    useEffect(() => {
        // Step 4 → require W A S D
        if (step === 4) {
            const { w, a, s, d } = keysPressed;
            if (w && a && s && d) {
                setKeysPressed((prev) => ({
                    ...prev,
                    up: false,
                    down: false,
                }));
                setStep(5);
            }
        }

        // Step 5 → require ArrowUp + ArrowDown
        if (step === 5) {
            if (keysPressed.up && keysPressed.down) {
                setStep(6);
            }
        }

        // Step 6 → BOOST (SHIFT)
        if (step === 6) {
            if (keysPressed.shift) {
                setStep(7);
            }
        }

        // Step 7 → message about marker → auto advance
        if (step === 7) {
            const t = setTimeout(() => setStep(8), 4000);
            return () => clearTimeout(t);
        }

        // Step 8 → finished
        if (step === 8) {
            const t = setTimeout(() => onComplete && onComplete(), 2500);
            return () => clearTimeout(t);
        }
    }, [step, keysPressed, onComplete]);

    // Ensure sequence reset if step changes
    useEffect(() => {
        if (step !== 3) setSequenceIndex(0);
    }, [step]);

    if (step > steps.length - 1) return null;

    return (
        <View pointerEvents="none">
            <MessageBox
                message={steps[step]}
                position="bottom-left"
                duration={step <= 2 ? 10000 : 10000}
            />
        </View>
    );
}
