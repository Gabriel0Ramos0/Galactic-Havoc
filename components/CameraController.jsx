import { useRef } from "react";
import { PanResponder, Platform } from "react-native";
import * as THREE from "three";

export default function useCameraController(cameraRef, shipRef, velocityRef) {
  const orbit = useRef({ theta: Math.PI, phi: Math.PI / 8, radius: 6 });
  const isDragging = useRef(false);
  const lastTouch = useRef({ x: 0, y: 0 });
  const pinchDistance = useRef(null);

  const applyZoom = (delta) => {
    orbit.current.radius = Math.max(2, Math.min(50, orbit.current.radius + delta));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          const [a, b] = evt.nativeEvent.touches;
          const dx = a.pageX - b.pageX;
          const dy = a.pageY - b.pageY;
          pinchDistance.current = Math.sqrt(dx * dx + dy * dy);
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
          const newDistance = Math.sqrt(dx * dx + dy * dy);
          if (pinchDistance.current) applyZoom((pinchDistance.current - newDistance) * 0.01);
          pinchDistance.current = newDistance;
          return;
        }

        if (!isDragging.current) return;
        const dx = evt.nativeEvent.locationX - lastTouch.current.x;
        const dy = evt.nativeEvent.locationY - lastTouch.current.y;

        orbit.current.theta += dx * 0.005;
        orbit.current.phi = Math.max(0.05, Math.min(Math.PI / 2, orbit.current.phi - dy * 0.005));

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

  const lastDirection = useRef(new THREE.Vector3(0, 0, 1));

  const updateCamera = () => {
    if (!cameraRef.current || !shipRef.current) return;

    const target = shipRef.current.position.clone();
    const velocity = velocityRef?.current || new THREE.Vector3();

    const offsetDistance = orbit.current.radius;
    const offsetHeight = orbit.current.radius * 0.2;

    let desiredPos = new THREE.Vector3();

    if (velocity.length() > 0.001) {
      lastDirection.current.copy(velocity).normalize();
    }

    const back = lastDirection.current.clone().multiplyScalar(-offsetDistance);
    desiredPos.set(target.x + back.x, target.y + back.y + offsetHeight, target.z + back.z);

    // interpolação suave
    cameraRef.current.position.lerp(desiredPos, 0.1);
    cameraRef.current.lookAt(target);
  };

  return { panHandlers: panResponder.panHandlers, onWheel, updateCamera };
}