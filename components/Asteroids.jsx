// app/components/Asteroids.js
import { OBJLoader, MTLLoader } from "three-stdlib";
import * as THREE from "three";

export default async function createAsteroids( count, spread, minScale, maxScale ) {
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

  function randomPositionInShell(center, minR, maxR) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = Math.sqrt(Math.random()) * (maxR - minR) + minR;
    const sinPhi = Math.sin(phi);
    return new THREE.Vector3(
      center.x + r * Math.cos(theta) * sinPhi,
      center.y + r * Math.sin(theta) * sinPhi,
      center.z + r * Math.cos(phi)
    );
  }

  // --- gerar instâncias ---
  for (let i = 0; i < count; i++) {
    const asteroid = baseAsteroid.clone();
    asteroid.traverse(c => { c.isMesh });

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
      rotVel: {
        x: (Math.random() - 0.5) * 0.05,
        y: (Math.random() - 0.5) * 0.05,
        z: (Math.random() - 0.5) * 0.05
      },
      scale,
    });
  }

  const tmpGlobal = new THREE.Vector3();
  const tmpNew = new THREE.Vector3();

  group.update = (shipPosition, universePos, dt = 1) => {
    const VIEW_DISTANCE = 2000;

    for (let info of infos) {
      tmpGlobal.copy(info.pos).add(universePos);

      const distSq = tmpGlobal.distanceToSquared(shipPosition);

      if (distSq > VIEW_DISTANCE * VIEW_DISTANCE) continue;

      info.mesh.rotation.x += info.rotVel.x * dt;
      info.mesh.rotation.y += info.rotVel.y * dt;
      info.mesh.rotation.z += info.rotVel.z * dt;

      info.mesh.position.copy(info.pos);
    }
  };

  // --- reciclagem (mantém posição, sem velocidade) ---
  group.recycle = (shipPosition, universePos, maxDistance = spread / 2, minDistanceFromShip) => {
    for (let info of infos) {
      tmpGlobal.copy(info.pos).add(universePos);
      const dSq = tmpGlobal.distanceToSquared(shipPosition);
      const maxSq = maxDistance * maxDistance;

      if (dSq > maxSq || dSq < 50 * 50) {
        let attempts = 0;
        do {
          tmpNew.copy(randomPositionInShell(shipPosition, minDistanceFromShip, Math.max(minDistanceFromShip + 500, maxDistance)));
          attempts++;
          if (attempts > 12) break;
        } while (tmpNew.distanceTo(shipPosition) < minDistanceFromShip);

        info.pos.copy(tmpNew.sub(universePos));
        info.mesh.position.copy(info.pos);
      }
    }
  };

  // --- colisões ---
  group.checkCollisions = (shipPosition, universePos, shipRadius = 5) => {
    const hits = [];
    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      tmpGlobal.copy(info.pos).add(universePos);
      const dist = tmpGlobal.distanceTo(shipPosition);
      const radius = info.scale * 0.8;
      if (dist < shipRadius + radius) hits.push(i);
    }
    return hits;
  };
  return group;
}