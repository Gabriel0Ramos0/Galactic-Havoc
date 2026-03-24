import * as THREE from "three";
import { useEffect, useRef } from "react";

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

    const speed = 0.02;
    const warpMultiplier = 3;
    const friction = 0.995;

    const baseMaxSpeed = 2.5;
    const warpMaxSpeed = 5;
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
        const targetMaxSpeed = isWarp ? warpMaxSpeed : baseMaxSpeed;

        currentMaxSpeed.current +=
            (targetMaxSpeed - currentMaxSpeed.current) * speedLerpFactor;

        const forward = new THREE.Vector3(0, 1, 0).applyQuaternion(shipRef.current.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(shipRef.current.quaternion);
        const inputDir = new THREE.Vector3();

        let isTurning = false;

        if (canControl.current) {
            if (keys.current.w) inputDir.add(forward);

            if (keys.current.s) {
                velocity.current.multiplyScalar(0.98);
            }

            if (keys.current.a) {
                inputDir.add(right.clone().negate());
                isTurning = true;
            }

            if (keys.current.d) {
                inputDir.add(right);
                isTurning = true;
            }

            if (keys.current.ArrowUp) {
                inputDir.y += 1;
                isTurning = true;
            }

            if (keys.current.ArrowDown) {
                inputDir.y -= 1;
                isTurning = true;
            }
        }

        // joystick
        if (joystickDelta.current.x !== 0 || joystickDelta.current.y !== 0 || joystickDelta.current.yUpDown !== 0) {
            isTurning = true;
        }

        inputDir.add(forward.clone().multiplyScalar(joystickDelta.current.y));
        inputDir.add(right.clone().multiplyScalar(joystickDelta.current.x));
        inputDir.y += joystickDelta.current.yUpDown;

        if (inputDir.lengthSq() > 0) {
            inputDir.normalize();
            acceleration.current.add(inputDir.multiplyScalar(thrust));
        }

        // Atualiza velocidade
        velocity.current.add(acceleration.current);

        // curva da nave
        const turnAssist = 0.05;
        const forwardDir = new THREE.Vector3(0, 1, 0)
            .applyQuaternion(shipRef.current.quaternion);

        const desiredVelocity = forwardDir.clone().multiplyScalar(velocity.current.length());

        velocity.current.lerp(desiredVelocity, turnAssist);

        // Leve desaceleração ao virar
        if (isTurning) {
            velocity.current.multiplyScalar(0.990);
        }

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

            // bank bonito
            const velDir = velocity.current.clone().normalize();
            const forwardDir2 = new THREE.Vector3(0, 1, 0).applyQuaternion(shipRef.current.quaternion);
            const cross = new THREE.Vector3().crossVectors(forwardDir2, velDir);
            const sideForce = cross.z;

            const maxBankAngle = Math.PI / 6;
            const bank = -sideForce * maxBankAngle;

            dummy.rotateZ(bank);

            targetQuaternion.current.copy(dummy.quaternion);

            const speedFactor = velocity.current.length() / currentMaxSpeed.current;
            const rotationSpeed = 0.05 + (speedFactor * 0.45);

            shipRef.current.quaternion.slerp(
                targetQuaternion.current,
                rotationSpeed
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