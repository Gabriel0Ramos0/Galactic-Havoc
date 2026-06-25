// app/components/systems/BiomeManager.js
import { createNoise3D } from "simplex-noise";

export const BIOME_TYPES = {
    EMPTY: "EMPTY",
    ASTEROID_FIELD: "ASTEROID_FIELD",
    NEBULA: "NEBULA",
    RESOURCE_RICH: "RESOURCE_RICH"
};

export default class BiomeManager {
    constructor(seed, createRNGOpt) {
        this.seed = seed;

        // Inicializa geradores de números pseudo-aleatórios distintos
        const rngBiome = createRNGOpt(this.seed + 12345);
        const rngDensity = createRNGOpt(this.seed + 67890);
        const rngOffset = createRNGOpt(this.seed + 99999); // RNG exclusivo para os desvios

        // Instâncias de noise totalmente separadas matematicamente
        this.biomeNoise = createNoise3D(rngBiome);
        this.densityNoise = createNoise3D(rngDensity);

        // Escalas macro: valores menores criam estruturas/regiões maiores no universo
        this.biomeScale = 0.00002;
        this.densityScale = 0.00001;
        this.offsetX = (rngOffset() - 0.5) * 1000000;
        this.offsetY = (rngOffset() - 0.5) * 1000000;
        this.offsetZ = (rngOffset() - 0.5) * 1000000;
    }

    /**
     * Determina as propriedades completas de um bioma em uma coordenada global do mundo.
     */
    getBiomeAt(x, y, z) {
        const sampledX = x + this.offsetX;
        const sampledY = y + this.offsetY;
        const sampledZ = z + this.offsetZ;

        const biomeVal = this.biomeNoise(
            sampledX * this.biomeScale,
            sampledY * this.biomeScale,
            sampledZ * this.biomeScale
        );

        const densityVal = this.densityNoise(
            sampledX * this.densityScale,
            sampledY * this.densityScale,
            sampledZ * this.densityScale
        );

        let type = BIOME_TYPES.EMPTY;
        let baseAsteroidCount = 0;
        let asteroidMultiplier = 1.0;

        if (biomeVal < -0.2) {
            type = BIOME_TYPES.EMPTY;
            baseAsteroidCount = 0;
        } else if (biomeVal >= -0.2 && biomeVal < 0.3) {
            type = BIOME_TYPES.ASTEROID_FIELD;
            baseAsteroidCount = densityVal > 0 ? 4 : 2;
        } else if (biomeVal >= 0.3 && biomeVal < 0.6) {
            type = BIOME_TYPES.NEBULA;
            baseAsteroidCount = 1;
            asteroidMultiplier = 0.5;
        } else {
            type = BIOME_TYPES.RESOURCE_RICH;
            baseAsteroidCount = densityVal > -0.2 ? 7 : 3;
            asteroidMultiplier = 1.5;
        }

        return {
            type,
            biomeValue: biomeVal,
            densityValue: densityVal,
            baseAsteroidCount,
            asteroidMultiplier
        };
    }
}