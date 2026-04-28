// app/screens/SandboxScreen.jsx
import { useRef, useState, useEffect } from "react";
import { View, Platform } from "react-native";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import * as THREE from "three";
import styles from "./style";

import Hud from "@/components/Hud";
import useCameraController from "@/components/CameraController";
import { transitionToTrack, stopTutorialCombat, playSfx, loadSfx } from "@/components/AudioController";
import ChunkManager from "@/components/ChunkManager";
import createStars from "@/components/Star";
import spawnAsteroidDestruction from "@/components/effects/AsteroidDestruction";
import { createShip } from "@/components/Nave";
import useProjectiles from "@/components/Projectiles";
import useMovement from "@/components/Moviment";
import Joystick from "@/components/Joystick";
import Menu from "@/components/Menu";
import Config from "@/components/Config";
import TransitionController from "@/components/TransitionController";
import { setupShipLighting, animateShipStartup, animateShipShutdown } from "@/components/effects/lighting";
import { createThrusterEffect } from "@/components/effects/Thrusters";
import CutsceneScreen from "@/components/CutsceneScreen";
import History from "@/components/History";
import createBlueMarker from "@/components/BlueMarker";

// Game State Constants
const GameState = {
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
};

export default function SandboxScreen() {
  const glRef = useRef();
  const cameraRef = useRef();
  const audioUnlocked = useRef(false);
  const chunkManagerRef = useRef(null);
  const shipRef = useRef();
  const effectsRef = useRef([]);
  const debugMode = useRef(false);
  const debugObjects = useRef([]);
  const transitionRef = useRef();
  const [glReady, setGlReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [controls, setControls] = useState({
    movement: false,
    movementVertical: false,
    boost: false,
    shooting: false,
    inspect: false,
    inventory: false,
  });
  const controlsRef = useRef(controls);
  const [worldSeed, setWorldSeed] = useState(null);

  const { panHandlers, updateCamera, onWheel } = useCameraController(cameraRef, shipRef);
  const { updateShip, joystickDelta, resetMovementState, setPaused, canControl: canControlRef, speedship, velocity } = useMovement(shipRef, {
    controlsRef
  });

  const [maxHP, setMaxHP] = useState(500);
  const [shipHP, setShipHP] = useState(maxHP);
  const [energy, setEnergy] = useState(0);
  const lastShotTimeRef = useRef(0);
  const [isRecharging, setIsRecharging] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [canControl, setCanControl] = useState(true);
  const [currentScore, setCurrentScore] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });
  const [markerCoords, setMarkerCoords] = useState(null);
  const hudTimerRef = useRef(0);
  const markerTimerRef = useRef(0);
  const [menuVisible, setMenuVisible] = useState(true);
  const [configVisible, setConfigVisible] = useState(false);
  const [cutsceneVisible, setCutsceneVisible] = useState(true);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [gameState, setGameState] = useState(GameState.MENU);
  const gameStateRef = useRef(gameState);
  const [hasSession, setHasSession] = useState(false);
  const rafRef = useRef(null);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (menuVisible && audioUnlocked.current) {
      transitionToTrack(0);
    }
  }, [menuVisible]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "-") {
        debugMode.current = !debugMode.current;

        debugObjects.current.forEach(obj => {
          obj.visible = debugMode.current;
        });

        // Chunks
        chunkManagerRef.current?.setDebugVisible(debugMode.current);

        // Asteróides
        chunkManagerRef.current?.setCollisionDebugVisible(debugMode.current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setControls({
      movement: tutorialStep >= 4,
      movementVertical: tutorialStep >= 5,
      boost: tutorialStep >= 6,
      inspect: tutorialStep >= 9,
      inventory: tutorialStep >= 10,
      shooting: tutorialStep >= 12,
    });
  }, [tutorialStep]);

  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  const criticalRecoveryTriggeredRef = useRef(false);

  useEffect(() => {
    if (gameState !== GameState.PLAYING || isTransitioning) return;

    // entrou em crítico
    if (energy <= 0 && !isCritical) {
      setIsCritical(true);
      setCanControl(false);
      animateShipShutdown(shipLightsRef.current);
      criticalRecoveryTriggeredRef.current = false;
    }

    // começou a recarregar DURANTE crítico
    if (isRecharging && isCritical && !criticalRecoveryTriggeredRef.current) {
      criticalRecoveryTriggeredRef.current = true;

      playSfx("tutorial_intro");
      animateShipStartup(shipLightsRef.current);
    }

    // saiu do crítico
    if (energy >= 100 && isCritical) {
      setCanControl(true);
      setIsCritical(false);
    }

  }, [energy, isRecharging, isCritical]);

  useEffect(() => {
    canControlRef.current = canControl;
  }, [canControl]);

  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastShot = now - lastShotTimeRef.current;

      if (timeSinceLastShot < 3000) {
        setIsRecharging(false);
        return;
      };
      setIsRecharging(true);
      setEnergy((prev) => {
        if (prev >= 100) {
          setIsRecharging(false);
          return 100;
        };
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (tutorialStep === 8 && sceneRef.current && !blueMarkerRef.current) {
      createBlueMarker({
        scene: sceneRef.current,
        spread: 10000,
        minDistance: 5000,
      }).then(marker => {
        blueMarkerRef.current = marker;
      });
    }
  }, [tutorialStep]);

  useEffect(() => {
    (async () => {
      await loadSfx();
    })();
  }, []);

  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    switch (tutorialStep) {
      case 1:
        setIsCritical(true);
        setCanControl(false);
        criticalRecoveryTriggeredRef.current = false;
        break;

      case 3:// sequência START
        playSfx("tutorial_alert");
        break;

      case 4: // sequência DWAS
        playSfx("tutorial_alert");
        break;

      case 5:
      case 6: // Boost
        playSfx("tutorial_alert");
        break;

      case 8: // Marcador Azul
        playSfx("tutorial_marker");
        break;

      case 11: // piratas
        blueMarkerRef.current?.remove();
        blueMarkerRef.current = null;
        setMarkerCoords(null);
        transitionToTrack(null);
        playSfx("tutorial_combat");
        break;

      case 13:
        stopTutorialCombat();
        transitionToTrack(4);
        break;

      default:
        break;
    }
  }, [tutorialStep, gameState]);

  const sceneRef = useRef(null);
  const blueMarkerRef = useRef(null);
  const shipLightsRef = useRef(null);
  const thrusterEffectRef = useRef(null);
  const { updateProjectiles, projectiles, spawnProjectileParticles } = useProjectiles(shipRef, sceneRef, {
    energy,
    canControlRef,
    controlsRef,
    onConsumeEnergy: (amount) => {
      setEnergy(prev => Math.max(prev - amount, 0));
    },
    onShoot: () => {
      lastShotTimeRef.current = Date.now();
      playSfx("fire");
    },
    shipVelocityRef: velocity
  });

  const unlockAudio = async () => {
    if (audioUnlocked.current) return;
    audioUnlocked.current = true;

    await loadSfx();
    transitionToTrack(0);
  };

  const onContextCreate = async (gl) => {
    if (sceneRef.current) return;

    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    // Renderer
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);

    // Cena
    const scene = new THREE.Scene();

    // Câmera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 6000);
    camera.position.set(0, 10, 15);
    cameraRef.current = camera;

    // Nave
    const ship = await createShip(scene);
    shipRef.current = ship;
    ship.userData.velocity = new THREE.Vector3();

    // Efeito de Propulsão
    const thrusterEffect = createThrusterEffect(scene, shipRef);
    thrusterEffectRef.current = thrusterEffect;

    const shipBox = new THREE.Box3();
    const shipHelper = new THREE.Box3Helper(shipBox, 0x00ff00);

    shipHelper.visible = false;
    scene.add(shipHelper);

    debugObjects.current.push({
      mesh: ship,
      box: shipBox,
      helper: shipHelper,
      update() {
        this.box.setFromObject(this.mesh);
        this.helper.box.copy(this.box);
      }
    });

    const axesHelper = new THREE.AxesHelper(7);
    axesHelper.visible = false;
    scene.add(axesHelper);

    debugObjects.current.push({
      helper: axesHelper,
      update() {
        if (!ship) return;

        axesHelper.position.copy(ship.position);
        axesHelper.rotation.copy(ship.rotation);
      }
    });

    // Universo
    const delay = () => new Promise(res => setTimeout(res, 0));
    await delay();
    const stars = await createStars(3000, 2000);
    await delay();

    scene.add(stars);

    // Marcador Azul (Tutorial)
    sceneRef.current = scene;

    // Iluminação Nave
    const shipLights = setupShipLighting(scene, ship);
    shipLightsRef.current = shipLights;

    // Loop de animação
    const clock = new THREE.Clock();

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      if (gameStateRef.current === GameState.PLAYING) {

        updateShip();
        updateCamera();
        updateProjectiles(dt);

        // Atualiza velocidade da nave
        if (shipRef.current && velocity.current) {
          shipRef.current.userData.velocity = velocity.current;
        }

        // Atualiza efeito de propulsão
        if (thrusterEffectRef.current) {
          thrusterEffectRef.current.update(dt);
        }

        // Efeitos Visuais
        effectsRef.current = effectsRef.current.filter(effect => {
          if (!effect.userData.update) return false;

          effect.userData.update(dt);

          return effect.parent !== null;
        });

        // Atualiza chunks
        if (chunkManagerRef.current && shipRef.current) {
          chunkManagerRef.current.update(shipRef.current.position);
        }

        const scale = 0.01;
        hudTimerRef.current += dt;

        if (hudTimerRef.current > 0.2) {
          hudTimerRef.current = 0;

          setCoords({
            x: (ship.position.x * scale),
            y: (ship.position.y * scale),
            z: (ship.position.z * scale),
          });
        }

        stars.recycle(ship.position, 1500);
        debugObjects.current.forEach(obj => {
          if (obj.update) obj.update();

          if (obj.helper) {
            obj.helper.visible = debugMode.current;
          } else if (obj.visible !== undefined) {
            obj.visible = debugMode.current;
          }
        });

        if (chunkManagerRef.current && shipRef.current) {
          chunkManagerRef.current.checkAsteroidCollisions(
            shipRef.current.position,
            (damage) => {
              setShipHP(prev => Math.max(prev - damage, 0));
            },
            scene,
            ({ scene, position, normal, size }) => {
              const effect = spawnAsteroidDestruction(scene, position, normal, size);
              effectsRef.current.push(effect);
              playSfx("explosion");
              setCurrentScore(prev => prev + 10);
            }
          );
        }

        if (chunkManagerRef.current && projectiles.current) {
          chunkManagerRef.current.checkAsteroidProjectileCollisions(
            projectiles.current,
            scene,
            (scene, position) => spawnProjectileParticles(scene, position),
            ({ scene, position, normal, size }) => {
              const effect = spawnAsteroidDestruction(scene, position, normal, size);
              effectsRef.current.push(effect);
              playSfx("explosion");
              setCurrentScore(prev => prev + 10);
            }
          );
        }

        if (blueMarkerRef.current && blueMarkerRef.current.update) {
          blueMarkerRef.current.update(dt, ship.position);
          try {
            const world = blueMarkerRef.current.group.position;
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
      }
      if (!glReady) {
        setGlReady(true);
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();

    // Cleanup ao desmontar ou quando necessário
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  };

  // Handlers para cutscene fim / pular
  const handleCutsceneFinish = async () => {
    transitionRef.current.start(async () => {
      setCutsceneVisible(false);
      setPaused(true);
      setGameState(GameState.MENU);
      setMenuVisible(true);
    });
  };

  return (
    <View style={styles.container} {...panHandlers} onWheel={onWheel}>
      <TransitionController ref={transitionRef} />
      {/* CUTSCENE */}
      {cutsceneVisible && (
        <CutsceneScreen
          onFinish={() => {
            handleCutsceneFinish();
          }}
          glReady={glReady}
          onUnlockAudio={unlockAudio}
        />
      )}

      {/* MENU */}
      {!cutsceneVisible && menuVisible && (
        <Menu
          onStart={async ({ mode, seed }) => {

            if (mode === "continue") {
              setPaused(false);
              setGameState(GameState.PLAYING);
              setMenuVisible(false);
              return;
            }
            if (mode === "new") {
              resetMovementState();
              setPaused(false);
              setEnergy(0);
              setShipHP(maxHP);
              setIsCritical(false);
              setIsRecharging(false);
              criticalRecoveryTriggeredRef.current = false;
              setTutorialStep(0);
              setIsTransitioning(true);

              if (blueMarkerRef.current) {
                try {
                  blueMarkerRef.current?.remove();
                } catch (err) { }
                blueMarkerRef.current = null;
                setMarkerCoords(null);
              }

              const finalSeed = seed?.trim()
                ? seed
                : Math.floor(Math.random() * 999999999).toString();

              setWorldSeed(finalSeed);

              if (chunkManagerRef.current) {
                chunkManagerRef.current.dispose();
              }

              if (sceneRef.current) {
                chunkManagerRef.current = new ChunkManager(sceneRef.current, finalSeed);
              }

              setHasSession(true);

              await transitionRef.current.start(async () => {
                setMenuVisible(false);
                setGameState(GameState.PLAYING);
                await transitionToTrack(2);
                setIsTransitioning(false);
              });
            }
          }}
          hasSession={hasSession}
          onConfig={() => setConfigVisible(true)}
          onHistory={() => setHistoryVisible(true)}
          onCredits={() => console.log("Mostrar Créditos")}
          onExit={() => console.log("Sair do jogo")}
          onLogin={() => console.log("Abrir tela de Login")}
        />
      )}

      <GLView
        style={{
          flex: 1,
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: gameState === GameState.PLAYING ? 1 : 0,
          pointerEvents: gameState === GameState.PLAYING ? "auto" : "none",
        }}
        onContextCreate={onContextCreate}
        ref={glRef}
      />

      {/* JOGO (GLView + HUD) */}
      {!cutsceneVisible && !menuVisible && gameState === GameState.PLAYING && (
        <>
          <Hud
            shipHP={shipHP}
            maxHP={maxHP}
            energy={energy}
            isRecharging={isRecharging}
            score={currentScore}
            coords={coords}
            speed={speedship}
            onMenuPress={async () => {
              setPaused(true);
              setIsTransitioning(true);

              transitionRef.current.start(async () => {
                setMenuVisible(true);
                setGameState(GameState.MENU);
                await transitionToTrack(0);
                setIsTransitioning(false);
              });
            }}
            setTutorialStep={setTutorialStep}
            initialTutorialStep={tutorialStep}
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
