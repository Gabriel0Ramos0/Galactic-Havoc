import * as THREE from "three";

const THRUSTER_LIFETIME = 0.6; // Duração do rastro
const THRUSTER_SPAWN_RATE = 10;
const THRUSTER_WIDTH = 0.5;
const THRUSTER_HEIGHT = 0.25;

// Material
const thrusterMaterial = new THREE.LineBasicMaterial({
    color: 0xff6600, // Laranja
    transparent: true,
    toneMapped: false,
});

class ThrusterParticle {
    constructor(position, direction, velocity) {
        // Cria contorno retangular
        const halfWidth = THRUSTER_WIDTH / 2;
        const halfHeight = THRUSTER_HEIGHT / 2;

        const points = [
            new THREE.Vector3(-halfWidth, -halfHeight, 0),
            new THREE.Vector3(halfWidth, -halfHeight, 0),
            new THREE.Vector3(halfWidth, halfHeight, 0),
            new THREE.Vector3(-halfWidth, halfHeight, 0),
            new THREE.Vector3(-halfWidth, -halfHeight, 0),
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        this.mesh = new THREE.Line(geometry, thrusterMaterial.clone());
        this.mesh.position.copy(position);

        // Orienta na direção do movimento
        this.mesh.lookAt(position.clone().add(direction));

        this.age = 0;
        this.lifetime = THRUSTER_LIFETIME;
        this.initialScale = 1;
        this.velocity = velocity.clone();
        this.direction = direction.clone().normalize();
    }

    update(dt) {
        this.age += dt;

        if (this.age >= this.lifetime) {
            return false;
        }

        // Proporção de vida (0 a 1)
        const progress = this.age / this.lifetime;

        // Encolhe gradualmente
        const scale = this.initialScale * (1 - progress);
        this.mesh.scale.set(scale, scale, scale);

        // Fade out
        const opacity = 1 - progress;
        this.mesh.material.opacity = opacity;

        this.mesh.position.add(
            this.direction.clone().multiplyScalar(0.1)
        );

        return true;
    }

    dispose() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}

export function createThrusterEffect(scene, shipRef) {
    const thrusterEffect = {
        particles: [],
        scene: scene,
        shipRef: shipRef,
        spawnCounter: 0,
        active: true,

        update(dt) {
            if (!this.active || !this.shipRef.current) return;

            this.spawnCounter++;

            if (this.spawnCounter >= THRUSTER_SPAWN_RATE) {
                this.spawnCounter = 0;

                const ship = this.shipRef.current;
                const shipVelocity = ship.userData.velocity;

                if (shipVelocity && shipVelocity.lengthSq() > 0.001) {
                    const motorOffsets = [
                        new THREE.Vector3(-1.6, -4, 0), // Motor esquerdo
                        new THREE.Vector3(1.6, -4, 0),  // Motor direito
                    ];

                    motorOffsets.forEach(offset => {
                        offset.applyQuaternion(ship.quaternion);
                        const motorPosition = ship.position.clone().add(offset);

                        // Direção oposta ao movimento
                        const thrustDirection = shipVelocity
                            .clone()
                            .negate()
                            .normalize();

                        // Cria nova partícula
                        const particle = new ThrusterParticle(
                            motorPosition,
                            thrustDirection,
                            shipVelocity
                        );

                        this.particles.push(particle);
                        this.scene.add(particle.mesh);
                    });
                }
            }

            // Atualiza todas as partículas
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const particle = this.particles[i];
                const isAlive = particle.update(dt);

                if (!isAlive) {
                    particle.mesh.parent?.remove(particle.mesh);
                    particle.dispose();
                    this.particles.splice(i, 1);
                }
            }
        },

        dispose() {
            this.active = false;
            this.particles.forEach(p => {
                p.mesh.parent?.remove(p.mesh);
                p.dispose();
            });
            this.particles = [];
        },
    };

    return thrusterEffect;
}