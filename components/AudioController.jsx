import { Audio } from "expo-av";

let menuSound = null;
let gameSound = null;
let useNostalgia = false;
let currentVolume = 0.5;

export async function startMenuMusic() {
  if (menuSound) return;

  const file = useNostalgia
    ? require("../assets/sounds/Background.mp3")
    : require("../assets/sounds/science-documentary-169621.mp3");

  const { sound } = await Audio.Sound.createAsync(file, {
    volume: currentVolume,
    isLooping: true,
  });

  menuSound = sound;
  await menuSound.playAsync();
}

export async function stopMenuMusic() {
  if (menuSound) {
    await menuSound.stopAsync();
    await menuSound.unloadAsync();
    menuSound = null;
  }
}

export async function startGameMusic() {
  if (gameSound) return;
  const { sound } = await Audio.Sound.createAsync(
    require("../assets/sounds/SpaceIntro.mp3"),
    { volume: currentVolume, isLooping: true }
  );
  gameSound = sound;
  await gameSound.playAsync();
}

export async function stopGameMusic() {
  if (gameSound) {
    await gameSound.stopAsync();
    await gameSound.unloadAsync();
    gameSound = null;
  }
}

export async function setMusicVolume(value) {
  currentVolume = value;
  if (menuSound) await menuSound.setVolumeAsync(value);
  if (gameSound) await gameSound.setVolumeAsync(value);
}

export function setUseNostalgia(value) {
  useNostalgia = value;
}

export function getUseNostalgia() {
  return useNostalgia;
}

export function getMusicVolume() {
  return currentVolume;
}

let sfxLoaded = false;
const sfx = {};

export async function loadSfx() {
  if (sfxLoaded) return;

  sfx.tutorial_intro = new Audio.Sound();
  await sfx.tutorial_intro.loadAsync(
    require("@/assets/sounds/tutorial_intro.mp3")
  );

  sfx.tutorial_alert = new Audio.Sound();
  await sfx.tutorial_alert.loadAsync(
    require("@/assets/sounds/tutorial_alert.mp3")
  );

  sfx.tutorial_ok = new Audio.Sound();
  await sfx.tutorial_ok.loadAsync(
    require("@/assets/sounds/tutorial_alert.mp3")
  );

  sfx.tutorial_marker = new Audio.Sound();
  await sfx.tutorial_marker.loadAsync(
    require("@/assets/sounds/tutorial_marker.mp3")
  );

  sfx.tutorial_combat = new Audio.Sound();
  await sfx.tutorial_combat.loadAsync(
    require("@/assets/sounds/tutorial_combat.mp3")
  );

  sfxLoaded = true;
}

export async function playSfx(name) {
  const sound = sfx[name];

  if (!sound) {
    console.warn("SFX não encontrado:", name);
    return;
  }

  try {
    await sound.stopAsync();
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (e) {
    console.warn("Erro ao tocar SFX:", name, e);
  }
}

export async function stopTutorialCombat() {
  if (!sfx.tutorial_combat) return;

  await fadeOutSound(sfx.tutorial_combat, 1200);
}


async function fadeOutSound(sound, duration = 800) {
  try {
    const status = await sound.getStatusAsync();
    if (!status.isPlaying) return;

    const steps = 20;
    const stepTime = duration / steps;
    let volume = status.volume ?? 1;

    const delta = volume / steps;

    for (let i = 0; i < steps; i++) {
      volume -= delta;
      await sound.setVolumeAsync(Math.max(volume, 0));
      await new Promise(r => setTimeout(r, stepTime));
    }

    await sound.stopAsync();
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(1); // reset
  } catch (e) { }
}
