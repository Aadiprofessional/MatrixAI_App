import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ImageBackground, ScrollView, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import Video from 'react-native-video';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import { supabase } from '../supabaseClient';

const AddProductScreen = ({ navigation }) => {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [fileType, setFileType] = useState('image');
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [sound, setSound] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.release();
      }
    };
  }, [sound]);

  const handleThumbnailUpload = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.8,
      });

      if (!result.didCancel && result.assets && result.assets.length > 0) {
        setThumbnail(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking thumbnail:', error);
    }
  };

  const handleFileUpload = async () => {
    try {
      if (fileType === 'image') {
        const result = await launchImageLibrary({
          mediaType: 'photo',
          includeBase64: false,
          maxWidth: 1000,
          maxHeight: 1000,
          quality: 0.8,
        });

        if (!result.didCancel && result.assets && result.assets.length > 0) {
          setFile(result.assets[0].uri);
        }
      } else {
        const result = await DocumentPicker.pick({
          type: [fileType === 'music' ? DocumentPicker.types.audio : DocumentPicker.types.video],
        });
        setFile(result.uri);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('User cancelled file picker');
      } else {
        console.log('Error picking file:', error);
      }
    }
  };

  const handleFileTypeChange = (type) => {
    setFileType(type);
    setFile(null);
    setThumbnail(null);
    if (sound) {
      sound.release();
      setSound(null);
    }
  };

  const uploadToSupabase = async (uri, fileExtension) => {
    try {
      console.log('Starting file upload for:', uri);
      
      // Convert React Native file URI to a format Supabase can handle
      const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      
      // Read file using react-native-fs
      const fileData = await RNFS.readFile(fileUri, 'base64');
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const arrayBuffer = new Uint8Array(byteNumbers);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `products/${fileType}/${fileName}`;
      console.log('Uploading to path:', filePath);
      
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, arrayBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: `image/${fileExtension}`
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);
      
      console.log('Upload successful, public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadToSupabase:', {
        message: error.message,
        stack: error.stack,
        uri,
        fileExtension
      });
      throw new Error(`Upload failed: ${error.message}`);
    }
  };

  const handleAddProduct = async () => {
    if (!file || !productName || !description || !price) {
      Alert.alert('Error', 'Please fill in all fields and upload a file');
      return;
    }

    if ((fileType === 'video' || fileType === 'music') && !thumbnail) {
      Alert.alert('Error', 'Please upload a thumbnail for video/music');
      return;
    }

    setLoading(true);
    try {
      const fileUri = file;
      const fileExtension = fileUri.split('.').pop().toLowerCase();
      const fileUrl = await uploadToSupabase(fileUri, fileExtension);
      
      let thumbnailUrl = null;
      if (thumbnail) {
        thumbnailUrl = await uploadToSupabase(thumbnail, 'jpg');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const productData = {
        uid: user.id,
        price: parseFloat(price),
        description,
        name: productName,
        file_url: fileUrl
      };

      let endpoint = '';
      if (fileType === 'image') {
        endpoint = 'https://matrix-server.vercel.app/uploadImageProduct';
      } else if (fileType === 'video') {
        endpoint = 'https://matrix-server.vercel.app/uploadVideoProduct';
        productData.video_url = fileUrl;
        productData.thumbnail_url = thumbnailUrl;
      } else if (fileType === 'music') {
        endpoint = 'https://matrix-server.vercel.app/uploadMusicProduct';
        productData.thumbnail_url = thumbnailUrl;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();
      console.log('API Response:', result);
      if (!result.success) {
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          response: result
        });
        throw new Error('Failed to upload product');
      }

      Alert.alert('Success', 'Product added successfully!');
      // Reset form
      setProductName('');
      setDescription('');
      setPrice('');
      setFile(null);
      setThumbnail(null);
      setFileType('image');
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', error.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (file && fileType === 'music') {
      const audio = new Sound(file, '', (error) => {
        if (!error) {
          audio.play();
          setSound(audio);
        }
      });
    }
  };

  return (
  
      <ScrollView contentContainerStyle={styles.scrollContainer}         showsVerticalScrollIndicator={false}
      bounces={false}>
        <View style={styles.container}>
          <ImageBackground 
      source={require('../assets/matrix.png')} 
      style={styles.background}
      imageStyle={{ opacity: 0.25 ,width:300,height:300 ,alignSelf:'center',justifyContent:'center',resizeMode:'contain', position:'absolute',top:'60',left:'200'}}

    >
          <View style={styles.header}>
            <TouchableOpacity   onPress={() => navigation.goBack()}>
              <Image 
                source={require('../assets/back.png')} 
                style={styles.backButton}
              />
            </TouchableOpacity>
            <Text style={styles.title}>Add your product</Text>
          </View>

          <View style={styles.mediaPreviewContainer}>
            <View style={styles.mediaPlaceholder}>
              <Image 
                source={require('../assets/empty.png')} 
                style={styles.placeholderIcon}
              />
              {file && fileType === 'image' && (
                <Image source={{ uri: file }} style={styles.previewImage} />
              )}
            </View>

            {file && (fileType === 'video' || fileType === 'music') && (
              <View style={styles.fileContainer}>
                {fileType === 'video' && (
                  <Video
                    source={{ uri: file }}
                    style={styles.videoPlayer}
                    controls={true}
                    paused={true}
                  />
                )}
                {fileType === 'music' && (
                  <TouchableOpacity style={styles.playButton} onPress={playAudio}>
                    <Text style={styles.playButtonText}>Play Audio</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="Enter product name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter product description"
              multiline
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter product price"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.radioContainer}>
            <TouchableOpacity 
              style={styles.radioButton} 
              onPress={() => handleFileTypeChange('image')}
            >
              <Text style={fileType === 'image' ? styles.radioSelected : styles.radioText}>Image</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.radioButton} 
              onPress={() => handleFileTypeChange('video')}
            >
              <Text style={fileType === 'video' ? styles.radioSelected : styles.radioText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.radioButton} 
              onPress={() => handleFileTypeChange('music')}
            >
              <Text style={fileType === 'music' ? styles.radioSelected : styles.radioText}>Music</Text>
            </TouchableOpacity>
          </View>
   

          <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
            <Text style={styles.uploadButtonText}>Upload File</Text>
          </TouchableOpacity>

          {(fileType === 'video' || fileType === 'music') && (
            <View style={styles.thumbnailContainer}>
              <Text style={styles.label}>Thumbnail</Text>
              {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={styles.thumbnailPreview} />
              ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={handleThumbnailUpload}>
                  <Text style={styles.uploadButtonText}>Upload Thumbnail</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={[styles.addButton, { opacity: loading ? 0.7 : 1 }]} 
            onPress={handleAddProduct}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>
              {loading ? 'Adding Product...' : 'Add Product'}
            </Text>
          </TouchableOpacity>
        </ImageBackground>
        </View>
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  thumbnailContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  thumbnailPreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginTop: 10,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  background: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
     
  },
  backButton: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  mediaPreviewContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  mediaPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  placeholderIcon: {
    width: 50,
    height: 50,
    tintColor: '#999',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    position: 'absolute',
  },
  fileContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  videoPlayer: {
    width: 300,
    height: 200,
    backgroundColor: '#000',
  },
  playButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  radioButton: {
    padding: 10,
  },
  radioText: {
    fontSize: 16,
    color: '#666',
  },
  radioSelected: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 30,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default AddProductScreen;
