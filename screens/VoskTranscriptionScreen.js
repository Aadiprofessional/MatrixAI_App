import React, { useState, useEffect } from 'react';
import { View, Text, Button, PermissionsAndroid, Platform, StyleSheet } from 'react-native';
import Voice from '@react-native-voice/voice';
import Vosk from 'react-native-vosk';

// Request microphone permission (Android only)
const requestPermissions = async () => {
    if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
                title: 'Microphone Permission',
                message: 'This app needs microphone access to recognize speech.',
                buttonPositive: 'OK',
            }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
};

const VoskTranscriptionScreen = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [text, setText] = useState('');

    useEffect(() => {
        if (Platform.OS === 'ios') {
            Voice.onSpeechStart = () => setIsRecording(true);
            Voice.onSpeechEnd = () => setIsRecording(false);
            Voice.onSpeechResults = (event) => setText(event.value[0]); // Get first result
        }
        return () => {
            if (Platform.OS === 'ios') {
                Voice.destroy().then(Voice.removeAllListeners);
            }
        };
    }, []);

    // Initialize Vosk for Android
    const startListeningAndroid = async () => {
        console.log("Button Clicked: Requesting Permissions...");
        const permissionGranted = await requestPermissions();
        
        if (permissionGranted) {
            console.log("Permission Granted: Initializing Vosk...");
            Vosk.start()
                .then(() => {
                    console.log("Vosk Started Successfully!");
                    setIsRecording(true);
                    Vosk.onResult((result) => {
                        console.log("Vosk Result:", result.text);
                        setText(result.text);
                    });
                })
                .catch((error) => console.error("Vosk Error:", error));
        } else {
            console.log("Permission Denied!");
        }
    };
    

    const stopListeningAndroid = async () => {
        Vosk.stop();
        setIsRecording(false);
    };

    // Start listening (iOS or Android)
    const startListening = () => {
        if (Platform.OS === 'ios') {
            Voice.start('en-US');
        } else {
            startListeningAndroid();
        }
    };

    // Stop listening (iOS or Android)
    const stopListening = () => {
        if (Platform.OS === 'ios') {
            Voice.stop();
        } else {
            stopListeningAndroid();
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Vosk Speech-to-Text</Text>
            <Text style={styles.transcription}>{text || "Start speaking..."}</Text>

            <Button 
                title={isRecording ? "Stop Recording" : "Start Recording"} 
                onPress={isRecording ? stopListening : startListening} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f4f4f4',
    },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    transcription: {
        fontSize: 18,
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
});

export default VoskTranscriptionScreen;
