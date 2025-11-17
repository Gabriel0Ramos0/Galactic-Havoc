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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (started && ready && videoRef.current) {

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      videoRef.current.playAsync().catch((e) => {
        onFinish && onFinish();
      });
    }
  }, [started, ready]);

  const handleStart = () => {
    setStarted(true);
  };

  const handleEnd = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => {
      onFinish && onFinish();
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
    width: width,
    height: height,
    marginLeft: "40px",
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
