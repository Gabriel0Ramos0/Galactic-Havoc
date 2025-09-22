// app/components/Star.jsx
import * as THREE from "three";
import { Asset } from "expo-asset";
import { Platform } from "react-native";

export default async function createStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 5000;
  const starVertices = [];

  for (let i = 0; i < starCount; i++) {
    starVertices.push(
      (Math.random() - 0.5) * 2000,
      (Math.random() - 0.5) * 2000,
      (Math.random() - 0.5) * 2000
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

  return stars;
}