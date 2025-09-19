import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import SandboxScreen from './screens/SandboxScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <SandboxScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
