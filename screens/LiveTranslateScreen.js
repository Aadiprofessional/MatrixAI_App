import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  ScrollView,
  Animated,
  PermissionsAndroid,
  Platform,
  Clipboard,
  Share,
  ActivityIndicator,
  Alert
} from 'react-native';
import AudioRecord from 'react-native-audio-record';
import { v4 as uuidv4 } from 'uuid';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts'; // Importing TTS library
import axios from 'axios';
import { useNavigation } from '@react-navigation/core';


const LiveTranslateScreen = () => {
  const slideAnimation = new Animated.Value(300);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedLanguage2, setSelectedLanguage2] = useState('Chinese');
  const [transcription, setTranscription] = useState('Press Mic to start listening');
  const [isListening, setIsListening] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [circleAnimation] = useState(new Animated.Value(0));
  const [highlightedText, setHighlightedText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [audioFilePath, setAudioFilePath] = useState('');
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [editingLanguage, setEditingLanguage] = useState('source'); // 'source' or 'target'
  const navigation = useNavigation();


  const languageCodes = {
    Afrikaans: 'af',
    Albanian: 'sq',
    Arabic: 'ar',
    Armenian: 'hy',
    Azerbaijani: 'az',
    Bengali: 'bn',
    Bosnian: 'bs',
    Bulgarian: 'bg',
    Catalan: 'ca',
    Chinese: 'zh',
    Croatian: 'hr',
    Czech: 'cs',
    Danish: 'da',
    Dutch: 'nl',
    English: 'en',
    Estonian: 'et',
    Finnish: 'fi',
    French: 'fr',
    Georgian: 'ka',
    German: 'de',
    Greek: 'el',
    Gujarati: 'gu',
    Hebrew: 'he',
    Hindi: 'hi',
    Hungarian: 'hu',
    Icelandic: 'is',
    Indonesian: 'id',
    Irish: 'ga',
    Italian: 'it',
    Japanese: 'ja',
    Kannada: 'kn',
    Kazakh: 'kk',
    Korean: 'ko',
    Latvian: 'lv',
    Lithuanian: 'lt',
    Macedonian: 'mk',
    Malay: 'ms',
    Malayalam: 'ml',
    Marathi: 'mr',
    Mongolian: 'mn',
    Nepali: 'ne',
    Norwegian: 'no',
    Persian: 'fa',
    Polish: 'pl',
    Portuguese: 'pt',
    Punjabi: 'pa',
    Romanian: 'ro',
    Russian: 'ru',
    Serbian: 'sr',
    Sinhala: 'si',
    Slovak: 'sk',
    Slovenian: 'sl',
    Spanish: 'es',
    Swahili: 'sw',
    Swedish: 'sv',
    Tamil: 'ta',
    Telugu: 'te',
    Thai: 'th',
    Turkish: 'tr',
    Ukrainian: 'uk',
    Urdu: 'ur',
    Uzbek: 'uz',
    Vietnamese: 'vi',
    Welsh: 'cy',
  };

  const azureEndpoint = 'https://api.cognitive.microsofttranslator.com';
  const azureKey = '21oYn4dps9k7VJUVttDmU3oigC93LUtyYB9EvQatENmWOufZa4xeJQQJ99ALACYeBjFXJ3w3AAAbACOG0HQP'; // Replace with your Azure API Key
  const languages = Object.keys(languageCodes);
  const region = 'eastus';

  const [isVoiceInitialized, setIsVoiceInitialized] = useState(false);

  const initializeVoice = useCallback(async (retryCount = 0) => {
    if (isVoiceInitialized) return;

    try {
      // Check if Voice module is available
      if (!Voice) {
        throw new Error('Voice module not available - Ensure react-native-voice is installed and linked');
      }

      // Verify Voice methods exist
      if (!Voice.destroy || !Voice.removeAllListeners || !Voice.onSpeechStart) {
        throw new Error('Voice module methods not available - Please ensure proper linking of native modules');
      }

      // Initialize Voice with retry logic
      await Voice.destroy().catch(() => {});
      await Voice.removeAllListeners().catch(() => {});
      
      // Set up event listeners
      Voice.onSpeechStart = () => {
        setIsListening(true);
        startCircleAnimation();
      };
      Voice.onSpeechEnd = () => {
        setIsListening(false);
        stopCircleAnimation();
      };
      Voice.onSpeechResults = (e) => {
        setTranscription(e.value[0] || 'Press Mic to start listening');
        translateText(e.value[0] || 'Press Mic to start listening');
      };
      Voice.onSpeechError = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
        Alert.alert('Speech Error', e.error?.message || 'Speech recognition failed');
      };

      setIsVoiceInitialized(true);
      return true;
    } catch (error) {
      console.error('Error initializing Voice (attempt ${retryCount}):', error);
      
      if (retryCount < 3) {
        // Retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return initializeVoice(retryCount + 1);
      }

      Alert.alert(
        'Voice Error', 
        `Failed to initialize voice recognition after ${retryCount + 1} attempts: ${error.message}`
      );
      return false;
    }
  }, [isVoiceInitialized]);

  useEffect(() => {
    const initializeAnimation = () => {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    };

    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Audio Recording Permission',
            message: 'This app needs access to your microphone to perform voice recognition.',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.error('Microphone permission denied');
        }
      }
    };

    initializeAnimation();
    requestPermissions();
    initializeVoice();

    return () => {
      Voice.destroy().then(() => Voice.removeAllListeners());
      setIsVoiceInitialized(false);
    };
  }, [initializeVoice]);



  const handleSpeakerPress = () => {
    Tts.speak(translatedText, {
      language: languageCodes[selectedLanguage2], // Speak in the second language
      pitch: 1,
      rate: 0.5,
    });

    // Start highlighting words as they are spoken
    const words = translatedText.split(' ');
    words.forEach((word, index) => {
      setTimeout(() => {
        setHighlightedText(word); // Highlight the word
      }, 1000 * index); // Delay to highlight each word one by one
    });
  };


  const translateText = async (inputText) => {
    // Validate input text
    if (!inputText || inputText.trim().length === 0) {
      setTranslatedText('');
      return;
    }

    // Validate target language is selected
    if (!selectedLanguage2) {
      setTranslatedText('Please select a target language');
      return;
    }

    // Get current target language code fresh each time
    const currentTargetLanguage = languageCodes[selectedLanguage2];
    if (!currentTargetLanguage) {
      console.error('Invalid target language:', selectedLanguage2);
      setTranslatedText(`Invalid target language: ${selectedLanguage2}`);
      return;
    }
    console.log('Translating text:', inputText);
    console.log('Target language:', selectedLanguage2, 'Code:', currentTargetLanguage);
    console.log('Making API call to:', `${azureEndpoint}/translate?api-version=3.0&to=${currentTargetLanguage}`);

    // Validate Azure configuration
    if (!azureEndpoint || !azureKey || !region) {
      console.error('Azure translation configuration missing');
      setTranslatedText('Translation service not configured');
      return;
    }

    let retries = 3;
    while (retries > 0) {
      try {
          const response = await axios.post(
          `${azureEndpoint}/translate?api-version=3.0&from=${languageCodes[selectedLanguage]}&to=${currentTargetLanguage}`,
          [{
            Text: inputText
          }],
          {
            headers: {
              'Ocp-Apim-Subscription-Key': azureKey,
              'Ocp-Apim-Subscription-Region': region,
              'Content-Type': 'application/json',
              'X-ClientTraceId': uuidv4(), // Add unique trace ID
              'X-ForceTranslation': 'true' // Force translation to target language
            },
            params: {
              from: languageCodes[selectedLanguage],
              to: currentTargetLanguage
            },
            timeout: 5000
          }
        );

        if (!response.data || !response.data[0] || !response.data[0].translations) {
          throw new Error('Invalid translation response format');
        }

        const translation = response.data[0].translations[0].text;
        if (!translation) {
          throw new Error('Empty translation received');
        }

        // Verify the translation language matches the target language
        const detectedLanguage = response.data[0].detectedLanguage?.language;
        if (detectedLanguage && detectedLanguage !== currentTargetLanguage) {
          console.error('Translation language mismatch:', 
            `Expected ${currentTargetLanguage}, got ${detectedLanguage}`);
          throw new Error('Translation language mismatch');
        }

        console.log('Translation successful:', translation);
        setTranslatedText(translation);
        return; // Success - exit the retry loop
      } catch (error) {
        retries--;
        console.error(`Translation attempt failed (${retries} retries left):`, 
          error.response ? error.response.data : error.message);

        if (retries === 0) {
          setTranslatedText('Translation failed - please try again');
          return;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const startCircleAnimation = () => {
    Animated.loop(
      Animated.timing(circleAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopCircleAnimation = () => {
    circleAnimation.stopAnimation();
    circleAnimation.setValue(0);
  };

  const handleCopyText = () => {
    Clipboard.setString(translatedText);
    alert('Text copied to clipboard!');
  };

  const handleShareText = async () => {
    try {
      await Share.share({
        message: translatedText,
      });
    } catch (error) {
      console.error('Error sharing text:', error);
    }
  };

  const swapLanguages = async () => {
    // Swap the languages
    const temp = selectedLanguage;
    setSelectedLanguage(selectedLanguage2);
    setSelectedLanguage2(temp);
    
    // If we have existing transcription, re-translate it to the new target language
    if (transcription && transcription !== 'Press Mic to start listening') {
      await translateText(transcription);
    }
    
    // If currently listening, restart with new source language
    if (isListening) {
      try {
        await Voice.stop();
        await Voice.start(selectedLanguage2); // Use the new source language
      } catch (error) {
        console.error('Error restarting voice recognition:', error);
      }
    }
  };

  // Add this useEffect hook near other useEffect hooks
  useEffect(() => {
    // Only translate if we have new transcription and a valid target language
    if (transcription && 
        transcription !== 'Press Mic to start listening' &&
        selectedLanguage2 &&
        languageCodes[selectedLanguage2]) {
      // Clear previous translation before starting new one
      setTranslatedText('');
      translateText(transcription);
    }
  }, [transcription, selectedLanguage2]);

  const updateLanguage = async (language, isSourceLanguage) => {
    console.log('Updating language:', {
      newLanguage: language,
      isSource: isSourceLanguage,
      currentSource: selectedLanguage,
      currentTarget: selectedLanguage2
    });

    // Clear any existing translations and transcription
    setTranslatedText('');
    setTranscription('Press Mic to start listening');

    if (isSourceLanguage) {
      // Stop any ongoing recognition
      try {
        await Voice.stop();
      } catch (error) {
        console.error('Error stopping voice recognition:', error);
      }

      setSelectedLanguage(language);
      console.log('New source language set:', language);
      
      // Restart recognition with new language if currently listening
      if (isListening) {
        try {
          const languageCode = languageCodes[language];
          if (!languageCode) {
            throw new Error(`Invalid language code for: ${language}`);
          }
          await Voice.start(languageCode);
          console.log('Restarted voice recognition with language:', languageCode);
        } catch (error) {
          console.error('Error restarting voice recognition:', error);
        }
      }
    } else {
      setSelectedLanguage2(language);
      console.log('New target language set:', language);
      
      // Verify the language code exists
      const targetCode = languageCodes[language];
      if (!targetCode) {
        console.error('Invalid target language code:', language);
        return;
      }

      console.log('Target language code:', targetCode);
      
      // Clear any cached translations
      setTranslatedText('');
    }
  };

  const handleUpload = async () => {
    setUploading(true);

    try {
      let fileToUpload = audioFile;
      
      if (isListening) {
        const result = await AudioRecord.stop();
        await Voice.stop();
        
        fileToUpload = { 
          uri: result, 
          type: 'audio/wav', 
          name: `${uuidv4()}.wav`
        };
        
        setAudioFilePath(result);
        setAudioFile(fileToUpload);
        setIsListening(false);
        setIsPaused(false);
      }

      if (!fileToUpload) {
        throw new Error('No audio file available');
      }

      const user = '595dfce5-0898-4364-9046-0aa850190321';
      const { uri, name } = fileToUpload;
      const duration = Math.floor((Date.now() - recordingStartTime) / 1000);

      const formData = new FormData();
      formData.append('audio', { 
        uri, 
        type: fileToUpload.type, 
        name 
      });
      formData.append('uid', user);
      formData.append('duration', duration);
      formData.append('transcription', transcription);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://ddtgdhehxhgarkonvpfq.functions.supabase.co/uploadAudio', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdGdkaGVoeGhnYXJrb252cGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2Njg4MTIsImV4cCI6MjA1MDI0NDgxMn0.mY8nx-lKrNXjJxHU7eEja3-fTSELQotOP4aZbxvmNPY',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const result = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'File uploaded successfully');
        setAudioFile(null);
        setAudioFilePath('');
        setTranscription('Click on mic and start speaking...');
      } else {
        throw new Error(result.error || 'Failed to upload the file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Error', 
        error.message === 'Network request failed' 
          ? 'Please check your internet connection'
          : error.message || 'An error occurred during file upload'
      );
    } finally {
      setUploading(false);
    }
  };

const handleStartListening = async () => {
  if (isListening) {
    console.log('Already listening!');
    return;
  }

  try {
    if (!isVoiceInitialized) {
      await initializeVoice();
    }

    if (!isVoiceInitialized) {
      throw new Error('Voice recognition not initialized');
    }

    // Initialize AudioRecord
    console.log('Initializing AudioRecord...');
    await AudioRecord.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      wavFile: `${uuidv4()}.wav`,
    });

    // Get language code and validate
    const languageCode = languageCodes[selectedLanguage];
    if (!languageCode) {
      throw new Error(`Language code not found for: ${selectedLanguage}`);
    }

    // Start recording and voice recognition
    setIsListening(true);
    setIsPaused(false);
    console.log('Starting AudioRecord...');
    await AudioRecord.start();
    
    console.log('Starting Voice recognition with language code:', languageCode);
    await Voice.start(languageCode);
    
    setTranscription('Listening...');
    setRecordingStartTime(Date.now());
  } catch (error) {
    console.error('Error starting voice recognition:', error);
    setIsListening(false);
    setIsPaused(false);
    Alert.alert('Error', `Failed to start listening: ${error.message}`);
    
    // Cleanup on error
    try {
      await Voice.destroy();
      await AudioRecord.stop();
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
};

  const handlePauseListening = async () => {
    setIsPaused(true);
    try {
      const result = await AudioRecord.stop();
      await Voice.stop();
      
      setAudioFilePath(result);
      setAudioFile({ 
        uri: result, 
        type: 'audio/wav', 
        name: `${uuidv4()}.wav`
      });
      
      setTranscription(prev => prev + ' [Paused]');
    } catch (error) {
      console.error('Error pausing recording:', error);
    }
  };

  const handleResumeListening = async () => {
    setIsPaused(false);
    try {
      await AudioRecord.start();
      await Voice.start(selectedLanguage); // Always use selectedLanguage for speech recognition
      setTranscription(prev => prev.replace(' [Paused]', ''));
    } catch (error) {
      console.error('Error resuming recording:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Back, Copy, Share */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
                 <Image source={require('../assets/back.png')} style={styles.icon2} />
               </TouchableOpacity>
        <View style={styles.rightHeader}>
        <TouchableOpacity >
            <Image source={require('../assets/cliper.png')} style={styles.icon3} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopyText}>
            <Image source={require('../assets/copy.png')} style={styles.icon3} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShareText}>
            <Image source={require('../assets/share.png')} style={styles.icon3} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSpeakerPress}>
            <Image source={require('../assets/speaker.png')} style={styles.icon3} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Blue Section */}
      <View style={styles.topSection}>
      <View style={styles.container2}>
       <View style={styles.languageSwitcher}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => {
            setEditingLanguage('source');
            setLanguageModalVisible(true);
          }}
        >
          <Text style={styles.languageText}>{selectedLanguage}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
          <Image
            source={require('../assets/Change.png')}
            style={styles.swapIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => {
            setEditingLanguage('target');
            setLanguageModalVisible(true);
          }}
        >
          <Text style={styles.languageText}>{selectedLanguage2}</Text>
        </TouchableOpacity>
        </View>
      </View>
  
  {/* Scroll view added for transcription */}
  <ScrollView style={{ height: 280,  }}>
    <Text style={styles.documentText}>{transcription}</Text>
  </ScrollView>
</View>

      {/* Animated Circle Behind Mic Icon */}
      <Animated.View
        style={[
          styles.circle,
          {
            opacity: circleAnimation,
            transform: [
              {
                scale: circleAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.5], // Adjust size of the circle to be slightly bigger than mic button
                }),
              },
            ],
          },
        ]}
      />

      {/* Sliding White Section */}
      <Animated.View style={[styles.bottomSection, { transform: [{ translateY: slideAnimation }] }]}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Text style={styles.translatedText}>{ translatedText}</Text>
        </ScrollView>
        
        <View style={styles.bottomButtons}>
          {isListening ? (
            <>
              {isPaused ? (
                <TouchableOpacity style={styles.button} onPress={handleResumeListening}>
                  <Image source={require('../assets/play.png')} style={styles.icon} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.button} onPress={handlePauseListening}>
                  <Image source={require('../assets/pause.png')} style={styles.icon} />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.button, uploading && styles.disabledButton]} 
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.loadingText}>Uploading...</Text>
                  </View>
                ) : (
                  <Image source={require('../assets/Tick.png')} style={styles.icon} />
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleStartListening}
              disabled={uploading}
            >
              <Image 
                source={require('../assets/mic3.png')} 
                style={[styles.icon, uploading && styles.disabledIcon]} 
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={languages}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.languageOption}
                  onPress={() => {
                    updateLanguage(item, editingLanguage === 'source');
                    setLanguageModalVisible(false);
                  }}
                >
                  <Text style={styles.languageOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setLanguageModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    gap: 20
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 45,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',

  },
  disabledButton: {
    opacity: 0.6
  },
  disabledIcon: {
    opacity: 0.6
  },
  container: {
    flex: 1,
    backgroundColor: '#007bff',
  },
  header: {
    flexDirection: 'row',
    paddingTop: 20,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  icon: {
    width: 34,
    height: 34,
    tintColor: '#ffffff',

  },
  icon2: {
    width: 24,
    height: 24,
    tintColor: '#fff',
   
  },
  icon3: {
    width: 24,
    height: 24,
    tintColor: '#ffffff',
marginLeft:10
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topSection: {
    paddingTop: 45,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
  },
  languageSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 8,
    width: '80%',
    
    height:50,
    position: 'relative', // Required for absolute positioning of the swap button
  },
  languageButton: {
    paddingHorizontal: 26,
    flex: 1, // Allow buttons to take equal space
    alignItems: 'center', // Center text horizontally
  },
  languageText: {
    fontSize: 16,
    color: '#000',
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute', // Position the swap button absolutely
    left: '50%', // Move to the horizontal center
    top: '50%', // Move to the vertical center
    transform: [{ translateX: -10 }, { translateY: -10 }], // Adjust for button size
  },
  container2: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
  swapIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  documentText: {
    fontSize: 20,
    color: '#fff',
  
    marginTop: 30,
  },
  bottomSection: {
    flex: 1,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '50%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  scrollView: {
    paddingVertical: 10,
  },
  translatedText: {
    fontSize: 18,
    color: '#555',
   
  },
  micButton: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  micIcon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
  circle: {
    position: 'absolute',
    bottom: 100, // Adjust the distance from the mic button
    left: '50%',
    width: 90, // A bit larger than mic button
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 123, 255, 0.3)',
    transform: [{ translateX: -45 }],
    zIndex: 0, // Ensure it is behind the mic button
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  languageOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  languageOptionText: {
    fontSize: 18,
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'center',
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default LiveTranslateScreen;
