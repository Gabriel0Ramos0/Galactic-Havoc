// app/screens/SandboxScreen.jsx
import { useRef, useState, useEffect } from "react";
import { View, Platform } from "react-native";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import * as THREE from "three";
import styles from "./style";

import Hud from "@/components/ui/Hud";
import useCameraController from "@/components/controllers/CameraController";
import { transitionToTrack, stopTutorialCombat, playSfx, loadSfx } from "@/components/controllers/AudioController";
import ChunkManager from "@/components/systems/ChunkManager";
import spawnAsteroidDestruction from "@/components/effects/AsteroidDestruction";
import { createShip } from "@/components/entities/Nave";
import useProjectiles from "@/components/systems/Projectiles";
import useMovement from "@/components/controllers/MovimentController";
import Joystick from "@/components/controllers/JoystickController";
import Menu from "@/components/ui/Menu";
import Config from "@/components/ui/Config";
import Credits from "@/components/ui/Credits";
import TransitionController from "@/components/controllers/TransitionController";
import { setupShipLighting, animateShipStartup, animateShipShutdown } from "@/components/effects/lighting";
import { createThrusterEffect } from "@/components/effects/Thrusters";
import CutsceneScreen from "@/components/ui/CutsceneScreen";
import History from "@/components/ui/History";
import createScrap from "@/components/systems/Scrap";
import createBlueMarker from "@/components/effects/BlueMarker";
import useInspection from "@/components/systems/useInspection";
import InventoryPanel from "@/components/ui/InventoryPanel";
import { transferLootToStorage, generateTutorialLoot, generateRandomLoot } from "@/components/controllers/ItemController";

const GameState = {
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
};

const TOTAL_STORAGE_SLOTS = 20;

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
  const [creditsVisible, setCreditsVisible] = useState(false);
  const [cutsceneVisible, setCutsceneVisible] = useState(true);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [gameState, setGameState] = useState(GameState.MENU);
  const gameStateRef = useRef(gameState);
  const [hasSession, setHasSession] = useState(false);
  const rafRef = useRef(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [lootPanelOpen, setLootPanelOpen] = useState(false);
  const [lootItems, setLootItems] = useState([]);
  const [isNearbyInteraction, setIsNearbyInteraction] = useState(false);
  const isFirstLootInteraction = useRef(true);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [storageSlots, setStorageSlots] = useState(() => {
    const slots = Array(TOTAL_STORAGE_SLOTS).fill(null);
    slots[0] = { id: "carbon_fragment", qty: 14 };
    slots[1] = { id: "iron_ore", qty: 6 };
    slots[2] = { id: "silicon_crystal", qty: 22 };
    return slots;
  });

  const [shipHardware, setShipHardware] = useState({
    "WPN-L": { slot: "WPN-L", allowedType: "WPN", id: null, durability: 0, active: false },
    "WPN-R": { slot: "WPN-R", allowedType: "WPN", id: "laser_vx", durability: 32, active: true },
    "POW-1": { slot: "POW-1", allowedType: "POW", id: "cell_alpha", durability: 94, active: true },
    "POW-2": { slot: "POW-2", allowedType: "POW", id: null, durability: 0, active: false },
    "NAV": { slot: "NAV", allowedType: "NAV", id: null, durability: 0, active: false },
    "WRP": { slot: "WRP", allowedType: "WRP", id: null, durability: 0, active: false },
    "THR": { slot: "THR", allowedType: "THR", id: "ion_thruster", durability: 78, active: true }
  });

  const handleTakeLootItem = (lootIndex) => {
    const result = transferLootToStorage(lootIndex, lootItems, storageSlots);
    if (result) {
      setLootItems(result.updatedLoot);
      setStorageSlots(result.updatedStorage);
      playSfx("tutorial_marker");
    }
  };

  const addLootItem = (item) => {
    setLootItems(prev => [...prev, item]);
  };

  const clearLootItems = () => {
    setLootItems([]);
  };

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
    const handleDebugKey = (e) => {
      if (e.key === "-") {
        debugMode.current = !debugMode.current;

        debugObjects.current.forEach(obj => {
          obj.visible = debugMode.current;
        });

        chunkManagerRef.current?.setDebugVisible(debugMode.current);
        chunkManagerRef.current?.setCollisionDebugVisible(debugMode.current);
      }
    };

    window.addEventListener("keydown", handleDebugKey);

    return () => {
      window.removeEventListener("keydown", handleDebugKey);
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

    if (energy <= 0 && !isCritical) {
      setIsCritical(true);
      setCanControl(false);
      animateShipShutdown(shipLightsRef.current);
      criticalRecoveryTriggeredRef.current = false;
    }

    if (isRecharging && isCritical && !criticalRecoveryTriggeredRef.current) {
      criticalRecoveryTriggeredRef.current = true;
      playSfx("tutorial_intro");
      animateShipStartup(shipLightsRef.current);
    }

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
      (async () => {
        const scrap = await createScrap({
          scene: sceneRef.current,
          position: new THREE.Vector3(300, 0, 500)
        });

        const marker = await createBlueMarker({
          scene: sceneRef.current,
          target: scrap.group
        });

        scrapRef.current = scrap;
        blueMarkerRef.current = marker;
      })();
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

      case 3:
        playSfx("tutorial_alert");
        break;

      case 4:
        playSfx("tutorial_alert");
        break;

      case 5:
      case 6:
        playSfx("tutorial_alert");
        break;

      case 8:
        playSfx("tutorial_marker");
        break;

      case 9:
        setMarkerCoords(null);
        break;

      case 12:
        setInventoryOpen(false);
        setLootPanelOpen(false);

        setTimeout(() => {

          const position = scrapRef.current?.group?.position?.clone();

          if (position) {
            const effect = spawnAsteroidDestruction(
              sceneRef.current,
              position,
              new THREE.Vector3(0, 1, 0),
              8
            );

            effectsRef.current.push(effect);
            playSfx("explosion");
          }

          blueMarkerRef.current?.remove();
          scrapRef.current?.remove();

          blueMarkerRef.current = null;
          scrapRef.current = null;

        }, 800);

        transitionToTrack(null);
        playSfx("tutorial_combat");

        break;

      case 14:
        stopTutorialCombat();
        transitionToTrack(4);
        break;

      default:
        break;
    }
  }, [tutorialStep, gameState]);

  const sceneRef = useRef(null);
  const blueMarkerRef = useRef(null);
  const scrapRef = useRef(null);
  const shipLightsRef = useRef(null);
  const thrusterEffectRef = useRef(null);

  useInspection({
    shipRef,
    blueMarkerRef,
    controls,
    gameState,
    lootPanelOpen,
    inventoryOpen,
    onNearbyChange: (isNearby) => {
      setIsNearbyInteraction(isNearby);
    },
    onOpenLootPanel: () => {
      if (controls.inspect) {
        if (isFirstLootInteraction.current) {
          setLootItems(generateTutorialLoot());
          isFirstLootInteraction.current = false;
        } else {
          setLootItems(generateRandomLoot());
        }

        setLootPanelOpen(true);
      }
    },
    onCloseLootPanel: () => setLootPanelOpen(false),
    onOpenInventory: () => {
      if (controls.inventory) {
        setInventoryOpen(true);
      }
    },
    onCloseInventory: () => setInventoryOpen(false),
  });

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
    transitionToTrack(8);
  };

  const onContextCreate = async (gl) => {
    if (sceneRef.current) return;

    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 6000);
    camera.position.set(0, 10, 15);
    cameraRef.current = camera;

    const ship = await createShip(scene);
    shipRef.current = ship;
    ship.userData.velocity = new THREE.Vector3();

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

    sceneRef.current = scene;

    const shipLights = setupShipLighting(scene, ship);
    shipLightsRef.current = shipLights;

    const clock = new THREE.Clock();

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      if (gameStateRef.current === GameState.PLAYING) {

        updateShip();
        updateCamera();
        updateProjectiles(dt);

        if (shipRef.current && velocity.current) {
          shipRef.current.userData.velocity = velocity.current;
        }

        if (thrusterEffectRef.current) {
          thrusterEffectRef.current.update(dt);
        }

        effectsRef.current = effectsRef.current.filter(effect => {
          if (!effect.userData.update) return false;
          effect.userData.update(dt);
          return effect.parent !== null;
        });

        if (chunkManagerRef.current && shipRef.current) {
          const shipVelocityVector = velocity.current || new THREE.Vector3();
          const actualSpeed = shipVelocityVector.length();
          const MAX_SHIP_SPEED = 5.0;
          const currentSpeedNormalized = Math.min(actualSpeed / MAX_SHIP_SPEED, 1.0);

          chunkManagerRef.current.update(
            shipRef.current.position,
            shipVelocityVector,
            currentSpeedNormalized,
            dt
          );
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

        if (scrapRef.current && scrapRef.current.update) {
          scrapRef.current.update(dt);
        }
      }
      if (!glReady) {
        setGlReady(true);
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  };

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
              isFirstLootInteraction.current = true;
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
          onCredits={() => setCreditsVisible(true)}
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
            lootItems={lootItems}
            setLootItems={setLootItems}
            lootPanelOpen={lootPanelOpen}
            onLootPanelClose={() => setLootPanelOpen(false)}
            isNearbyInteraction={isNearbyInteraction}
            onTakeLootItem={handleTakeLootItem}
          />

          {/* NOVO INVENTORY SYSTEM TOTALMENTE CONTROLADO */}
          <InventoryPanel
            isOpen={inventoryOpen}
            storageSlots={storageSlots}
            setStorageSlots={setStorageSlots}
            shipHardware={shipHardware}
            setShipHardware={setShipHardware}
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
      <Credits visible={creditsVisible} onClose={() => setCreditsVisible(false)} />
    </View>
  );
}