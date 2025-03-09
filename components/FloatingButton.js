import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Image, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ChatSlider from './ChatSlider';

const FloatingButton = () => {
    const [isSliderVisible, setIsSliderVisible] = useState(false);
    const navigation = useNavigation();

    const handlePress = () => {
        navigation.navigate('BotScreen',{chatName:'New Chat'});
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                onPress={handlePress} 
                style={styles.floatingButton}
            >
                <Image
                    source={require('../assets/robot.png')}
                    style={styles.buttonImage}
                />
            </TouchableOpacity>

            <ChatSlider 
                isVisible={isSliderVisible} 
                toggleModal={() => setIsSliderVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90,
        right: 20,
    },
    floatingButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
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
});

export default FloatingButton;
