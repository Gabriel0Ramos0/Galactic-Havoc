// app/components/Star.jsx
import * as THREE from "three";
import { Asset } from "expo-asset";
import { Platform } from "react-native";

export default async function createStars(starCount = 5000, spread = 2000) {
  const starGeometry = new THREE.BufferGeometry();
  const starVertices = [];

  for (let i = 0; i < starCount; i++) {
    starVertices.push(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );
  }

  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starVertices, 3)
  );

  let starMaterial;

  if (Platform.OS === "web") {
    const asset = Asset.fromModule(require("@/assets/textures/circle.png"));
    await asset.downloadAsync();
    const starTexture = new THREE.TextureLoader().load(asset.localUri);

    starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      map: starTexture,
      transparent: true,
      alphaTest: 0.5,
    });
  } else {
    starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      alphaTest: 0.5,
    });
  }

  const stars = new THREE.Points(starGeometry, starMaterial);

  // Função de reciclagem: atualiza posições baseado na nave
  stars.recycle = (shipPosition, maxDistance = spread / 2) => {
    const positions = starGeometry.getAttribute("position");

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      const dx = x - shipPosition.x;
      const dy = y - shipPosition.y;
      const dz = z - shipPosition.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance > maxDistance) {
        // reposiciona a estrela à frente da nave
        positions.setXYZ(
          i,
          shipPosition.x + (Math.random() - 0.5) * spread,
          shipPosition.y + (Math.random() - 0.5) * spread,
          shipPosition.z + (Math.random() - 0.5) * spread
        );
      }
    }

    positions.needsUpdate = true;
  };

  return stars;
}