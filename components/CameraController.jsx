import { useRef } from "react";
import { PanResponder, Platform } from "react-native";
import * as THREE from "three";

export default function useCameraController(cameraRef, shipRef) {
  const orbit = useRef({ theta: Math.PI, phi: Math.PI / 8, radius: 15 });
  const isDragging = useRef(false);
  const lastTouch = useRef({ x: 0, y: 0 });
  const pinchDistance = useRef(null);
  const tempVec1 = useRef(new THREE.Vector3());
  const tempVec2 = useRef(new THREE.Vector3());
  const tempVec3 = useRef(new THREE.Vector3());
  const currentDirection = useRef(new THREE.Vector3(0, 1, 0));

  const applyZoom = (delta) => {
    orbit.current.radius = THREE.MathUtils.clamp(
      orbit.current.radius + delta,
      2,
      50
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          const [a, b] = evt.nativeEvent.touches;
          const dx = a.pageX - b.pageX;
          const dy = a.pageY - b.pageY;
          pinchDistance.current = dx * dx + dy * dy;
        } else {
          isDragging.current = true;
          lastTouch.current = {
            x: evt.nativeEvent.locationX,
            y: evt.nativeEvent.locationY,
          };
        }
      },
      onPanResponderMove: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          const [a, b] = evt.nativeEvent.touches;
          const dx = a.pageX - b.pageX;
          const dy = a.pageY - b.pageY;
          const distSq = dx * dx + dy * dy;

          if (pinchDistance.current) {
            applyZoom((pinchDistance.current - distSq) * 0.01);
          }

          pinchDistance.current = distSq;
          return;
        }

        if (!isDragging.current) return;
        const dx = evt.nativeEvent.locationX - lastTouch.current.x;
        const dy = evt.nativeEvent.locationY - lastTouch.current.y;

        orbit.current.theta += dx * 0.01;
        orbit.current.phi = THREE.MathUtils.clamp(
          orbit.current.phi - dy * 0.01,
          0.05,
          Math.PI - 0.01
        );

        lastTouch.current = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };
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

    const velocity =
      shipRef.current.userData.velocity || tempVec3.current.set(0, 0, 0);

    // Previsão de movimento
    const target = tempVec1.current
      .copy(shipRef.current.position)
      .addScaledVector(velocity, 0.5);

    let desiredPos;

    if (isDragging.current) {
      // ORBITAL — SEM SUAVIDADE
      const { radius, theta, phi } = orbit.current;

      desiredPos = tempVec2.current.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      ).add(target);

      cameraRef.current.position.copy(desiredPos);
    } else {
      const desiredDirection = tempVec2.current
        .set(0, 1, 0)
        .applyQuaternion(shipRef.current.quaternion)
        .normalize();

      currentDirection.current.lerp(desiredDirection, 0.08);

      const offset = tempVec3.current
        .copy(currentDirection.current)
        .multiplyScalar(orbit.current.radius);

      desiredPos = tempVec2.current.copy(target).sub(offset);
      desiredPos.y += orbit.current.radius * 0.25;

      const dist = cameraRef.current.position.distanceTo(desiredPos);
      const smooth = THREE.MathUtils.clamp(dist * 0.05, 0.05, 0.2);

      cameraRef.current.position.lerp(desiredPos, smooth);
    }

    cameraRef.current.lookAt(target);
  };

  return { panHandlers: panResponder.panHandlers, onWheel, updateCamera };
}