import * as THREE from "three";
import { useRef, useEffect } from "react";

export function createProjectileParticles(scene, position) {
    const count = 40;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifeTimes = new Float32Array(count);
    const scales = new Float32Array(count);

    // Ponto central de impacto (maior)
    positions[0] = position.x;
    positions[1] = position.y;
    positions[2] = position.z;
    velocities[0] = 0;
    velocities[1] = 0;
    velocities[2] = 0;
    lifeTimes[0] = 0.6;
    scales[0] = 1.5;

    // Partículas secundárias
    for (let i = 1; i < count; i++) {
        positions[i * 3 + 0] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;

        // direção aleatória
        const dir = new THREE.Vector3(
            (Math.random() - 0.5),
            (Math.random() - 0.5),
            (Math.random() - 0.5)
        ).normalize();

        const speed = 0.5 + Math.random() * 2; // velocidade das partículas
        velocities[i * 3 + 0] = dir.x * speed;
        velocities[i * 3 + 1] = dir.y * speed;
        velocities[i * 3 + 2] = dir.z * speed;

        lifeTimes[i] = 0.4 + Math.random() * 0.4; // partículas curtas
        scales[i] = 0.2 + Math.random() * 0.5; // tamanhos variados
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("life", new THREE.BufferAttribute(lifeTimes, 1));
    geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));

    const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            color: { value: new THREE.Color(0x00ffff) }, // azul laser
        },
        vertexShader: `
            attribute float life;
            attribute float scale;
            varying float vLife;
            varying float vScale;
            void main() {
                vLife = life;
                vScale = scale;
                gl_PointSize = 20.0 * vScale * vLife;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            varying float vLife;
            varying float vScale;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                float alpha = smoothstep(0.5, 0.0, dist) * vLife;
                // cintilação leve
                alpha *= 0.7 + 0.3 * sin(vLife * 20.0);
                gl_FragColor = vec4(color, alpha);
            }
        `,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    return {
        update: (dt) => {
            let aliveCount = 0;
            const pos = geometry.attributes.position.array;

            for (let i = 0; i < count; i++) {
                pos[i * 3 + 0] += velocities[i * 3 + 0] * dt * 10;
                pos[i * 3 + 1] += velocities[i * 3 + 1] * dt * 10;
                pos[i * 3 + 2] += velocities[i * 3 + 2] * dt * 10;

                lifeTimes[i] -= dt * 2;
                if (lifeTimes[i] > 0) aliveCount++;
            }

            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.life.needsUpdate = true;

            if (aliveCount === 0) {
                scene.remove(points);
                geometry.dispose();
                material.dispose();
                return false;
            }

            return true;
        },
    };
}

export default function useProjectiles(shipRef, sceneRef, options = {}) {
    const projectiles = useRef([]);
    const particleEffects = useRef([]);
    const speed = options.speed || 5;
    const maxDistance = options.maxDistance || 500;
    const energy = useRef(options.energy ?? 100);
    useEffect(() => {
        energy.current = options.energy ?? 100;
    }, [options.energy]);
    const onConsumeEnergy = options.onConsumeEnergy ?? (() => { });
    const canControlRef = options.canControlRef ?? { current: true };
    const controlsRef = options.controlsRef ?? { current: { shooting: true } };
    const onShoot = options.onShoot ?? (() => { });
    const shipVelocityRef = options.shipVelocityRef;
    const keys = useRef({
        space: false,
    });
    const lastSide = useRef(1);
    const lastShotTime = useRef(0);
    const damage = options.damage || 10;
    const fireRate = options.fireRate || 200;

    const geometryRef = useRef(null);
    const materialRef = useRef(null);

    useEffect(() => {
        geometryRef.current = new THREE.CapsuleGeometry(0.15, 0.8, 8, 16);
        materialRef.current = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 2,
            roughness: 0.2,
            metalness: 0.8,
        });

        return () => {
            geometryRef.current.dispose();
            materialRef.current.dispose();
        };
    }, []);

    const fireProjectile = () => {
        if (!shipRef.current || !sceneRef.current) return;

        lastSide.current *= -1;

        const projectile = new THREE.Mesh(
            geometryRef.current,
            materialRef.current
        );

        const ship = shipRef.current;

        const forward = new THREE.Vector3(0, 1, 0).applyQuaternion(ship.quaternion).normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(ship.quaternion).normalize();
        const up = new THREE.Vector3(0, 0, 1).applyQuaternion(ship.quaternion).normalize();

        const sideOffset = 1.5 * lastSide.current; // distância da asa
        const forwardOffset = 0.5; // distância atrás do nariz
        const upOffset = -0.6; // ajuste vertical

        const spawnPosition = new THREE.Vector3()
            .copy(ship.position)
            .add(right.multiplyScalar(sideOffset))
            .add(forward.multiplyScalar(forwardOffset))
            .add(up.multiplyScalar(upOffset));

        projectile.position.copy(spawnPosition);

        const axis = new THREE.Vector3(0, 2, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, forward);
        projectile.quaternion.copy(quaternion);

        projectile.userData.direction = forward;
        projectile.userData.startPos = projectile.position.clone();
        projectile.userData.damage = damage;

        projectile.userData.shipVelocity =
            shipVelocityRef?.current?.clone() || new THREE.Vector3();

        sceneRef.current.add(projectile);
        projectiles.current.push(projectile);
    };

    useEffect(() => {

        const handleKeyDown = (e) => {
            if (e.code === "Space") {
                keys.current.space = true;
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === "Space") {
                keys.current.space = false;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    const spawnProjectileParticles = (scene, position) => {
        if (!scene || !position) return;
        const effect = createProjectileParticles(scene, position);
        particleEffects.current.push(effect);
    };

    const updateProjectiles = (dt = 0) => {
        if (!controlsRef.current.shooting) return;

        const now = Date.now();

        if (keys.current.space) {
            if (now - lastShotTime.current >= fireRate) {

                if (canControlRef.current && energy.current >= 2) {
                    fireProjectile();

                    onConsumeEnergy(2);
                    onShoot();

                    lastShotTime.current = now;
                }
            }
        }

        for (let i = projectiles.current.length - 1; i >= 0; i--) {
            const p = projectiles.current[i];
            const baseVelocity = p.userData.direction.clone().multiplyScalar(speed);
            const inheritedVelocity = p.userData.shipVelocity.clone();

            p.position.add(baseVelocity.add(inheritedVelocity));

            if (p.position.distanceTo(p.userData.startPos) > maxDistance) {
                sceneRef.current?.remove(p);
                projectiles.current.splice(i, 1);
            }
        }
        particleEffects.current = particleEffects.current.filter(effect => effect.update(dt));
    };

    return {
        updateProjectiles,
        projectiles,
        spawnProjectileParticles,
    };
}