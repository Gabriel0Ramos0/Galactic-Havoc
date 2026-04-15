import { OBJLoader, MTLLoader } from "three-stdlib";
import * as THREE from "three";

let cachedEnemy = null;
let loadingPromise = null;

async function loadEnemyModel() {
    if (cachedEnemy) return cachedEnemy;
    if (loadingPromise) return loadingPromise;

    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();

    const basePath = "/models/Nave_v2/";

    mtlLoader.setPath(basePath);
    mtlLoader.setResourcePath(basePath);

    loadingPromise = new Promise((resolve, reject) => {
        mtlLoader.load(
            "d5class.mtl",
            (materials) => {
                materials.preload();

                objLoader.setMaterials(materials);
                objLoader.setPath(basePath);

                objLoader.load(
                    "d5class.obj",
                    (object) => {
                        object.scale.set(3, 3, 3);
                        object.rotation.x = Math.PI / 2;

                        cachedEnemy = object;
                        resolve(object);
                    },
                    undefined,
                    reject
                );
            },
            undefined,
            reject
        );
    });

    return loadingPromise;
}

export async function createEnemy(scene) {
    const baseModel = await loadEnemyModel();

    const enemy = new THREE.Group();
    const clone = baseModel.clone(true);

    // cache dos meshes
    const meshes = [];

    clone.traverse((child) => {
        if (child.isMesh) {
            child.material = child.material.clone();

            if (child.material.emissive) {
                child.material.emissive.set(0xff0000);
                child.material.emissiveIntensity = 0;
            }

            meshes.push(child);
        }
    });

    enemy.userData.meshes = meshes;

    enemy.add(clone);

    enemy.position.set(
        Math.random() * 50 - 25,
        0,
        Math.random() * 50 - 25
    );

    scene.add(enemy);

    return enemy;
}

export function updateEnemy(enemy, player) {
    if (!enemy || !player) return;

    const distance = enemy.position.distanceTo(player.position);

    const maxDistance = 500;
    const minDistance = 50;

    let intensity = (distance - minDistance) / (maxDistance - minDistance);
    intensity = Math.max(0, Math.min(1, intensity));

    const meshes = enemy.userData.meshes || [];

    for (let i = 0; i < meshes.length; i++) {
        const mat = meshes[i].material;
        if (mat.emissive) {
            mat.emissiveIntensity = intensity * 2;
        }
    }
}