import { useRef } from "react";
import { PanResponder, Platform } from "react-native";
import * as THREE from "three";

export default function useCameraController(cameraRef, shipRef, velocityRef) {
  const orbit = useRef({ theta: Math.PI, phi: Math.PI / 8, radius: 15 });
  const isDragging = useRef(false);
  const lastTouch = useRef({ x: 0, y: 0 });
  const pinchDistance = useRef(null);
  const tempVec1 = useRef(new THREE.Vector3());
  const tempVec2 = useRef(new THREE.Vector3());
  const tempVec3 = useRef(new THREE.Vector3());

  const applyZoom = (delta) => {
    orbit.current.radius = Math.max(2, Math.min(50, orbit.current.radius + delta));
  };

  // Vetor de direção atual da câmera, suavizado
  const currentDirection = useRef(new THREE.Vector3(0, 1, 0));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          const [a, b] = evt.nativeEvent.touches;
          const dx = a.pageX - b.pageX;
          const dy = a.pageY - b.pageY;
          const distSq = dx * dx + dy * dy;
          pinchDistance.current = distSq;
        } else {
          isDragging.current = true;
          lastTouch.current = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
        }
      },
      onPanResponderMove: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          const [a, b] = evt.nativeEvent.touches;
          const dx = a.pageX - b.pageX;
          const dy = a.pageY - b.pageY;
          const distSq = dx * dx + dy * dy;
          if (pinchDistance.current) applyZoom((pinchDistance.current - distSq) * 0.01);
          pinchDistance.current = distSq;
          return;
        }

        if (!isDragging.current) return;
        const dx = evt.nativeEvent.locationX - lastTouch.current.x;
        const dy = evt.nativeEvent.locationY - lastTouch.current.y;

        orbit.current.theta += dx * 0.005;
        orbit.current.phi = Math.max(0.05, Math.min(Math.PI - 0.01, orbit.current.phi - dy * 0.005));

        lastTouch.current = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        pinchDistance.current = null;
      },
    })
  ).current;

  const onWheel = (event) => {
    if (Platform.OS === "web") {
      applyZoom(event.deltaY * 0.01);
    }
  };

  const updateCamera = () => {
    if (!cameraRef.current || !shipRef.current) return;

    const target = tempVec1.current.copy(shipRef.current.position);

    let desiredPos;

    if (isDragging.current) {
      const x = orbit.current.radius * Math.sin(orbit.current.phi) * Math.sin(orbit.current.theta);
      const y = orbit.current.radius * Math.cos(orbit.current.phi);
      const z = orbit.current.radius * Math.sin(orbit.current.phi) * Math.cos(orbit.current.theta);

      desiredPos = tempVec2.current.set(x, y, z).add(target);

    } else {
      const desiredDirection = tempVec2.current
        .set(0, 1, 0)
        .applyQuaternion(shipRef.current.quaternion)
        .normalize();

      currentDirection.current.lerp(desiredDirection, 0.05);

      const offset = tempVec3.current
        .copy(currentDirection.current)
        .multiplyScalar(orbit.current.radius);

      desiredPos = tempVec2.current.copy(target).sub(offset);
      desiredPos.y += orbit.current.radius * 0.3;
    }
    cameraRef.current.position.lerp(desiredPos, 0.05);
    cameraRef.current.lookAt(target);
  };

  return { panHandlers: panResponder.panHandlers, onWheel, updateCamera };
}