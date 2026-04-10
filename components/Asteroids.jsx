// app/components/Asteroids.js
import { OBJLoader, MTLLoader } from "three-stdlib";
import * as THREE from "three";

let cachedBaseAsteroid = null;

// --- carregamento único do modelo ---
async function loadAsteroidBase() {
  if (cachedBaseAsteroid) return cachedBaseAsteroid;

  const mtlLoader = new MTLLoader();
  const materials = await mtlLoader.loadAsync(require("../assets/models/asteroide/ASTEROIDE.mtl"));
  materials.preload();

  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  const base = await objLoader.loadAsync(require("../assets/models/asteroide/ASTEROIDE.obj"));

  base.traverse((child) => {
    if (child.isMesh) {
      child.material.side = THREE.DoubleSide;
      child.material.roughness = 1.0;
      child.material.metalness = 0.2;
    }
  });

  cachedBaseAsteroid = base;
  return base;
}

// --- helper para limpar materiais ---
function disposeMaterial(material) {
  for (const key in material) {
    const value = material[key];
    if (value && typeof value === "object" && "minFilter" in value) {
      value.dispose();
    }
  }
  material.dispose();
}

export default async function createAsteroids(count, spread, minScale, maxScale, options = {}) {
  const group = new THREE.Group();
  const infos = [];
  const baseAsteroid = await loadAsteroidBase();

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
    const asteroid = baseAsteroid.clone(true);

    const scale = minScale + Math.random() * (maxScale - minScale);
    asteroid.scale.setScalar(scale);

    asteroid.position.set(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );

    asteroid.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    group.add(asteroid);

    const box = new THREE.Box3().setFromObject(asteroid);

    infos.push({
      mesh: asteroid,
      box,
      scale,
      hp: Math.floor(80 + Math.random() * 40),
      alive: true,
    });
  }

  // --- reciclagem ---
  group.recycle = (shipPosition, maxDistance, minDistanceFromShip) => {
    const maxSq = maxDistance * maxDistance;

    for (let info of infos) {
      const mesh = info.mesh;
      const distSq = mesh.position.distanceToSquared(shipPosition);

      if (distSq > maxSq) {
        let attempts = 0;
        let newPos = new THREE.Vector3();

        if (!info.alive) {
          info.hp = Math.floor(80 + Math.random() * 40);
          info.alive = true;
          mesh.visible = true;
        }

        do {
          newPos.copy(
            randomPositionInShell(
              shipPosition,
              minDistanceFromShip,
              Math.max(minDistanceFromShip + 500, maxDistance)
            )
          );

          attempts++;
          if (attempts > 12) break;

        } while (newPos.distanceTo(shipPosition) < minDistanceFromShip);

        mesh.position.copy(newPos);
      }
    }
  };

  const onProjectileHit = options.onProjectileHit || (() => { });
  const onAsteroidDestroyed = options.onAsteroidDestroyed || (() => { });

  // --- colisões ---
  group.checkCollisions = (shipPosition, onDamage, scene) => {
    const now = Date.now();

    const shipBox = new THREE.Box3().setFromCenterAndSize(
      shipPosition,
      new THREE.Vector3(20, 20, 20)
    );

    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      const mesh = info.mesh;

      if (!info.alive) continue;

      info.box.setFromObject(mesh);

      if (info.box.intersectsBox(shipBox)) {

        if (!info.lastHit || now - info.lastHit > 500) {
          info.lastHit = now;

          info.hp -= 20;

          // 💥 AQUI MUDA TUDO
          onDamage?.(15);

          if (info.hp <= 0 && info.alive) {
            info.alive = false;
            info.mesh.visible = false;

            onAsteroidDestroyed?.({
              scene,
              position: info.mesh.position.clone(),
              normal: null,
              size: info.scale
            });
          }
        }
      }
    }
  };

  group.checkProjectileCollisions = (projectiles, scene) => {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const projectile = projectiles[i];
      const projectileBox = new THREE.Box3().setFromObject(projectile);

      for (let info of infos) {
        if (!info.alive) continue;

        info.box.setFromObject(info.mesh);

        if (info.box.intersectsBox(projectileBox)) {
          info.hp -= projectile.userData.damage;

          if (scene && projectile.parent) {
            scene.remove(projectile);
          }
          projectiles.splice(i, 1);

          if (scene) {
            onProjectileHit(scene, projectile.position.clone());
          }

          if (info.hp <= 0 && info.alive) {
            info.alive = false;
            info.mesh.visible = false;

            onAsteroidDestroyed?.({
              scene,
              position: info.mesh.position.clone(),
              normal: projectile.userData?.direction || null,
              size: info.scale
            });
          }

          break;
        }
      }
    }
  };

  // --- dispose completo ---
  group.dispose = () => {
    group.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(disposeMaterial);
          } else {
            disposeMaterial(child.material);
          }
        }
      }
    });

    group.clear();
  };

  return group;
}