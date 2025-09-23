// Nave.jsx
import { OBJLoader } from "three-stdlib";
import * as THREE from "three";

export function createShip(scene) {
    const loader = new OBJLoader();
    const ship = new THREE.Group();

    loader.load(
        require("../assets/models/Nave/neghvar.obj"),
        (object) => {
            object.scale.set(1, 1, 1);
            object.rotation.x = Math.PI / 2; // deita para frente (X)
            object.rotation.z = -Math.PI * 2; // gira a nave 180° em X
            ship.add(object);
        },
        (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% carregado"),
        (error) => console.error("Erro ao carregar OBJ:", error)
    );
    scene.add(ship);
    return ship;
}
