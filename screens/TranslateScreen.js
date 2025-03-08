import React, { useEffect, useState, useRef, forwardRef } from 'react';
const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  import {
      View,
      Text,
      StyleSheet,
      TouchableOpacity,
      TouchableWithoutFeedback,
      Share,
      ScrollView,
      Image,
      TextInput,
      Switch,
      Modal,
      ActivityIndicator,
      FlatList,
      Animated,
      NativeModules,
      Dimensions,
  } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
import { PDFDocument, rgb, PNGImage } from 'react-native-pdf-lib';
import LottieView from 'lottie-react-native';

import { svg2png } from 'svg-png-converter';
import RNFS from 'react-native-fs';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider'; // Import the Slider component

  import { useNavigation } from '@react-navigation/native';
  import Sound from 'react-native-sound';
  import ForceDirectedGraph from '../components/mindMap';
  import ForceDirectedGraph2 from '../components/mindMap2';
  import { Picker } from '@react-native-picker/picker';
  import DropDownPicker from 'react-native-dropdown-picker';
  import Svg, { Path } from 'react-native-svg';
  import LinearGradient from 'react-native-linear-gradient'; // Import LinearGradient

  const TranslateScreen = ({ route }) => {
    const graphRef = useRef(null);
      const { audioid ,uid} = route.params || {};
      const scrollY = new Animated.Value(0);
      const playerHeight = scrollY.interpolate({
          inputRange: [0, 200],
          outputRange: [120, 60],
          extrapolate: 'clamp',
      });
      const playerPadding = scrollY.interpolate({
          inputRange: [0, 200],
          outputRange: [16, 8],
          extrapolate: 'clamp',
      });
    
      const [waveformHeights, setWaveformHeights] = useState([]);
      const [isTranscriptionGenerating, setIsTranscriptionGenerating] = useState(false);
const [transcriptionGeneratedFor, setTranscriptionGeneratedFor] = useState(new Set());

      const [is2xSpeed, setIs2xSpeed] = useState(false);
      const [isRepeatMode, setIsRepeatMode] = useState(false);
      const [editingStates, setEditingStates] = useState([]);
      const [transcription, setTranscription] = useState([]);
   
      const [sliderWidth, setSliderWidth] = useState(Dimensions.get('window').width);
      const [isLoading, setIsLoading] = useState(true);
      const [paragraphs, setParagraphs] = useState([]);
      const [audioUrl, setAudioUrl] = useState('');
      const [keyPoints, setKeypoints] = useState('');
      const [XMLData, setXMLData] = useState('');
      const [duration, setDuration] = useState('');
      const audioPlayerRef = useRef(null);
      const [isFullScreen, setIsFullScreen] = useState(false);
      const [showMindMap, setShowMindMap] = useState(false);
      const scrollViewRef = useRef(null);
      const [isSeeking, setIsSeeking] = useState(false);
      const userScrollTimeoutRef = useRef(null);

      const isTranscriptionEmpty = transcription  === '';
      const coin = require('../assets/coin.png');
      const [currentWordIndex, setCurrentWordIndex] = useState({
          paraIndex: 0,
          wordIndex: 0,
          word: ''
      });

      useEffect(() => {
        if (scrollViewRef.current && currentWordIndex.paraIndex !== undefined) {
          // Calculate approximate y position based on paragraph index
          const yOffset = currentWordIndex.paraIndex * 200; // 200 is estimated height per paragraph
          scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
        }
      }, [currentWordIndex.paraIndex]);
      const [wordTimings, setWordTimings] = useState([]);
      const navigation = useNavigation();
     
      const [isAudioLoading, setIsAudioLoading] = useState(false);
      const [fileName, setFileName] = useState('');
      const [fileContent, setFileContent] = useState('');
      const [isSliderVisible, setSliderVisible] = useState(false);
      const [isTranscriptionVisible, setTranscriptionVisible] = useState(false);
      const [isSpeechToTextEnabled, setSpeechToTextEnabled] = useState(true);
      const [isEditingEnabled, setEditingEnabled] = useState(true);
   
      const [translations, setTranslations] = useState([]);
      const [selectedButton, setSelectedButton] = useState('transcription');
      const [selectedLanguage, setSelectedLanguage] = useState('zh');
      const [translatedText, setTranslatedText] = useState('');
   
    
      const [showDropdown, setShowDropdown] = useState(false);
      const [audioPosition, setAudioPosition] = useState(0);
      const [audioDuration, setAudioDuration] = useState(0);
      const [isAudioPlaying, setIsAudioPlaying] = useState(false);
      const [sound, setSound] = useState(null);
      const resizeIcon = require('../assets/robot.png');
    
     
      const languages = [
          { label: 'Chinese', value: 'zh' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Hindi', value: 'hi' },
      ];
  
      const handleSelectLanguage = (value) => {
          setSelectedLanguage(value);
          setShowDropdown(false); // Close dropdown after selection
      };
  

  
      const isMounted = useRef(true);
  
    useEffect(() => {
        const fetchData = async () => {
            const cachedData = await AsyncStorage.getItem(`audioData-${audioid}`);
            if (cachedData) {
                const { transcription, paragraphs, audioUrl, keyPoints, XMLData } = JSON.parse(cachedData);
                setTranscription(transcription);
                setParagraphs(paragraphs);
                setAudioUrl(audioUrl);
                setKeypoints(keyPoints);
               
                setIsLoading(false);
            } else {
                fetchAudioMetadata(uid, audioid);
            }
        };

        fetchData();
    }, [uid, audioid]);

    const togglePlaybackSpeed = () => {
        const newSpeed = is2xSpeed ? 1 : 2; // Toggle between 1x and 2x
        if (audioPlayerRef.current) {
            audioPlayerRef.current.setRateAsync(newSpeed, true); // Set playback speed
            setIs2xSpeed(!is2xSpeed); // Update state
        }
    };
    
  
  


  

    const toggleEdit = (index) => {
        const newEditingStates = [...editingStates];
        newEditingStates[index] = !newEditingStates[index];
        setEditingStates(newEditingStates);
    };

   
   


    const toggleSlider = () => setSliderVisible(!isSliderVisible);

 

    const toggleTextEditing = () => {
        setEditingEnabled(!isEditingEnabled);
        // Reset all editing states when toggling editing mode
        setEditingStates(Array(paragraphs.length).fill(false));
    };
   

    const toggleSpeechToText = () => {
        setSpeechToTextEnabled(!isSpeechToTextEnabled);
        // This will control the visibility of timestamps
    };

  

    
    const handleOutsidePress = () => {
        if (isSliderVisible) {
            setSliderVisible(false);
        }
    };

    const azureEndpoint = 'https://api.cognitive.microsofttranslator.com';
    const azureKey = '21oYn4dps9k7VJUVttDmU3oigC93LUtyYB9EvQatENmWOufZa4xeJQQJ99ALACYeBjFXJ3w3AAAbACOG0HQP';
    const region = 'eastus';

 
    
    const handleButtonPress = (button) => {
        setSelectedButton(button);
    
        if (button === 'mindMap') {
            
            fetchAudioMetadata(uid, audioid); 
        }
    };
    useEffect(() => {
     
            fetchAudioMetadata(uid, audioid);
     
    }, [uid, audioid, selectedButton]); 
        
    const splitTranscription = (text) => {
        if (!text) return { paragraphs: [], words: [] };
        
        // Handle Chinese text specifically
        const isChinese = /[\u4e00-\u9fff]/.test(text);
        let words = isChinese ? Array.from(text) : text.split(/\s+/);
        
        if (isChinese) {
            // For Chinese text, split into smaller paragraphs
            const charsPerParagraph = 100; // Reduced from 200 to 100 for better readability
            const paragraphs = [];
            
            // First try to split by common Chinese punctuation
            const segments = text.split(/[。！？；,，]/g);
            let currentParagraph = '';
            
            for (const segment of segments) {
                if (!segment.trim()) continue;
                
                // If adding this segment would make the paragraph too long, start a new one
                if ((currentParagraph + segment).length > charsPerParagraph && currentParagraph) {
                    paragraphs.push(currentParagraph.trim());
                    currentParagraph = segment;
                } else {
                    currentParagraph += (currentParagraph ? '，' : '') + segment;
                }
            }
            
            // Add the last paragraph if it's not empty
            if (currentParagraph.trim()) {
                paragraphs.push(currentParagraph.trim() + '。');
            }
            
            // If no paragraphs were created (no punctuation found), split by character count
            if (paragraphs.length === 0) {
                for (let i = 0; i < text.length; i += charsPerParagraph) {
                    const chunk = text.slice(i, Math.min(i + charsPerParagraph, text.length));
                    if (chunk.trim()) {
                        paragraphs.push(chunk.trim());
                    }
                }
            }
            
            return { paragraphs, words };
        } else {
            // For non-Chinese text, use the original sentence-based splitting
            const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
            const paragraphs = [];
            const sentencesPerParagraph = 9;
            
            for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
                const paragraphSentences = sentences.slice(i, i + sentencesPerParagraph);
                const paragraph = paragraphSentences.join('. ') + '.';
                if (paragraph.trim()) {
                    paragraphs.push(paragraph.trim());
                }
            }
            
            return { paragraphs, words };
        }
        
        return { paragraphs, words };
    };

    const calculateParagraphTimings = (words, duration) => {
        if (!words.length || !duration) return [];
        
        // Calculate time per paragraph based on total duration and number of paragraphs
        const wordsPerParagraph = Math.ceil(words.length / Math.ceil(words.length / (9 * 10))); // ~10 words per line, 9 lines
        const paragraphCount = Math.ceil(words.length / wordsPerParagraph);
        const timePerParagraph = duration / paragraphCount;
        
        return Array(paragraphCount).fill(0).map((_, index) => ({
            start: index * timePerParagraph,
            end: (index + 1) * timePerParagraph,
            words: words.slice(index * wordsPerParagraph, (index + 1) * wordsPerParagraph)
        }));
    };

    useEffect(() => {
        // Generate random heights for the waveform bars
        const heights = Array(100).fill(0).map(() => Math.floor(Math.random() * (60 - 10 + 1)) + 10);
        setWaveformHeights(heights);
    }, []);

    // Add a state to track if user is manually scrolling
    const [isUserScrolling, setIsUserScrolling] = useState(false);

    // Add a state to track the last auto-scrolled paragraph
    const [lastScrolledPara, setLastScrolledPara] = useState(0);

    // Update the onAudioProgress function to improve scrolling behavior
    const onAudioProgress = (progress) => {
        if (!progress || !progress.currentTime || !progress.duration || !wordTimings.length) return;
        
        const currentTime = Number(progress.currentTime.toFixed(2));
        
        // STEP 1: Find the most appropriate paragraph
        let currentParaIndex = -1;
        let bestParaDistance = Infinity;
        
        // Try to find the paragraph containing the current time
        for (let i = 0; i < wordTimings.length; i++) {
            const para = wordTimings[i];
            
            // Check if time is within paragraph bounds
            if (currentTime >= para.start && currentTime < para.end) {
                currentParaIndex = i;
                break;
            }
            
            // If not in bounds, calculate distance to this paragraph
            const distanceToStart = Math.abs(para.start - currentTime);
            const distanceToEnd = Math.abs(para.end - currentTime);
            const minDistance = Math.min(distanceToStart, distanceToEnd);
            
            if (minDistance < bestParaDistance) {
                bestParaDistance = minDistance;
                currentParaIndex = i;
            }
        }
        
        // Default to first paragraph if no match found
        if (currentParaIndex === -1 && wordTimings.length > 0) {
            currentParaIndex = 0;
        }
        
        // STEP 2: Find the appropriate word to highlight
        if (currentParaIndex !== -1) {
            const currentParagraphWords = wordTimings[currentParaIndex].words || [];
            
            // Initialize variables for word selection
            let selectedWordIdx = -1;
            let lastWordBeforeTime = -1;
            let firstWordAfterTime = -1;
            let bestWordDistance = Infinity;
            let bestWordIdx = -1;
            
            // First pass: collect information about words relative to current time
            for (let i = 0; i < currentParagraphWords.length; i++) {
                const word = currentParagraphWords[i];
                if (!word || word.start === undefined) continue;
                
                // Check for exact match (current time falls within word's time range)
                if (word.end !== undefined && currentTime >= word.start && currentTime < word.end) {
                    selectedWordIdx = i;
                    break; // Found exact match, no need to continue
                }
                
                // Track the last word that started before current time
                if (word.start <= currentTime) {
                    lastWordBeforeTime = i;
                }
                
                // Track the first word that starts after current time
                if (word.start > currentTime && (firstWordAfterTime === -1 || word.start < currentParagraphWords[firstWordAfterTime].start)) {
                    firstWordAfterTime = i;
                }
                
                // Calculate distance to this word for best approximation
                const distanceToWord = Math.min(
                    Math.abs(word.start - currentTime),
                    word.end !== undefined ? Math.abs(word.end - currentTime) : Infinity
                );
                
                if (distanceToWord < bestWordDistance) {
                    bestWordDistance = distanceToWord;
                    bestWordIdx = i;
                }
            }
            
            // STEP 3: Decision logic for word selection with improved fallback
            
            // If we found an exact match, use it
            if (selectedWordIdx === -1) {
                // No exact match found, use best alternative
                
                // Case 1: We have a word that started before current time
                if (lastWordBeforeTime !== -1) {
                    const lastWord = currentParagraphWords[lastWordBeforeTime];
                    
                    // Check if we should advance to next word
                    if (lastWord.end !== undefined && currentTime > lastWord.end) {
                        // We're past the end of the last word
                        
                        // Case 1A: We have a next word to potentially jump to
                        if (firstWordAfterTime !== -1) {
                            const nextWord = currentParagraphWords[firstWordAfterTime];
                            const timeSinceLastWordEnded = currentTime - lastWord.end;
                            const timeUntilNextWordStarts = nextWord.start - currentTime;
                            
                            // More aggressive forward-looking: advance to next word if:
                            // 1. We're closer to next word than to end of last word, OR
                            // 2. It's been more than 0.1 seconds since last word ended (reduced from 0.2)
                            if (timeUntilNextWordStarts < timeSinceLastWordEnded || timeSinceLastWordEnded > 0.1) {
                                // Verify next word timing data is valid
                                if (nextWord.start !== undefined && nextWord.end !== undefined) {
                                    selectedWordIdx = firstWordAfterTime;
                                } else {
                                    // Skip invalid word and look for next valid one
                                    let foundValidWord = false;
                                    for (let i = firstWordAfterTime + 1; i < currentParagraphWords.length; i++) {
                                        const word = currentParagraphWords[i];
                                        if (word.start !== undefined && word.end !== undefined) {
                                            selectedWordIdx = i;
                                            foundValidWord = true;
                                            break;
                                        }
                                    }
                                    
                                    // If we couldn't find a valid word ahead, use the best word by distance
                                    if (!foundValidWord && bestWordIdx !== -1) {
                                        selectedWordIdx = bestWordIdx;
                                    }
                                }
                            } else {
                                selectedWordIdx = lastWordBeforeTime;
                            }
                        } else {
                            // Case 1B: No next word in this paragraph, look ahead to next paragraph
                            if (currentParaIndex < wordTimings.length - 1) {
                                const nextParaWords = wordTimings[currentParaIndex + 1].words || [];
                                if (nextParaWords.length > 0 && nextParaWords[0].start !== undefined) {
                                    const firstWordNextPara = nextParaWords[0];
                                    const timeSinceLastWordEnded = currentTime - lastWord.end;
                                    const timeUntilNextParaStarts = firstWordNextPara.start - currentTime;
                                    
                                    // If we're very close to the next paragraph's first word, jump to next paragraph
                                    // More aggressive jumping to next paragraph
                                    if (timeUntilNextParaStarts < 1.5 && timeSinceLastWordEnded > 0.3) {
                                        // We're close enough to next paragraph, update state to move there
                                        setCurrentWordIndex({
                                            paraIndex: currentParaIndex + 1,
                                            wordIndex: 0,
                                            word: firstWordNextPara.punctuated_word || firstWordNextPara.word || ''
                                        });
                                        
                                        // Auto-scroll if needed
                                        if (scrollViewRef.current && 
                                            (currentParaIndex + 1) !== lastScrolledPara && 
                                            !isUserScrolling) {
                                            setLastScrolledPara(currentParaIndex + 1);
                                            scrollViewRef.current.scrollTo({
                                                y: (currentParaIndex + 1) * 200,
                                                animated: true
                                            });
                                        }
                                        
                                        // Return early since we've handled this case
                                        return;
                                    }
                                }
                            }
                            
                            // If we can't jump to next paragraph, use best word by distance
                            selectedWordIdx = bestWordIdx !== -1 ? bestWordIdx : lastWordBeforeTime;
                        }
                    } else {
                        // We're still within the last word's time range
                        selectedWordIdx = lastWordBeforeTime;
                    }
                } 
                // Case 2: No word has started yet, but we have upcoming words
                else if (firstWordAfterTime !== -1) {
                    selectedWordIdx = firstWordAfterTime;
                } 
                // Case 3: No timing data available, use best word by distance
                else if (bestWordIdx !== -1) {
                    selectedWordIdx = bestWordIdx;
                }
                // Case 4: Absolute fallback - use first word if available
                else if (currentParagraphWords.length > 0) {
                    selectedWordIdx = 0;
                }
            }
            
            // STEP 4: If we still don't have a word, implement aggressive forward-looking
            if (selectedWordIdx === -1) {
                // Look ahead across multiple paragraphs if necessary
                let foundWord = false;
                
                // Check next few paragraphs
                for (let paraOffset = 1; paraOffset <= 3; paraOffset++) {
                    if (currentParaIndex + paraOffset < wordTimings.length) {
                        const aheadParaWords = wordTimings[currentParaIndex + paraOffset].words || [];
                        
                        if (aheadParaWords.length > 0) {
                            // Found a paragraph with words, use its first word
                            setCurrentWordIndex({
                                paraIndex: currentParaIndex + paraOffset,
                                wordIndex: 0,
                                word: aheadParaWords[0].punctuated_word || aheadParaWords[0].word || ''
                            });
                            
                            // Auto-scroll if needed
                            if (scrollViewRef.current && 
                                (currentParaIndex + paraOffset) !== lastScrolledPara && 
                                !isUserScrolling) {
                                setLastScrolledPara(currentParaIndex + paraOffset);
                                scrollViewRef.current.scrollTo({
                                    y: (currentParaIndex + paraOffset) * 200,
                                    animated: true
                                });
                            }
                            
                            foundWord = true;
                            break;
                        }
                    }
                }
                
                // If we still haven't found a word, default to first word of current paragraph
                if (!foundWord && currentParagraphWords.length > 0) {
                    selectedWordIdx = 0;
                } else if (!foundWord) {
                    // Absolute fallback: stay on current paragraph but don't get stuck
                    // Find any word with valid timing data in the current paragraph
                    for (let i = 0; i < currentParagraphWords.length; i++) {
                        if (currentParagraphWords[i] && 
                            currentParagraphWords[i].start !== undefined && 
                            currentParagraphWords[i].end !== undefined) {
                            selectedWordIdx = i;
                            break;
                        }
                    }
                    
                    // If still no valid word, just use the first word
                    if (selectedWordIdx === -1 && currentParagraphWords.length > 0) {
                        selectedWordIdx = 0;
                    }
                    
                    // If absolutely nothing works, just return without updating
                    if (selectedWordIdx === -1) return;
                }
            }
            
            // STEP 5: Update the UI with our selected word
            if (selectedWordIdx !== -1) {
                // Get the current word index state
                const prevWordIndex = currentWordIndex;
                
                // Only update if we're changing words to avoid unnecessary re-renders
                if (prevWordIndex.paraIndex !== currentParaIndex || 
                    prevWordIndex.wordIndex !== selectedWordIdx) {
                    
                    setCurrentWordIndex({
                        paraIndex: currentParaIndex,
                        wordIndex: selectedWordIdx,
                        word: currentParagraphWords[selectedWordIdx]?.punctuated_word || 
                              currentParagraphWords[selectedWordIdx]?.word || ''
                    });
                    
                    // Auto-scroll to the current paragraph only if:
                    // 1. Paragraph changed from the last scrolled paragraph
                    // 2. User is not manually scrolling
                    if (scrollViewRef.current && 
                        currentParaIndex !== lastScrolledPara && 
                        !isUserScrolling) {
                        
                        // Update the last scrolled paragraph
                        setLastScrolledPara(currentParaIndex);
                        
                        // Scroll to the paragraph
                        const yOffset = currentParaIndex * 200; // Approximate height per paragraph
                        scrollViewRef.current.scrollTo({
                            y: yOffset,
                            animated: true
                        });
                    }
                }
            }
        }
    };


    // Audio player functions
    const loadAudio = () => {
        if (sound) {
            sound.release();
        }

        // Enable streaming for better performance
        Sound.setCategory('Playback');
        
        const loadWithRetry = (attempt = 0) => {
            const maxAttempts = 3;
            
            console.log(`Attempting to load audio (attempt ${attempt + 1}): ${audioUrl}`);
            
            // Create new sound instance with error handling
            const newSound = new Sound(audioUrl, '', (error) => {
                if (error) {
                    console.warn(`Failed to load sound (attempt ${attempt + 1}):`, error);
                    
                    if (attempt < maxAttempts - 1) {
                        // Retry with exponential backoff
                        setTimeout(() => {
                            loadWithRetry(attempt + 1);
                        }, Math.pow(2, attempt) * 1000);
                    } else {
                        console.error('All audio loading attempts failed');
                        Alert.alert(
                            'Audio Error',
                            'Failed to load audio. Please try again later.',
                            [{ text: 'OK' }]
                        );
                    }
                    return;
                }
                
                console.log('Audio loaded successfully');
                
                // Configure sound instance
                newSound.setVolume(1.0);
                newSound.setNumberOfLoops(0);
                
                // Get duration after a small delay to ensure it's loaded
                setTimeout(() => {
                    const duration = newSound.getDuration();
                    if (duration && duration > 0) {
                        setAudioDuration(duration);
                        setSound(newSound);
                        console.log(`Audio duration: ${duration} seconds`);
                    } else {
                        console.warn('Invalid duration, checking current time');
                        // If duration is invalid, try an alternative approach
                        newSound.getCurrentTime((seconds) => {
                            if (seconds >= 0) {
                                // If we can get current time, the audio is probably valid
                                setAudioDuration(seconds > 0 ? seconds : 0);
                                setSound(newSound);
                            } else {
                        newSound.release();
                                Alert.alert(
                                    'Audio Error',
                                    'Could not determine audio duration.',
                                    [{ text: 'OK' }]
                                );
                            }
                        });
                    }
                }, 300);
            });
        };
        
        loadWithRetry();
    };

    const toggleAudioPlayback = () => {
        if (!sound) return;
        
        if (isAudioPlaying) {
            sound.pause();
            setIsAudioPlaying(false);
        } else {
            // If at the end, start from beginning
            if (audioPosition >= audioDuration) {
                sound.setCurrentTime(0);
                setAudioPosition(0);
                setCurrentWordIndex({ paraIndex: 0 });
            }
            
            sound.play((success) => {
                if (success) {
                    if (isRepeatMode) {
                        // In repeat mode, start from beginning
                        sound.setCurrentTime(0);
                        setAudioPosition(0);
                        setCurrentWordIndex({ paraIndex: 0 });
                        sound.play();
                    } else {
                        setIsAudioPlaying(false);
                        setAudioPosition(audioDuration);
                    }
                } else {
                    console.error('Playback failed');
                    setIsAudioPlaying(false);
                }
            });
            
            setIsAudioPlaying(true);
        }
    };

    const seekAudio = (seconds) => {
        if (!sound) return;
        
        const newPosition = Math.max(0, Math.min(audioPosition + seconds, audioDuration));
        sound.setCurrentTime(newPosition);
        setAudioPosition(newPosition);
        
        // Trigger audio progress update when seeking
        onAudioProgress({
            currentTime: newPosition,
            duration: audioDuration
        });
    };

   
    
 
    useEffect(() => {
        // Basic Sound.js configuration
        Sound.setCategory('Playback');
        
        if (audioUrl) {
            console.log('Initializing audio with URL:', audioUrl);
            
            // Release previous sound if it exists
            if (sound) {
                sound.release();
                setSound(null);
            }
            
            // Determine if this is a local file
            const isLocalFile = audioUrl.startsWith('file://');
            
            // Function to load audio with retry logic
            const loadAudioWithRetry = (attempt = 0) => {
                const maxAttempts = 3;
                
                console.log(`Loading audio attempt ${attempt + 1}/${maxAttempts}`);
                
                // For local files, use empty string as the base path
                // For remote URLs, use null to indicate it's a remote URL
                const basePath = isLocalFile ? '' : null;
                
                try {
                    const newSound = new Sound(audioUrl, basePath, (error) => {
                if (error) {
                            console.error(`Audio loading error (attempt ${attempt + 1}):`, error);
                            
                            if (attempt < maxAttempts - 1) {
                                // Wait a bit longer between retries
                                setTimeout(() => {
                                    loadAudioWithRetry(attempt + 1);
                                }, (attempt + 1) * 1000);
                            } else {
                                // All attempts failed, try one last approach for remote URLs
                                if (!isLocalFile) {
                                    console.log('Trying alternative loading method...');
                                    
                                    // Try downloading the file locally first
                                    const tempFilePath = `${RNFS.CachesDirectoryPath}/temp_audio_${Date.now()}.mp3`;
                                    
                                    RNFS.downloadFile({
                                        fromUrl: audioUrl,
                                        toFile: tempFilePath,
                                        background: true
                                    }).promise.then(result => {
                                        if (result.statusCode === 200) {
                                            console.log('Downloaded audio to temp file:', tempFilePath);
                                            
                                            // Now try to load from the local file
                                            const localSound = new Sound(`file://${tempFilePath}`, '', (localError) => {
                                                if (localError) {
                                                    console.error('Failed to load downloaded audio:', localError);
                    Alert.alert(
                        'Audio Error',
                                                        'Could not load audio after multiple attempts.',
                        [{ text: 'OK' }]
                    );
                                                } else {
                                                    console.log('Successfully loaded audio from downloaded file');
                                                    localSound.setVolume(1.0);
                                                    
                                                    // Use the duration from the API if available
                                                    if (duration && duration > 0) {
                                                        setAudioDuration(duration);
                                                    } else {
                                                        const soundDuration = localSound.getDuration();
                                                        setAudioDuration(soundDuration > 0 ? soundDuration : 30);
                                                    }
                                                    setSound(localSound);
                                                }
                                            });
                                        } else {
                                            console.error('Failed to download audio file:', result);
                                            Alert.alert(
                                                'Audio Error',
                                                'Could not download audio file.',
                                                [{ text: 'OK' }]
                                            );
                                        }
                                    }).catch(downloadError => {
                                        console.error('Error downloading audio:', downloadError);
                                        Alert.alert(
                                            'Audio Error',
                                            'Failed to download audio file.',
                                            [{ text: 'OK' }]
                                        );
                                    });
                                } else {
                                    Alert.alert(
                                        'Audio Error',
                                        'Could not load audio after multiple attempts.',
                                        [{ text: 'OK' }]
                                    );
                                }
                            }
                    return;
                }
                
                        // Audio loaded successfully
                        console.log('Audio loaded successfully');
                newSound.setVolume(1.0);
                
                        // Get duration with a delay to ensure it's properly loaded
                        setTimeout(() => {
                const duration = newSound.getDuration();
                            console.log('Audio duration:', duration);
                            
                            if (duration && duration > 0) {
                    setAudioDuration(duration);
                    setSound(newSound);
                            } else {
                                // Try to get current time as fallback
                                newSound.getCurrentTime((seconds) => {
                                    console.log('Current time fallback:', seconds);
                                    setAudioDuration(seconds > 0 ? seconds : 30);
                                    setSound(newSound);
                                });
                            }
                        }, 500);
                    });
                } catch (e) {
                    console.error('Exception during audio loading:', e);
                    
                    if (attempt < maxAttempts - 1) {
                        setTimeout(() => {
                            loadAudioWithRetry(attempt + 1);
                        }, (attempt + 1) * 1000);
                    } else {
                        Alert.alert(
                            'Audio Error',
                            'An unexpected error occurred while loading audio.',
                            [{ text: 'OK' }]
                        );
                    }
                }
            };
            
            // Start loading the audio
            loadAudioWithRetry();
        }
        
        return () => {
            if (sound) {
                sound.release();
            }
        };
    }, [audioUrl, duration]);

    useEffect(() => {
        let interval;
        if (isAudioPlaying) {
            interval = setInterval(() => {
                if (sound && !isSeeking) { // Only update if not seeking
                    sound.getCurrentTime((seconds) => {
                        // Only update if not seeking to prevent jumps
                        if (!isSeeking) {
                            setAudioPosition(seconds);
                            onAudioProgress({
                                currentTime: seconds,
                                duration: audioDuration
                            });
                        }
                    });
                }
            }, 100);
        }
        
        return () => clearInterval(interval);
    }, [isAudioPlaying, sound, isSeeking, audioDuration]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: transcription || 'No transcription available.',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handlePress = async () => {
        if (transcriptionGeneratedFor.has(audioid)) return;
    
        setIsTranscriptionGenerating(true);
    
        try {
            const formData = new FormData();
            formData.append('uid', uid);
            formData.append('audioid', audioid);
    
            const response = await fetch('https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/convertAudio', {
                method: 'POST',
                body: formData,
            });
    
            const data = await response.json();
          
    
           
            
            if (response.ok) {
                setTranscriptionGeneratedFor(prev => new Set(prev).add(audioid));
                await fetchAudioMetadata(uid, audioid); // Reload data from API
            } else {
                console.error('Transcription generation failed:', await response.text());
            }
        } catch (error) {
            console.error('Error generating transcription:', error);
        } finally {
            setIsTranscriptionGenerating(false);
        }
    };
    
    const handleValueChange = (value) => {
        if (!sound) return;
        
        // Set seeking state to true to prevent position updates from the interval
        setIsSeeking(true);
        
        // Update position without triggering progress update during dragging
        setAudioPosition(value);
    };

    const handleSlidingComplete = (value) => {
        if (!sound) return;
        
        // Set the audio to the new position
        sound.setCurrentTime(value);
        
        // Update position
        setAudioPosition(value);
        
        // Use a small delay before triggering the progress update to prevent UI jumping
        setTimeout(() => {
            // Trigger progress update after a small delay
            onAudioProgress({
                currentTime: value,
                duration: audioDuration
            });
            
            // End seeking state
            setIsSeeking(false);
        }, 100);
    };

    const handleLayout = (event) => {
        const { width } = event.nativeEvent.layout;
        setSliderWidth(width);
    };

    // Calculate the position of the custom thumb
    const thumbPosition = (audioPosition / audioDuration) * sliderWidth;

    const handleTranslateParagraph = async (index) => {
        if (!paragraphs[index]) return;
    
        try {
            const response = await fetch(
                `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${selectedLanguage}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Ocp-Apim-Subscription-Key': azureKey,
                        'Ocp-Apim-Subscription-Region': region,
                    },
                    body: JSON.stringify([{ Text: paragraphs[index] }]),
                }
            );
    
            const data = await response.json();
            console.log('Paragraph Translation Response:', data);  // Log the response to check its structure
    
            // Check if the translation is available
            if (data && data[0] && data[0].translations && data[0].translations[0]) {
                const translation = data[0].translations[0].text;
    
                setTranslations((prev) => {
                    const updatedTranslations = [...prev];
                    updatedTranslations[index] = translation;
                    return updatedTranslations;
                });
            } else {
                console.error('Translation data is not in the expected format:', data);
            }
        } catch (error) {
            console.error('Translation error:', error);
        }
    };
   
    const handleFloatingButtonPress = () => {
        if (transcription) {
            navigation.navigate('BotScreen2', { transcription , XMLData,uid,audioid });
        } else {
            alert('No transcription to translate.');
        }
    };

    const fetchAudioMetadata = async (uid, audioid) => {
        try {
            setIsLoading(true);
            
            // Show audio player container with loading state
            setAudioDuration(100); // Temporary duration to show the player
            setAudioPosition(0);
            
            const response = await fetch('https://matrix-server.vercel.app/getAudioFile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uid, audioid }),
            });
            const data = await response.json();
            console.log(data);
            if (response.ok) {
                // Set state with fetched data
                setTranscription(data.transcription || '');
                setFileName(data.audio_name || 'Untitled');
                setFileContent(data.file_path || '');
                setDuration(data.duration || 0);

                // Directly use the audio_url from the response
                setAudioUrl(data.audio_url || '');

                // Process words_data if available
                if (data.words_data && Array.isArray(data.words_data) && data.words_data.length > 0) {
                    // Store the words data for highlighting
                    setWordTimings(processWordTimings(data.words_data));
                    
                    // Create paragraphs from words_data (100 words per paragraph)
                    const { paragraphs, words } = createParagraphsFromWordsData(data.words_data);
                    setParagraphs(paragraphs);
                } else {
                    // Fallback to the old method if words_data is not available
                    let paragraphs = [];
                    let wordTimings = [];
                    if (data.transcription) {
                        const { paragraphs: para, words } = splitTranscription(data.transcription);
                        paragraphs = para;
                        setParagraphs(para);
                        if (data.duration) {
                            wordTimings = calculateParagraphTimings(words, data.duration);
                            setWordTimings(wordTimings);
                        }
                    }
                }

                // Set key points and XML data
                setKeypoints(data.key_points || '');
                setXMLData(data.xml_data || '');
            } else {
                console.error('Error fetching audio metadata:', data.error);
                Alert.alert('Error', 'Failed to load audio data');
            }
        } catch (error) {
            console.error('Error in fetchAudioMetadata:', error);
            Alert.alert('Error', 'An unexpected error occurred while loading audio data');
        } finally {
            setIsLoading(false);
        }
    };

    // New function to process words_data into a format suitable for highlighting
    const processWordTimings = (wordsData) => {
        if (!wordsData || !Array.isArray(wordsData)) return [];
        
        // Filter out words with invalid timing data
        const validWordsData = wordsData.filter(word => 
            word && 
            typeof word.start === 'number' && 
            typeof word.end === 'number' && 
            !isNaN(word.start) && 
            !isNaN(word.end) && 
            word.start >= 0 && 
            word.end >= word.start
        );
        
        // If no valid words, return empty array
        if (validWordsData.length === 0) return [];
        
        // Group words into paragraphs (100 words per paragraph)
        const wordsPerParagraph = 100;
        const paragraphCount = Math.ceil(validWordsData.length / wordsPerParagraph);
        
        return Array(paragraphCount).fill(0).map((_, index) => {
            const startIdx = index * wordsPerParagraph;
            const endIdx = Math.min((index + 1) * wordsPerParagraph, validWordsData.length);
            const paragraphWords = validWordsData.slice(startIdx, endIdx);
            
            // Ensure all words in the paragraph have valid timing data
            const validParagraphWords = paragraphWords.map(word => {
                // Create a copy to avoid modifying the original
                const wordCopy = {...word};
                
                // Ensure start and end are valid numbers
                if (typeof wordCopy.start !== 'number' || isNaN(wordCopy.start) || wordCopy.start < 0) {
                    // If invalid start, use previous word's end or 0
                    const prevWordIdx = paragraphWords.indexOf(word) - 1;
                    wordCopy.start = prevWordIdx >= 0 ? paragraphWords[prevWordIdx].end : 0;
                }
                
                if (typeof wordCopy.end !== 'number' || isNaN(wordCopy.end) || wordCopy.end < wordCopy.start) {
                    // If invalid end, estimate based on average word duration or add small offset
                    wordCopy.end = wordCopy.start + 0.3; // Default 300ms per word if no better estimate
                }
                
                return wordCopy;
            });
            
            // Calculate paragraph start and end times
            const paraStart = validParagraphWords.length > 0 ? validParagraphWords[0].start : 0;
            const paraEnd = validParagraphWords.length > 0 ? 
                validParagraphWords[validParagraphWords.length - 1].end : 0;
            
            return {
                start: paraStart,
                end: paraEnd,
                words: validParagraphWords
            };
        });
    };

    // New function to create paragraphs from words_data
    const createParagraphsFromWordsData = (wordsData) => {
        if (!wordsData || !Array.isArray(wordsData)) {
            return { paragraphs: [], words: [] };
        }
        
        // Filter out invalid word data and ensure we have text for each word
        const validWordsData = wordsData.filter(wordData => 
            wordData && (wordData.punctuated_word || wordData.word)
        );
        
        // Extract all words, using punctuated_word if available, falling back to word
        const words = validWordsData.map(wordData => {
            // Use punctuated_word if available, otherwise use word
            // If neither is available (shouldn't happen due to filter), use empty string
            return wordData.punctuated_word || wordData.word || '';
        });
        
        // Group into paragraphs (100 words per paragraph)
        const wordsPerParagraph = 100;
        const paragraphs = [];
        
        for (let i = 0; i < words.length; i += wordsPerParagraph) {
            const paragraphWords = words.slice(i, i + wordsPerParagraph);
            // Join words with space, trim any extra spaces
            const paragraphText = paragraphWords.join(' ').replace(/\s+/g, ' ').trim();
            paragraphs.push(paragraphText);
        }
        
        return { paragraphs, words };
    };

    // Update the useEffect for component lifecycle
    useEffect(() => {
        // Set isMounted to true when component mounts
        isMounted.current = true;
        
        // Fetch data on mount
        fetchAudioMetadata(uid, audioid);
        
        // Clean up function
        return () => {
            isMounted.current = false;
            
            // Release sound resources
            if (sound) {
                sound.release();
            }
            
            // Clear any pending timeouts
            if (userScrollTimeoutRef.current) {
                clearTimeout(userScrollTimeoutRef.current);
            }
        };
    }, [uid, audioid]);

    const toggleTranscriptionVisibility = () => {
        setTranscriptionVisible(!isTranscriptionVisible);
        
        // If turning on translations, translate all paragraphs
        if (!isTranscriptionVisible) {
            paragraphs.forEach((_, index) => handleTranslateParagraph(index));
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer2}>
                <Image source={require('../assets/logo10.png')} style={styles.headerTitle} />
            </View>
                 <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                    <Image
                        source={require('../assets/back.png')}
                        style={styles.icon}
                    />
                </TouchableOpacity>
                <Text style={styles.header}>
                    {fileName.length > 20 ? `${fileName.substring(0, 20)}...` : fileName}
                </Text>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                        <Image
                            source={require('../assets/share.png')}
                            style={styles.icon}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={toggleSlider}>
                        <Image
                            source={require('../assets/threeDot.png')}
                            style={styles.icon}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            {/* Header Section */}
            {isLoading ? (
                <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
            ) : (
                <>
       
                </>
            )}

{audioUrl && (
    <Animated.View style={[
        styles.audioPlayerContainer,
        {
          height: playerHeight,
          padding: playerPadding,
          borderRadius: playerPadding,
        }
      ]}>
        {/* Lottie Animation at the top */}
  
        {/* Container for inputRange: 120 */}
        <Animated.View style={[
            styles.audioControlsContainer2,
          {
            opacity: playerHeight.interpolate({
              inputRange: [60, 120],
              outputRange: [1, 0], // Visible at 120, hidden at 60
              extrapolate: 'clamp'
            }),
            transform: [
              {
                scale: playerHeight.interpolate({
                  inputRange: [60, 120],
                  outputRange: [0.8, 1], // Optional: Add a scaling effect
                  extrapolate: 'clamp'
                })
              }
            ]
          }
        ]}>
       
            {/* Play/Pause Button */}
            <TouchableOpacity onPress={toggleAudioPlayback} style={styles.playButton}>
              <View style={[styles.playButton2]}>
                <Image
                  source={isAudioPlaying ? require('../assets/pause.png') : require('../assets/play.png')}
                  style={styles.playIcon2}
                />
              </View>
            </TouchableOpacity>
  
            {/* Slider (80% width) */}
            <Animated.View style={[
              styles.waveformBox2,
              {
                width: '80%', // Fixed 80% width
                height: playerHeight._value - 40,
              }
            ]}>
              <View style={[styles.waveformContainer, {
                height: playerHeight._value - 40,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center', // Center slider horizontally
              }]}>
                {/* Slider with Progress Trail */}
                <View style={styles.container69} onLayout={handleLayout}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={audioDuration}
                  value={audioPosition}
                  onValueChange={handleValueChange}
                  onSlidingComplete={handleSlidingComplete}
                  minimumTrackTintColor="transparent"
                  maximumTrackTintColor="transparent"
                  thumbTintColor="orange" // Hide the default thumb
                />
               
              
                </View>
  
                {/* Lottie Animation for Waves */}
                <View style={styles.waveAnimationContainer}>
                  <LottieView
                    source={require('../assets/waves.json')} // Add your Lottie animation JSON here
                    autoPlay={isAudioPlaying} // Sync with audio playback
                    loop
                    style={styles.waveAnimation}
                  />
                  {/* Mask to Reveal Animation */}
                  <Animated.View
                    style={[
                      styles.mask,
                      {
                        width: `${100 - (audioPosition / audioDuration) * 100}%`, // Dynamic width based on progress
                      }
                    ]}
                  />
                </View>
              </View>
            </Animated.View>
        
        </Animated.View>
  
        {/* Container for inputRange: 60 */}
        <Animated.View style={[
          styles.audioControlsContainer,
          {
            opacity: playerHeight.interpolate({
              inputRange: [60, 120],
              outputRange: [0, 1], // Visible at 60, hidden at 120
              extrapolate: 'clamp'
            }),
            transform: [
              {
                scale: playerHeight.interpolate({
                  inputRange: [60, 120],
                  outputRange: [0.8, 1], // Optional: Add a scaling effect
                  extrapolate: 'clamp'
                })
              }
            ]
          }
        ]}>
          {/* Slider (100% width) */}
          <Animated.View style={[
            styles.waveformBox,
            {
              width: '95%', // Full width
              height: playerHeight._value - 40,
            }
          ]}>
            <View style={[styles.waveformContainer, {
              height: playerHeight._value - 40,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center', // Center slider horizontally
            }]}>
              {/* Slider with Progress Trail */}
              <View style={styles.container69} onLayout={handleLayout}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={audioDuration}
                  value={audioPosition}
                  onValueChange={handleValueChange}
                  onSlidingComplete={handleSlidingComplete}
                  minimumTrackTintColor="transparent"
                  maximumTrackTintColor="transparent"
                  thumbTintColor="transparent" // Hide the default thumb
                />
                {/* Custom Thumb */}
                <View
                  style={[
                    styles.customThumb,
                    { left: thumbPosition -1 }, // Adjust for thumb width
                  ]}
                />
              </View>
  
              {/* Lottie Animation for Waves */}
              <View style={styles.waveAnimationContainer2}>
                <LottieView
                  source={require('../assets/waves.json')} // Add your Lottie animation JSON here
                  autoPlay={isAudioPlaying} // Sync with audio playback
                  loop
                  style={styles.waveAnimation2}
                />
                {/* Mask to Reveal Animation */}
                <Animated.View
                  style={[
                    styles.mask2,
                    {
                      width: `${100 - (audioPosition / audioDuration) * 100}%`, // Dynamic width based on progress
                    }
                  ]}
                />
              </View>
            </View>
          </Animated.View>
  
          {/* Time Container */}
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, styles.leftTime]}>{formatTime(audioPosition)}</Text>
            <Text style={[styles.timeText, styles.rightTime]}>{formatTime(audioDuration)}</Text>
          </View>
  
          {/* Additional Controls */}
          <Animated.View style={[styles.controls, {
            opacity: playerHeight.interpolate({
              inputRange: [60, 120],
              outputRange: [0, 1], // Visible at 60, hidden at 120
              extrapolate: 'clamp'
            })
          }]}>
            <TouchableOpacity onPress={() => setIsRepeatMode(!isRepeatMode)}>
              <Image
                source={require('../assets/repeat.png')}
                style={[
                  styles.navIcon2,
                  { tintColor: isRepeatMode ? 'orange' : 'gray' } // Change color based on state
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => seekAudio(-10)}>
              <Image
                source={require('../assets/backward.png')}
                style={styles.navIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleAudioPlayback}>
              <Image
                source={isAudioPlaying ? require('../assets/pause.png') : require('../assets/play.png')}
                style={styles.playIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => seekAudio(10)}>
              <Image
                source={require('../assets/forward.png')}
                style={styles.navIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlaybackSpeed}>
              <Image
                source={require('../assets/2x.png')}
                style={[
                  styles.navIcon2,
                  { tintColor: is2xSpeed ? 'orange' : 'gray' } // Change color based on state
                ]}
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
)}




            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={[styles.button, selectedButton === 'transcription' ? styles.selectedButton : null]}
                    onPress={() => handleButtonPress('transcription')}>
                    {selectedButton === 'transcription' ? (
                        <LinearGradient
                            colors={['#13EF97', '#1D8EC4']} // Gradient colors
                            style={styles.gradientButton} // Use a new style for the gradient
                            start={{ x: 1, y: 0 }}
                            end={{ x: 0, y: 0 }}
                        >
                            <Text style={styles.buttonText2}>
                                Transcription
                            </Text>
                        </LinearGradient>
                    ) : (
                        <Text style={styles.buttonText}>
                            Transcription
                        </Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, selectedButton === 'mindMap' ? styles.selectedButton : null]}
                    onPress={() => handleButtonPress('mindMap')}>
                    {selectedButton === 'mindMap' ? (
                        <LinearGradient
                            colors={['#13EF97', '#1D8EC4']} // Gradient colors
                            style={styles.gradientButton} // Use a new style for the gradient
                            start={{ x: 1, y: 0 }}
                            end={{ x: 0, y: 0 }}
                        >
                            <Text style={styles.buttonText2}>
                                Mind Map
                            </Text>
                        </LinearGradient>
                    ) : (
                        <Text style={styles.buttonText}>
                            Mind Map
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        


{isTranscriptionEmpty && (
    <Text style={styles.generatingText}>Generating Transcription May take some time...</Text>
)}

            {selectedButton === 'transcription' && (
                <ScrollView 
                    ref={scrollViewRef}
                    style={styles.contentContainer}
                    onScroll={(event) => {
                        const offsetY = event.nativeEvent.contentOffset.y;
                        scrollY.setValue(offsetY);
                    }}
                    onScrollBeginDrag={() => {
                        setIsUserScrolling(true);
                        // Cancel any pending reset of user scrolling state
                        if (userScrollTimeoutRef.current) {
                            clearTimeout(userScrollTimeoutRef.current);
                        }
                    }}
                    onScrollEndDrag={() => {
                        // Set a timeout to reset the user scrolling state
                        if (userScrollTimeoutRef.current) {
                            clearTimeout(userScrollTimeoutRef.current);
                        }
                        userScrollTimeoutRef.current = setTimeout(() => setIsUserScrolling(false), 3000);
                    }}
                    onMomentumScrollEnd={() => {
                        // Set a timeout to reset the user scrolling state
                        if (userScrollTimeoutRef.current) {
                            clearTimeout(userScrollTimeoutRef.current);
                        }
                        userScrollTimeoutRef.current = setTimeout(() => setIsUserScrolling(false), 3000);
                    }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    scrollEventThrottle={16}
                >
                    
                    {paragraphs.map((para, index) => (
                        <View key={index} style={[
                            styles.paragraphContainer,
                            styles.paragraphWrapper,
                            index === currentWordIndex.paraIndex && styles.highlightedParagraph
                        ]}>
                            {isSpeechToTextEnabled && (
                                <Text style={[styles.timestamp, {color: 'orange'}]}>
                                    {formatTime(wordTimings[index]?.start || 0)}
                                </Text>
                            )}
                            <View style={styles.paragraphRow}>
                                {editingStates[index] ? (
                                    <TextInput
                                        style={[
                                            styles.paragraphText,
                                            styles.editableText,
                                            index === currentWordIndex.paraIndex && styles.highlightedParagraph
                                        ]}
                                        value={para}
                                        onChangeText={(text) => {
                                            const newParagraphs = [...paragraphs];
                                            newParagraphs[index] = text;
                                            setParagraphs(newParagraphs);
                                        }}
                                        multiline
                                    />
                                ) : (
                                    index === currentWordIndex.paraIndex && wordTimings[index]?.words ? (
                                        <Text style={styles.paragraphText}>
                                            {wordTimings[index].words.map((wordData, wordIdx) => {
                                                const word = wordData.punctuated_word || wordData.word;
                                                return (
                                                    <Text 
                                                        key={wordIdx} 
                                                        style={wordIdx === currentWordIndex.wordIndex ? styles.highlightedWord : styles.word}
                                                    >
                                                        {word}{' '}
                                                    </Text>
                                                );
                                            })}
                                        </Text>
                                    ) : (
                                        <Text style={[
                                            styles.paragraphText,
                                            index === currentWordIndex.paraIndex && styles.highlightedParagraph
                                        ]}>
                                            {para}
                                        </Text>
                                    )
                                )}
                              
                            </View>
                            {/* Move the pencil icon above the paragraph */}
                            {isEditingEnabled && (
                                <TouchableOpacity 
                                    onPress={() => toggleEdit(index)}
                                    style={styles.editIconAbove}
                                >
                                    <Image
                                        source={require('../assets/pencil.png')}
                                        style={styles.pencilIcon}
                                    />
                                </TouchableOpacity>
                            )}
                            {isTranscriptionVisible && translations[index] && (
                                <Text style={styles.translatedText}>{translations[index]}</Text>
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}


{selectedButton === 'mindMap' && (
    <View style={styles.contentContainer}>
                   <ForceDirectedGraph 
                     ref={graphRef}
                     transcription={transcription} 
                     uid={uid} 
                     audioid={audioid} 
                     xmlData={XMLData} 
                   />



                   <View style={{flexDirection: 'row', position: 'absolute', bottom: 10, left: '15%'}}>
           
            <TouchableOpacity 
                onPress={() => setIsFullScreen(true)} 
                style={styles.centerFloatingButton}
            >
                <Image
                    source={require('../assets/maximize.png')}
                    style={styles.buttonImage3}
                />
            </TouchableOpacity>
       
            </View>
                </View>

            )}


            {/* Floating Buttons */}
          
            <TouchableOpacity onPress={handleFloatingButtonPress} style={styles.floatingButton2}>
                <Image source={resizeIcon} style={styles.buttonImage} />
            </TouchableOpacity>

            {/* Full Screen Modal */}
            <Modal
                visible={isFullScreen}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setIsFullScreen(false)}
            >
                <View style={styles.fullScreenContainer}>
                    <View style={styles.fullScreenGraphContainer}>
                        <ForceDirectedGraph2 transcription={transcription} uid={uid} audioid={audioid} xmlData={XMLData} />
                    </View>
                    <TouchableOpacity 
                        onPress={() => setIsFullScreen(false)} 
                        style={styles.closeFullScreenButton}
                    >
                        <Image
                            source={require('../assets/close.png')}
                            style={styles.closeIcon}
                        />
                    </TouchableOpacity>
                </View>
            </Modal>
          
      {/* Slider with Toggle Buttons */}
{isSliderVisible && (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <View style={styles.sliderContainer}>
            {/* Show Translation Section */}
            <View style={styles.sliderContent}>
                <Text style={styles.sliderText}>Show Translation</Text>
              
                {/* Language Dropdown */}
             <View style={styles.pickerContainer}>
             
                <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)} style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {languages.find(lang => lang.value === selectedLanguage)?.label || 'Select'}
                </Text>
            </TouchableOpacity>

            {/* Custom Dropdown Modal */}
            {showDropdown && (
               <Modal
               transparent={true}
               animationType="slide"  // Change animation to 'slide'
               visible={showDropdown}
               onRequestClose={() => setShowDropdown(false)}
             >
               <View style={styles.modalOverlay}>
                 <View style={styles.dropdownList}>
                   <FlatList
                     data={languages}
                     keyExtractor={(item) => item.value}
                     renderItem={({ item }) => (
                       <TouchableOpacity 
                         onPress={() => handleSelectLanguage(item.value)} 
                         style={styles.dropdownItem}
                       >
                         <Text style={styles.dropdownItemText}>{item.label}</Text>
                         {selectedLanguage === item.value && (
                           <Image 
                             source={require('../assets/Tick.png')} // Update this path to your tick.png location
                             style={styles.tickIcon} 
                           />
                         )}
                       </TouchableOpacity>
                     )}
                     ItemSeparatorComponent={() => <View style={styles.separator} />}
                   />
                 </View>
               </View>
             </Modal>
            )}
            </View>
              <Switch
                    value={isTranscriptionVisible}
                    onValueChange={toggleTranscriptionVisibility}
                />
            </View>

            {/* Show Editing Section */}
            <View style={styles.sliderContent}>
                <Text style={styles.sliderText}>Show Editing</Text>
                <Switch
                    value={isEditingEnabled}
                    onValueChange={toggleTextEditing}
                />
            </View>

            {/* Show Date Section */}
            <View style={styles.sliderContent}>
                <Text style={styles.sliderText}>Show Time</Text>
                <Switch
                    value={isSpeechToTextEnabled}
                    onValueChange={toggleSpeechToText}
                />
            </View>
        </View>
    </TouchableWithoutFeedback>
)}

            {/* Display the Mind Map if it's toggled on */}
         
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({

    progressTrail: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'white', // This acts as the mask
        overflow: 'hidden', // Ensures the Lottie animation is clipped
    },
    waveAnimation: {
        width: '100%', // Ensure the Lottie animation covers the entire width
        height: '100%', // Ensure the Lottie animation covers the entire height
    },
    container69: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      },
     
    linePointer: {
        width: 2,
        height: 40,
        backgroundColor: 'orange', // Color of the line pointer
        borderRadius: 0, // No border radius for a straight line
    },
    waveAnimationContainer: {
        position: 'absolute',
        width: '100%', // Cover the entire waveform box
        height: '100%',
        borderRadius:50,
        overflow: 'hidden', // Clip the animation
    },
    waveAnimationContainer2: {
        position: 'absolute',
        width: '100%', // Cover the entire waveform box
        height: '100%',
        overflow: 'hidden', // Clip the animation
        marginBottom: -20,
       
    },
    waveAnimation: {
        width: '200%', // Full width
        height: '250%', // Full height
    },
    waveAnimation2: {
        width: '150%', // Full width
        height: '250%', // Full height
    
    },
    mask: {
        position: 'absolute',
        right: 0, // Start from the right
        top: 0,
        bottom: 0,
        backgroundColor: '#F2F3F7', // Acts as the mask
    },
    mask2: {
        position: 'absolute',
        right: 0, // Start from the right
        top: 0,
        bottom: 0,
        backgroundColor: 'white', // Acts as the mask
    },
    audioPlayerContainer: {
        marginTop: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    audioControlsContainer: {
        position: 'absolute',
        backgroundColor: '#F2F3F7',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', // Adjust width as needed
        borderRadius:10,
    },
    audioControlsContainer2: {
       flexDirection:'row',
       alignItems: 'center',
       justifyContent: 'center',
      
       position: 'absolute',
       backgroundColor: '#F2F3F7',
       borderRadius:50,
       paddingLeft:15,
       paddingRight:15,
       width: '100%', // Adjust width as needed

    },
    waveformBox: {
        backgroundColor: '#FFFFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius:10,
        width: '80%', // Adjust width as needed
    },
    waveformBox2: {
        
        justifyContent: 'center',
        alignItems: 'center',
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
   
    waveform: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
    },
    waveformBar: {
        width: 4,
        backgroundColor: '#007bff',
        marginHorizontal: 1,
        borderRadius: 2,
        minHeight: 10,
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
    customThumb: {
        position: 'absolute',
        width: 5,
        height: 90,
        borderRadius:50,
        backgroundColor: 'orange',
        borderRadius: 0,
      
        zIndex:200,
      },
      headerTitle: {
        width: 250,
        height: 80,
        resizeMode: 'contain',
       
        
        left:'25%',
        position:'absolute',
      },
    container: {
        flex: 1,
        backgroundColor: '#fff',
         
    },
    container2: {
        backgroundColor: '#2CF105FF',
        paddingVertical: 10,
      },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor:'#fff',
    },
    headerContainer2: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
       
        backgroundColor:'#fff',
    },
    overlayButtonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
       
      
    },
    
    blueButton: {
        backgroundColor: '#007BFF',
       width:150,
        borderRadius: 20,
        
       
        marginLeft: 120,
       
        padding: 8, // Adjust padding for better touch area
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5, // Adds shadow for Android
        shadowColor: '#000', // Adds shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    detailIcon2: {
        width: 14,
        height: 14,
        resizeMode: 'contain',
    },
    convert:{
        marginRight:5,
        fontSize:12,
        color:'#fff',
            },
            convert2:{
                marginRight:5,
                fontSize:16,
                color:'#fff',
                    },
  
    translatedText: {
        color: '#007bff',
        fontSize: 16,
        marginTop: 4,
    },
    word: {
        color: '#333',
        fontSize: 16,
        lineHeight: 24,
    },
    paragraphRow:{
flexDirection:'row',
    },
    playButton2:{
        marginRight:10,
    
        backgroundColor: '#007BFFFF',
        padding:10,
        borderRadius:50,
    },
    highlightedWord: {
        backgroundColor: '#007bff',
        color: '#ffffff',
        borderRadius: 4,
        paddingHorizontal: 2,
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      dropdownList: {
        width: '100%',
        backgroundColor: 'white',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
      },
      dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 5,
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
      
      },
      loadingText: {
        color: '#666',
        fontSize: 16,
      },
      controls: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginTop: -10,
        marginBottom:10,
      },
      icon: {
        width: 30,
        height: 30,
        tintColor: '#007bff',
      },
      icon2: {
        width: 30,
        height: 30,
        tintColor: '#ffffff',
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
   
    
      navIcon: {
        width: 24,
        height: 24,
        tintColor: '#007bff',
        marginHorizontal: 40,
      },
      navIcon2: {
        width: 24,
        height: 24,
        tintColor: '#007bff',
        marginHorizontal: -10,
      },
      playIcon: {
        width: 32,
        height: 32,
        tintColor: '#007bff',
      },
      playIcon2: {
        width: 32,
        height: 32,
        tintColor: '#ffffff',
      },
      separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 5,
      },
      tickIcon: {
   
     alignSelf:'flex-end',
        width:20,
        height:20,
        tintColor:'#0076EDFF'
      },
    button: {
        flex: 1,
        borderColor: '#1D8EC4',
        borderWidth: 1,
     
        margin: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    button2: {
        marginTop: 20,
        alignSelf: 'center',
        padding: 10,
        backgroundColor: '#007bff',
        borderRadius: 5,
      },
    buttonText: {
        color: '#007BFF',
        fontWeight: '600',
        marginVertical:5,
    },
    buttonText2: {
        color: '#fff',
        fontWeight: '600',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    dropdownButton: {
        padding: 5,
        backgroundColor: '#007BFF',
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    dropdownButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dropdownList: {
        backgroundColor: '#fff',
        width: '100%',
        borderRadius: 10,
   
    },
    selectedButton: {
      
        borderWidth:0,
        borderRadius:10,
        marginVertical:5,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    dropdownItemText: {
        fontSize: 16,
    },
    paragraphContainer: {
        marginBottom: 16,
    },
    paragraphWrapper: {
        padding: 8,
        borderRadius: 4,
    },
    highlightedParagraph: {
        backgroundColor: '#007bff20',
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
        paddingLeft: 12,
    },
    paragraphText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        flex: 1,
        marginBottom: 8,
    },
    editableText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        flex: 1,
        padding: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 4,
    },
    timestamp: {
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '500',
    },
    
    mindMapContainer: {
        padding: 20,
        backgroundColor: '#f1f1f1',
        borderRadius: 10,
        marginTop: 10,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    mindMapText: {
        fontSize: 18,
        color: '#333',
    },
    header: {
        fontSize: 13,
        fontWeight: '600',
        alignSelf:'center',
        position:'absolute',
        left:'45%',
    },
    iconButton: {
        padding: 8,
    },
    icon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
    languageInput: {
        fontSize: 16,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#007bff',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
 
 
    buttonText2: {
        color: '#fff',
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    transcriptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        flex: 1,
    },
    content2: {
        fontSize: 12,
        lineHeight: 24,
        color: '#8A8A8AAE',
        flex: 1,
    },
    languageDropdownContainer: {
        position: 'absolute', // Position it absolutely at the top
        top: 20, // Adjust this as necessary to position it where you want
        left: 10,
        right: 10,
        zIndex: 10, // Ensure it appears above other elements
    },
    pickerContainer: {
        width: '30%',
      marginRight:30,
    },
    picker: {
        backgroundColor: '#fff',
        borderColor: '#007BFF',
        borderWidth: 1,
        borderRadius: 5,
    },
    dropDownStyle: {
        backgroundColor: '#fafafa',
        maxHeight: 200, // Limit the height of the dropdown
    },
    textInput: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#007bff',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 90,
        right: 90,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        shadowColor: '#007BFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    floatingButton2: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 101,
        shadowColor: '#007BFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    buttonImage: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    buttonImage2: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
    },
    buttonImage3: {
        width: 30,
        height: 30,
      
        resizeMode: 'contain',
        tintColor:'#ffffff',
    },
    buttonImage4: {
        width: 30,
        height: 30,
      
        resizeMode: 'cover',
        tintColor:'#ffffff',
    },
    sliderContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 105,
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: -3 },
    },
    sliderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    sliderText: {
        fontSize: 16,
        flex: 1,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalText: {
        fontSize: 18,
        marginBottom: 20,
    },
    closeButton: {
        backgroundColor: '#FF6600',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    centerFloatingButton: {
        position: 'absolute',
        bottom: 80,
        left: '15%',
        marginLeft: -30, // Half of button width to center
        width: 50,
        height: 50,
        borderRadius: 30,
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
       
    },
   
    centerFloatingButton2: {
        position: 'absolute',
        bottom: 160,
        marginLeft: 25,
        width: 50,
        height: 50,
        borderRadius: 30,
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
       
    },
    fullScreenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: '#fff',
        padding: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenGraphContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
       marginTop:20,
       marginRight:-10,
        padding: 10,
        overflow: 'hidden',
    },
    closeFullScreenButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FF6600',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1005,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
    },
    closeIcon: {
        width: 20,
        height: 20,
        tintColor: '#fff',
    },
    pencilIcon: {
        width: 20,
        height: 20,
        tintColor: '#007bff',
        marginLeft: 8,
    },
    editIcon: {
        padding: 4,
    },
    editIconAbove: {
        position: 'absolute',
        right: 10, // Adjust as necessary for spacing
        top: 5, // Position it above the paragraph
        zIndex: 1, // Ensure it appears above other elements
    },
    gradientButton: {
       width:'100%',
       height:32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius:10,
    },
});

export default TranslateScreen;
