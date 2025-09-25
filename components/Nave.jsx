import { OBJLoader, MTLLoader } from "three-stdlib";
import * as THREE from "three";

export function createShip(scene) {
  const mtlLoader = new MTLLoader();
  const ship = new THREE.Group();

  mtlLoader.load(
    require("../assets/models/Nave/neghvar.mtl"),
    (materials) => {
      materials.preload();

      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);

      objLoader.load(
        require("../assets/models/Nave/neghvar.obj"),
        (object) => {
          object.scale.set(1, 1, 1);
          object.rotation.x = Math.PI / 2;
          ship.add(object);
          ship.userData.loaded = true;
        },
        (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% carregado"),
        (error) => console.error("Erro ao carregar OBJ:", error)
      );
    },
    (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% carregado MTL"),
    (error) => console.error("Erro ao carregar MTL:", error)
  );

  ship.userData.loaded = false;
  scene.add(ship);
  return ship;
}
