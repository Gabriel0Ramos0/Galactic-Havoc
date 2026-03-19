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
  getMusicVolume,
  stopTutorialCombat,
  playSfx,
  loadSfx
} from "@/components/AudioController";
import { Audio } from "expo-av";
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
import createBlueMarker from "@/components/BlueMarker";

export default function SandboxScreen() {
  const glRef = useRef();
  const cameraRef = useRef();
  const shipRef = useRef();

  const { panHandlers, updateCamera, onWheel } = useCameraController(cameraRef, shipRef);
  const { updateShip, joystickDelta, resetMovementState, setPaused } = useMovement(shipRef);

  const [currentHP] = useState(100);
  const [currentScore] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });
  const [markerCoords, setMarkerCoords] = useState(null);
  const hudTimerRef = useRef(0);
  const markerTimerRef = useRef(0);
  const [menuVisible, setMenuVisible] = useState(true);
  const [configVisible, setConfigVisible] = useState(false);
  const [cutsceneVisible, setCutsceneVisible] = useState(true);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [inGame, setInGame] = useState(false);
  const rafRef = useRef(null);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Controla a música do menu
  useEffect(() => {
    if (menuVisible) {
      startMenuMusic();
    } else {
      stopMenuMusic();
    }
  }, [menuVisible]);

  useEffect(() => {
    return () => {
      if (glRef.current && typeof glRef.current._stopAnimation === "function") {
        glRef.current._stopAnimation();
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (tutorialStep === 8 && sceneRef.current && universeRef.current && !blueMarkerRef.current) {
      createBlueMarker({
        group: universeRef.current,
        spread: 10000,
        minDistance: 5000,
      }).then(marker => {
        blueMarkerRef.current = marker;
      });
    }
  }, [tutorialStep]);

  useEffect(() => {
    loadSfx();
  }, []);

  useEffect(() => {
    if (!inGame) return;

    switch (tutorialStep) {
      case 1:
        playSfx("tutorial_intro");
        break;

      case 3:
      case 4: // sequência DWAS
        playSfx("tutorial_alert");
        break;

      case 5:
      case 6:
        playSfx("tutorial_ok");
        break;

      case 8: // marcador aparece
        playSfx("tutorial_marker");
        break;

      case 11: // piratas
        blueMarkerRef.current?.remove();
        blueMarkerRef.current = null;
        setMarkerCoords(null);
        playSfx("tutorial_combat");
        stopGameMusic();
        break;

      case 13:
        stopTutorialCombat();
        startGameMusic();
        break;

      default:
        break;
    }
  }, [tutorialStep, inGame]);

  const view = 3000; // tamanho do cubo de visão

  const sceneRef = useRef(null);
  const universeRef = useRef(null);
  const blueMarkerRef = useRef(null);

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

    // Universo
    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    // Estrelas
    const stars = await createStars(7000, 2000);
    universeGroup.add(stars);

    // Sóis
    const suns = await createSuns(3, 6000);
    universeGroup.add(suns);

    // Asteroides
    const asteroids = await createAsteroids(200, 8000, 2, 20);
    universeGroup.add(asteroids);

    // Marcador Azul (Tutorial)
    sceneRef.current = scene;
    universeRef.current = universeGroup;

    // Iluminação Nave
    setupShipLighting(scene, ship);

    // Loop de animação
    let running = true;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!running) return;
      rafRef.current = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      updateShip();
      updateCamera();
      const shipDelta = ship.position.clone();
      ship.position.set(0, 0, 0);
      universeGroup.position.sub(shipDelta);

      const scale = 0.01;
      hudTimerRef.current += dt;

      if (hudTimerRef.current > 0.2) {
        hudTimerRef.current = 0;

        setCoords({
          x: (-universeGroup.position.x * scale),
          y: (-universeGroup.position.y * scale),
          z: (-universeGroup.position.z * scale),
        });
      }

      stars.recycle(ship.position, universeGroup.position, 900);
      suns.recycle(ship.position, universeGroup.position, 2500);

      asteroids.update(ship.position, universeGroup.position, dt);
      asteroids.recycle(ship.position, universeGroup.position, 3000, 1200);

      if (blueMarkerRef.current && blueMarkerRef.current.update) {
        blueMarkerRef.current.update(dt, universeGroup.position);
        try {
          const world = blueMarkerRef.current.basePosition;
          markerTimerRef.current += dt;

          if (markerTimerRef.current > 0.2) {
            markerTimerRef.current = 0;

            setMarkerCoords({
              x: world.x * 0.01,
              y: world.y * 0.01,
              z: world.z * 0.01,
            });
          }
        } catch { }
      }
      const VIEW_DISTANCE = 3000 * 3000;

      suns.children.forEach(sun => {
        const dx = sun.position.x + universeGroup.position.x - ship.position.x;
        const dy = sun.position.y + universeGroup.position.y - ship.position.y;
        const dz = sun.position.z + universeGroup.position.z - ship.position.z;

        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq > VIEW_DISTANCE) return;

        if (sun.userData.growing) {
          const target = 1;
          const speed = 0.004;

          sun.scale.x = THREE.MathUtils.lerp(sun.scale.x, target, speed);
          sun.scale.y = THREE.MathUtils.lerp(sun.scale.y, target, speed);
          sun.scale.z = THREE.MathUtils.lerp(sun.scale.z, target, speed);

          if (Math.abs(sun.scale.x - target) < 0.01) {
            sun.scale.set(1, 1, 1);
            sun.userData.growing = false;
          }
        }
      });
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();

    glRef.current = glRef.current || {};
    glRef.current._stopAnimation = () => {
      running = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
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
            if (blueMarkerRef.current) {
              try {
                universeRef.current.remove(blueMarkerRef.current.group);
              } catch (err) { }
              blueMarkerRef.current = null;
              setMarkerCoords(null);
            }
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
              if (glRef.current && typeof glRef.current._stopAnimation === "function") {
                glRef.current._stopAnimation();
              } else if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
              }
              if (blueMarkerRef.current) {
                try {
                  universeRef.current.remove(blueMarkerRef.current.group);
                } catch (err) { }
                blueMarkerRef.current = null;
                setMarkerCoords(null);
              }
              setMenuVisible(true);
              setInGame(false);
              await stopGameMusic();
            }}
            setTutorialStep={setTutorialStep}
            markerCoords={markerCoords}
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
