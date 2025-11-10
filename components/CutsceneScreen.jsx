// components/CutsceneScreen.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { Video } from "expo-av";

export default function CutsceneScreen({ onFinish }) {
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const videoRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current; // controla o fade

  // Quando vídeo estiver pronto e iniciado
  useEffect(() => {
    if (started && ready && videoRef.current) {
      console.log("🎬 Cutscene: vídeo pronto, iniciando reprodução...");

      // Fade-in suave
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      videoRef.current.playAsync().catch((e) => {
        console.warn("Erro ao tocar vídeo:", e);
        onFinish && onFinish();
      });
    }
  }, [started, ready]);

  const handleStart = () => {
    console.log("Cutscene: iniciar pressionado");
    setStarted(true);
  };

  const handleEnd = () => {
    console.log("🎬 Cutscene: vídeo terminou, aplicando fade-out...");
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => {
      onFinish && onFinish(); // chama o menu depois do fade
    });
  };

  const onStatusUpdate = (status) => {
    if (status.didJustFinish) {
      handleEnd();
    }
  };

  return (
    <View style={styles.container}>
      {!started ? (
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>Iniciar Jornada</Text>
        </TouchableOpacity>
      ) : (
        <Animated.View style={[styles.fadeContainer, { opacity: fadeAnim }]}>
          <Video
            ref={videoRef}
            source={require("../assets/videos/intro.mp4")}
            style={styles.video}
            resizeMode="contain"
            shouldPlay={false}
            onLoad={() => {
              console.log("Cutscene: vídeo carregado");
              setReady(true);
            }}
            onPlaybackStatusUpdate={onStatusUpdate}
          />
        </Animated.View>
      )}
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  fadeContainer: {
    width: width,
    height: height,
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "black",
  },
  button: {
    position: "absolute",
    zIndex: 2,
    backgroundColor: "rgba(20,20,20,0.8)",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0ff",
  },
  buttonText: {
    color: "#0ff",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
