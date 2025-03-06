import React, { useEffect, useState, useCallback, useRef } from 'react';

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
import Voice from '@react-native-voice/voice'; // Import Voice library
import Tts from 'react-native-tts'; // Importing TTS library
import axios from 'axios';
import { useNavigation } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';

// Add a simple UUID generator function that doesn't rely on crypto
const generateSimpleUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const LiveTranslateScreen = () => {
  const [isTranslateMode, setIsTranslateMode] = useState(false); // New state for translation mode
  const slideAnimation = new Animated.Value(isTranslateMode ? 0 : 300);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedLanguage2, setSelectedLanguage2] = useState('Chinese');
  const [transcription, setTranscription] = useState('Press Mic to start listening');
  const [isListening, setIsListening] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [circleAnimation] = useState(new Animated.Value(0));
  const [highlightedText, setHighlightedText] = useState('');
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

  useEffect(() => {
    // Initialize animation based on translation mode
    Animated.timing(slideAnimation, {
      toValue: isTranslateMode ? 0 : 300,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Request permissions
    requestPermissions();
    
    // Set up Voice listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    
    // Clean up on unmount
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [isTranslateMode]); // Add isTranslateMode as a dependency

  // Speech recognition event handlers
  const onSpeechStart = () => {
    console.log('Speech started');
    setIsListening(true);
  };

  const onSpeechEnd = () => {
    console.log('Speech ended');
    setIsListening(false);
    stopCircleAnimation();
  };

  const onSpeechResults = (event) => {
    console.log('Speech results:', event);
    if (event.value && event.value.length > 0) {
      const result = event.value[0];
      setTranscription(result);
      // Only translate if in translate mode
      if (isTranslateMode) {
        translateText(result);
      }
    }
  };

  const onSpeechError = (error) => {
    console.error('Speech recognition error:', error);
    setIsListening(false);
    stopCircleAnimation();
    Alert.alert('Error', 'Speech recognition failed. Please try again.');
  };

  // Request microphone permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs microphone access to recognize speech.',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permissions Required',
            'This app needs microphone permission to function properly.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleStartListening = async () => {
    if (isListening) {
      console.log('Already listening!');
      return;
    }

    try {
      setTranscription('Listening...');
      setTranslatedText('');
      startCircleAnimation();
      
      // Start voice recognition with the selected language
      await Voice.start(languageCodes[selectedLanguage] || 'en-US');
    } catch (error) {
      console.error('Error starting listening:', error);
      setIsListening(false);
      stopCircleAnimation();
      Alert.alert('Error', `Failed to start listening: ${error.message}`);
    }
  };

  const handleStopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      stopCircleAnimation();
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

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
              'X-ClientTraceId': generateSimpleUUID(), // Add unique trace ID
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

  // Add toggle translation mode function
  const toggleTranslateMode = () => {
    const newMode = !isTranslateMode;
    setIsTranslateMode(newMode);
    
    // Animate the bottom section
    Animated.timing(slideAnimation, {
      toValue: newMode ? 0 : 300, // Slide up when in translate mode, down when not
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // If exiting translate mode, reset translated text
    if (!newMode) {
      setTranslatedText('');
    } else if (transcription && transcription !== 'Press Mic to start listening' && transcription !== 'Listening...') {
      // If entering translate mode and we have transcription, translate it
      translateText(transcription);
    }
  };

  const swapLanguages = async () => {
    // Swap the languages
    const temp = selectedLanguage;
    setSelectedLanguage(selectedLanguage2);
    setSelectedLanguage2(temp);
    
    // If we have existing transcription, re-translate it to the new target language
    if (transcription && transcription !== 'Press Mic to start listening' && transcription !== 'Listening...') {
      await translateText(transcription);
    }
    
    // If currently listening, restart with new source language
    if (isListening) {
      try {
        // Stop current recognition and restart with new language
        await Voice.stop();
        await Voice.start(languageCodes[selectedLanguage2] || 'en-US');
      } catch (error) {
        console.error('Error restarting voice recognition:', error);
      }
    }
  };

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
      setSelectedLanguage(language);
      console.log('New source language set:', language);
      
      // Restart recognition with new language if currently listening
      if (isListening) {
        try {
          await Voice.stop();
          await Voice.start(languageCodes[language] || 'en-US');
        } catch (error) {
          console.error('Error stopping voice recognition:', error);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back, Copy, Share */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Image source={require('../assets/back.png')} style={styles.icon2} />
        </TouchableOpacity>
        <View style={styles.rightHeader}>
          {/* Only show these buttons in translate mode */}
          {isTranslateMode && (
            <>
              <TouchableOpacity>
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
            </>
          )}
          {/* Toggle translate mode button */}
          <TouchableOpacity 
            onPress={toggleTranslateMode} 
            style={[
              styles.translateButton, 
              isTranslateMode && styles.activeTranslateButton
            ]}
          >
            <Image 
              source={require('../assets/Translate.png')} 
              style={[styles.icon4, isTranslateMode && styles.activeIcon]} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Blue Section */}
      <View style={styles.topSection}>
        <View style={styles.container2}>
          <View style={styles.languageSwitcher}>
            {/* Always show source language */}
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => {
                setEditingLanguage('source');
                setLanguageModalVisible(true);
              }}
            >
              <Text style={styles.languageText}>{selectedLanguage}</Text>
            </TouchableOpacity>
            
            {/* Only show language swap and target language in translate mode */}
            {isTranslateMode ? (
              <>
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
              </>
            ) : null}
          </View>
        </View>
  
        {/* Scroll view added for transcription */}
        <ScrollView style={{ height: 280 }}>
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

      {/* Sliding White Section - Only visible in translate mode */}
      <Animated.View style={[styles.bottomSection, { transform: [{ translateY: slideAnimation }] }]}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Text style={styles.translatedText}>{translatedText}</Text>
        </ScrollView>
        
        <View style={styles.bottomButtons}>
          {isListening ? (
            <TouchableOpacity style={styles.button} onPress={handleStopListening}>
              <Image source={require('../assets/Tick.png')} style={styles.icon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleStartListening}
            >
              <Image 
                source={require('../assets/mic3.png')} 
                style={styles.icon} 
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Floating mic button when not in translate mode */}
      {!isTranslateMode && (
        <View style={styles.floatingMicContainer}>
          {isListening ? (
            <TouchableOpacity style={styles.floatingMicButton} onPress={handleStopListening}>
              <Image source={require('../assets/Tick.png')} style={styles.icon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.floatingMicButton} 
              onPress={handleStartListening}
            >
              <Image 
                source={require('../assets/mic3.png')} 
                style={styles.icon} 
              />
            </TouchableOpacity>
          )}
        </View>
      )}

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
    </SafeAreaView>
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
    marginLeft:10,
  },
  icon4: {
    width: 24,
    height: 24,
    tintColor: '#ffffff',
  
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
  translateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E26C05FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    resizeMode: 'cover',
  },
  activeTranslateButton: {
    backgroundColor: '#0056b3',
  },
  activeIcon: {
    tintColor: '#fff',
  },
  floatingMicContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingMicButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LiveTranslateScreen;
