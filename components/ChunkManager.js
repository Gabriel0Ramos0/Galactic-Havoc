// app/components/ChunkManager.js
import * as THREE from "three";

const CHUNK_SIZE = 1000;
const VIEW_DISTANCE = 5500;
const VIEW_DISTANCE_SQ = VIEW_DISTANCE * VIEW_DISTANCE;

export default class ChunkManager {
    constructor(scene, seed = null) {
        this.scene = scene;
        this.chunks = new Map();
        this.debugChunks = new Map();
        this.debugVisible = false;
        this.sunTextures = null;
        this.suns = [];
        this.minSunDistance = 3000; // ajuste aqui
        this.seed = seed ?? Math.floor(Math.random() * 999999999);
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

    processQueue(limit = 2) {
        for (let i = 0; i < limit; i++) {
            const item = this.spawnQueue.shift();
            if (!item) return;
            if (!this.chunks.has(item.key)) return;

            const { cx, cy, cz } = item;

            const key = this.getChunkKey(cx, cy, cz);

            if (!this.chunks.has(key)) continue;

            this.createChunkDebug(cx, cy, cz);
            this.createSunInChunk(cx, cy, cz).catch(console.error);
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

    async createSunInChunk(x, y, z) {
        const key = this.getChunkKey(x, y, z);
        const seed = this.getChunkSeed(x, y, z);
        const random = this.createRNG(seed);

        // CHANCE DE SPAWN
        if (random() > 0.005) return; // 0.5%

        const textures = await this.loadSunTextures();

        const offsetX = random() * CHUNK_SIZE;
        const offsetY = random() * CHUNK_SIZE;
        const offsetZ = random() * CHUNK_SIZE;

        const position = new THREE.Vector3(
            x * CHUNK_SIZE + offsetX,
            y * CHUNK_SIZE + offsetY,
            z * CHUNK_SIZE + offsetZ
        );

        if (this.isTooCloseToOtherSuns(position)) return;

        const { createSun } = await import("@/components/Sun");

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

    update(playerPosition) {
        const chunk = this.getChunkCoord(playerPosition);
        const key = this.getChunkKey(chunk.x, chunk.y, chunk.z);

        if (this.currentChunk !== key) {
            this.currentChunk = key;
            this.updateChunks(chunk);
        }
        this.processQueue(1);
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

                        this.spawnQueue.push({
                            cx, cy, cz,
                            key
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

        if (chunkData?.sun) {
            // Remove da cena
            this.scene.remove(chunkData.sun);

            // Limpa material e geometria
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

            // Remove do array
            const index = this.suns.indexOf(chunkData.sun);
            if (index !== -1) {
                this.suns.splice(index, 1);
            }
        }
    }

    dispose() {
        for (let key of this.chunks.keys()) {
            this.removeChunkDebug(key);
            this.removeChunkObjects(key);
        }

        this.suns.forEach(sun => {
            this.scene.remove(sun);
        });

        this.suns = [];

        this.debugChunks.clear();
        this.chunks.clear();
        this.spawnQueue = [];

        this.currentChunk = null;
    }
}