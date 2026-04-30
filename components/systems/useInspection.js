import { useEffect, useRef } from "react";

export default function useInspection({
    shipRef,
    blueMarkerRef,
    controls,
    gameState,
    lootPanelOpen = false,
    onNearbyChange = () => { },
    onOpenLootPanel = () => { },
    onCloseLootPanel = () => { },
}) {
    const inspectionStateRef = useRef({
        isNearby: false,
        canInspect: false,
    });

    const INSPECTION_DISTANCE = 180; // distância para inspecionar

    useEffect(() => {
        // Se o marcador não existe mais, reseta isNearby
        if (!blueMarkerRef?.current?.group) {
            if (inspectionStateRef.current.isNearby) {
                inspectionStateRef.current.isNearby = false;
                inspectionStateRef.current.canInspect = false;
                onNearbyChange(false);
            }
            // Fechar o painel de loot quando o marcador desaparecer
            if (lootPanelOpen) {
                onCloseLootPanel();
            }
            return;
        }

        const checkProximity = () => {
            const shipPos = shipRef.current.position;
            const markerPos = blueMarkerRef.current.group.position;

            const distance = shipPos.distanceTo(markerPos);
            const wasNearby = inspectionStateRef.current.isNearby;
            inspectionStateRef.current.isNearby = distance < INSPECTION_DISTANCE;
            inspectionStateRef.current.canInspect = inspectionStateRef.current.isNearby && (controls.inspect || controls.inventory);

            if (wasNearby !== inspectionStateRef.current.isNearby) {
                onNearbyChange(inspectionStateRef.current.isNearby);
            }
            if (wasNearby && !inspectionStateRef.current.isNearby && lootPanelOpen) {
                onCloseLootPanel();
            }
        };

        const interval = setInterval(checkProximity, 100);
        return () => clearInterval(interval);
    }, [blueMarkerRef, shipRef, controls, onNearbyChange, lootPanelOpen, onCloseLootPanel]);

    useEffect(() => {
        if (gameState !== "playing") return;

        const handleInspectionKey = (e) => {
            if ((e.key === "i" || e.key === "I") && inspectionStateRef.current.canInspect) {
                e.preventDefault();
                
                if (lootPanelOpen) {
                    onCloseLootPanel();
                } else {
                    onOpenLootPanel();
                }
            }
        };

        window.addEventListener("keydown", handleInspectionKey);

        return () => {
            window.removeEventListener("keydown", handleInspectionKey);
        };
    }, [gameState, lootPanelOpen, onOpenLootPanel, onCloseLootPanel]);

    return {
        isNearby: inspectionStateRef.current.isNearby,
        canInspect: inspectionStateRef.current.canInspect,
    };
}
