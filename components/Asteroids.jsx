// app/components/Asteroids.jsx
import * as THREE from "three";

export default function createAsteroids({
    count = 300,
    spread = 6000,
    minScale = 2,
    maxScale = 20,
    geometrySegments = 2,
    color = 0x999999,
} = {}) {
    // geometria básica (ico para aparência rochosa)
    const geom = new THREE.IcosahedronGeometry(1, geometrySegments);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.1 });

    const inst = new THREE.InstancedMesh(geom, mat, count);
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // dados por instância
    const infos = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
        const scale = minScale + Math.random() * (maxScale - minScale);
        const pos = new THREE.Vector3(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread
        );
        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        const rotVel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
        );

        infos.push({ pos, vel, rotVel, scale });

        dummy.position.copy(pos);
        dummy.scale.setScalar(scale);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
    }

    inst.frustumCulled = false;

    // métodos úteis
    inst.userData = inst.userData || {};
    inst.userData.infos = infos;
    inst.userData.dummy = dummy;
    inst.userData.spread = spread;

    // reciclagem: reposiciona caso muito longe da nave
    inst.recycle = (shipPosition, universePos, maxDistance = spread / 2, minDistanceFromShip = 800) => {
        for (let i = 0; i < infos.length; i++) {
            const info = infos[i];
            // posição global atual
            const global = new THREE.Vector3().copy(info.pos).add(universePos);
            const d = global.distanceTo(shipPosition);

            if (d > maxDistance || d < 50) {
                // gera nova posição garantindo que fique a pelo menos minDistanceFromShip
                let newPos;
                do {
                    newPos = new THREE.Vector3(
                        shipPosition.x + (Math.random() - 0.5) * spread,
                        shipPosition.y + (Math.random() - 0.5) * spread,
                        shipPosition.z + (Math.random() - 0.5) * spread
                    );
                } while (newPos.distanceTo(shipPosition) < minDistanceFromShip);

                // converte para posição local do grupo (subtrai universePos)
                info.pos.set(newPos.x - universePos.x, newPos.y - universePos.y, newPos.z - universePos.z);

                // randomiza velocidade/rot
                info.vel.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6);
                info.rotVel.set((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);

                // apply matrix immediately
                dummy.position.copy(info.pos);
                dummy.scale.setScalar(info.scale);
                dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                dummy.updateMatrix();
                inst.setMatrixAt(i, dummy.matrix);
                inst.instanceMatrix.needsUpdate = true;
            }
        }
    };

    // update por frame: move instâncias pela vel e rotVel; chamar depois de universeGroup.position/sub()
    inst.update = (shipPosition, universePos, dt = 1) => {
        for (let i = 0; i < infos.length; i++) {
            const info = infos[i];

            // atualiza posição local
            info.pos.add(info.vel.clone().multiplyScalar(dt));

            // rotação
            const idx = i;
            dummy.position.copy(info.pos);
            dummy.scale.setScalar(info.scale);
            dummy.rotation.x += info.rotVel.x * dt;
            dummy.rotation.y += info.rotVel.y * dt;
            dummy.rotation.z += info.rotVel.z * dt;
            dummy.updateMatrix();
            inst.setMatrixAt(idx, dummy.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;
    };

    // colisão simples: retorna array de índices colididos (ou primeiro índice)
    inst.checkCollisions = (shipPosition, universePos, shipRadius = 5) => {
        const hits = [];
        for (let i = 0; i < infos.length; i++) {
            const info = infos[i];
            const global = new THREE.Vector3().copy(info.pos).add(universePos);
            const dist = global.distanceTo(shipPosition);
            const radius = info.scale; // aproximar radius ~ scale
            if (dist < shipRadius + radius) hits.push(i);
        }
        return hits;
    };

    return inst;
}