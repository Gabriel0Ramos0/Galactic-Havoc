import { Audio } from "expo-av";

let soundInstance = null;
let currentTrackIndex = 0;
let currentVolume = 0.5;

const playlist = [
  {
    id: 1,
    name: "Science",
    file: require("../assets/sounds/science.mp3"),
  },
  {
    id: 2,
    name: "Lost",
    file: require("../assets/sounds/Background.mp3"),
  },
  {
    id: 3,
    name: "Space Intro",
    file: require("../assets/sounds/SpaceIntro.mp3"),
  },
  {
    id: 4,
    name: "Stellar",
    file: require("../assets/sounds/stellar.mp3"),
  },
  {
    id: 5,
    name: "Rizzlas C18",
    file: require("../assets/sounds/rizzlas-c18.mp3"),
  },
  {
    id: 6,
    name: "Introfy",
    file: require("../assets/sounds/emocao.mp3"),
  },
  {
    id: 7,
    name: "Journey",
    file: require("../assets/sounds/journey.mp3"),
  },
];

export function getPlaylist() {
  return playlist;
}

export function getCurrentTrackIndex() {
  return currentTrackIndex;
}

export function getCurrentTrack() {
  return playlist[currentTrackIndex];
}

export async function playTrack(index, { skipStop = false } = {}) {
  try {
    if (soundInstance && !skipStop) {
      await soundInstance.stopAsync();
      await soundInstance.unloadAsync();
    }

    const track = playlist[index];
    if (!track) return;

    currentTrackIndex = index;

    const { sound } = await Audio.Sound.createAsync(track.file, {
      volume: currentVolume,
      isLooping: false,
    });

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish && !status.isLooping && !isTransitioning) {
        const next = getRandomTrackIndex();
        transitionToTrack(next);
      }
    });

    soundInstance = sound;
    await soundInstance.playAsync();
  } catch (e) {
    console.warn("Erro ao tocar música:", e);
  }
}

export async function stopMusic() {
  if (soundInstance) {
    await soundInstance.stopAsync();
    await soundInstance.unloadAsync();
    soundInstance = null;
  }
}

export async function nextTrack() {
  const next = (currentTrackIndex + 1) % playlist.length;
  await playTrack(next);
}

export async function prevTrack() {
  const prev =
    (currentTrackIndex - 1 + playlist.length) % playlist.length;
  await playTrack(prev);
}

export async function setMusicVolume(value) {
  currentVolume = value;
  if (soundInstance) {
    await soundInstance.setVolumeAsync(value);
  }
}

export function getMusicVolume() {
  return currentVolume;
}

let isTransitioning = false;

export async function transitionToTrack(index, fadeDuration = 1000) {
  if (isTransitioning) return;
  isTransitioning = true;

  try {
    // fade out atual
    if (soundInstance) {
      await fadeOutSound(soundInstance, fadeDuration);
      await soundInstance.unloadAsync();
      soundInstance = null;
    }

    // toca nova
    await playTrack(index, { skipStop: true });

    // fade in
    if (soundInstance) {
      await soundInstance.setVolumeAsync(0);

      const steps = 20;
      const stepTime = fadeDuration / steps;

      for (let i = 0; i < steps; i++) {
        await new Promise(r => setTimeout(r, stepTime));
        await soundInstance.setVolumeAsync(((i + 1) / steps) * currentVolume);
      }
    }

  } catch (e) {
    console.warn("Erro na transição:", e);
  }

  isTransitioning = false;
}

export function getRandomTrackIndex(excludeCurrent = true) {
  let index;
  do {
    index = Math.floor(Math.random() * playlist.length);
  } while (excludeCurrent && index === currentTrackIndex);

  return index;
}

let sfxLoaded = false;
const sfx = {};

export async function loadSfx() {
  if (sfxLoaded) return;

  sfx.tutorial_intro = new Audio.Sound();
  await sfx.tutorial_intro.loadAsync(
    require("../assets/sounds/tutorial_intro.mp3")
  );

  sfx.tutorial_alert = new Audio.Sound();
  await sfx.tutorial_alert.loadAsync(
    require("../assets/sounds/tutorial_alert.mp3")
  );

  sfx.tutorial_marker = new Audio.Sound();
  await sfx.tutorial_marker.loadAsync(
    require("../assets/sounds/tutorial_marker.mp3")
  );

  sfx.tutorial_combat = new Audio.Sound();
  await sfx.tutorial_combat.loadAsync(
    require("../assets/sounds/tutorial_combat.mp3")
  );

  sfx.fire = new Audio.Sound();
  await sfx.fire.loadAsync(
    require("../assets/sounds/fire.mp3")
  );

  sfx.explosion = new Audio.Sound();
  await sfx.explosion.loadAsync(
    require("../assets/sounds/explosionast.mp3")
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
    await sound.setVolumeAsync(currentVolume);
  } catch (e) { }
}
