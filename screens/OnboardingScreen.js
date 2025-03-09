import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation,onFinish }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef(null);

    const slides = [
        {
            title: "Welcome to Matrix AI",
            description: "Unlimited audio files (up to 500 hours)",
            image: require('../assets/OnBoard/1.png'),
        },
        {
            title: "Generate with 150 Languages, AI Voices",
            description: "Unlimited audio files (up to 500 hours)",
            image: require('../assets/OnBoard/2.png'),
        },
        {
            title: "Generate Video, Image With AI",
            description: "Unlimited audio files (up to 500 hours)",
            image: require('../assets/OnBoard/3.png'),
        },
        {
            title: "Generate Document, And Buy on AI Shop",
            description: "Unlimited Document files (up to 500 hours)",
            image: require('../assets/OnBoard/4.png'),
        },
    ];

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            scrollViewRef.current.scrollTo({ x: (currentIndex + 1) * width, animated: true });
            setCurrentIndex(currentIndex + 1);
        } else {
            navigation.replace('Login'); // Use navigation prop here
        }
    };


    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        setCurrentIndex(index);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                ref={scrollViewRef}
                scrollEventThrottle={16}
            >
                {slides.map((slide, index) => (
                    <View key={index} style={styles.slide}>
                        <View style={styles.imageContainer}>
                            <Image source={slide.image} style={styles.image} />
                        </View>
                        <Text style={styles.title}>{slide.title}</Text>
                        <Text style={styles.description}>{slide.description}</Text>
                    </View>
                ))}
            </ScrollView>
            <View style={styles.paginationContainer}>
                <View style={styles.pagination}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentIndex === index && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>
                    {currentIndex === slides.length - 1 ? "Enjoy" : "Next"}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    slide: {
        width,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
    },
    imageContainer: {
        height: height * 0.6, // Container takes 70% of screen height
        width: '100%', // Full width
        justifyContent: 'center', // Center the image within the container
        alignItems: 'center',
    },
    image: {
        height: '100%', // Image height is dynamic within the container
        width: '100%', // Restrict the width to 80% of the container
        resizeMode: 'contain', // Scale the image without distortion
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 120,
        alignItems: 'center',
        width: '100%',
    },
    pagination: {
        flexDirection: 'row',
        backgroundColor: '#2274F0',
        padding: 10,
        borderRadius: 20,
        elevation: 2,
    },
    dot: {
        height: 8,
        width: 8,
        backgroundColor: '#FFFFFF32',
        borderRadius: 9,
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: '#fff',
        width: 16,
    },
    button: {
        position: 'absolute',
        bottom: 50,
        backgroundColor: '#2274F0',
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 25,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OnboardingScreen;
