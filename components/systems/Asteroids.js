import * as THREE from "three";

export function createAsteroid({ base, position, random }) {
  const asteroid = base.clone(true);

  const scale = 2 + random() * 18;
  asteroid.scale.setScalar(scale);

  asteroid.position.copy(position);

  asteroid.rotation.set(
    random() * Math.PI,
    random() * Math.PI,
    random() * Math.PI
  );

  const box = new THREE.Box3().setFromObject(asteroid);

  return {
    mesh: asteroid,
    box,
    scale,
    hp: Math.floor(80 + random() * 40),
    alive: true,
    lastHit: 0,
  };
}