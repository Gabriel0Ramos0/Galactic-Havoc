// app/components/ChunkManager.js
import * as THREE from "three";

const CHUNK_SIZE = 1000;
const VIEW_DISTANCE = 3000;
const VIEW_DISTANCE_SQ = VIEW_DISTANCE * VIEW_DISTANCE;

export default class ChunkManager {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.debugChunks = new Map();
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

    update(playerPosition) {
        const chunk = this.getChunkCoord(playerPosition);
        const key = this.getChunkKey(chunk.x, chunk.y, chunk.z);

        if (this.currentChunk !== key) {
            this.currentChunk = key;
            this.updateChunks(chunk);
        }
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
                        this.chunks.set(key, true);
                        this.createChunkDebug(cx, cy, cz);
                    }
                }
            }
        }

        for (let key of this.chunks.keys()) {
            if (!needed.has(key)) {
                this.removeChunkDebug(key);
                this.chunks.delete(key);
            }
        }
    }

    createChunkDebug(x, y, z) {
        const key = this.getChunkKey(x, y, z);

        const size = CHUNK_SIZE;

        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffcc,
            transparent: true,
            opacity: 0.15,
        });

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, material);

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
}