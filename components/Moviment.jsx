import * as THREE from "three";
import { useEffect, useRef } from "react";

export default function useMovement(shipRef) {
    const velocity = useRef(new THREE.Vector3(0, 0, 0));
    const acceleration = useRef(new THREE.Vector3(0, 0, 0));

    const keys = useRef({
        w: false,
        a: false,
        s: false,
        d: false,
        ArrowUp: false,
        ArrowDown: false,
    });

    const joystickDelta = useRef({ x: 0, y: 0, yUpDown: 0 });

    const speed = 0.02;
    const friction = 0.95;
    const rotationSmoothness = 0.1;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (keys.current.hasOwnProperty(e.key)) {
                keys.current[e.key] = true;
            }
        };
        const handleKeyUp = (e) => {
            if (keys.current.hasOwnProperty(e.key)) {
                keys.current[e.key] = false;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    const updateShip = () => {
        if (!shipRef.current) return;

        acceleration.current.set(0, 0, 0);

        const forward = new THREE.Vector3(0, 1, 0).applyQuaternion(shipRef.current.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(shipRef.current.quaternion);

        if (keys.current.w) acceleration.current.add(forward.clone().multiplyScalar(speed));
        if (keys.current.s) acceleration.current.add(forward.clone().multiplyScalar(-speed));
        if (keys.current.a) acceleration.current.add(right.clone().multiplyScalar(-speed));
        if (keys.current.d) acceleration.current.add(right.clone().multiplyScalar(speed));
        if (keys.current.ArrowUp) acceleration.current.y += speed;
        if (keys.current.ArrowDown) acceleration.current.y -= speed;

        // Joystick mobile
        acceleration.current.add(forward.clone().multiplyScalar(joystickDelta.current.y * speed));
        acceleration.current.add(right.clone().multiplyScalar(joystickDelta.current.x * speed));
        acceleration.current.y += joystickDelta.current.yUpDown * speed;

        velocity.current.add(acceleration.current);
        velocity.current.multiplyScalar(friction);

        shipRef.current.position.add(velocity.current);

        if (velocity.current.lengthSq() > 0.0001) {
            if (!keys.current.s) {
                const target = new THREE.Vector3().copy(shipRef.current.position).add(velocity.current);
                const targetQuaternion = new THREE.Quaternion();
                const dummy = new THREE.Object3D();
                dummy.position.copy(shipRef.current.position);
                dummy.lookAt(target);
                dummy.rotateX(Math.PI / 2);
                dummy.rotateY(Math.PI);
                targetQuaternion.copy(dummy.quaternion);
                shipRef.current.quaternion.slerp(targetQuaternion, rotationSmoothness);
            }
        }
    };
    return {
        updateShip,
        joystickDelta,
    };
}