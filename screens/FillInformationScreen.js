import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';


const FillInformationScreen = () => {
  const navigation = useNavigation();
  const [idCard, setIdCard] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
    const { uid, loading } = useAuth();

  const pickImage = (setImage) => {
    const options = {
      title: 'Select Image',
      mediaType: 'photo',
      quality: 0.5,
    };

    launchImageLibrary(options, (response) => {
      if (!response.didCancel && !response.error) {
        setImage(response.assets[0].uri);
      }
    });
  };


  const checkUserCoins = async (uid, requiredCoins) => {
    try {
      console.log('Checking coins for UID:', uid);
      const { data, error } = await supabase
        .from("users")
        .select("user_coins")
        .eq("uid", uid)
        .single();
  
      if (error) {
        console.error('Error checking user coins:', error);
        return false;
      }

      console.log('User coin balance:', data?.user_coins);
      console.log('Required coins:', requiredCoins);
  
      if (!data || data.user_coins < requiredCoins) {
        console.log('Insufficient coins');
        return false;
      }
  
      console.log('Sufficient coins');
      return true;
    } catch (error) {
      console.error('Error in checkUserCoins:', error);
      return false;
    }
  };
  
  const [isProcessing, setIsProcessing] = useState(false);

  const uriToBase64 = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handlePayRent = async () => {
    if (!uid) return;

    // Validate all fields
    if (!name || !email || !address || !idCard || !selfie) {
      Alert.alert('Error', 'Please fill all fields and upload both images');
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
  
    // First confirmation
    Alert.alert(
      'Confirm Payment',
      'Are you sure you want to pay 100 coins?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsProcessing(true);
            
            // Check coins
            const hasEnoughCoins = await checkUserCoins(uid, 100);
            
            if (!hasEnoughCoins) {
              setIsProcessing(false);
              Alert.alert(
                'Insufficient Coins',
                'You don\'t have enough coins to make this payment. Please recharge.',
                [
                  {
                    text: 'Recharge Now',
                    onPress: () => navigation.navigate('TransactionScreen')
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  }
                ]
              );
              return;
            }
  
            // Make API call
            try {
              const frontImageBase64 = idCard ? await uriToBase64(idCard) : null;
              const backImageBase64 = selfie ? await uriToBase64(selfie) : null;

              const response = await fetch('https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/makeSeller', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  uid: uid,
                  name: name,
                  frontImage: frontImageBase64,
                  backImage: backImageBase64,
                  emailAddress: email,
                  permanentAddress: address
                })
              });
  
              const result = await response.json();
              if (result.success) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'SuccessScreen' }],
                });
              } else {
                Alert.alert('Error', 'Failed to process payment');
              }
            } catch (error) {
              console.error('API Error:', error);
              Alert.alert('Error', 'An error occurred while processing your request');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image 
            source={require('../assets/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Fill Your Information</Text>
      </View>

      <Text style={styles.subtitle}>Enter your details</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Full Name" 
        value={name}
        onChangeText={setName}
      />
      
      <View style={styles.uploadContainer}>
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={() => pickImage(setIdCard)}
        >
          <Text style={styles.uploadText}>Upload ID Card</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={() => pickImage(setSelfie)}
        >
          <Text style={styles.uploadText}>Upload Selfie</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <View style={styles.imageBox}>
          {idCard && <Image source={{ uri: idCard }} style={styles.image} />}
          <Text style={styles.imageLabel}>ID Card</Text>
        </View>
        <View style={styles.imageBox}>
          {selfie && <Image source={{ uri: selfie }} style={styles.image} />}
          <Text style={styles.imageLabel}>Selfie</Text>
        </View>
      </View>

      <TextInput 
        style={styles.input} 
        placeholder="Official Email" 
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput 
        style={styles.input} 
        placeholder="Permanent address" 
        value={address}
        onChangeText={setAddress}
      />
      
    
      <TouchableOpacity 
        style={styles.payButton}
        onPress={handlePayRent}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Pay the Rent</Text>
        )}
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
     
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
    marginRight: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#7D7D7D',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  uploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  uploadText: {
    color: '#757575',
    fontSize: 14,
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imageBox: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imageLabel: {
    position: 'absolute',
    bottom: 10,
    color: '#757575',
  },
  payButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});



export default FillInformationScreen;
