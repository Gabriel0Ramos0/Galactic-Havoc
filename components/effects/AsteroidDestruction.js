import * as THREE from "three";

export default function spawnAsteroidDestruction(scene, position, normal, size = 1, asteroidBase = null) {
    const group = new THREE.Group();
    group.position.copy(position);

    const bigFragments = [];
    const smallFragments = [];

    // Clona o material PBR completo do asteroide base
    const fragmentMaterial = asteroidBase?.material ? asteroidBase.material.clone() : new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.9,
        metalness: 0.2
    });

    // Intensidade inicial do calor
    fragmentMaterial.emissive = new THREE.Color(0xff4400);
    fragmentMaterial.emissiveIntensity = 4.0;

    // 1. FRAGMENTOS MAIORES
    const bigFragCount = 8;
    for (let i = 0; i < bigFragCount; i++) {
        const mesh = new THREE.Mesh(
            new THREE.IcosahedronGeometry((0.25 + Math.random() * 0.35) * size, 0),
            fragmentMaterial
        );

        let dir = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();

        if (normal) dir.addScaledVector(normal, 0.8).normalize();

        // Velocidade linear
        mesh.userData.velocity = dir.clone().multiplyScalar(15 + Math.random() * 15);
        mesh.userData.spin = new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6
        );

        // Afasta a posição inicial do fragmento
        mesh.position.addScaledVector(dir, 0.5 * size);

        group.add(mesh);
        bigFragments.push(mesh);
    }

    // FRAGMENTOS
    const smallFragCount = 30;
    for (let i = 0; i < smallFragCount; i++) {
        const mesh = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.1 * size, 0),
            fragmentMaterial
        );

        const randomScale = 0.5 + Math.random() * 1.0;
        mesh.scale.set(randomScale, randomScale, randomScale);

        let dir = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();

        if (normal) dir.addScaledVector(normal, 0.6).normalize();

        mesh.userData.velocity = dir.clone().multiplyScalar(30 + Math.random() * 25);
        mesh.userData.spin = new THREE.Vector3(
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12
        );

        mesh.position.addScaledVector(dir, 0.8 * size);

        group.add(mesh);
        smallFragments.push(mesh);
    }

    scene.add(group);

    let t = 0;
    const duration = 5.0;

    group.userData.update = (dt) => {
        t += dt;

        if (t < 2.5) {
            fragmentMaterial.emissiveIntensity = THREE.MathUtils.lerp(4.0, 0.0, t / 2.5);
        } else {
            fragmentMaterial.emissiveIntensity = 0;
        }

        bigFragments.forEach(f => {
            // Mapeamento de translação pura
            f.position.addScaledVector(f.userData.velocity, dt);

            f.rotation.x += f.userData.spin.x * dt;
            f.rotation.y += f.userData.spin.y * dt;
            f.rotation.z += f.userData.spin.z * dt;

            // Começa a sumir nos últimos 1.5 segundos
            if (t > 3.5) {
                const progress = (duration - t) / 1.5;
                const scaleFactor = Math.max(0, progress);
                f.scale.setScalar(scaleFactor);
            }
        });

        smallFragments.forEach(f => {
            f.position.addScaledVector(f.userData.velocity, dt);

            f.rotation.x += f.userData.spin.x * dt;
            f.rotation.y += f.userData.spin.y * dt;
            f.rotation.z += f.userData.spin.z * dt;

            if (t > 3.0) {
                const progress = (duration - t) / 2.0;
                const scaleFactor = Math.max(0, progress);
                f.scale.setScalar(scaleFactor);
            }
        });

        if (t > duration) {
            fragmentMaterial.dispose();

            group.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
            });

            scene.remove(group);
        }
    };

    return group;
}