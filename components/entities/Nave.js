import { OBJLoader, MTLLoader } from "three-stdlib";
import * as THREE from "three";

// Cache para o modelo da nave
let cachedShip = null;
let loadingPromise = null;

function loadShipModel() {
  if (cachedShip) return Promise.resolve(cachedShip);
  if (loadingPromise) return loadingPromise;

  const mtlLoader = new MTLLoader();
  const objLoader = new OBJLoader();
  const basePath = "/models/Nave/";

  mtlLoader.setPath(basePath);
  mtlLoader.setResourcePath(basePath);

  loadingPromise = new Promise((resolve, reject) => {
    mtlLoader.load(
      "neghvar.mtl",
      (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.setPath(basePath);

        objLoader.load(
          "neghvar.obj",
          (object) => {
            object.scale.set(1, 1, 1);
            object.rotation.x = Math.PI / 2;

            cachedShip = object;
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

export async function createShip(scene) {
  const baseModel = await loadShipModel();
  const ship = new THREE.Group();
  const clone = baseModel.clone(true);

  clone.position.set(0, 4, 0);
  ship.add(clone);

  scene.add(ship);
  ship.userData.loaded = true;

  return ship;
}