import * as THREE from "three";
import { useEffect, useRef, useState } from "react";

export default function useMovement(shipRef) {
    const velocity = useRef(new THREE.Vector3(0, 0, 0));
    const acceleration = useRef(new THREE.Vector3(0, 0, 0));
    const targetQuaternion = useRef(new THREE.Quaternion());

    const keys = useRef({
        w: false,
        a: false,
        s: false,
        d: false,
        ArrowUp: false,
        ArrowDown: false,
        Shift: false,
    });

    const joystickDelta = useRef({ x: 0, y: 0, yUpDown: 0 });

    const speed = 0.006;
    const warpMultiplier = 3;
    const friction = 0.995;
    const rotationSmoothness = 0.1;

    const baseMaxSpeed = 2.5;
    const warpMaxSpeed = 10;
    const currentMaxSpeed = useRef(baseMaxSpeed);
    const speedLerpFactor = 0.02;

    const paused = useRef(false);
    const setPaused = (v) => { paused.current = v; };
    const canControl = useRef(true);

    const resetMovementState = () => {
        velocity.current.set(0, 0, 0);
        acceleration.current.set(0, 0, 0);
        currentMaxSpeed.current = baseMaxSpeed;

        keys.current = {
            w: false,
            a: false,
            s: false,
            d: false,
            ArrowUp: false,
            ArrowDown: false,
            Shift: false,
        };

        joystickDelta.current = { x: 0, y: 0, yUpDown: 0 };
    };

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

        if (paused.current) return;

        acceleration.current.set(0, 0, 0);

        const isWarp = keys.current.Shift;
        const thrust = isWarp ? speed * warpMultiplier : speed;
        const strafe = thrust * 4;
        const vertical = thrust * 4;
        const targetMaxSpeed = isWarp ? warpMaxSpeed : baseMaxSpeed;

        currentMaxSpeed.current +=
            (targetMaxSpeed - currentMaxSpeed.current) * speedLerpFactor;

        const forward = new THREE.Vector3(0, 1, 0).applyQuaternion(shipRef.current.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(shipRef.current.quaternion);

        if (canControl.current) {
            // ======= CONTROLES =======
            if (keys.current.w) acceleration.current.add(forward.clone().multiplyScalar(thrust));
            if (keys.current.s) { velocity.current.multiplyScalar(0.98) };
            if (keys.current.a) acceleration.current.add(right.clone().multiplyScalar(-strafe));
            if (keys.current.d) acceleration.current.add(right.clone().multiplyScalar(strafe));
            if (keys.current.ArrowUp) acceleration.current.y += vertical;
            if (keys.current.ArrowDown) acceleration.current.y -= vertical;
        }

        // MOBILE (joystick)
        acceleration.current.add(forward.clone().multiplyScalar(joystickDelta.current.y * thrust));
        acceleration.current.add(right.clone().multiplyScalar(joystickDelta.current.x * strafe));
        acceleration.current.y += joystickDelta.current.yUpDown * vertical;

        // Atualiza velocidade
        velocity.current.add(acceleration.current);

        // Limite de velocidade
        if (velocity.current.length() > currentMaxSpeed.current) {
            velocity.current.setLength(currentMaxSpeed.current);
        }

        // Atrito
        velocity.current.multiplyScalar(friction);

        // Movimento da nave
        shipRef.current.position.add(velocity.current);

        // Ajuste de rotação baseado na direção atual
        if (velocity.current.lengthSq() > 0.0001) {
            const dir = velocity.current.clone().normalize();

            const dummy = new THREE.Object3D();
            dummy.position.copy(shipRef.current.position);
            const target = new THREE.Vector3().copy(shipRef.current.position).add(dir);
            dummy.lookAt(target);
            dummy.rotateX(Math.PI / 2);
            dummy.rotateY(Math.PI);

            targetQuaternion.current.copy(dummy.quaternion);

            shipRef.current.quaternion.slerp(
                targetQuaternion.current,
                0.05
            );
        }
    };

    return {
        updateShip,
        joystickDelta,
        resetMovementState,
        setPaused,
        canControl,
    };
}