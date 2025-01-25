import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';

const FillInformationScreen = () => {
  const navigation = useNavigation();
  const [idCard, setIdCard] = useState(null);
  const [selfie, setSelfie] = useState(null);

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

  return (
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
      <TextInput style={styles.input} placeholder="Full Name" />
      
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

      <TextInput style={styles.input} placeholder="Email address" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Permanent address" />
      
      <TouchableOpacity style={styles.uploadButton}>
        <Text style={styles.uploadText}>Add GST (Optional)</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.payButton}
        onPress={() => navigation.navigate('SuccessScreen')}
      >
        <Text style={styles.buttonText}>Pay the Rent</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    marginTop: 50,
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
