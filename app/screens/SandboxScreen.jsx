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
import { createShip } from "@/components/Nave";
import useMovement from "@/components/Moviment";
import Joystick from "@/components/Joystick";

export default function SandboxScreen() {
  const glRef = useRef();
  const cameraRef = useRef();
  const shipRef = useRef();

  const { panHandlers, updateCamera, onWheel } = useCameraController(cameraRef, shipRef);
  const { updateShip, joystickDelta } = useMovement(shipRef);

  const onContextCreate = async (gl) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    // Renderer
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);

    // Cena
    const scene = new THREE.Scene();

    // Câmera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 10000);
    cameraRef.current = camera;

    // Luz
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Nave
    const ship = createShip(scene);
    shipRef.current = ship;
    ship.position.set(0, 0, 0);

    // Grupo do universo
    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    // Estrelas
    const stars = await createStars();
    universeGroup.add(stars);

    // Sóis
    const suns = await createSuns(5, 5000);
    universeGroup.add(suns);

    // Loop de animação
    const animate = () => {
      requestAnimationFrame(animate);

      updateShip();
      updateCamera();
      const shipDelta = ship.position.clone();
      ship.position.set(0, 0, 0);
      universeGroup.position.sub(shipDelta);

      suns.recycle(ship.position);
      stars.recycle(ship.position);
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
