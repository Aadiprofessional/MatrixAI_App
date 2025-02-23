import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VoiceSettingsScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Voice Settings Screen</Text>
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

export default VoiceSettingsScreen;
