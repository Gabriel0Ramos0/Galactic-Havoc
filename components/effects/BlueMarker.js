import * as THREE from "three";
import { playSfx } from "@/components/controllers/AudioController";

export default async function createBlueMarker({
    scene,
    target,
    activateDistance = 180
}) {
    const markerVisual = new THREE.Group();
    scene.add(markerVisual);

    // LABEL
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#bfeeff";
    ctx.font = "22px monospace";
    ctx.fillText("Módulo de Defesa", 16, 36);

    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
        })
    );

    sprite.scale.set(160, 40, 1);
    sprite.position.set(0, 60, 0);
    markerVisual.add(sprite);

    // GLOW
    const glowGeom = new THREE.SphereGeometry(40, 32, 32);

    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x3388ff,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const glowSphere = new THREE.Mesh(glowGeom, glowMat);
    markerVisual.add(glowSphere);

    markerVisual.userData = {
        time: 0,
        activated: false,
        glowLife: 0,
        activateDistance
    };

    function update(dt, shipPosition) {
        if (!target) return;

        markerVisual.userData.time += dt;
        const t = markerVisual.userData.time;

        markerVisual.position.copy(target.position);

        const distance = markerVisual.position.distanceTo(shipPosition);

        const scale = THREE.MathUtils.clamp(distance / 1000, 0.8, 2.5);
        sprite.scale.set(160 * scale, 40 * scale, 1);

        glowSphere.scale.setScalar(
            1 + Math.sin(t * 2.5) * 0.15
        );

        if (
            !markerVisual.userData.activated &&
            distance <= activateDistance
        ) {
            markerVisual.userData.activated = true;
            markerVisual.userData.glowLife = 1;

            playSfx("marker_ping");

            window.dispatchEvent(
                new CustomEvent("blueMarkerReached", {
                    detail: {
                        worldPos: markerVisual.position.toArray(),
                        type: "SCRAP_SIGNAL"
                    },
                })
            );
        }

        if (markerVisual.userData.glowLife > 0) {
            markerVisual.userData.glowLife -= dt * 0.8;

            const k = markerVisual.userData.glowLife;

            glowSphere.scale.setScalar(
                1.2 + (1 - k) * 6
            );

            glowMat.opacity = 0.4 * k;
        }
    }

    function remove() {
        scene.remove(markerVisual);
    }

    return {
        group: markerVisual,
        update,
        remove
    };
}