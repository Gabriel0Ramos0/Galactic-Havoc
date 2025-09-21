// app/components/CameraController.js
import { PanResponder } from "react-native";
import * as THREE from "three";

export default function createCameraController(camera, target, radius = 6) {
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let theta = 0;
  let phi = Math.PI / 4;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      isDragging = true;
      lastX = evt.nativeEvent.locationX;
      lastY = evt.nativeEvent.locationY;
    },
    onPanResponderMove: (evt) => {
      if (!isDragging) return;
      const dx = evt.nativeEvent.locationX - lastX;
      const dy = evt.nativeEvent.locationY - lastY;

      theta -= dx * 0.01;
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - dy * 0.01));

      lastX = evt.nativeEvent.locationX;
      lastY = evt.nativeEvent.locationY;
    },
    onPanResponderRelease: () => {
      isDragging = false;
    },
  });

  function updateCamera() {
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    camera.position.set(target.x + x, target.y + y, target.z + z);
    camera.lookAt(target);
  }

  return { panHandlers: panResponder.panHandlers, updateCamera };
}
