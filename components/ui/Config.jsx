import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, ScrollView } from "react-native";
import Slider from "@react-native-community/slider";
import { getPlaylist, playTrack, getCurrentTrackIndex, setMusicVolume, getMusicVolume } from "@/components/controllers/AudioController";

export default function Config({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState("audio");
  const [volume, setVolume] = useState(getMusicVolume());
  const [volumeInput, setVolumeInput] = useState("50");
  const [playlist, setPlaylist] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (visible) {
      const vol = getMusicVolume();
      setVolume(vol);
      setVolumeInput(String(Math.round(vol * 100)));
      setPlaylist(getPlaylist());
      setCurrent(getCurrentTrackIndex());
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      const index = getCurrentTrackIndex();
      setCurrent((prev) => (prev !== index ? index : prev));
    }, 500);

    return () => clearInterval(interval);
  }, [visible]);

  const handleVolumeChange = async (value) => {
    setVolume(value);
    setVolumeInput(String(Math.round(value * 100)));
    await setMusicVolume(value);
  };

  const handleVolumeInput = async (text) => {
    setVolumeInput(text);
    const num = Math.min(100, Math.max(0, Number(text)));
    const normalized = num / 100;
    setVolume(normalized);
    await setMusicVolume(normalized);
  };

  const handlePlay = async (index) => {
    await playTrack(index);
    setCurrent(index);
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.trackItem,
        current === index && styles.activeTrack
      ]}
      onPress={() => handlePlay(index)}
    >
      <Text style={styles.trackText}>
        {current === index ? "▶ " : ""}{item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "geral":
        return (
          <>
            <Text style={styles.sectionTitle}>Geral</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Idioma</Text></TouchableOpacity>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Notificações</Text></TouchableOpacity>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Salvar Automático</Text></TouchableOpacity>
            </View>
          </>
        );
      case "audio":
        return (
          <>
            <Text style={styles.sectionTitle}>Áudio</Text>

            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>Volume</Text>

                <TextInput
                  style={styles.inputInline}
                  value={`${volumeInput}%`}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    const clean = text.replace("%", "");
                    handleVolumeInput(clean);
                  }}
                />
              </View>

              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor="#0ff"
                maximumTrackTintColor="#222"
                thumbTintColor="#0ff"
              />
            </View>

            <Text style={styles.sectionTitle}>Música</Text>

            <View style={styles.card}>
              <FlatList
                data={playlist}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                style={{ maxHeight: 200 }}
              />
            </View>
          </>
        );

      case "gameplay":
        return (
          <>
            <Text style={styles.sectionTitle}>Controles</Text>

            <View style={styles.card}>
              {[
                ["Mover ↑", "W"],
                ["Mover ↓", "S"],
                ["Mover ←", "A"],
                ["Mover →", "D"],
                ["Disparo", "SPACE"],
                ["Boost", "SHIFT"],
              ].map(([label, key]) => (
                <View style={styles.row} key={label}>
                  <Text style={styles.label}>{label}</Text>
                  <TouchableOpacity style={styles.keyButton}>
                    <Text style={styles.keyText}>{key}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Gameplay</Text>

            <View style={styles.card}>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Dificuldade</Text></TouchableOpacity>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Assistência de Mira</Text></TouchableOpacity>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>HUD Dinâmico</Text></TouchableOpacity>
            </View>
          </>
        );

      case "video":
        return (
          <>
            <Text style={styles.sectionTitle}>Vídeo</Text>

            <View style={styles.card}>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Resolução</Text></TouchableOpacity>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Modo Tela Cheia</Text></TouchableOpacity>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Qualidade Gráfica</Text></TouchableOpacity>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>VSync</Text></TouchableOpacity>
            </View>
          </>
        );

      case "outros":
        return (
          <>
            <Text style={styles.sectionTitle}>Outros</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Créditos</Text></TouchableOpacity>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Resetar Jogo</Text></TouchableOpacity>
              <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Logs do Sistema</Text></TouchableOpacity>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>

          <Text style={styles.title}>⚙️ CONFIGURAÇÕES</Text>

          {/* TABS */}
          <View style={styles.tabs}>
            {["geral", "gameplay", "audio", "video", "outros"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  activeTab === tab && styles.activeTabButton
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={styles.tabText}>{tab.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView>
            {renderTabContent()}
          </ScrollView>

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
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    width: "70%",
    maxHeight: "85%",
    backgroundColor: "#0a0a0a",
    borderRadius: 20,
    padding: 20,
    borderColor: "#0ff",
    borderWidth: 1,
  },

  title: {
    color: "#0ff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },

  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#111",
  },

  activeTabButton: {
    backgroundColor: "#0ff33",
  },

  tabText: {
    color: "#0ff",
    fontWeight: "bold",
  },

  sectionTitle: {
    color: "#0ff",
    fontSize: 18,
    marginTop: 15,
    marginBottom: 5,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#0ff22",
  },

  label: {
    color: "#0ff",
    marginBottom: 5,
  },

  inputInline: {
    backgroundColor: "#000",
    color: "#0ff",
    borderWidth: 1,
    borderColor: "#0ff",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    width: 60,
    textAlign: "center",
    fontWeight: "bold",
  },

  trackItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },

  activeTrack: {
    backgroundColor: "#0ff33",
    borderRadius: 6,
  },

  trackText: {
    color: "#0ff",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  keyButton: {
    backgroundColor: "#000",
    borderColor: "#0ff",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },

  keyText: {
    color: "#0ff",
    fontWeight: "bold",
  },

  button: {
    backgroundColor: "#0ff22",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },

  buttonText: {
    color: "#0ff",
    textAlign: "center",
  },

  closeButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#0ff",
    borderRadius: 10,
  },

  closeText: {
    textAlign: "center",
    color: "#000",
    fontWeight: "bold",
  },
});
