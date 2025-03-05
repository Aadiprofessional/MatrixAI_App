import React, { useState, useEffect } from 'react';
import { View, Text, Button, PermissionsAndroid, Platform, StyleSheet } from 'react-native';
import Voice from '@react-native-voice/voice';

// Request microphone permissions (needed for Android, optional for iOS)
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
        // Attach listeners to handle speech events
        Voice.onSpeechStart = () => setIsRecording(true);
        Voice.onSpeechEnd = () => setIsRecording(false);
        Voice.onSpeechResults = (event) => setText(event.value[0]); // Get first result

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    // Start voice recognition
    const startListening = async () => {
        const permissionGranted = await requestPermissions();
        if (permissionGranted) {
            try {
                await Voice.start('en-US'); // Start listening for speech
            } catch (error) {
                console.error(error);
            }
        }
    };

    // Stop voice recognition
    const stopListening = async () => {
        try {
            await Voice.stop();
            setIsRecording(false);
        } catch (error) {
            console.error(error);
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
