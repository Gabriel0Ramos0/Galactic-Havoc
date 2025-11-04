import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { setMusicVolume, getMusicVolume } from "@/components/AudioController";

export default function Config({ visible, onClose }) {
  const [volume, setVolume] = useState(getMusicVolume());

  useEffect(() => {
    setVolume(getMusicVolume());
  }, [visible]);

  const handleVolumeChange = async (value) => {
    setVolume(value);
    await setMusicVolume(value);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>⚙️ Configurações</Text>

          <View style={styles.option}>
            <Text style={styles.optionText}>🎵 Volume</Text>
            <Slider
              style={{ width: 200, height: 40 }}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor="#0ff"
              maximumTrackTintColor="#222"
              thumbTintColor="#0ff"
            />
            <Text style={styles.optionText}>{Math.round(volume * 100)}%</Text>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: 300,
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 20,
    borderColor: "#0ff",
    borderWidth: 1,
  },
  title: {
    color: "#0ff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  option: {
    paddingVertical: 10,
    alignItems: "center",
  },
  optionText: {
    color: "#0ff",
    fontSize: 18,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    backgroundColor: "#0ff",
    borderRadius: 8,
  },
  closeText: {
    textAlign: "center",
    color: "#000",
    fontWeight: "bold",
  },
});
