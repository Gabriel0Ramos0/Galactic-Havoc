// app/components/BlueMarker.js
import * as THREE from "three";
import { Audio } from "expo-av";

export default async function createBlueMarker({
    group,              // universeGroup
    spread = 10000,      // mesma lógica dos sóis
    minDistance = 5000,  // distância mínima da nave
    activateDistance = 180
}) {

    // 1. Spawn
    function randomCoordinate() {
        return (Math.random() - 0.5) * spread;
    }

    let pos = new THREE.Vector3(
        randomCoordinate(),
        randomCoordinate(),
        randomCoordinate()
    );

    while (pos.length() < minDistance) {
        pos.set(randomCoordinate(), randomCoordinate(), randomCoordinate());
    }

    // 2. Criar grupo do marcador
    const markerGroup = new THREE.Group();
    markerGroup.position.copy(pos);

    // 3. ESFERA com pulso
    const geom = new THREE.SphereGeometry(12, 24, 18);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x66ccff,
        emissive: 0x00aaff,
        emissiveIntensity: 1.2,
        metalness: 0.1,
        roughness: 0.3,
        transparent: true,
        opacity: 0.95,
    });
    const sphere = new THREE.Mesh(geom, mat);
    markerGroup.add(sphere);

    // 4. LABEL
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(10,10,20,0.0)";
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = "#bfeeff";
    ctx.font = "22px monospace";
    ctx.fillText("Nave Zefira", 12, 36);

    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0.9,
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(160, 40, 1);
    sprite.position.set(0, 35, 0);
    markerGroup.add(sprite);

    // 5. Estado interno de animação
    markerGroup.userData = {
        activated: false,
        activateDistance,
        pulseSpeed: 2.0,
        time: 0,
        explodeTime: 0,
    };

    let disposed = false;

    // 6. Som
    let sound = null;
    try {
        const s = new Audio.Sound();
        await s.loadAsync(require("@/assets/sounds/marker_ping.mp3"));
        await s.setIsLoopingAsync(false);
        sound = s;
    } catch (_) { }

    // 7. Adicionar ao universo
    group.add(markerGroup);

    // 8. UPDATE — mantém TODAS animações
    function update(dt, universeOffset = new THREE.Vector3(0, 0, 0)) {
        if (disposed) return;
        markerGroup.userData.time += dt;

        const t = markerGroup.userData.time * markerGroup.userData.pulseSpeed;

        // posição absoluta
        const worldPos = new THREE.Vector3()
            .copy(markerGroup.position)
            .add(universeOffset);

        const distance = worldPos.length();

        // ESCALA dinâmica baseada na distância
        const maxScale = 2.5;
        const minScale = 0.8;
        const distanceScale = THREE.MathUtils.clamp(distance / 1000, minScale, maxScale);

        // PULSO normal
        if (markerGroup.userData.explodeTime <= 0) {
            const pulseScale = (1 + Math.sin(t) * 0.12) * distanceScale;
            sphere.scale.set(pulseScale, pulseScale, pulseScale);
            sphere.material.emissiveIntensity =
                0.9 + Math.max(0, Math.cos(t)) * 0.8;
        }

        // sprite escala conforme distância
        sprite.scale.set(160 * distanceScale, 40 * distanceScale, 1);

        // ATIVAÇÃO
        if (!markerGroup.userData.activated && distance <= activateDistance) {
            markerGroup.userData.activated = true;
            markerGroup.userData.explodeTime = 0.3;
            sphere.scale.set(1.6, 1.6, 1.6);
            sphere.material.emissiveIntensity = 3;

            if (sound) {
                try { sound.replayAsync(); } catch (_) { }
            }

            // evento
            try {
                window.dispatchEvent(
                    new CustomEvent("blueMarkerReached", {
                        detail: { worldPos: worldPos.toArray(), distance }
                    })
                );
            } catch (_) { }
        }

        // ANIMAÇÃO DA EXPLOSÃO
        if (markerGroup.userData.explodeTime > 0) {
            markerGroup.userData.explodeTime -= dt;
            const lerp = Math.max(markerGroup.userData.explodeTime / 0.3, 0);
            const s = 1 + lerp * 0.6;
            sphere.scale.set(s, s, s);
            sphere.material.emissiveIntensity = 0.9 + lerp * 2.1;
        }
    }

    async function remove() {
        if (disposed) return;
        disposed = true;

        try {
            group.remove(markerGroup);
        } catch (_) { }

        try {
            if (sound) {
                await sound.stopAsync();
                await sound.unloadAsync();
            }
        } catch (_) { }
    }

    // 9. Retorno final
    return {
        group: markerGroup,
        basePosition: pos.clone(),
        update,
        remove,
    };
}
