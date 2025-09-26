import * as THREE from "three";

/**
 * Configura a iluminação da nave
 * @param {THREE.Scene} scene
 * @param {THREE.Object3D} ship
 * @param {boolean} isWarpSpeed
 */

export function setupShipLighting(scene, ship, isWarpSpeed = false) {
    // 🔹 Luz ambiente
    const ambientLight = new THREE.DirectionalLight(0xffffff, 0.4);
    scene.add(ambientLight);

    if (ship) {
        const shipLight = new THREE.PointLight(0x00ffff, 1, 50);
        shipLight.position.set(0, -5, 0);
        ship.add(shipLight);

        // Luzes dos motores
        const normalEngineOffsets = [
            { x: -1.6, y: -7, z: -0.1 },
            { x: 1.6, y: -7, z: -0.1 },
        ];

        const warpEngineOffsets = [
            { x: -2, y: -7, z: -0.1 },
            { x: 2, y: -7, z: -0.1 },
        ];

        const engineOffsets = isWarpSpeed ? warpEngineOffsets : normalEngineOffsets;

        engineOffsets.forEach((o) => {
            const engineLight = new THREE.PointLight(0x00fff, isWarpSpeed ? 2 : 0.5, isWarpSpeed ? 20 : 10);
            engineLight.position.set(o.x, o.y, o.z);
            ship.add(engineLight);
        });
    }
}

/**
 * Cria luz de sol/planeta presa ao mesh
 * @param {THREE.Object3D} sun - mesh do sol/planeta (a luz será adicionada como child)
 * @param {Object} opts
 * @param {number} opts.color
 * @param {number} opts.intensity
 * @param {number} opts.distance
 * @param {number} opts.decay
 * @param {boolean} opts.debug
 */
export function createSunLight(
    sun,
    {
        color = 0xffcc66,
        intensity = 1000,
        distance = 1000,
        decay = 1,
        debug = false
    } = {}
) {
    const sunLight = new THREE.PointLight(color, intensity, distance, decay);
    sunLight.position.set(0, 0, 0);
    sun.add(sunLight);

    if (debug) {
        const helper = new THREE.PointLightHelper(sunLight, 1000);
        sun.add(helper);

    }

    return sunLight;
}
