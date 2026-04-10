import * as THREE from "three";
import { Audio } from "expo-av";
import { OBJLoader, MTLLoader } from "three-stdlib";

export default async function createBlueMarker({
    scene,
    spread = 10000,
    minDistance = 5000,
    activateDistance = 180
}) {

    // Spawn
    function randomCoordinate() {
        return (Math.random() - 0.5) * spread;
    }

    const pos = new THREE.Vector3();
    do {
        pos.set(
            randomCoordinate(),
            randomCoordinate(),
            randomCoordinate()
        );
    } while (pos.length() < minDistance);

    // Grupo principal
    const markerGroup = new THREE.Group();
    markerGroup.position.copy(pos);
    scene.add(markerGroup);

    // LABEL
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#bfeeff";
    ctx.font = "22px monospace";
    ctx.fillText("Nave Zefira", 16, 36);

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
    markerGroup.add(sprite);

    // GLOW FAKE (AURA)
    const glowGeom = new THREE.SphereGeometry(40, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x3388ff,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const glowSphere = new THREE.Mesh(glowGeom, glowMat);
    markerGroup.add(glowSphere);

    // Nave-Mãe (OBJ)
    let motherShip = null;

    new MTLLoader().load(
        require("../assets/models/marker/estacao_espacial.mtl"),
        (materials) => {
            materials.preload();

            new OBJLoader()
                .setMaterials(materials)
                .load(
                    require("../assets/models/marker/estacao_espacial.obj"),
                    (object) => {

                        // Centralização
                        const box = new THREE.Box3().setFromObject(object);
                        const center = new THREE.Vector3();
                        box.getCenter(center);
                        object.position.sub(center);

                        // Ajuste de base 
                        const size = new THREE.Vector3();
                        box.getSize(size);

                        object.position.y += size.y * 0.15;

                        const targetSize = 90;
                        const maxAxis = Math.max(size.x, size.y, size.z);
                        const scale = targetSize / maxAxis;

                        object.scale.setScalar(scale);
                        object.rotation.x = Math.PI / 2;
                        object.traverse((child) => {
                            if (child.isMesh && child.material) {
                                child.material.emissive?.set?.(0x000000);
                                child.material.emissiveIntensity = 0;
                                child.material.transparent = false;
                                child.material.opacity = 1;
                                child.material.depthWrite = true;
                            }
                        });

                        motherShip = object;
                        markerGroup.add(object);
                    }
                );
        }
    );

    // Estado
    markerGroup.userData = {
        time: 0,
        activated: false,
        glowLife: 0,      // controla expansão do glow
        activateDistance
    };

    // Som
    let sound = null;
    try {
        sound = new Audio.Sound();
        await sound.loadAsync(
            require("@/assets/sounds/marker_ping.mp3")
        );
    } catch (_) { }

    // UPDATE
    function update(dt, shipPosition) {
        markerGroup.userData.time += dt;
        const t = markerGroup.userData.time;

        const distance = markerGroup.position.distanceTo(shipPosition);

        // label
        const scale = THREE.MathUtils.clamp(distance / 1000, 0.8, 2.5);
        sprite.scale.set(160 * scale, 40 * scale, 1);

        // nave
        if (motherShip) {
            motherShip.rotation.z += dt * 0.02;
            motherShip.rotation.y = Math.sin(t * 0.2) * 0.1;
            motherShip.position.y = Math.sin(t * 0.35) * 4;
        }

        // GLOW BASE
        glowSphere.scale.setScalar(
            1 + Math.sin(t * 2.5) * 0.15
        );

        // ATIVAÇÃO → GLOW SE EXPANDE E MORRE
        if (
            !markerGroup.userData.activated &&
            distance <= activateDistance
        ) {
            markerGroup.userData.activated = true;
            markerGroup.userData.glowLife = 1;

            try { sound?.replayAsync(); } catch (_) { }

            window.dispatchEvent(
                new CustomEvent("blueMarkerReached", {
                    detail: {
                        worldPos: markerGroup.position.toArray(),
                        type: "MOTHER_SHIP_SIGNAL_FAILURE",
                    },
                })
            );
        }

        // glow reativo
        if (markerGroup.userData.glowLife > 0) {
            markerGroup.userData.glowLife -= dt * 0.8;

            const k = markerGroup.userData.glowLife;

            glowSphere.scale.setScalar(
                1.2 + (1 - k) * 6
            );

            glowMat.opacity = 0.4 * k;
        }
    }

    // REMOVE
    async function remove() {
        scene.remove(markerGroup);
        try {
            await sound?.unloadAsync();
        } catch (_) { }
    }

    return {
        group: markerGroup,
        basePosition: pos.clone(),
        update,
        remove,
    };
}