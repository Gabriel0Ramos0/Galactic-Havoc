// app/screens/SandboxScreen.jsx
import React, { useRef, useState, useEffect } from "react";
import { View, Platform } from "react-native";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import * as THREE from "three";
import styles from "./style";

import Hud from "@/components/Hud";
import useCameraController from "@/components/CameraController";
import {
  startMenuMusic,
  stopMenuMusic,
  startGameMusic,
  stopGameMusic,
  setMusicVolume,
  getMusicVolume
} from "@/components/AudioController";
import createStars from "@/components/Star";
import createSuns from "@/components/Sun";
import createAsteroids from "@/components/Asteroids";
import { createShip } from "@/components/Nave";
import useMovement from "@/components/Moviment";
import Joystick from "@/components/Joystick";
import Menu from "@/components/Menu";
import Config from "@/components/Config";
import { setupShipLighting } from "@/components/lighting";
import CutsceneScreen from "@/components/CutsceneScreen";
import History from "@/components/History";

export default function SandboxScreen() {
  const glRef = useRef();
  const cameraRef = useRef();
  const shipRef = useRef();

  const { panHandlers, updateCamera, onWheel } = useCameraController(cameraRef, shipRef);
  const { updateShip, joystickDelta, resetMovementState, setPaused } = useMovement(shipRef);

  const [currentHP] = useState(100);
  const [currentScore] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });
  const [menuVisible, setMenuVisible] = useState(true);
  const [configVisible, setConfigVisible] = useState(false);
  const [cutsceneVisible, setCutsceneVisible] = useState(true);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [inGame, setInGame] = useState(false);

  // Controla a música do menu
  useEffect(() => {
    if (menuVisible) {
      startMenuMusic();
    } else {
      stopMenuMusic();
    }
  }, [menuVisible]);


  const view = 2000; // tamanho do cubo de visão

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

    // Nave
    const ship = createShip(scene);
    shipRef.current = ship;
    ship.position.set(0, 0, 0);

    // Universo
    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    // Estrelas
    const stars = await createStars();
    stars.children.forEach(s => s.frustumCulled = false);
    universeGroup.add(stars);

    // Sóis
    const suns = await createSuns(3, view);
    suns.children.forEach(s => s.frustumCulled = false);
    universeGroup.add(suns);

    // Asteroides
    const asteroids = await createAsteroids({ count: 300, spread: 8000 });
    universeGroup.add(asteroids);

    // Iluminação Nave
    setupShipLighting(scene, ship);

    // Loop de animação
    const animate = () => {
      requestAnimationFrame(animate);

      updateShip();
      updateCamera();
      const shipDelta = ship.position.clone();
      ship.position.set(0, 0, 0);
      universeGroup.position.sub(shipDelta);

      const scale = 0.01; // 100 unidades espaciais = 1 no HUD
      setCoords({
        x: (-universeGroup.position.x * scale),
        y: (-universeGroup.position.y * scale),
        z: (-universeGroup.position.z * scale),
      });

      stars.recycle(ship.position, universeGroup.position, 900);
      suns.recycle(ship.position, universeGroup.position, 1500);
      asteroids.recycle(ship.position, universeGroup.position, 3000, 1200);
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  // Handlers para cutscene fim / pular
  const handleCutsceneFinish = async () => {
    setCutsceneVisible(false);
    setMenuVisible(true);
    setInGame(false);
  };

  return (
    <View style={styles.container} {...panHandlers} onWheel={onWheel}>
      {/* CUTSCENE */}
      {cutsceneVisible && (
        <CutsceneScreen
          onFinish={() => {
            handleCutsceneFinish();
          }}
        />
      )}

      {/* MENU */}
      {!cutsceneVisible && menuVisible && (
        <Menu
          onStart={async () => {
            resetMovementState();
            setPaused(false);
            await stopMenuMusic();
            await startGameMusic();
            setMenuVisible(false);
            setInGame(true);
          }}
          onConfig={() => setConfigVisible(true)}
          onHistory={() => setHistoryVisible(true)}
          onCredits={() => console.log("Mostrar Créditos")}
          onExit={() => console.log("Sair do jogo")}
          onLogin={() => console.log("Abrir tela de Login")}
        />
      )}

      {/* JOGO (GLView + HUD) */}
      {!cutsceneVisible && !menuVisible && inGame && (
        <>
          <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} ref={glRef} />
          <Hud
            shipHP={currentHP}
            score={currentScore}
            coords={coords}
            onMenuPress={async () => {
              setPaused(true);
              resetMovementState();
              setMenuVisible(true);
              setInGame(false);
              await stopGameMusic();
            }}
          />
          {Platform.OS !== "web" && (
            <Joystick
              onMove={(delta) => {
                joystickDelta.current = delta;
              }}
            />
          )}
        </>
      )}
      <Config visible={configVisible} onClose={() => setConfigVisible(false)} />
      <History visible={historyVisible} onClose={() => setHistoryVisible(false)} />
    </View>
  );
}
