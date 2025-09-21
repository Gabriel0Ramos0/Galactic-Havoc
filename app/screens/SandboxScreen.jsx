// app/screens/SandboxScreen.jsx
import React, { useRef, useEffect } from "react";
import { View, StyleSheet, PanResponder } from "react-native";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import * as THREE from "three";

export default function SandboxScreen() {
  const glRef = useRef();
  const cameraRef = useRef();
  const shipRef = useRef();
  const orbit = useRef({ theta: 0, phi: Math.PI / 4, radius: 6 });
  const isDragging = useRef(false);
  const lastTouch = useRef({ x: 0, y: 0 });

  // PanResponder para arrastar e girar a câmera
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isDragging.current = true;
        lastTouch.current = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };
      },
      onPanResponderMove: (evt) => {
        if (!isDragging.current) return;
        const dx = evt.nativeEvent.locationX - lastTouch.current.x;
        const dy = evt.nativeEvent.locationY - lastTouch.current.y;
        orbit.current.theta += dx * 0.005; // sensibilidade horizontal
        orbit.current.phi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, orbit.current.phi - dy * 0.005)
        );
        lastTouch.current = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
      },
    })
  ).current;

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

    /// Estrelas
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
      'position',
      new THREE.Float32BufferAttribute(starVertices, 3)
    );

    let starMaterial;
    if (Platform.OS === 'web') {
      // Textura funciona no web
      const asset = Asset.fromModule(require('../assets/textures/circle.png'));
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
      // Mobile: usar cor sólida
      starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        transparent: true,
        alphaTest: 0.5,
      });
    }

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Nave (cone)
    const shipGeometry = new THREE.ConeGeometry(0.5, 1, 16);
    const shipMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffcc });
    const ship = new THREE.Mesh(shipGeometry, shipMaterial);
    ship.rotation.x = Math.PI / 2;
    ship.position.set(0, -0.1, 0);
    scene.add(ship);
    shipRef.current = ship;

    const velocity = new THREE.Vector3(0, 0, -0.1); // velocidade da nave

    // Animação
    const animate = () => {
      requestAnimationFrame(animate);

      // Movimento da nave
      ship.position.add(velocity);

      // Atualiza posição da câmera ao redor da nave
      const target = ship.position;
      const { theta, phi, radius } = orbit.current;
      const x = target.x + radius * Math.sin(phi) * Math.cos(theta);
      const y = target.y + radius * Math.cos(phi);
      const z = target.z + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.set(x, y, z);
      camera.lookAt(target);

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <GLView
        style={{ flex: 1 }}
        onContextCreate={onContextCreate}
        ref={glRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
});
