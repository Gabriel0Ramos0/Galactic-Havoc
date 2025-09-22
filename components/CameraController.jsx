import { useRef } from "react";
import { PanResponder } from "react-native";

export default function useCameraController(cameraRef, shipRef) {
  const orbit = useRef({ theta: 0, phi: Math.PI / 4, radius: 6 });
  const isDragging = useRef(false);
  const lastTouch = useRef({ x: 0, y: 0 });

  // PanResponder para girar a câmera
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

        orbit.current.theta += dx * 0.005; // Giroscópico
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

  // Atualização da posição da câmera
  const updateCamera = () => {
    if (!cameraRef.current || !shipRef.current) return;

    const target = shipRef.current.position;
    const { theta, phi, radius } = orbit.current;

    const x = target.x + radius * Math.sin(phi) * Math.cos(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.sin(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  };

  return { panHandlers: panResponder.panHandlers, updateCamera };
}