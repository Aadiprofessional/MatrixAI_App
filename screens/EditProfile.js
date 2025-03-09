import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import Header from '../components/Header';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
const EditProfile = ({ navigation }) => {
    const { uid} = useAuth();
    const [originalData, setOriginalData] = useState(null);
    const [profileData, setProfileData] = useState({
        name: '',
        gender: '',
        age: '',
        phone: ''
    });
    const [isEdited, setIsEdited] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!uid) return;

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('name, gender, age, phone')
                    .eq('uid', uid)
                    .single();

                if (error) {
                    console.error('Error fetching user data:', error);
                    return;
                }

                if (data) {
                    console.log('Fetched user data:', data);
                    setOriginalData(data);
                    setProfileData({
                        name: data.name || '',
                        gender: data.gender || '',
                        age: data.age?.toString() || '',
                        phone: data.phone || ''
                    });
                } else {
                    console.log('No user data found');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };
        
        fetchUserData();
    }, [uid]);

    const handleChange = (field, value) => {
        setProfileData(prev => {
            const newData = { ...prev, [field]: value };
            const hasChanged = Object.keys(newData).some(key => 
                newData[key] !== (originalData?.[key] || '')
            );
            setIsEdited(hasChanged);
            return newData;
        });
    };
    
    const handleUpdate = async () => {
        if (!uid) return;

        try {
            Alert.alert(
                "Confirm Update",
                "Are you sure you want to update your profile?",
                [
                    {
                        text: "Cancel",
                        onPress: () => console.log("Update cancelled"),
                        style: "cancel"
                    },
                    {
                        text: "OK",
                        onPress: async () => {
                            const { error } = await supabase
                                .from('users')
                                .update({
                                    name: profileData.name,
                                    gender: profileData.gender,
                                    age: parseInt(profileData.age),
                                    phone: profileData.phone
                                })
                                .eq('uid', uid);
                                
                            if (error) {
                                console.error('Error updating user data:', error);
                                Alert.alert("Error", "Failed to update profile");
                                return;
                            }
                            
                            setOriginalData(profileData);
                            setIsEdited(false);
                            Alert.alert("Success", "Profile updated successfully");
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error:', error);
            Alert.alert("Error", "An unexpected error occurred");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
               <View style={styles.header}>
                          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
                                              <Image
                                                  source={require('../assets/back.png')} 
                                                  style={styles.headerIcon}
                                              />
                                          </TouchableOpacity>
                           <Text style={styles.headerTitle}>Edit Profile</Text>
                         
                       </View>
            
            <View style={styles.imageContainer}>
                <Image source={require('../assets/avatar.png')} style={styles.profileImage} />
            </View>
            
            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <TextInput 
                        style={styles.input}
                        placeholder="Name"
                        value={profileData.name}
                        onChangeText={(text) => handleChange('name', text)}
                    />
                    <TouchableOpacity style={styles.editIcon}>
                        <Image source={require('../assets/pencil.png')} style={styles.icon} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.inputContainer}>
                    <TextInput 
                        style={styles.input}
                        placeholder="Gender"
                        value={profileData.gender}
                        onChangeText={(text) => handleChange('gender', text)}
                    />
                    <TouchableOpacity style={styles.editIcon}>
                        <Image source={require('../assets/pencil.png')} style={styles.icon} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.inputContainer}>
                    <TextInput 
                        style={styles.input}
                        placeholder="Age"
                        value={profileData.age}
                        onChangeText={(text) => handleChange('age', text)}
                        keyboardType="numeric"
                    />
                    <TouchableOpacity style={styles.editIcon}>
                        <Image source={require('../assets/pencil.png')} style={styles.icon} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.inputContainer}>
                    <TextInput 
                        style={styles.input}
                        placeholder="Phone"
                        value={profileData.phone}
                        onChangeText={(text) => handleChange('phone', text)}
                        keyboardType="phone-pad"
                    />
                    <TouchableOpacity style={styles.editIcon}>
                        <Image source={require('../assets/pencil.png')} style={styles.icon} />
                    </TouchableOpacity>
                </View>
                
                {isEdited && (
                    <TouchableOpacity 
                        style={styles.updateButton} 
                        onPress={handleUpdate}
                    >
                        <Text style={styles.updateButtonText}>Update Profile</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    imageContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    formContainer: {
        marginHorizontal: 20,
        marginTop: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    input: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 8,
        fontSize: 16,
    },
    editIcon: {
        marginLeft: 10,
    },
    icon: {
        width: 20,
        height: 20,
    },
    updateButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    updateButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        
    },
    headerTitle: {
        fontSize: 20,
        position:'absolute',
        left:'45%',
        fontWeight: 'bold',
        color: '#007bff',
    },
    headerIcon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
});

export default EditProfile;
