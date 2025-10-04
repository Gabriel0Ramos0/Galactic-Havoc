import { OBJLoader, MTLLoader } from "three-stdlib";
import * as THREE from "three";

export default async function createAsteroids({
  count = 300,
  spread = 6000,
  minScale = 2,
  maxScale = 20,
} = {}) {
  const group = new THREE.Group();
  const infos = [];

  // --- carregar modelo ---
  const mtlLoader = new MTLLoader();
  const materials = await mtlLoader.loadAsync(require("../assets/models/asteroide/ASTEROIDE.mtl"));
  materials.preload();

  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  const baseAsteroid = await objLoader.loadAsync(require("../assets/models/asteroide/ASTEROIDE.obj"));

  baseAsteroid.traverse(child => {
    if (child.isMesh) {
      child.material.side = THREE.DoubleSide;
      child.material.roughness = 1.0;
      child.material.metalness = 0.2;
    }
  });

  // --- gerar instâncias ---
  for (let i = 0; i < count; i++) {
    const asteroid = baseAsteroid.clone(true);
    const scale = minScale + Math.random() * (maxScale - minScale);
    asteroid.scale.setScalar(scale);

    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );

    asteroid.position.copy(pos);
    asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    group.add(asteroid);

    infos.push({
      mesh: asteroid,
      pos,
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5),
      rotVel: new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02),
      scale,
    });
  }

  // --- atualizar por frame ---
  group.update = (shipPosition, universePos, dt = 1) => {
    for (const info of infos) {
      info.pos.add(info.vel.clone().multiplyScalar(dt));
      info.mesh.rotation.x += info.rotVel.x * dt;
      info.mesh.rotation.y += info.rotVel.y * dt;
      info.mesh.rotation.z += info.rotVel.z * dt;
      info.mesh.position.copy(info.pos);
    }
  };

  // --- reciclagem: reposiciona se longe ---
  group.recycle = (shipPosition, universePos, maxDistance = spread / 2, minDistanceFromShip = 800) => {
    for (const info of infos) {
      const global = new THREE.Vector3().copy(info.pos).add(universePos);
      const d = global.distanceTo(shipPosition);
      if (d > maxDistance || d < 50) {
        let newPos;
        do {
          newPos = new THREE.Vector3(
            shipPosition.x + (Math.random() - 0.5) * spread,
            shipPosition.y + (Math.random() - 0.5) * spread,
            shipPosition.z + (Math.random() - 0.5) * spread
          );
        } while (newPos.distanceTo(shipPosition) < minDistanceFromShip);
        info.pos.copy(newPos.sub(universePos));
        info.vel.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6);
      }
    }
  };

  // --- colisões ---
  group.checkCollisions = (shipPosition, universePos, shipRadius = 5) => {
    const hits = [];
    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      const global = new THREE.Vector3().copy(info.pos).add(universePos);
      const dist = global.distanceTo(shipPosition);
      const radius = info.scale * 0.8; // aproxima o raio ao tamanho
      if (dist < shipRadius + radius) hits.push(i);
    }
    return hits;
  };

  return group;
}
