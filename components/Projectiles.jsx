import * as THREE from "three";
import { useRef, useEffect } from "react";

export default function useProjectiles(shipRef, sceneRef, options = {}) {
    const projectiles = useRef([]);
    const speed = options.speed || 5;
    const maxDistance = options.maxDistance || 500;
    const energy = useRef(options.energy ?? 100);
    useEffect(() => {
        energy.current = options.energy ?? 100;
    }, [options.energy]);
    const onConsumeEnergy = options.onConsumeEnergy ?? (() => { });
    const canControlRef = options.canControlRef ?? { current: true };
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

    const updateProjectiles = () => {
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
    };

    return {
        updateProjectiles,
        projectiles,
    };
}