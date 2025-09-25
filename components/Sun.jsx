import * as THREE from 'three';
import { Asset } from 'expo-asset';

const textures = [
    require('@/assets/textures/sol.png'),
    require('@/assets/textures/sol-azul.png')
];

export default async function createSuns(sunCount = 10, spread = 2000) {
    const sun = new THREE.Group();

    // Carregar todas as texturas primeiro
    const loadedTextures = await Promise.all(
        textures.map(async (t) => {
            const asset = Asset.fromModule(t);
            await asset.downloadAsync();
            return new THREE.TextureLoader().load(asset.localUri);
        })
    );

    for (let i = 0; i < sunCount; i++) {
        const size = Math.random() * 5 + 5;
        const sunGeometry = new THREE.SphereGeometry(size, 32, 32);

        // Escolher uma textura aleatória
        const randomTexture = loadedTextures[Math.floor(Math.random() * loadedTextures.length)];

        const sunMaterial = new THREE.MeshBasicMaterial({
            map: randomTexture,
            transparent: true,
        });

        const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

        sunMesh.position.set(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread
        );

        sun.add(sunMesh);
    }

    sun.recycle = (shipPosition, maxDistance = spread / 2) => {
        sun.children.forEach((sun) => {
            const dx = sun.position.x - shipPosition.x;
            const dy = sun.position.y - shipPosition.y;
            const dz = sun.position.z - shipPosition.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance > maxDistance) {
                sun.position.set(
                    shipPosition.x + (Math.random() - 0.5) * spread,
                    shipPosition.y + (Math.random() - 0.5) * spread,
                    shipPosition.z + (Math.random() - 0.5) * spread
                );
            }
        });
    };

    return sun;
}
