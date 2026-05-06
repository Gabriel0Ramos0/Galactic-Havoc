import * as THREE from "three";
import { OBJLoader, MTLLoader } from "three-stdlib";

export default async function createScrap({
    scene,
    position,
    accessType = "free"
}) {
    const scrapGroup = new THREE.Group();
    scrapGroup.position.copy(position);
    scene.add(scrapGroup);

    const basePath = "/models/marker/";
    let scrapObject = null;

    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(basePath);
    mtlLoader.setResourcePath(basePath);

    const objLoader = new OBJLoader();

    await new Promise((resolve) => {
        mtlLoader.load("estacao_espacial.mtl", (materials) => {
            materials.preload();

            objLoader.setMaterials(materials);
            objLoader.setPath(basePath);

            objLoader.load("estacao_espacial.obj", (object) => {
                const box = new THREE.Box3().setFromObject(object);
                const center = new THREE.Vector3();
                box.getCenter(center);
                object.position.sub(center);

                const size = new THREE.Vector3();
                box.getSize(size);

                object.position.y += size.y * 0.15;

                const targetSize = 90;
                const maxAxis = Math.max(size.x, size.y, size.z);
                const scale = targetSize / maxAxis;

                object.scale.setScalar(scale);
                object.rotation.x = Math.PI / 2;

                object.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.emissive?.set?.(0x000000);
                        child.material.emissiveIntensity = 0;
                        child.material.transparent = false;
                        child.material.opacity = 1;
                        child.material.depthWrite = true;
                    }
                });

                scrapObject = object;
                scrapGroup.add(object);

                resolve();
            });
        });
    });

    scrapGroup.userData = {
        time: 0,
        accessType,
        discoverable: false
    };

    function update(dt) {
        scrapGroup.userData.time += dt;
        const t = scrapGroup.userData.time;

        if (scrapObject) {
            scrapObject.rotation.z += dt * 0.02;
            scrapObject.rotation.y = Math.sin(t * 0.2) * 0.1;
            scrapObject.position.y = Math.sin(t * 0.35) * 4;
        }
    }

    function remove() {
        scene.remove(scrapGroup);
    }

    return {
        group: scrapGroup,
        update,
        remove
    };
}