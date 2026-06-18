import React, { useState, useEffect } from "react";
import { View } from "react-native";
import MessageBox from "@/components/ui/MessageBox";

export default function Tutorial({ onComplete, onStepChange, initialStep = 0 }) {
    const [step, setStep] = useState(initialStep);

    const steps = [
        "", // 0
        "Piloto… o campo gravitacional local distorceu os eixos da nave! Precisamos recalibrar manualmente.", // 1
        "Prepare-se. Vamos executar o protocolo de Estabilização Primária.", // 2
        "Reinicie os propulsores na seguinte ordem: [S] → [T] → [A] → [R] → [T].", // 3
        "Bom trabalho, propulsores restaurados! Agora mova-se com [W], [A], [S] e [D].", // 4
        "Excelente. Ajuste a altitude com [↑] e [↓].", // 5
        "Perfeito. Ative o BOOST! Segure [W] e pressione [SHIFT].", // 6
        "Um sinal desconhecido foi detectado… analisando origem. Aguarde um momento.", // 7
        "Aproximando-se do ponto de energia. Vá até o objeto para identificá-lo.", // 8
        "É um módulo de defesa… use [E] para inspecionar.", // 9
        "Suprimentos encontrados. Abra a Interface da Nave com [TAB] para equipar os módulos de disparo.", // 10
        "Identifique o módulo de disparo e equipe-o em um slot ativo.", // 11 ← NOVA ETAPA!
        "Atenção… três naves piratas estão se aproximando!", // 12
        "Prepare o sistema de armas. Pressione [ESPAÇO] para disparar.", // 13
        "Ótimo trabalho, piloto! Os piratas foram neutralizados.", // 14
        "Restauração completa. O sistema de navegação está online. Siga para o próximo destino e continue sua aventura!", // 15
    ];

    // Notifica mudanças de step
    useEffect(() => {
        if (typeof onStepChange === "function") {
            onStepChange(step);
        }
    }, [step]);

    // Steps automáticos iniciais
    useEffect(() => {
        if (step >= 0 && step <= 2) {
            const t = setTimeout(() => setStep(s => s + 1), 4000);
            return () => clearTimeout(t);
        }
    }, [step]);

    // STEP 3 → sequência START
    useEffect(() => {
        if (step !== 3) return;

        const sequence = ["s", "t", "a", "r", "t"];
        let index = 0;

        const handleKey = (e) => {
            const key = e.key.toLowerCase();

            if (key === sequence[index]) {
                index++;
                if (index === sequence.length) {
                    setStep(4);
                }
            } else {
                index = 0; // reset se errar
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [step]);

    // STEP 4 → WASD
    useEffect(() => {
        if (step !== 4) return;

        const pressed = new Set();

        const handleKey = (e) => {
            const key = e.key.toLowerCase();
            if (["w", "a", "s", "d"].includes(key)) {
                pressed.add(key);
                if (pressed.size === 4) {
                    setStep(5);
                }
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [step]);

    // STEP 5 → ↑ ↓
    useEffect(() => {
        if (step !== 5) return;

        let up = false;
        let down = false;
        let advanced = false;

        const handleKey = (e) => {
            if (advanced) return;

            if (e.key === "ArrowUp") up = true;
            if (e.key === "ArrowDown") down = true;

            if (up && down) {
                advanced = true;
                setStep(6);
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [step]);

    // STEP 6 → SHIFT (boost)
    useEffect(() => {
        if (step !== 6) return;

        let advanced = false;

        const handleKey = (e) => {
            if (advanced) return;

            if (e.key === "Shift") {
                advanced = true;
                setStep(7);
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [step]);

    // STEP 7 → auto
    useEffect(() => {
        if (step !== 7) return;

        const t = setTimeout(() => setStep(8), 4000);
        return () => clearTimeout(t);
    }, [step]);

    // STEP 8 → evento do jogo (blue marker)
    useEffect(() => {
        if (step !== 8) return;

        const onReached = () => {
            setStep(9);
        };

        window.addEventListener("blueMarkerReached", onReached);
        return () => window.removeEventListener("blueMarkerReached", onReached);
    }, [step]);

    // STEP 9 → tecla E
    useEffect(() => {
        if (step !== 9) return;

        let advanced = false;

        const handleKey = (e) => {
            if (advanced) return;

            if (e.key.toLowerCase() === "e") {
                advanced = true;
                setStep(10);
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [step]);

    // STEP 10 → TAB
    useEffect(() => {
        if (step !== 10) return;

        let advanced = false;

        const handleKey = (e) => {
            if (advanced) return;

            if (e.key.toLowerCase() === "tab") {
                advanced = true;
                e.preventDefault();
                setStep(11);
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [step]);

    // STEP 11 → NOVO: Espera o item ser equipado no painel de inventário
    useEffect(() => {
        if (step !== 11) return;

        const onEquipped = (event) => {
            const { slot, itemId } = event.detail || {};

            if (
                slot === "WPN-L" &&
                itemId === "laser_vx"
            ) {
                setStep(12);
            }
        };

        window.addEventListener("itemEquipped", onEquipped);

        return () =>
            window.removeEventListener("itemEquipped", onEquipped);
    }, [step]);

    // STEP 12 → auto (Naves piratas se aproximando)
    useEffect(() => {
        if (step !== 12) return;

        const t = setTimeout(() => setStep(13), 4000);
        return () => clearTimeout(t);
    }, [step]);

    // STEP 13 → SPACE
    useEffect(() => {
        if (step !== 13) return;
        let advanced = false;

        const handleKey = (e) => {
            if (advanced) return;
            if (e.code === "Space") {
                advanced = true;
                setStep(14);
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [step]);

    // STEP 14 → auto
    useEffect(() => {
        if (step !== 14) return;

        const t = setTimeout(() => setStep(15), 4000);
        return () => clearTimeout(t);
    }, [step]);

    // STEP 15 → finalizar
    useEffect(() => {
        if (step !== 15) return;

        const t = setTimeout(() => {
            onComplete && onComplete();
        }, 2500);

        return () => clearTimeout(t);
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