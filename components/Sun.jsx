import * as THREE from 'three';
import { Asset } from 'expo-asset';
import { createSunLight } from "@/components/lighting";

const textures = [
    require('@/assets/textures/sol.png'),
    require('@/assets/textures/sol-azul.png')
];

export default async function createSuns(sunCount, spread) {
    const sunsGroup = new THREE.Group();

    // Carregar todas as texturas primeiro
    const loadedTextures = await Promise.all(
        textures.map(async (t) => {
            const asset = Asset.fromModule(t);
            await asset.downloadAsync();
            return new THREE.TextureLoader().load(asset.localUri);
        })
    );

    for (let i = 0; i < sunCount; i++) {
        const size = Math.random() * (200 - 60) + 60;
        const sunGeometry = new THREE.SphereGeometry(size, 32, 32);

        const randomTexture = loadedTextures[Math.floor(Math.random() * loadedTextures.length)];

        const sunMaterial = new THREE.MeshBasicMaterial({
            map: randomTexture,
            transparent: true,
        });

        const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

        // posição inicial
        sunMesh.position.set(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread
        );

        createSunLight(sunMesh, 1000, 1000);
        sunMesh.userData.targetScale = 1;
        sunMesh.scale.set(1, 1, 1);

        sunsGroup.add(sunMesh);
    }

    sunsGroup.recycle = (shipPosition, universePos, maxDistance) => {
        const children = sunsGroup.children;

        const maxSq = maxDistance * maxDistance;
        const minDistance = spread * 1.5;
        const minSq = minDistance * minDistance;

        for (let i = 0; i < children.length; i++) {
            const sunMesh = children[i];

            const dx = sunMesh.position.x + universePos.x - shipPosition.x;
            const dy = sunMesh.position.y + universePos.y - shipPosition.y;
            const dz = sunMesh.position.z + universePos.z - shipPosition.z;

            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq > maxSq) {

                let newX, newY, newZ;
                let dx2, dy2, dz2, newDistSq;

                let attempts = 0;

                do {
                    newX = shipPosition.x + (Math.random() - 0.5) * spread * 2 - universePos.x;
                    newY = shipPosition.y + (Math.random() - 0.5) * spread * 2 - universePos.y;
                    newZ = shipPosition.z + (Math.random() - 0.5) * spread * 2 - universePos.z;

                    dx2 = newX - shipPosition.x;
                    dy2 = newY - shipPosition.y;
                    dz2 = newZ - shipPosition.z;

                    newDistSq = dx2 * dx2 + dy2 * dy2 + dz2 * dz2;

                    attempts++;
                    if (attempts > 10) break;

                } while (newDistSq < minSq);

                sunMesh.position.set(newX, newY, newZ);

                sunMesh.scale.set(0.001, 0.001, 0.001);
                sunMesh.userData.growing = true;
            }
        }
    };

    return sunsGroup;
}