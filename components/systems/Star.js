// app/components/Star.js
import * as THREE from "three";

/**
 * Cria um domo único de estrelas brancas para o plano de fundo distante.
 * Apenas pontinhos brancos simples para dar a sensação de universo expandido.
 * * @param {number} count - Quantidade total de estrelas no fundo.
 * @param {number} radius - O raio do domo ao redor da nave.
 */
export function createSpaceBackground(count = 2000, radius = 6000) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];

  for (let i = 0; i < count; i++) {
    // Distribuição esférica uniforme usando amostragem de Fibonacci ou coordenadas esféricas puras
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);

    // Coloca as estrelas exatamente na casca da esfera (ou com uma leve variação para profundidade)
    // Multiplicar por (0.9 + Math.random() * 0.1) dá uma leve profundidade sem criar camadas
    const currentRadius = radius * (0.95 + Math.random() * 0.05);

    positions.push(
      currentRadius * Math.sin(phi) * Math.cos(theta),
      currentRadius * Math.sin(phi) * Math.sin(theta),
      currentRadius * Math.cos(phi)
    );
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 1.5,          // Pontos pequenos e discretos
    color: 0xffffff,    // Apenas branco puro
    transparent: true,
    opacity: 0.8,       // Brilho bom, mas sem ofuscar
    depthWrite: false   // Garante que fique sempre ao fundo sem quebrar o z-index dos objetos do jogo
  });

  const starField = new THREE.Points(geometry, material);

  // Evita que o Three.js suma com as estrelas se a câmera virar de costas para a origem do objeto
  starField.frustumCulled = false;

  return starField;
}