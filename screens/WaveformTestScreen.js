import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WaveformPlayer from '../components/WaveformPlayer';

const WaveformTestScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <WaveformPlayer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default WaveformTestScreen;
