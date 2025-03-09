import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
const SettingsScreen = () => {
    const [language, setLanguage] = useState('en');
    const [region, setRegion] = useState('US');
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    const handleLanguageChange = (itemValue) => setLanguage(itemValue);
    const handleRegionChange = (itemValue) => setRegion(itemValue);
    const toggleTheme = () => setIsDarkMode(previousState => !previousState);
    
    const checkForUpdates = () => {
        // Simulate update check
        Alert.alert('Update Check', 'Your app is up to date.');
    };
    
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.settingItem}>
                <Text style={styles.label}>Language</Text>
                <Picker
                    selectedValue={language}
                    onValueChange={handleLanguageChange}
                    style={styles.picker}
                >
                    <Picker.Item label="English" value="en" />
                    <Picker.Item label="French" value="fr" />
                    <Picker.Item label="Spanish" value="es" />
                </Picker>
            </View>
            
            <View style={styles.settingItem}>
                <Text style={styles.label}>Region</Text>
                <Picker
                    selectedValue={region}
                    onValueChange={handleRegionChange}
                    style={styles.picker}
                >
                    <Picker.Item label="United States" value="US" />
                    <Picker.Item label="France" value="FR" />
                    <Picker.Item label="Spain" value="ES" />
                </Picker>
            </View>
            
            <View style={styles.settingItem}>
                <Text style={styles.label}>Dark Mode</Text>
                <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleTheme}
                    value={isDarkMode}
                />
            </View>
            
            <View style={styles.settingItem}>
                <Button
                    title="Check for Updates"
                    onPress={checkForUpdates}
                    color="#007bff"
                />
            </View>
            
            <View style={styles.settingItem}>
                <Text style={styles.versionInfo}>Version: 1.0.0</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    settingItem: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    versionInfo: {
        fontSize: 14,
        color: '#666',
        marginTop: 20,
    },
});

export default SettingsScreen;
