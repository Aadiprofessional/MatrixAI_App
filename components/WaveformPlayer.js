import React, { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { AudioWaveform } from '@simform_solutions/react-native-audio-waveform';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const WaveformPlayer = ({ audioUri, duration, position, onSeek }) => {
  const waveformRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <GestureHandlerRootView style={styles.container}>
      <AudioWaveform
        ref={waveformRef}
        source={audioUri}
        waveFormStyle={styles.waveform}
        containerStyle={styles.waveformContainer}
        onProgress={({ currentTime }) => {
          if (onSeek) onSeek(currentTime);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        autoPlay={false}
        scrubEnabled={true}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 100,
  },
  waveform: {
    waveColor: '#007bff',
    scrubColor: '#d3e3ff',
  },
  waveformContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});

export default WaveformPlayer;
