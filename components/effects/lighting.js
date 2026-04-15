import * as THREE from "three";

/**
 * Configura a iluminação da nave
 * @param {THREE.Scene} scene
 * @param {THREE.Object3D} ship
 * @param {boolean} isWarpSpeed
 */

export function setupShipLighting(scene, ship, isWarpSpeed = false) {
    const lights = {};

    const ambientLight = new THREE.DirectionalLight(0xffffff, 0.4);
    scene.add(ambientLight);
    lights.ambient = ambientLight;

    if (ship) {
        const shipLight = new THREE.PointLight(0x00ffff, 0, 50); // começa desligada
        shipLight.position.set(0, -5, 0);
        ship.add(shipLight);
        lights.ship = shipLight;

        const engineOffsets = [
            { x: -1.6, y: -7, z: -0.1 },
            { x: 1.6, y: -7, z: -0.1 },
        ];

        lights.engines = [];

        engineOffsets.forEach((o) => {
            const engineLight = new THREE.PointLight(0x00ffff, 0, 20); // começa desligada
            engineLight.position.set(o.x, o.y, o.z);
            ship.add(engineLight);
            lights.engines.push(engineLight);
        });

        // Beacons nas extremidades das asas (frente e trás)
        const beaconOffsets = [
            { x: -3.2, y: 1, z: 0.5 },  // asa esquerda, frente
            { x: -3.2, y: 1, z: -0.5 }, // asa esquerda, trás
            { x: 3.2, y: 1, z: 0.5 },   // asa direita, frente
            { x: 3.2, y: 1, z: -0.5 },  // asa direita, trás
        ];

        lights.beacons = [];

        beaconOffsets.forEach((o) => {
            const beaconLight = new THREE.PointLight(0xff0000, 0, 35);
            beaconLight.position.set(o.x, o.y, o.z);
            ship.add(beaconLight);
            lights.beacons.push(beaconLight);
        });
    }
    return lights;
}

export function animateShipStartup(lights) {
    if (!lights) return;

    let t = 0;

    const interval = setInterval(() => {
        t++;

        const flicker = Math.random() * 2;

        if (lights.ship) {
            lights.ship.intensity = Math.min(1, flicker);
        }

        lights.engines?.forEach((l) => {
            l.intensity = Math.min(2, flicker * 1.5);
        });

        lights.beacons?.forEach((l) => {
            l.intensity = Math.random() > 0.5 ? 1.5 : 0.3;
        });

        // depois estabiliza
        if (t > 80) {
            clearInterval(interval);

            if (lights.ship) lights.ship.intensity = 1;

            lights.engines?.forEach((l) => {
                l.intensity = 2;
            });

            lights.beacons?.forEach((l) => {
                l.intensity = 1.5;
            });
        }
    }, 80);
}

export function animateShipShutdown(lights) {
    if (!lights) return;

    let t = 0;

    const interval = setInterval(() => {
        t++;

        const flicker = Math.random() * 1;

        if (lights.ship) {
            lights.ship.intensity = Math.max(0, flicker * (1 - t / 20));
        }

        lights.engines?.forEach((l) => {
            l.intensity = Math.max(0, flicker * (1 - t / 15));
        });

        lights.beacons?.forEach((l) => {
            l.intensity = Math.max(0, (Math.random() > 0.5 ? 1 : 0.2) * (1 - t / 18));
        });

        // depois apaga tudo
        if (t > 20) {
            clearInterval(interval);

            if (lights.ship) lights.ship.intensity = 0;

            lights.engines?.forEach((l) => {
                l.intensity = 0;
            });

            lights.beacons?.forEach((l) => {
                l.intensity = 0;
            });
        }
    }, 80);
}

/**
 * Cria luz de sol/planeta presa ao mesh
 * @param {THREE.Object3D} sun
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
