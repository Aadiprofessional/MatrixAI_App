import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VoiceNoteScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Voice Note Screen</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default VoiceNoteScreen;
