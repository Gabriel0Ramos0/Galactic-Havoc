// app/components/Star.js
import * as THREE from "three";

/**
 * Cria um domo único de estrelas brancas para o plano de fundo distante (Estático).
 */
export function createSpaceBackground(count = 2000, radius = 6000) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];

  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);

    const currentRadius = radius * (0.95 + Math.random() * 0.05);

    positions.push(
      currentRadius * Math.sin(phi) * Math.cos(theta),
      currentRadius * Math.sin(phi) * Math.sin(theta),
      currentRadius * Math.cos(phi)
    );
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 1.5,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    depthWrite: false
  });

  const starField = new THREE.Points(geometry, material);
  starField.frustumCulled = false;

  return starField;
}

/**
 * Cria o efeito de túnel de velocidade linear
 * @param {number} count - Quantidade de estrelas no túnel
 * @param {number} radius - Raio máximo do túnel ao redor da nave.
 */
export function createSpeedParticles(count = 600, radius = 1000) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const randomOffsets = [];

  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);

    // Multiplicador interno aleatório para distribuir as estrelas ao longo do volume
    const r = radius * Math.pow(Math.random(), 0.5);

    positions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );

    // Um fator aleatório individual para cada estrela correr em velocidade ligeiramente diferente
    randomOffsets.push(Math.random());
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aRandom", new THREE.Float32BufferAttribute(randomOffsets, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uShipDirection: { value: new THREE.Vector3(0, 0, -1) },
      uSpeed: { value: 0.0 },          // 0.0 a 1.0
      uTime: { value: 0.0 },           // Tempo contínuo para mover as estrelas
      uBaseOpacity: { value: 0.3 },    // Visibilidade quando parado
      uPointSize: { value: 3.5 },      // Um pouco maiores para dar sensação de proximidade
      uRadius: { value: radius }
    },
    vertexShader: `
      uniform float uPointSize;
      uniform vec3 uShipDirection;
      uniform float uSpeed;
      uniform float uTime;
      uniform float uBaseOpacity;
      uniform float uRadius;

      attribute float aRandom;
      varying float vOpacity;

      void main() {
        vec3 pos = position;
        vec3 dir = normalize(uShipDirection);

        // FADE DE VELOCIDADE: 
        // Cria uma transição suave (0.0 a 1.0) conforme a velocidade sai de 0.0 e chega a 0.15
        float speedFade = smoothstep(0.0, 0.15, uSpeed);

        // MATEMÁTICA DO TÚNEL CONTÍNUO:
        float projection = dot(pos, dir);
        vec3 lateralComponent = pos - dir * projection;

        float speedMultiplier = 1500.0;
        float progress = mod(projection - uTime * speedMultiplier * (0.7 + aRandom * 0.6), uRadius * 2.0) - uRadius;

        pos = lateralComponent + dir * progress;

        // Controle direcional de intensidade
        float alignment = dot(normalize(pos), dir);
        float targetOpacity = uBaseOpacity;

        if (alignment > -0.2) {
          targetOpacity = mix(uBaseOpacity, 0.9, alignment * uSpeed);
        } else {
          targetOpacity = mix(uBaseOpacity, 0.0, (-alignment) * uSpeed);
        }

        // Aplica o fade de velocidade global nas partículas:
        // Se estiver abaixo de 0.15, vai ficando transparente de forma suave até sumir em 0.0
        vOpacity = targetOpacity * speedFade;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      varying float vOpacity;
      void main() {
        float dist = distance(gl_PointCoord, vec2(0.5));
        if (dist > 0.5) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, vOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true
  });

  const speedSphere = new THREE.Points(geometry, material);
  speedSphere.frustumCulled = false;

  return speedSphere;
}