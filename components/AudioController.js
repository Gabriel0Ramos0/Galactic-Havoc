import { createAudioPlayer } from "expo-audio";

let soundInstance = null;
let currentTrackIndex = 0;
let trackMonitor = null;
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
      try {
        if (typeof soundInstance.stop === "function") {
          soundInstance.stop();
        }

        if (typeof soundInstance.remove === "function") {
          soundInstance.remove();
        }

      } catch (e) {
        console.warn("Erro ao limpar som:", e);
      }

      soundInstance = null;
    }

    const track = playlist[index];
    if (!track) return;

    currentTrackIndex = index;

    const sound = createAudioPlayer(track.file);

    sound.volume = currentVolume;
    sound.loop = false;

    soundInstance = sound;
    sound.play();
    startTrackMonitor(sound);

  } catch (e) {
    console.warn("Erro ao tocar música:", e);
  }
}

export async function stopMusic() {
  if (soundInstance) {
    soundInstance.stop();
    soundInstance.remove();
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
    soundInstance.volume = value;
  }
}

export function getMusicVolume() {
  return currentVolume;
}

function startTrackMonitor(sound) {
  stopTrackMonitor();

  trackMonitor = setInterval(() => {
    try {
      const duration = sound.duration;
      const current = sound.currentTime;

      if (!duration || !current) return;

      if (duration - current < 0.3 && !isTransitioning) {
        const next = getRandomTrackIndex();
        transitionToTrack(next);
      }
    } catch (e) { }
  }, 300);
}

function stopTrackMonitor() {
  if (trackMonitor) {
    clearInterval(trackMonitor);
    trackMonitor = null;
  }
}

let isTransitioning = false;

export async function transitionToTrack(index, fadeDuration = 1000) {
  if (isTransitioning) return;
  isTransitioning = true;

  try {
    stopTrackMonitor();

    // fade out atual
    if (soundInstance) {
      await fadeOutSound(soundInstance, fadeDuration);
      soundInstance.remove();
      soundInstance = null;
    }

    // toca nova
    await playTrack(index, { skipStop: true });

    // fade in
    if (soundInstance) {
      soundInstance.volume = 0;

      const steps = 20;
      const stepTime = fadeDuration / steps;

      for (let i = 0; i < steps; i++) {
        await new Promise(r => setTimeout(r, stepTime));
        soundInstance.volume = ((i + 1) / steps) * currentVolume;
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

  const create = (file) => {
    const sound = createAudioPlayer(file);
    sound.volume = 1;
    sound.loop = false;
    return sound;
  };

  sfx.tutorial_intro = create(require("../assets/sounds/tutorial_intro.mp3"));
  sfx.tutorial_alert = create(require("../assets/sounds/tutorial_alert.mp3"));
  sfx.tutorial_marker = create(require("../assets/sounds/tutorial_marker.mp3"));
  sfx.tutorial_combat = create(require("../assets/sounds/tutorial_combat.mp3"));
  sfx.fire = create(require("../assets/sounds/fire.mp3"));
  sfx.explosion = create(require("../assets/sounds/explosionast.mp3"));
  sfx.marker_ping = create(require("../assets/sounds/marker_ping.mp3"));

  sfxLoaded = true;
}

export async function playSfx(name) {
  const sound = sfx[name];

  if (!sound) {
    console.warn("SFX não encontrado:", name);
    return;
  }

  try {
    sound.seekTo(0);
    sound.play();
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
    const steps = 20;
    const stepTime = duration / steps;
    let volume = sound.volume ?? 1;

    const delta = volume / steps;

    for (let i = 0; i < steps; i++) {
      volume -= delta;
      sound.volume = Math.max(volume, 0);
      await new Promise(r => setTimeout(r, stepTime));
    }

    sound.stop();
    sound.seekTo(0);
    sound.volume = currentVolume;

  } catch (e) { }
}
