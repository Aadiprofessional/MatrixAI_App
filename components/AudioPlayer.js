import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import Sound from 'react-native-sound';
import { useAuth } from '../context/AuthContext';

const AudioPlayer = ({ url, transcript = [], onProgress, scrollY }) => {
  const { uid, loading } = useAuth();
  const safeScrollY = scrollY ?? 0;
  console.log('AudioPlayer scrollY:', scrollY, 'safeScrollY:', safeScrollY);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [waveformData, setWaveformData] = useState(Array(100).fill(50));
  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef(null);

  const playerHeight = Math.max(200 - safeScrollY, 150); // Adjust height dynamically based on scrollY
  const controlsOpacity = safeScrollY > 100 ? 0 : 1; // Hide controls when scrolled down

  useEffect(() => {
    const audioUrl = url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    try {
      const player = new Sound(audioUrl, null, (error) => {
        if (error) {
          console.error('Failed to load sound:', error);
          setIsLoading(false);
          return;
        }

        setDuration(player.getDuration());
        setIsLoading(false);
        playerRef.current = player;

        // Generate initial waveform data
        const initialWaveform = Array(100).fill(5).map(() => Math.random() * 50 + 50);
        setWaveformData(initialWaveform);
      });

      return () => {
        if (playerRef.current) {
          playerRef.current.release();
          playerRef.current = null;
        }
      };
    } catch (error) {
      console.error('Player initialization error:', error);
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    let timeInterval = null;
    let animationInterval = null;

    if (isPlaying && playerRef.current) {
      timeInterval = setInterval(() => {
        if (playerRef.current) {
          playerRef.current.getCurrentTime((currentTime) => {
            setPosition(currentTime);
            if (onProgress) {
              onProgress({
                currentTime,
                duration,
              });
            }

            const progress = currentTime / duration;
            const baseLevel = Math.sin(progress * Math.PI * 2) * 50 + 50;
            const newLevel = baseLevel + (Math.random() * 10 - 5);
            setWaveformData((prev) => {
              const newData = [...prev, newLevel];
              return newData.length > 100 ? newData.slice(-100) : newData;
            });
          });
        }
      }, 100);
    }

    return () => {
      clearInterval(timeInterval);
      clearInterval(animationInterval);
    };
  }, [isPlaying, onProgress, duration]);

  const seek = (seconds) => {
    if (playerRef.current) {
      playerRef.current.getCurrentTime((currentTime) => {
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
        playerRef.current.setCurrentTime(newTime);
        setPosition(newTime);
      });
    }
  };

  const togglePlayback = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play((success) => {
          if (!success) {
            console.error('Playback failed');
          }
        });
      }
      setIsPlaying(!isPlaying);
    }
  };
console.log(scrollY);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={[styles.container, { height: playerHeight }]}>
      <View style={styles.waveformBox}>
        <View style={[styles.waveformContainer, { height: Math.max(150, 200 - safeScrollY) }]}>
          {console.log('Waveform container height:', Math.max(150, 200 - safeScrollY))}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading waveform...</Text>
            </View>
          ) : (
            <View style={styles.waveform}>
              {waveformData.map((value, index) => {
                const progress = position / duration;
                const isPlayed = index / waveformData.length < progress;
                const barHeight = Math.max(80, 180 - safeScrollY * 0.8);
                console.log('Waveform bar height:', barHeight, 'scrollY:', safeScrollY);
                return (
                  <View
                    key={index}
                    style={[
                      styles.waveformBar,
                      { 
                        height: Math.max(80, 180 - safeScrollY * 0.8),
                        backgroundColor: isPlayed ? '#007bff' : '#e0e0e0',
                        transform: [
                          { 
                            scaleY: Math.max(0.8, (value / 100) * (1 - (safeScrollY / 300)))
                          }
                        ]
                      }
                    ]}
                  />
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, styles.leftTime]}>{formatTime(position)}</Text>
        <Text style={[styles.timeText, styles.rightTime]}>{formatTime(duration)}</Text>
      </View>

      <View style={[styles.controls, { opacity: controlsOpacity }]}>
        <TouchableOpacity onPress={() => seek(-5)}>
          <Image
            source={require('../assets/backward.png')}
            style={styles.navIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={togglePlayback}>
          <Image
            source={isPlaying ? require('../assets/pause.png') : require('../assets/play.png')}
            style={styles.playIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => seek(5)}>
          <Image
            source={require('../assets/forward.png')}
            style={styles.navIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.transcriptContainer}>
        {transcript.map((item, index) => (
          <Text key={index} style={styles.transcriptText}>
            {item.text}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 10,
  },
  waveformContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    paddingVertical: 10,
    minHeight: 80,
  },
  waveformBox: {
    backgroundColor: '#ffffff',
  },
  timeContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  leftTime: {
    textAlign: 'left',
    flex: 1,
  },
  rightTime: {
    textAlign: 'right',
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 10,
  },
  icon: {
    width: 30,
    height: 30,
    tintColor: '#007bff',
  },
  progressContainer: {
    marginHorizontal: 10,
  },
  transcriptContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  transcriptText: {
    fontSize: 16,
    marginVertical: 2,
  },
  waveform: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#007bff',
    marginHorizontal: 1,
    borderRadius: 2,
    minHeight: 10,
  },
  navIcon: {
    width: 24,
    height: 24,
    tintColor: '#007bff',
    marginHorizontal: 20,
  },
  playIcon: {
    width: 32,
    height: 32,
    tintColor: '#007bff',
  },
});

export default AudioPlayer;
