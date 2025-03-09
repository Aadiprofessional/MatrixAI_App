import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TrashScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Trash Screen</Text>
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

export default TrashScreen;
