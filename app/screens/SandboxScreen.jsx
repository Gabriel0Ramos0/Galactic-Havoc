// app/screens/SandboxScreen.jsx
import React, { useRef } from "react";
import { View, StyleSheet } from "react-native";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import { Asset } from "expo-asset";
import { Platform } from "react-native";
import * as THREE from "three";

import useCameraController from "@/components/CameraController";
import createStars from "@/components/Star";

export default function SandboxScreen() {
  const glRef = useRef();
  const cameraRef = useRef();
  const shipRef = useRef();

  const { panHandlers, updateCamera, onWheel } = useCameraController(cameraRef, shipRef);

  const onContextCreate = async (gl) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    // Renderer
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);

    // Cena
    const scene = new THREE.Scene();

    // Câmera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
    cameraRef.current = camera;

    // Luz
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Nave
    const shipGeometry = new THREE.ConeGeometry(0.5, 1, 16);
    const shipMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffcc });
    const ship = new THREE.Mesh(shipGeometry, shipMaterial);
    ship.rotation.x = Math.PI / 2;
    ship.position.set(0, -0.1, 0);
    scene.add(ship);
    shipRef.current = ship;

    const velocity = new THREE.Vector3(0, 0, +0.1);

    // Estrelas
    const stars = await createStars();
    scene.add(stars);

    // Loop de animação
    const animate = () => {
      requestAnimationFrame(animate);

      ship.position.add(velocity); // nave anda pra frente
      updateCamera();
      stars.recycle(ship.position);
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  return (
    <View style={styles.container} {...panHandlers} onWheel={onWheel}>
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} ref={glRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
});