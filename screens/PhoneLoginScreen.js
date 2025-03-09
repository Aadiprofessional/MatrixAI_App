import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Dimensions, ActivityIndicator, Modal, Pressable
} from 'react-native';
import flagUS from '../assets/flags/usa.jpeg'; // Example for US flag
import flagIN from '../assets/flags/india.jpeg'; // Example for India flag
import flagOTHER from '../assets/flags/china.jpeg'; // Example for other flags
import { SafeAreaView } from 'react-native-safe-area-context';  
const { width } = Dimensions.get('window');

const PhoneLoginScreen = ({ navigation }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false); // State to manage loading
    const [countryCode, setCountryCode] = useState('+91'); // Default to India
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const countryCodes = [
        { label: '+1', value: '+1', flag: flagUS },
        { label: '+91', value: '+91', flag: flagIN },
        { label: '+8', value: '+8', flag: flagOTHER },
    ];

    const handleLogin = async () => {
        const formattedPhone = `${countryCode}${phone.trim()}`;
        if (phone.trim() === '' || phone.length !== 10 || /\s/.test(phone)) {
            alert('Please enter a valid 10-digit phone number without spaces!');
            return;
        }
    
        setLoading(true);
    
        try {
            const response = await fetch('https://matrix-server.vercel.app/sendPhoneOtp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: formattedPhone }),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('API Response:', data);  // For debugging
    
            if (data.error) {
                // If the error message is specific (like 'User not registered')
                if (data.error === 'User not registered') {
                    navigation.navigate('SignUpDetails', {
                        phone: formattedPhone,
                        disableEmailInput: true,
                    });
                } else {
                    alert(data.error); // Show the error message from the backend
                }
            } else {
                // If OTP is successfully sent, navigate to the OTPCode screen
                navigation.navigate('OTPCode2', { phone: formattedPhone });
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            alert(error.message || 'Error sending OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    
    

    const handleSignUp = () => {
        navigation.navigate('SignUpDetails', {
            phone: '', // No predefined email address
            disableEmailInput: false, // Allow email input on SignUpDetails screen
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <View style={styles.backButtonCircle}>
                    <Image source={require('../assets/back.png')} style={styles.backArrow} />
                </View>
            </TouchableOpacity>

            {/* Heading */}
            <Text style={styles.heading}>Log in and unlock{'\n'}the digital universe</Text>

            {/* Combined Dropdown and Phone Input */}
            <View style={styles.inputContainer}>
                <TouchableOpacity onPress={() => setDropdownVisible(!dropdownVisible)} style={styles.dropdown}>
                    <View style={styles.dropdownContent}>
                        <Image source={countryCodes.find(code => code.value === countryCode).flag} style={styles.flagIcon} />
                        <Text style={styles.dropdownText}>{countryCode}</Text>
                    </View>
                    <Image source={require('../assets/downArrow.png')} style={styles.dropdownIcon} />
                </TouchableOpacity>
                {dropdownVisible && (
                    <Modal transparent={true} animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                {countryCodes.map((code) => (
                                    <Pressable
                                        key={code.value}
                                        onPress={() => {
                                            setCountryCode(code.value);
                                            setDropdownVisible(false);
                                        }}
                                        style={styles.modalItem}
                                    >
                                        <View style={styles.modalItemContent}>
                                            <Image source={code.flag} style={styles.flagIcon} />
                                            <Text style={styles.modalItemText}>{code.label}</Text>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </Modal>
                )}
             
                <View style={styles.divider2} />
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Phone"
                        placeholderTextColor="#aaa"
                        keyboardType="numeric"
                        value={phone}
                        onChangeText={setPhone}
                        maxLength={10} // Limit to 10 digits
                    />
                </View>
            </View>

            {/* Get OTP Button */}
            <TouchableOpacity style={styles.otpButton} onPress={handleLogin}>
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.otpButtonText}>Get OTP</Text>
                )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.orText}>or continue with</Text>
                <View style={styles.divider} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialButtonsContainer}>
                <TouchableOpacity style={styles.socialButton}>
                    <Image source={require('../assets/google.png')} style={styles.socialIcon} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                    <Image source={require('../assets/facebook.png')} style={styles.socialIcon} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                    <Image source={require('../assets/apple.png')} style={styles.socialIcon} />
                </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <Text style={styles.signupText}>
                Don't have an account?
                <Text style={styles.signupLink} onPress={handleSignUp}> Sign up</Text>
            </Text>

            {/* Privacy Policy and Terms */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Privacy Policy  </Text>
                <Text style={styles.footerText}>  Term of Service</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
    },
    backButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2274F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#aaa',
    },
    backArrow: {
        tintColor: '#fff',
        width: 20,
        height: 20,
        marginHorizontal: 5,
        resizeMode: 'contain',
    },
    heading: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 80,
        marginBottom: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        width: '100%',
        marginBottom: 20,
    },
    dropdown: {
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        padding: 5,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
    },
    dropdownContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 16,
        color: '#000',
    },
    dropdownIcon: {
        width: 10,
        height: 10,
        resizeMode: 'contain',
 
        marginLeft: 3,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '80%',
    },
    modalItem: {
        padding: 10,
    },
    modalItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalItemText: {
        fontSize: 16,
    },
    inputWrapper: {
        padding: 10,
    },
    input: {
        fontSize: 16,
        color: '#000',
    },
    otpButton: {
        backgroundColor: '#2274F0',
        paddingVertical: 12,
        borderRadius: 30,
        width: '90%',
        alignItems: 'center',
        marginBottom: 20,
    },
    otpButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'medium',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        width: '100%',
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    
    
    orText: {
        marginHorizontal: 10,
        color: '#aaa',
        fontSize: 14,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '80%',
        marginVertical: 10,
    },
    socialButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 50,
        padding: 10,
    },
    socialIcon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
    signupText: {
        fontSize: 14,
        color: '#000',
        marginTop: 10,
    },
    signupLink: {
        color: '#2274F0',
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        width: '100%',
    },
    footerText: {
        color: '#aaa',
        fontSize: 12,
    },
    flagIcon: {
        width: 20,
        height: 20,
        marginRight: 5,
    },
    divider2: {
        width: 1,
        backgroundColor: '#ccc',
        height: '100%',
        
    },
});

export default PhoneLoginScreen;
