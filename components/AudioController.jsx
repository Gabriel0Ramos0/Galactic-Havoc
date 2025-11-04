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
