import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const InsideScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Inside Screen</Text>
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

export default InsideScreen;
