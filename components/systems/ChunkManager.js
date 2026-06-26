// app/components/ChunkManager.js
import * as THREE from "three";
import { createNoise3D } from "simplex-noise";
import { createSpaceBackground, createSpeedParticles } from "./Star";
import BiomeManager from "@/components/systems/BiomeManager";
import { createAsteroid } from "@/components/systems/Asteroids";

const CHUNK_SIZE = 1000;
const VIEW_DISTANCE = 5500;
const VIEW_DISTANCE_SQ = VIEW_DISTANCE * VIEW_DISTANCE;
const _cameraDir = new THREE.Vector3();
const _vectorToAsteroid = new THREE.Vector3();
const _projectileBox = new THREE.Box3();
const _projSize = new THREE.Vector3(5, 5, 5);

export default class ChunkManager {
    constructor(scene, seed = null) {
        this.scene = scene;
        this.chunks = new Map();
        this.debugChunks = new Map();
        this.debugVisible = false;
        this.sunTextures = null;
        this.suns = [];
        this.minSunDistance = 3000;
        this.asteroids = [];
        this.asteroidBase = null;
        this.loadingAsteroidBase = null;
        this.destroyedAsteroids = new Set();
        this.debugCollision = false;
        this.shipCollisionBox = new THREE.Box3();
        this.seed = seed ?? Math.floor(Math.random() * 999999999);
        const rng = this.createRNG(this.seed);
        this.noise3D = createNoise3D(rng);
        const rng2 = this.createRNG(this.seed + 9999);
        this.sunNoise3D = createNoise3D(rng2);
        this.biomeManager = new BiomeManager(this.seed, this.createRNG);

        this.starField = null; // Domo único de estrelas de fundo
        this.speedParticles = null;
        this.starTime = 0;
        this.initDeepSpace();

        this.spawnQueue = [];
    }

    getChunkCoord(position) {
        return {
            x: Math.floor(position.x / CHUNK_SIZE),
            y: Math.floor(position.y / CHUNK_SIZE),
            z: Math.floor(position.z / CHUNK_SIZE),
        };
    }

    getChunkKey(x, y, z) {
        return `${x}_${y}_${z}`;
    }

    getChunkSeed(x, y, z) {
        const str = `${this.seed}_${x}_${y}_${z}`;
        return this.hashString(str);
    }

    getSunValue(x, y, z) {
        const scale = 0.0002;

        return this.sunNoise3D(
            x * scale,
            y * scale,
            z * scale
        );
    }

    createRNG(seed) {
        let s = seed;

        return function () {
            s = (s * 1664525 + 1013904223) % 4294967296;
            return s / 4294967296;
        };
    }

    hashString(str) {
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }

        return Math.abs(hash);
    }

    initDeepSpace() {
        // Instancia o domo de estrelas de fundo fixo
        this.starField = createSpaceBackground(2500, 6000);
        this.scene.add(this.starField);

        // Cria o domo menor reativo
        this.speedParticles = createSpeedParticles(400, 1200);
        this.scene.add(this.speedParticles);
    }

    processQueue(limit = 5) {
        this.spawnQueue.sort((a, b) => a.priority - b.priority);

        for (let i = 0; i < limit; i++) {
            const item = this.spawnQueue.shift();
            if (!item) return;

            const { cx, cy, cz, key, type } = item;

            if (!this.chunks.has(key)) continue;

            // Criação básica do Chunk
            if (!type) {
                this.createChunkDebug(cx, cy, cz);
                this.createSunInChunk(cx, cy, cz).catch(console.error);

                // Removida totalmente a criação de estrelas locais (localStars) por chunk

                // Agenda asteroides normalmente
                this.spawnQueue.push({
                    type: "asteroids",
                    cx, cy, cz,
                    key
                });
            }
            else if (type === "asteroids") {
                this.createAsteroidsInChunk(cx, cy, cz).catch(console.error);
            }
        }
    }

    isTooCloseToOtherSuns(position) {
        const minDistSq = this.minSunDistance * this.minSunDistance;

        for (const sun of this.suns) {
            const dx = sun.position.x - position.x;
            const dy = sun.position.y - position.y;
            const dz = sun.position.z - position.z;

            if ((dx * dx + dy * dy + dz * dz) < minDistSq) {
                return true;
            }
        }

        return false;
    }

    async loadSunTextures() {
        if (this.sunTextures) return this.sunTextures;

        if (this.loadingTextures) return this.loadingTextures;

        this.loadingTextures = (async () => {
            const { Asset } = await import('expo-asset');

            const texturesRaw = [
                require('@/assets/textures/sol.png'),
                require('@/assets/textures/sol-azul.png')
            ];

            const textures = await Promise.all(
                texturesRaw.map(async (t) => {
                    const asset = Asset.fromModule(t);
                    await asset.downloadAsync();
                    return new THREE.TextureLoader().load(asset.localUri);
                })
            );

            this.sunTextures = textures;
            return textures;
        })();

        return this.loadingTextures;
    }

    async loadAsteroidBase() {
        if (this.asteroidBase) return this.asteroidBase;

        if (this.loadingAsteroidBase) return this.loadingAsteroidBase;

        this.loadingAsteroidBase = (async () => {
            const basePath = "/models/asteroide/";

            const { MTLLoader, OBJLoader } = await import('three-stdlib');

            const mtlLoader = new MTLLoader();
            mtlLoader.setPath(basePath);
            mtlLoader.setResourcePath(basePath);

            const materials = await mtlLoader.loadAsync("ASTEROIDE.mtl");
            materials.preload();

            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath(basePath);

            const base = await objLoader.loadAsync("ASTEROIDE.obj");

            base.traverse((child) => {
                if (child.isMesh) {
                    child.material.side = THREE.DoubleSide;
                    child.material.roughness = 1.0;
                    child.material.metalness = 0.2;
                }
            });

            this.asteroidBase = base;
            return base;
        })();

        return this.loadingAsteroidBase;
    }

    calculateAsteroidCount(x, y, z) {
        const worldX = x * CHUNK_SIZE;
        const worldY = y * CHUNK_SIZE;
        const worldZ = z * CHUNK_SIZE;

        // Consulta a topologia global delegada ao BiomeManager
        const biomeData = this.biomeManager.getBiomeAt(worldX, worldY, worldZ);

        let count = biomeData.baseAsteroidCount;

        const chunkSeed = this.getChunkSeed(x, y, z);
        const chunkRng = this.createRNG(chunkSeed);

        if (biomeData.type === "EMPTY") {
            return 0;
        }

        if (biomeData.type === "ASTEROID_FIELD") {
            return count + (chunkRng() > 0.5 ? 1 : -1);
        }

        if (biomeData.type === "RESOURCE_RICH") {
            return count + Math.floor(chunkRng() * 4);
        }

        return count;
    }

    async createAsteroidsInChunk(x, y, z) {
        const key = this.getChunkKey(x, y, z);
        const seed = this.getChunkSeed(x, y, z);
        const random = this.createRNG(seed);

        const asteroidCount = this.calculateAsteroidCount(x, y, z);
        if (asteroidCount === 0) return;

        const baseAsteroid = await this.loadAsteroidBase();

        const chunkAsteroids = [];
        let created = 0;

        const createStep = () => {
            const batchSize = created < 3 ? 3 : 1;

            for (let i = 0; i < batchSize && created < asteroidCount; i++, created++) {

                const asteroidId = `${key}_${created}`;

                const offsetX = random() * CHUNK_SIZE;
                const offsetY = random() * CHUNK_SIZE;
                const offsetZ = random() * CHUNK_SIZE;

                if (this.destroyedAsteroids.has(asteroidId)) {
                    continue;
                }

                const position = new THREE.Vector3(
                    x * CHUNK_SIZE + offsetX,
                    y * CHUNK_SIZE + offsetY,
                    z * CHUNK_SIZE + offsetZ
                );

                const asteroidData = createAsteroid({
                    base: baseAsteroid,
                    position,
                    random
                });
                asteroidData.id = asteroidId;

                asteroidData.box.setFromObject(asteroidData.mesh);

                this.scene.add(asteroidData.mesh);
                this.asteroids.push(asteroidData);

                const boxHelper = new THREE.Box3Helper(asteroidData.box, 0xff0000);
                boxHelper.visible = this.debugCollision;

                this.scene.add(boxHelper);
                asteroidData.debugBox = boxHelper;

                chunkAsteroids.push(asteroidData);
            }

            if (created < asteroidCount) {
                requestAnimationFrame(createStep);
            }
        };

        createStep();

        const chunkData = this.chunks.get(key);
        if (chunkData) {
            chunkData.asteroids = chunkAsteroids;
        }
    }

    async createSunInChunk(x, y, z) {
        const key = this.getChunkKey(x, y, z);
        const seed = this.getChunkSeed(x, y, z);
        const random = this.createRNG(seed);

        // Região Fixa
        const gridSize = 2;

        const gx = Math.floor(x / gridSize);
        const gy = Math.floor(y / gridSize);
        const gz = Math.floor(z / gridSize);

        const regionSeed = this.hashString(`${this.seed}_${gx}_${gy}_${gz}`);
        const regionRng = this.createRNG(regionSeed);

        const chosenX = Math.floor(regionRng() * gridSize);
        const chosenY = Math.floor(regionRng() * gridSize);
        const chosenZ = Math.floor(regionRng() * gridSize);

        if (
            x % gridSize !== chosenX ||
            y % gridSize !== chosenY ||
            z % gridSize !== chosenZ
        ) return;

        const value = this.getSunValue(
            x * CHUNK_SIZE,
            y * CHUNK_SIZE,
            z * CHUNK_SIZE
        );

        if (value < 0.6) return;

        const textures = await this.loadSunTextures();

        const offsetX = random() * CHUNK_SIZE;
        const offsetY = random() * CHUNK_SIZE;
        const offsetZ = random() * CHUNK_SIZE;

        const position = new THREE.Vector3(
            x * CHUNK_SIZE + offsetX,
            y * CHUNK_SIZE + offsetY,
            z * CHUNK_SIZE + offsetZ
        );

        const { createSun } = await import("@/components/systems/Sun");

        const sun = createSun({
            position,
            random,
            textures
        });

        this.scene.add(sun);
        this.suns.push(sun);

        const chunkData = this.chunks.get(key);

        if (chunkData) {
            chunkData.sun = sun;
        }
    }

    checkAsteroidCollisions(shipPosition, onDamage, scene, onAsteroidDestroyed) {
        const now = Date.now();

        if (!this.shipCollisionBox) {
            this.shipCollisionBox = new THREE.Box3();
        }

        this.shipCollisionBox.setFromCenterAndSize(
            shipPosition,
            _vectorToAsteroid.set(20, 20, 20)
        );

        const chunk = this.getChunkCoord(shipPosition);
        const radius = 1;

        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                for (let z = -radius; z <= radius; z++) {

                    const key = this.getChunkKey(
                        chunk.x + x,
                        chunk.y + y,
                        chunk.z + z
                    );

                    const chunkData = this.chunks.get(key);
                    if (!chunkData?.asteroids) continue;

                    for (let i = chunkData.asteroids.length - 1; i >= 0; i--) {
                        const asteroidData = chunkData.asteroids[i];

                        if (!asteroidData.alive || asteroidData.inViewCone === false) continue;

                        if (asteroidData.box.intersectsBox(this.shipCollisionBox)) {
                            if (!asteroidData.lastHit || now - asteroidData.lastHit > 500) {
                                asteroidData.lastHit = now;
                                asteroidData.hp -= 20;

                                onDamage?.(15);

                                if (asteroidData.hp <= 0) {
                                    asteroidData.alive = false;
                                    asteroidData.mesh.visible = false;
                                    this.destroyedAsteroids.add(asteroidData.id);

                                    onAsteroidDestroyed?.({
                                        scene,
                                        position: asteroidData.mesh.position.clone(),
                                        normal: null,
                                        size: asteroidData.scale
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    checkAsteroidProjectileCollisions(projectiles, scene, onProjectileHit, onAsteroidDestroyed) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];

            const chunk = this.getChunkCoord(projectile.position);
            const key = this.getChunkKey(chunk.x, chunk.y, chunk.z);

            const chunkData = this.chunks.get(key);
            if (!chunkData?.asteroids) continue;

            _projectileBox.setFromCenterAndSize(projectile.position, _projSize);

            for (let j = chunkData.asteroids.length - 1; j >= 0; j--) {
                const asteroidData = chunkData.asteroids[j];

                if (!asteroidData.alive || asteroidData.inViewCone === false) continue;

                if (asteroidData.box.intersectsBox(_projectileBox)) {
                    asteroidData.hp -= projectile.userData.damage;

                    if (scene && projectile.parent) {
                        scene.remove(projectile);
                    }

                    projectiles.splice(i, 1);

                    if (scene) {
                        onProjectileHit?.(scene, projectile.position);
                    }

                    if (asteroidData.hp <= 0) {
                        asteroidData.alive = false;
                        asteroidData.mesh.visible = false;
                        this.destroyedAsteroids.add(asteroidData.id);

                        onAsteroidDestroyed?.({
                            scene,
                            position: asteroidData.mesh.position,
                            normal: projectile.userData?.direction || null,
                            size: asteroidData.scale
                        });
                    }

                    break;
                }
            }
        }
    }

    update(playerPosition, camera = null, shipVelocityVector = null, currentSpeedNormalized = 0, dt = 0.016) {
        if (this.starField) this.starField.position.copy(playerPosition);

        if (this.speedParticles) {
            this.speedParticles.position.copy(playerPosition);
            const shaderMat = this.speedParticles.material;

            if (shipVelocityVector && shipVelocityVector.lengthSq() > 0.01) {
                this.starTime += dt * currentSpeedNormalized;
                shaderMat.uniforms.uTime.value = this.starTime;
                shaderMat.uniforms.uShipDirection.value.copy(shipVelocityVector).normalize();
                shaderMat.uniforms.uSpeed.value = THREE.MathUtils.clamp(currentSpeedNormalized, 0.0, 1.0);
            } else {
                shaderMat.uniforms.uSpeed.value = 0.0;
            }
        }

        const chunk = this.getChunkCoord(playerPosition);
        const key = this.getChunkKey(chunk.x, chunk.y, chunk.z);

        if (this.currentChunk !== key) {
            this.currentChunk = key;
            this.updateChunks(chunk);
        }

        if (camera) {
            camera.getWorldDirection(_cameraDir);
            const CUTOFF_THRESHOLD = -0.3;

            for (const [key, chunkData] of this.chunks.entries()) {
                if (!chunkData?.asteroids) continue;

                for (let i = 0; i < chunkData.asteroids.length; i++) {
                    const asteroid = chunkData.asteroids[i];
                    if (!asteroid.alive) continue;

                    _vectorToAsteroid
                        .copy(asteroid.mesh.position)
                        .sub(camera.position)
                        .normalize();

                    const dotProduct = _cameraDir.dot(_vectorToAsteroid);

                    if (dotProduct < CUTOFF_THRESHOLD) {
                        asteroid.mesh.visible = false;
                        asteroid.inViewCone = false;
                        if (asteroid.debugBox) asteroid.debugBox.visible = false;
                    } else {
                        asteroid.mesh.visible = true;
                        asteroid.inViewCone = true;
                        if (asteroid.debugBox) asteroid.debugBox.visible = this.debugCollision;
                    }
                }
            }
        }

        const queueSize = this.spawnQueue.length;
        let speed = 1;

        if (queueSize > 100) speed = 10;
        else if (queueSize > 50) speed = 5;
        else if (queueSize > 20) speed = 3;

        this.processQueue(speed);
    }

    updateChunks(centerChunk) {
        const needed = new Set();
        const chunkRadius = Math.ceil(VIEW_DISTANCE / CHUNK_SIZE);

        const centerX = centerChunk.x * CHUNK_SIZE;
        const centerY = centerChunk.y * CHUNK_SIZE;
        const centerZ = centerChunk.z * CHUNK_SIZE;

        for (let x = -chunkRadius; x <= chunkRadius; x++) {
            for (let y = -chunkRadius; y <= chunkRadius; y++) {
                for (let z = -chunkRadius; z <= chunkRadius; z++) {

                    const cx = centerChunk.x + x;
                    const cy = centerChunk.y + y;
                    const cz = centerChunk.z + z;

                    const worldX = cx * CHUNK_SIZE;
                    const worldY = cy * CHUNK_SIZE;
                    const worldZ = cz * CHUNK_SIZE;

                    const dx = worldX - centerX;
                    const dy = worldY - centerY;
                    const dz = worldZ - centerZ;

                    if ((dx * dx + dy * dy + dz * dz) > VIEW_DISTANCE_SQ) continue;

                    const key = this.getChunkKey(cx, cy, cz);
                    needed.add(key);

                    if (!this.chunks.has(key)) {
                        this.chunks.set(key, { sun: null });

                        const priority = dx * dx + dy * dy + dz * dz;

                        this.spawnQueue.push({
                            cx, cy, cz,
                            key,
                            priority
                        });
                    }
                }
            }
        }

        for (let key of this.chunks.keys()) {
            if (!needed.has(key)) {
                this.removeChunkDebug(key);
                this.removeChunkObjects(key);
                this.chunks.delete(key);
            }
        }
    }

    setCollisionDebugVisible(visible) {
        this.debugCollision = visible;

        for (const asteroid of this.asteroids) {
            if (asteroid.debugBox) {
                asteroid.debugBox.visible = visible;
            }
        }
    }

    setDebugVisible(visible) {
        this.debugVisible = visible;

        this.debugChunks.forEach((obj) => {
            obj.visible = visible;
        });
    }

    createChunkDebug(x, y, z) {
        const key = this.getChunkKey(x, y, z);
        const seed = this.getChunkSeed(x, y, z);

        const random = this.createRNG(seed);

        const size = CHUNK_SIZE;

        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffcc,
            transparent: true,
            opacity: 0.15,
        });

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, material);
        line.visible = this.debugVisible;

        line.position.set(
            x * CHUNK_SIZE + CHUNK_SIZE / 2,
            y * CHUNK_SIZE + CHUNK_SIZE / 2,
            z * CHUNK_SIZE + CHUNK_SIZE / 2
        );

        this.scene.add(line);
        this.debugChunks.set(key, line);
    }

    removeChunkDebug(key) {
        const obj = this.debugChunks.get(key);
        if (!obj) return;

        this.scene.remove(obj);
        obj.geometry?.dispose?.();
        obj.material?.dispose?.();

        this.debugChunks.delete(key);
    }

    removeChunkObjects(key) {
        const chunkData = this.chunks.get(key);
        if (!chunkData) return;

        if (chunkData?.sun) {
            this.scene.remove(chunkData.sun);

            chunkData.sun.traverse((child) => {
                if (child.geometry) child.geometry.dispose?.();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose?.());
                    } else {
                        child.material.dispose?.();
                    }
                }
            });

            const index = this.suns.indexOf(chunkData.sun);
            if (index !== -1) {
                this.suns.splice(index, 1);
            }
        }

        if (chunkData?.asteroids && chunkData.asteroids.length > 0) {
            for (const asteroidData of chunkData.asteroids) {
                if (asteroidData.debugBox) {
                    this.scene.remove(asteroidData.debugBox);
                    asteroidData.debugBox.geometry?.dispose?.();
                    asteroidData.debugBox.material?.dispose?.();
                }
                
                this.scene.remove(asteroidData.mesh);

                // Limpa material e geometria
                asteroidData.mesh.traverse((child) => {
                    if (child.geometry) child.geometry.dispose?.();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose?.());
                        } else {
                            child.material.dispose?.();
                        }
                    }
                });

                // Remove do array
                const index = this.asteroids.indexOf(asteroidData);
                if (index !== -1) {
                    this.asteroids.splice(index, 1);
                }
            }
        }
    }

    dispose() {
        for (let key of this.chunks.keys()) {
            this.removeChunkDebug(key);
            this.removeChunkObjects(key);
        }
        if (this.starField) {
            this.scene.remove(this.starField);
            this.starField.geometry?.dispose();
            this.starField.material?.dispose();
            this.starField = null;
        }
        if (this.speedParticles) {
            this.scene.remove(this.speedParticles);
            this.speedParticles.geometry?.dispose();
            this.speedParticles.material?.dispose();
            this.speedParticles = null;
        }

        this.suns.forEach(sun => {
            this.scene.remove(sun);
        });

        this.asteroids.forEach(asteroidData => {
            this.scene.remove(asteroidData.mesh);
        });

        this.suns = [];
        this.asteroids = [];

        this.debugChunks.clear();
        this.chunks.clear();
        this.spawnQueue = [];

        this.currentChunk = null;
    }
}