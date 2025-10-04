// app/screens/SandboxScreen.jsx
import React, { useRef } from "react";
import { View, Platform } from "react-native";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import * as THREE from "three";
import styles from "./style";

import useCameraController from "@/components/CameraController";
import createStars from "@/components/Star";
import createSuns from "@/components/Sun";
import createAsteroids from "@/components/Asteroids";
import { createShip } from "@/components/Nave";
import useMovement from "@/components/Moviment";
import Joystick from "@/components/Joystick";
import { setupShipLighting } from "@/components/lighting";

export default function SandboxScreen() {
  const glRef = useRef();
  const cameraRef = useRef();
  const shipRef = useRef();

  const { panHandlers, updateCamera, onWheel } = useCameraController(cameraRef, shipRef);
  const { updateShip, joystickDelta } = useMovement(shipRef);

  const view = 2000; // tamanho do cubo de visão

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

    // Nave
    const ship = createShip(scene);
    shipRef.current = ship;
    ship.position.set(0, 0, 0);

    // Universo
    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    // Estrelas
    const stars = await createStars();
    stars.children.forEach(s => s.frustumCulled = false);
    universeGroup.add(stars);

    // Sóis
    const suns = await createSuns(3, view);
    suns.children.forEach(s => s.frustumCulled = false);
    universeGroup.add(suns);

    // Asteroides
    const asteroids = await createAsteroids({ count: 300, spread: 8000 });
    universeGroup.add(asteroids);

    // Iluminação Nave
    setupShipLighting(scene, ship);

    // Loop de animação
    const animate = () => {
      requestAnimationFrame(animate);

      updateShip();
      updateCamera();
      const shipDelta = ship.position.clone();
      ship.position.set(0, 0, 0);
      universeGroup.position.sub(shipDelta);

      stars.recycle(ship.position, universeGroup.position, 900);
      suns.recycle(ship.position, universeGroup.position, 1500);
      asteroids.recycle(ship.position, universeGroup.position, 3000, 1200);
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  return (
    <View style={styles.container} {...panHandlers} onWheel={onWheel}>
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} ref={glRef} />

      {Platform.OS !== "web" && (
        <Joystick
          onMove={(delta) => {
            joystickDelta.current = delta;
          }}
        />
      )}
    </View>
  );
}
