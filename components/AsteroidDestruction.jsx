import * as THREE from "three";

export default function spawnAsteroidDestruction(scene, position, normal, size = 1) {
    const group = new THREE.Group();
    group.position.copy(position);

    const bigFragments = [];
    const smallFragments = [];

    // -------------------------
    // 💥 FLASH + SHOCKWAVE
    // -------------------------
    const flash = new THREE.Mesh(
        new THREE.SphereGeometry(1.2 * size, 12, 12),
        new THREE.MeshBasicMaterial({
            color: 0xffaa55,
            transparent: true,
            opacity: 1,
        })
    );

    const shockwave = new THREE.Mesh(
        new THREE.RingGeometry(0.5 * size, 1.5 * size, 32),
        new THREE.MeshBasicMaterial({
            color: 0xff8844,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        })
    );

    shockwave.rotation.x = Math.PI / 2;

    group.add(flash);
    group.add(shockwave);

    // -------------------------
    // 🪨 FRAGMENTOS GRANDES (lentos)
    // -------------------------
    for (let i = 0; i < 4; i++) {
        const mesh = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.6 * size, 0),
            new THREE.MeshStandardMaterial({ color: 0x777777 })
        );

        let dir = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();

        if (normal) dir.addScaledVector(normal, 0.8).normalize();

        mesh.userData.velocity = dir.multiplyScalar(4 + Math.random() * 3);
        mesh.userData.spin = new THREE.Vector3(
            Math.random(),
            Math.random(),
            Math.random()
        );

        group.add(mesh);
        bigFragments.push(mesh);
    }

    // -------------------------
    // 🧱 FRAGMENTOS PEQUENOS (rápidos)
    // -------------------------
    for (let i = 0; i < 10; i++) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.2 * size, 0.2 * size, 0.2 * size),
            new THREE.MeshStandardMaterial({ color: 0x999999 })
        );

        let dir = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();

        mesh.userData.velocity = dir.multiplyScalar(8 + Math.random() * 6);

        group.add(mesh);
        smallFragments.push(mesh);
    }

    // -------------------------
    // ✨ POEIRA (Points shader style)
    // -------------------------
    const count = 40;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;

        const dir = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();

        velocities[i * 3 + 0] = dir.x * (2 + Math.random() * 4);
        velocities[i * 3 + 1] = dir.y * (2 + Math.random() * 4);
        velocities[i * 3 + 2] = dir.z * (2 + Math.random() * 4);

        life[i] = 1 + Math.random();
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("life", new THREE.BufferAttribute(life, 1));

    const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { color: { value: new THREE.Color(0xffaa66) } },
        vertexShader: `
            attribute float life;
            varying float vLife;
            void main() {
                vLife = life;
                gl_PointSize = 25.0 * life;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }
        `,
        fragmentShader: `
            varying float vLife;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                float alpha = smoothstep(0.5, 0.0, d) * vLife;
                gl_FragColor = vec4(1.0,0.6,0.3, alpha);
            }
        `
    });

    const points = new THREE.Points(geo, mat);
    group.add(points);

    scene.add(group);

    // -------------------------
    // ⏱️ UPDATE
    // -------------------------
    let t = 0;

    group.userData.update = (dt) => {
        t += dt;

        // flash
        flash.scale.multiplyScalar(1.25);
        flash.material.opacity *= 0.8;

        // shockwave
        shockwave.scale.multiplyScalar(1.15);
        shockwave.material.opacity *= 0.9;

        // big fragments (pesados)
        bigFragments.forEach(f => {
            f.position.addScaledVector(f.userData.velocity, dt);
            f.userData.velocity.multiplyScalar(0.97);

            f.rotation.x += f.userData.spin.x * dt;
            f.rotation.y += f.userData.spin.y * dt;
        });

        // small fragments
        smallFragments.forEach(f => {
            f.position.addScaledVector(f.userData.velocity, dt);
            f.userData.velocity.multiplyScalar(0.95);
        });

        // poeira
        const pos = geo.attributes.position.array;
        const lifeArr = geo.attributes.life.array;

        for (let i = 0; i < count; i++) {
            pos[i * 3 + 0] += velocities[i * 3 + 0] * dt;
            pos[i * 3 + 1] += velocities[i * 3 + 1] * dt;
            pos[i * 3 + 2] += velocities[i * 3 + 2] * dt;

            lifeArr[i] -= dt;
        }

        geo.attributes.position.needsUpdate = true;
        geo.attributes.life.needsUpdate = true;

        // cleanup
        if (t > 2.5) {
            geo.dispose();
            mat.dispose();

            group.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });

            scene.remove(group);
        }
    };

    return group;
}