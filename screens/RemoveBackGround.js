import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
const audioIcon = require('../assets/mic3.png');
const videoIcon = require('../assets/cliper.png');
const backIcon = require('../assets/back.png');
const uploadIcon = require('../assets/Import.png');
const helpIcon = require('../assets/threeDot.png');
const helpIcon2 = require('../assets/mic2.png');
const Translate = require('../assets/right-up.png');
const micIcon = require('../assets/mic3.png');
const clockIcon = require('../assets/clock.png');
const calendarIcon = require('../assets/calender.png');

const RemoveBackground = () => {
  const navigation = useNavigation();
  const [files, setFiles] = useState([]);
  const [imageDescription, setImageDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);  // Separate modal state
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);  // Separate modal state
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const UID = '595dfce5-0898-4364-9046-0aa850190321';
  // Handle selecting an image file
    useEffect(() => {
          fetchImages();
      }, []);
  const handleFileSelect = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
      });
      setSelectedImage(res[0]);
      setDescriptionModalVisible(true);  // Open image modal
    } catch (err) {
      console.log(err);
    }
  };
// Fetch images from the server
const fetchImages = async (UID) => {
    try {
      // Use backticks (``) for template literals to correctly insert UID
      const response = await fetch(`https://matrix-server.vercel.app/getRemoveBg?uid=595dfce5-0898-4364-9046-0aa850190321`);
      const result = await response.json();
  
      if (response.ok) {
        const imageList = result.data.map((item) => ({
          id: item.image_id,
          name: item.image_name,
          uri: item.image_url,
          created_at: item.created_at,
        }));
        setFiles(imageList); // Assuming `setFiles` is a state setter
      } else {
        console.error('Failed to fetch images:', result);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  
  


  // Call fetchImages when component mounts
  React.useEffect(() => {
    fetchImages();
  }, []);
  
  const handleUpload = async () => {
    if (!selectedImage) return;
  
    const formData = new FormData();
  
    // Ensure UID is passed in the FormData
    formData.append('uid', UID); // Replace `UID` with the actual UID variable in your app
    
    // Assuming `selectedImage` is the raw file object (i.e., the image file)
    formData.append('image', selectedImage); // Directly pass the image file object as 'image'
  
    setUploading(true);
  
    try {
      const response = await fetch('https://matrix-server.vercel.app/uploadRemoveBg', {
        method: 'POST',
        body: formData, // Directly use FormData, no custom headers for Content-Type
      });
  
      const result = await response.json();
      if (response.ok) {
        alert('Image uploaded successfully!');
        fetchImages(); // Fetch updated image list
      } else {
        console.error('Upload failed:', result);
        alert(`Upload failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again later.');
    } finally {
      setUploading(false);
      setDescriptionModalVisible(false);
    }
  };
  

  // Render image list item
  const renderRightActions = (item, progress, dragX) => (
    <View style={styles.rightActionsContainer}>
        {/* Edit Button */}
        <TouchableOpacity
            onPress={() => {
                console.log(item);
                setSelectedFile(item); // Set selected file for editing
                setEditModalVisible(true); // Open edit modal
            }}
            style={styles.actionButton1}
        >
            <Image
                source={require('../assets/pencil2.png')}
                style={styles.actionIcon}
            />
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
            onPress={() => handleShareFile(item)}
            style={styles.actionButton2}
        >
            <Image
                source={require('../assets/send.png')}
                style={styles.actionIcon}
            />
        </TouchableOpacity>

        {/* Remove Button */}
        <TouchableOpacity
            onPress={() => handleRemoveFile(item.audioid)}
            style={styles.actionButton3}
        >
            <Image
                source={require('../assets/remove.png')}
                style={styles.actionIcon}
            />
        </TouchableOpacity>
    </View>
  );
  
  const renderFileItem = ({ item }) => {
    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(item, progress, dragX)}
        overshootRight={false}
      >
        <TouchableOpacity
          style={styles.fileItem}
          onPress={() => {
            setSelectedImage(item);
            setImageModalVisible(true);
          }}
        >
          <Image source={{ uri: item.uri }} style={styles.fileIconLeft} />
          <View style={styles.detailsColumn}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.name.length > 25 ? `${item.name.substring(0, 20)}...` : item.name}
            </Text>
            <View style={styles.fileDetails}>
              <Image source={clockIcon} style={styles.detailIcon} />
              <Text style={styles.detailText}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
          </View>
          <TouchableOpacity
                                  style={styles.actionButton}
                                  onPress={() => handlePress(item)}
                                  >
                                   <Text style={styles.convert}>
                                      Generate
                                  </Text>
                                  <Image source={Translate} style={styles.detailIcon5} />
                                  </TouchableOpacity>
                              </TouchableOpacity>
      </Swipeable>
    );
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
        <Text style={styles.headerTitle}>Matrix AI</Text>
        <TouchableOpacity>
          <Image source={helpIcon} style={styles.headerIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.topButtonsContainer}>
        <TouchableOpacity style={styles.topButton} onPress={handleFileSelect}>
          <Image source={uploadIcon} style={styles.topIcon} />
        </TouchableOpacity>
        <View style={styles.topHelp}>
          <Image source={helpIcon2} style={styles.topHelpIcon} />
          <Text style={styles.helpText}>How to add voice memos to Generate</Text>
        </View>
      </View>

      <View style={styles.searchBox2}>
        <View style={styles.searchBox}>
          <Image source={require('../assets/search.png')} style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            style={styles.textInput}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Image source={require('../assets/select-all.png')} style={styles.filterIcon} />
        </TouchableOpacity>
      </View>

    
      {/* Description Modal */}
      <Modal
  transparent={true}
  animationType="fade"
  visible={imageModalVisible}
  onRequestClose={() => setImageModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <TouchableOpacity onPress={() => setImageModalVisible(false)} style={styles.closeButton}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
      <Image
        source={{ uri: selectedImage?.uri }}
        style={styles.modalImage}
        resizeMode="contain"
      />
    </View>
  </View>
</Modal>

<Modal
  transparent={true}
  animationType="slide"
  visible={descriptionModalVisible}
  onRequestClose={() => setDescriptionModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Add Description</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter description"
        value={imageDescription}
        onChangeText={setImageDescription}
      />
      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
        <Text style={styles.uploadText}>Upload</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      <FlatList
        data={files}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFileItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
        }
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
     
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: '#5E5E5E31',
    paddingHorizontal: 5,
    height: '88%',
},
actionButton1: {
    backgroundColor: '#298EF9FF',
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 5,
},
actionButton2: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 5,
},
actionButton3: {
    backgroundColor: '#ff4d4d',
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 5,
},
actionIcon: {
    width: 20,
    tintColor:'#FFFFFFFF',
    height: 20,
    resizeMode: 'contain',
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
    fontWeight: 'bold',
    color: '#007bff',
  },
  headerIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  topButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  topButton: {
    backgroundColor: '#FF6600',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
  },
  topIcon: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  topHelp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    borderRadius: 10,
    padding: 12,
  },
  topHelpIcon: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
    marginRight: 8,
  },
  helpText: {
    color: '#ffffff',
    fontSize: 12,
    flexShrink: 1,
  },
  searchBox2: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    width: '90%',
    height: 40,
    marginLeft: 5,
  },
  searchIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  filterButton: {
  
  
  },
  filterIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9f9f9',
    borderColor:'#3333334E',
    borderWidth:1,
    padding: 14,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
},
fileItem2: {
    flexDirection: 'row',
    alignItems: 'center',






},


  selectedFileItem: {
    backgroundColor: '#f1f1f1',
  },
  fileIconLeft: {
    width: 90,
    height: 160,
    borderWidth:1,
    borderRadius:15,
    borderColor:'#33333324',
    marginRight: 15,
    resizeMode:'contain'
  },
  detailsColumn: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop:10,
  },
  fileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  detailIcon: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
    marginRight: 5,
  },
  detailText: {
    fontSize: 12,
    color: '#888',
  },
  actionButton: {
    position: 'absolute', // Keeps the button position absolute within the parent container
    right: 5, // Distance from the right edge
    bottom: 15, // Distance from the bottom edge of the container
    backgroundColor: '#57575710',
    borderRadius: 20,
    padding: 8, // Adjust padding for better touch area
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    elevation: 5, // Adds shadow for Android
    shadowColor: '#000', // Adds shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
convert:{
    marginRight:5,
    fontSize:12,
    color:'#000',
        },
        detailIcon5: {
            width: 20,
            height: 20,
            marginRight: 1,
            borderRadius:20,
            resizeMode: 'contain',
            backgroundColor:'#007bff',
            tintColor:'#fff',
        },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  uploadText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

 
});

export default RemoveBackground;
