import * as THREE from "three";

/**
 * @param {THREE.Scene} scene
 * @param {THREE.Object3D} ship
 * @param {THREE.Group|THREE.Object3D[]} suns
 * @param {boolean} isWarpSpeed
 */
export function setupLighting(scene, ship, suns = [], isWarpSpeed = false) {
    // Luz ambiente
    const ambientLight = new THREE.DirectionalLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Luz interna da nave
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

    // Luz de cada sol
    // Está com problema e não está batendo na nave direito
    // suns.forEach((sun, index) => {
    //     const intensity = 1 + Math.random() * 2;
    //     const distance = 1000 + Math.random() * 2000;

    //     const sunLight = new THREE.PointLight(0xffcc66, intensity, distance);
    //     sunLight.position.copy(sun.position);

    //     scene.add(sunLight);
    // });

}
