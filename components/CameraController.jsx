// app/components/CameraController.jsx
import { useRef } from "react";
import { PanResponder, Platform } from "react-native";

export default function useCameraController(cameraRef, shipRef) {
  const orbit = useRef({ theta: 0, phi: Math.PI / 4, radius: 6 });
  const isDragging = useRef(false);
  const lastTouch = useRef({ x: 0, y: 0 });
  const pinchDistance = useRef(null); // para zoom por pinça no mobile

  // Atualiza o zoom (mantém limites)
  const applyZoom = (delta) => {
    orbit.current.radius = Math.max(
      2,
      Math.min(50, orbit.current.radius + delta)
    );
  };

  // PanResponder para drag e pinch
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          // iniciar pinça
          const [a, b] = evt.nativeEvent.touches;
          const dx = a.pageX - b.pageX;
          const dy = a.pageY - b.pageY;
          pinchDistance.current = Math.sqrt(dx * dx + dy * dy);
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
          // gesto de pinça → zoom
          const [a, b] = evt.nativeEvent.touches;
          const dx = a.pageX - b.pageX;
          const dy = a.pageY - b.pageY;
          const newDistance = Math.sqrt(dx * dx + dy * dy);

          if (pinchDistance.current) {
            const delta = (pinchDistance.current - newDistance) * 0.01;
            applyZoom(delta);
          }
          pinchDistance.current = newDistance;
          return;
        }

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
        pinchDistance.current = null;
      },
    })
  ).current;

  // Handler para scroll no Web
  const onWheel = (event) => {
    if (Platform.OS === "web") {
      const delta = event.deltaY * 0.01;
      applyZoom(delta);
    }
  };

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

  return { panHandlers: panResponder.panHandlers, onWheel, updateCamera };
}