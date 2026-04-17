import * as THREE from 'three';
import { createSunLight } from "@/components/effects/lighting";

export function createSun({ position, random, textures }) {

    const size = random() * (200 - 60) + 60;

    const geometry = new THREE.SphereGeometry(size, 32, 32);

    const texture = textures[Math.floor(random() * textures.length)];

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
    });

    const sun = new THREE.Mesh(geometry, material);

    sun.position.copy(position);

    // Luz
    createSunLight(sun, 1000, 1000);

    return sun;
}