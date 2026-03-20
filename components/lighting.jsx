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

        // depois estabiliza
        if (t > 80) {
            clearInterval(interval);

            if (lights.ship) lights.ship.intensity = 1;

            lights.engines?.forEach((l) => {
                l.intensity = 2;
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

        // luz principal piscando e diminuindo
        if (lights.ship) {
            lights.ship.intensity = Math.max(0, flicker * (1 - t / 20));
        }

        // motores apagando mais rápido
        lights.engines?.forEach((l) => {
            l.intensity = Math.max(0, flicker * (1 - t / 15));
        });

        // depois apaga tudo
        if (t > 20) {
            clearInterval(interval);

            if (lights.ship) lights.ship.intensity = 0;

            lights.engines?.forEach((l) => {
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
