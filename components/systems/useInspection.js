import { useEffect, useRef } from "react";

export default function useInspection({
    shipRef,
    blueMarkerRef,
    controls,
    gameState,
    lootPanelOpen = false,
    inventoryOpen = false, // Adicionado
    onNearbyChange = () => { },
    onOpenLootPanel = () => { },
    onCloseLootPanel = () => { },
    onOpenInventory = () => { },  // Adicionado
    onCloseInventory = () => { }, // Adicionado
}) {
    const inspectionStateRef = useRef({
        isNearby: false,
        canInspect: false,
    });

    const INSPECTION_DISTANCE = 180; // Distância limite para inspecionar

    // 1. MONITORAMENTO DE PROXIMIDADE (LOOP)
    useEffect(() => {
        // Se o marcador não existe ou foi removido do mapa
        if (!blueMarkerRef?.current?.group) {
            if (inspectionStateRef.current.isNearby) {
                inspectionStateRef.current.isNearby = false;
                inspectionStateRef.current.canInspect = false;
                onNearbyChange(false);
            }
            // Força o fechamento se o loot sumir
            if (lootPanelOpen) {
                onCloseLootPanel();
            }
            return;
        }

        const checkProximity = () => {
            if (!shipRef.current || !blueMarkerRef.current?.group) return;

            const shipPos = shipRef.current.position;
            const markerPos = blueMarkerRef.current.group.position;

            const distance = shipPos.distanceTo(markerPos);
            const wasNearby = inspectionStateRef.current.isNearby;

            // Atualiza estados no Ref
            inspectionStateRef.current.isNearby = distance < INSPECTION_DISTANCE;
            inspectionStateRef.current.canInspect = inspectionStateRef.current.isNearby;

            // Dispara evento de mudança apenas quando o estado altera
            if (wasNearby !== inspectionStateRef.current.isNearby) {
                onNearbyChange(inspectionStateRef.current.isNearby);
            }

            // Se o jogador se afastar demais com o painel aberto, fecha automaticamente
            if (wasNearby && !inspectionStateRef.current.isNearby && lootPanelOpen) {
                onCloseLootPanel();
            }
        };

        const interval = setInterval(checkProximity, 100);
        return () => clearInterval(interval);
    }, [blueMarkerRef, shipRef, onNearbyChange, lootPanelOpen, onCloseLootPanel]);

    // 2. ESCUTADOR DE TECLADO (EVENT LISTENERS PARA 'E' E 'TAB')
    useEffect(() => {
        if (gameState !== "playing") return;

        const handleKeyDown = (e) => {
            // Tecla 'E' ou 'e': Abre/Alterna o painel de Loot (Se estiver perto)
            if (e.key === "e" || e.key === "E") {
                if (inspectionStateRef.current.canInspect) {
                    e.preventDefault();
                    if (lootPanelOpen) {
                        onCloseLootPanel();
                    } else {
                        onOpenLootPanel();
                    }
                }
            }

            // Tecla 'Tab': Abre/Alterna o painel de Inventário globalmente
            if (e.key === "Tab") {
                e.preventDefault();

                if (inventoryOpen) {
                    onCloseInventory();
                } else {
                    onOpenInventory();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [gameState, lootPanelOpen, inventoryOpen, onOpenLootPanel, onCloseLootPanel, onOpenInventory, onCloseInventory]);

    return {
        isNearby: inspectionStateRef.current.isNearby,
        canInspect: inspectionStateRef.current.canInspect,
    };
}