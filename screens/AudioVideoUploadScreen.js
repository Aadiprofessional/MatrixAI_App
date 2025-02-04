import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    TextInput,
    Image,
    ActivityIndicator,
    Modal,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import RNFS from 'react-native-fs';  // Import react-native-fs to read files
import axios from 'axios';
import { Buffer } from 'buffer';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler'; 
import Share from 'react-native-share'; // Add for file sharing
import { Button, Alert } from 'react-native';
import { supabase } from '../supabaseClient'; 
import { Picker } from '@react-native-picker/picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import Toast from 'react-native-toast-message';



const audioIcon = require('../assets/mic3.png');
const videoIcon = require('../assets/cliper.png');
const backIcon = require('../assets/back.png');
const uploadIcon = require('../assets/Import.png');
const resizeIcon = require('../assets/cliper.png');
const helpIcon = require('../assets/threeDot.png');
const helpIcon2 = require('../assets/mic2.png');
const Translate = require('../assets/right-up.png');
const coin = require('../assets/coin.png');
const micIcon = require('../assets/mic3.png');
const micIcon2 = require('../assets/Translate.png');
const clockIcon = require('../assets/clock.png');
const calendarIcon = require('../assets/calender.png');

const AudioVideoUploadScreen = () => {
    const navigation = useNavigation();
    const [files, setFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
   
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [isFilterMode, setIsFilterMode] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');
    const [audioFile, setAudioFile] = useState(null);
    const [uploading, setUploading] = useState(false); // For upload indicator
   
    const [duration, setDuration] = useState(null);
    const audioRecorderPlayer = new AudioRecorderPlayer();
    const [popupVisible, setPopupVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [newFileName, setNewFileName] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [uploadData, setUploadData] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            loadFiles();
        }, [])
    );
    const uid = '595dfce5-0898-4364-9046-0aa850190321';

    const loadFiles = async () => {
        try {
            const response = await fetch(`https://matrix-server-gzqd.vercel.app/getAudio/595dfce5-0898-4364-9046-0aa850190321`);
            
            // Check response content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                Alert.alert('Error', 'Server returned invalid response');
                return;
            }

            const data = await response.json();
            
            if (response.ok) {
                // Sort files by uploaded_at in descending order (newest first)
                const sortedFiles = (data.audioData || []).sort((a, b) => 
                    new Date(b.uploaded_at) - new Date(a.uploaded_at)
                );
                setFiles(sortedFiles);
            } else {
                console.error('Error fetching audio:', data.error);
                Alert.alert('Error', data.error || 'Failed to fetch audio files');
            }
        } catch (error) {
            console.error('Error fetching audio:', error);
            Alert.alert('Error', 'Failed to load audio files. Please try again later.');
        }
    };

    // Refresh files after modifications
    const refreshFiles = async () => {
        await loadFiles();
    };

    useEffect(() => {
        // Refresh files when edit modal closes
        if (!editModalVisible) {
            refreshFiles();
        }
    }, [editModalVisible]);

    const getFilteredFiles = () => {
        if (!searchQuery) {
            return files;
        }
        return files.filter(file => {
            const fileName = file.audio_name?.toLowerCase() || '';
            const searchTerm = searchQuery.toLowerCase();
            return fileName.includes(searchTerm);
        });
    };

    const handleFileSelect = async () => {
        try {
            const res = await DocumentPicker.pick({
                type: [DocumentPicker.types.audio],
            });
    
            if (res && res[0]) {
                setAudioFile(res[0]);
    
                // Calculate audio duration
                const uri = res[0].uri;
                const durationInSeconds = await getAudioDuration(uri);
                setDuration(durationInSeconds);
    
                setPopupVisible(true); // 👈 Show popup after file selection
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log('User cancelled file picker.');
            } else {
                console.error('Error picking file:', err.message);
                Alert.alert('Error', 'An error occurred while picking the file.');
            }
        }
    };
    
    const handleUpload = async (file, duration) => {
        if (!file) {
            Alert.alert('Error', 'No file selected');
            return;
        }
        setUploading(true);
    
        const user = '595dfce5-0898-4364-9046-0aa850190321';
        const { uri, name } = file;
    
        const formData = new FormData();
        formData.append('audio', { uri, type: file.type, name });
        formData.append('uid', user);
        formData.append('duration', duration);
    
        const headers = {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        };
    
        try {
            const response = await fetch('https://ddtgdhehxhgarkonvpfq.functions.supabase.co/uploadAudio', {
                method: 'POST',
                headers: headers,
                body: formData,
            });
    
            const data = await response.json();
    
            if (response.ok) {
                setUploadData(data); // Set uploadData here
                loadFiles();
                Toast.show({
                    type: 'success',
                    text1: 'Upload Complete',
                    text2: 'Your file has been uploaded successfully.',
                });
    
                // Stop the upload process and show toast for conversion start
                setUploading(false); // Stop the upload
                setPopupVisible(false); 
                Toast.show({
                    type: 'info',
                    text1: 'Conversion Started',
                    text2: 'Your file is being processed.',
                });
    
                // Call handlePress for backend conversion
                if (data.audioID) {
                    handlePress({ audioid: data.audioID });
                } else {
                    Alert.alert('Error', 'Upload completed, but audioID is missing.');
                }
            } else {
                Alert.alert('Error', 'Failed to upload the file');
                setUploadData(null); // Reset uploadData on failure
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            Alert.alert('Error', 'An error occurred during file upload');
            setUploadData(null); // Reset uploadData on error
        } finally {
            setUploading(false); // Ensure uploading is stopped
        }
    };
    
    const handlePress = async ({ audioid }) => {
        try {
            console.log('audioid:', audioid, 'uid:', uid);
            console.log('Types:', typeof audioid, typeof uid);
    
            const formData = new FormData();
            formData.append('uid', String(uid));
            formData.append('audioid', String(audioid));
    
            const response = await fetch('https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/convertAudio', {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData,
            });
    
            const data = await response.json();
    
            if (response.ok && data.message === "Transcription completed and saved") {
                navigation.navigate('TranslateScreen2', {
                    uid,
                    audioid,
                    transcription: data.transcription,
                    chunkUrls: data.chunkUrls,
                });
            } else {
                console.error('API Error:', data);
                Alert('Failed to process audio. Please try again.');
            }
        } catch (error) {
            console.error('Network Error:', error);
            Alert('Network error occurred. Please check your connection.');
        }
    };
    
    const getAudioDuration = async (uri) => {
        return new Promise((resolve, reject) => {
            const sound = new Sound(uri, '', (error) => {
                if (error) {
                    console.error('Error loading audio:', error);
                    reject('Error loading audio');
                } else {
                    const durationInSeconds = sound.getDuration();
                    sound.release();
                    resolve(Math.round(durationInSeconds));
                }
            });
        });
    };

  
    
    
    

    const handleClosePopup = () => {
        setPopupVisible(false); // Close popup
    };


   
    
    
    const handlePress2 = async (item) => {
       
            navigation.navigate('TranslateScreen2', {
                uid,
                audioid: item.audioid, // Use item.audioid if audioid doesn't exist
            });
    };
    


    const handleRemoveFile = async (audioid) => {
        console.log(audioid,uid);
        
        if (!uid || !audioid) {
            console.error('Error: UID and audioid are required');
            Alert.alert('Error', 'UID and audio ID are required to delete the file.');
            return;
        }
    
        try {
            console.log('Deleting file with UID:', uid, 'and AudioID:', audioid); // Debug log
    
            const response = await fetch('https://matrix-server-gzqd.vercel.app/removeAudio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: uid,  // User's UID
                    audioid: audioid,  // File's unique ID
                }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                console.log('File deleted successfully:', data); // Debug log
    
                // Update local state after deletion
                const updatedFiles = files.filter((file) => file.audioid !== audioid);
                setFiles(updatedFiles);
              
            } else {
                console.error('Error deleting audio:', data.error);
                Alert.alert('Error', data.error || 'Failed to delete the audio file.');
            }
        } catch (error) {
            console.error('Error deleting audio:', error);
            Alert.alert('Error', 'An error occurred while deleting the audio file.');
        }
    };


    
    const handleFloatingButton2Press = () => {
    
            navigation.navigate('TranslateScreen4');
    
    };
    const handleFloatingButtonPress = () => {
    
        navigation.navigate('LiveTranslateScreen');

};
    
    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
      
        if (minutes === 0) {
          return `${remainingSeconds} sec`; // Only show seconds if minutes are 0
        } else if (remainingSeconds === 0) {
          return `${minutes} min`; // Only show minutes if seconds are 0
        } else {
          return `${minutes} min ${remainingSeconds} sec`; // Show both
        }
      };

    const openFilterModal = () => setFilterModalVisible(true);
    const closeFilterModal = () => setFilterModalVisible(false);

    const handleShareFile = async (file) => {
        try {
            setIsSharing(true);
            if (!file.audio_url) {
                Alert.alert('Error', 'File URL is not available');
                setIsSharing(false);
                return;
            }

            // Create temporary file path
            const tempFilePath = `${RNFS.TemporaryDirectoryPath}/${file.audio_name || 'audio_file'}.mp3`;
            
            // Download the file
            const download = RNFS.downloadFile({
                fromUrl: file.audio_url,
                toFile: tempFilePath,
                progress: (res) => {
                    const progressPercent = (res.bytesWritten / res.contentLength) * 100;
                    console.log(`Download progress: ${progressPercent.toFixed(2)}%`);
                }
            });

            // Wait for download to complete
            await download.promise;
            
            // Share the downloaded file
            const shareOptions = {
                title: `Share ${file.audio_name}`,
                url: `file://${tempFilePath}`,
                type: 'audio/mpeg',
                failOnCancel: false,
                message: `Check out this audio file: ${file.audio_name}`,
            };

            const result = await Share.open(shareOptions);
            
            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    console.log('Shared with activity type:', result.activityType);
                } else {
                    console.log('Shared successfully');
                }
            } else if (result.action === Share.dismissedAction) {
                console.log('Sharing dismissed');
            }

            // Clean up temporary file
            try {
                await RNFS.unlink(tempFilePath);
                console.log('Temporary file deleted');
            } catch (cleanupError) {
                console.error('Error deleting temporary file:', cleanupError);
            }
        } catch (error) {
            console.error('Error sharing file:', error.message);
            Alert.alert('Error', 'Failed to share the file. Please try again.');
        } finally {
            setIsSharing(false);
        }
    };

    const handleEditName = async () => {
        if (!newFileName.trim()) {
            Alert.alert('Invalid Name', 'File name cannot be empty.');
            return;
        }
    
        try {
            const response = await fetch('https://matrix-server-gzqd.vercel.app/editAudio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: uid, // User's UID
                    audioid: selectedFile.audioid, // File's unique ID
                    updatedName: newFileName, // New name for the audio file
                }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                // Update local state with the new file name
                const updatedFiles = files.map((file) =>
                    file.audioid === selectedFile.audioid
                        ? { ...file, audio_name: newFileName }
                        : file
                );
                setFiles(updatedFiles);
                setEditModalVisible(false); // Close edit modal
                setNewFileName('');
                refreshFiles(); // Refresh the file list
            } else {
                console.error('Error updating audio:', data.error);
                Alert.alert('Error', 'Failed to update the audio name.');
            }
        } catch (error) {
            console.error('Error updating audio name:', error);
            Alert.alert('Error', 'An error occurred while updating the audio name.');
        }
    };
    

    const toggleFileSelection = (fileId) => {
        setSelectedFiles((prevSelected) => {
            if (prevSelected.includes(fileId)) {
                return prevSelected.filter(id => id !== fileId);
            } else {
                return [...prevSelected, fileId];
            }
        });
    };

    const renderRightActions = (item,progress, dragX) => (
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
            disabled={isSharing}
        >
            {isSharing ? (
                <ActivityIndicator color="#fff" size="small" />
            ) : (
                <Image
                    source={require('../assets/send.png')}
                    style={styles.actionIcon}
                />
            )}
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
       
        const isSelected = selectedFiles.includes(item.audioid);
        return (
            <Swipeable
            renderRightActions={(progress, dragX) => renderRightActions(item, progress, dragX)} // Pass `item` to renderRightActions
            overshootRight={false}
        >
                <TouchableOpacity
                    style={[
                        styles.fileItem,
                        isSelected && styles.selectedFileItem,
                    ]}
                    onPress={() => {
                        if (isFilterMode) {
                            toggleFileSelection(item.audioid);
                        }
                    }}
                >
                    {isFilterMode && (
                        <View style={styles.dot}>
                            {isSelected && <View style={styles.innerDot} />}
                        </View>
                    )}
                    <Image
                        source={audioIcon }
                        style={styles.fileIcon}
                    />
                <View style={styles.detailsRow}>
    <Text style={styles.fileName} numberOfLines={1}>
        {item.audio_name?.length > 20 ? `${item.audio_name.substring(0, 18)}...` : item.audio_name || 'Unknown File'}
    </Text>
    <View style={styles.fileDetails}>
        <Image source={clockIcon} style={styles.detailIcon} />
        <Text style={styles.detailText}>
        {formatDuration(item.duration)}
      </Text>
        <Image source={calendarIcon} style={styles.detailIcon} />
        <Text style={styles.detailText}>
            {item.uploaded_at?.split('T')[0] || 'Unknown Date'}
        </Text>
    </View>
</View>

                        <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handlePress2(item)}
                    >
                         <Text style={styles.convert}>
                            Convert
                        </Text>
                        <Image source={Translate} style={styles.detailIcon5} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Swipeable>
        );
    };
 
    const handleDeleteAll = async () => {
        try {
            setIsDeleting(true);
            // Create a copy of selected files array
            const filesToDelete = [...selectedFiles];
            
            // Delete each selected file one by one
            for (const audioid of filesToDelete) {
                await handleRemoveFile(audioid);
            }
            
            // Clear selection and exit filter mode
            setSelectedFiles([]);
            setIsFilterMode(false);
        } catch (error) {
            console.error('Error deleting files:', error);
            Alert.alert('Error', 'Failed to delete some files');
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleFilterMode = () => {
        const newFilterMode = !isFilterMode;
        setIsFilterMode(newFilterMode);
        
        // // If entering filter mode, select all files
        // if (newFilterMode) {
        //     setSelectedFiles(files.map(file => file.audioid));
        // } else {
        //     // Clear selection when exiting filter mode
        //     setSelectedFiles([]);
        // }
    };



    return (
        <View style={styles.container}>
            {/* Header Section */}
            {uploading && (
                <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color="#0066FEFF" />
                    <Text style={styles.uploadingText}>Uploading Audio...</Text>
                </View>
            )}
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
                <TouchableOpacity style={styles.topButton2}>
                    <Image source={resizeIcon} style={styles.topIcon} />
                </TouchableOpacity>
                <View style={styles.topHelp}>
                    <Image source={helpIcon2} style={styles.topHelpIcon} />
                    <Text style={styles.helpText}>How to add voice memos to Transcribe</Text>
                </View>
            </View>
            {/* Loading Indicator */}
          

            {/* Search Bar */}
            <View style={styles.searchBox2}>
            <View style={styles.searchBox}>
                <Image source={require('../assets/search.png')} style={styles.searchIcon} />
                <TextInput
                    placeholder="Search"
                    style={styles.textInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
            <TouchableOpacity onPress={toggleFilterMode} style={styles.filterButton}>
    <Image source={require('../assets/select-all.png')} style={styles.filterIcon} />
</TouchableOpacity>

</View>
            {/* Filter Modal */}
            
            {/* File List */}
            <FlatList
                data={getFilteredFiles()}
                keyExtractor={(item) => item.audioid}
                renderItem={renderFileItem}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {searchQuery ? (
                            <Text style={styles.noResultsText}>No files match your search</Text>
                        ) : (
                            <ActivityIndicator size="large" color="#0066FEFF" />
                        )}
                    </View>
                }
            />
                {isFilterMode && (
            <TouchableOpacity style={styles.deleteAllButton} onPress={handleDeleteAll}>
                {isDeleting ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <>
                        <Image source={require('../assets/remove.png')} style={styles.deleteIcon} />
                        <Text style={styles.deleteAllButtonText}>Delete All</Text>
                    </>
                )}
            </TouchableOpacity>
        )}
            {/* Add File Floating Button */}
            <TouchableOpacity style={styles.floatingButton} onPress={handleFloatingButton2Press}>
                <Image source={micIcon} style={styles.floatingButtonIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatingButton2} onPress={handleFloatingButtonPress}>
                <Image source={micIcon2} style={styles.floatingButtonIcon} />
            </TouchableOpacity>
    
    
            {popupVisible && (
    <View style={styles.popupContainer}>
        <View style={styles.popupContent}>
            <Text style={styles.popupText}>Pay to Upload</Text>

            <View style={styles.popupButtons}>
                <TouchableOpacity onPress={handleClosePopup} style={styles.popupButton}>
                    <Text style={styles.popupButtonText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={async () => {
                        await handleUpload(audioFile, duration); // Only call handleUpload
                    }}
                    disabled={uploading}
                >
                    <Text style={styles.convert2}>-{duration}</Text>
                    <Image source={coin} style={styles.detailIcon2} />

                    {uploading ? (
                        <ActivityIndicator size="small" color="#0000ff" />
                    ) : (
                        <Text style={styles.convert}>Convert</Text>
                    )}

                    <Image source={Translate} style={styles.detailIcon5} />
                </TouchableOpacity>
            </View>
        </View>
    </View>
)}


            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit File Name</Text>
                        <TextInput
                            style={styles.editInput}
                            placeholder="Enter new file name"
                            value={newFileName}
                            onChangeText={setNewFileName}
                            autoFocus={true}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setEditModalVisible(false);
                                    setNewFileName('');
                                }}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleEditName}
                            >
                                <Text style={styles.modalButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
   
        marginTop: 50, // Ensures the container respects the safe area
    },
    rightActionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        backgroundColor: '#5E5E5E31',
        paddingHorizontal: 5,
        height: '88%',
    },
 
  
  
      popupContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
      popupContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' },
      popupText: { fontSize: 18, textAlign: 'center' },
      popupButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
      popupButton: { padding: 10, backgroundColor: '#0066FE', borderRadius: 5 },
      popupButtonText: { color: 'white' },
   
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007bff',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#007bff',
    },
    selectedFileItem: {
        backgroundColor: '#e6f7ff',
    },
    deleteAllButton: {
        position: 'absolute',
        bottom: 20,
        left: '10%',
        right: '60%',
        backgroundColor: '#ff4d4d',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    deleteIcon: {
        width: 20,
        height: 20,
        tintColor: '#fff',
    },
   
   
    uploadingOverlay: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderRadius: 5, // Optional, for rounded corners
        marginVertical: 10, // Adjust based on how much space you want above and below
        zIndex: 100, // Optional, depending on your layout
    },
    
    uploadingText: {
        marginTop: 10,
        color: '#0478F4FF',
        fontSize: 16,
    },
    deleteAllButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    
    actionButton: {
        position: 'absolute', // Makes the button position absolute
        right: 5, // Distance from the right edge of the screen
     // Distance from the bottom edge of the screen
        backgroundColor: '#57575710',
        borderRadius: 20,
        padding: 8, // Adjust padding for better touch area
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5, // Adds shadow for Android
        shadowColor: '#000', // Adds shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    actionButton4: {
       // Distance from the right edge of the screen
     // Distance from the bottom edge of the screen
        backgroundColor: '#FF6600FF',
        borderRadius: 20,
        padding: 8, // Adjust padding for better touch area
        flexDirection: 'row',
        justifyContent: 'center',
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
    convert2:{
        marginRight:5,
        fontSize:16,
        color:'#000',
            },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyImage: {
        width: 80, // Adjust size as needed
        height: 80,
        resizeMode: 'contain',
        marginTop:50,
    },
    actionButton1: {
        backgroundColor: '#298EF9FF',
        borderRadius: 20,
        padding: 10,
        marginHorizontal: 5,
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
        marginLeft:5,
    },
    searchBox2: {
        flexDirection: 'row',
        alignItems: 'center',
      
     
     
        width: '100%',
        height: 50,
    },
    searchIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
        resizeMode: 'contain',
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 0,
        paddingHorizontal: 10,
        height: 40,
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
    filterButton: {
        marginLeft: 1,
    },
    filterIcon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
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
    fileDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    detailIcon: {
        width: 14,
        height: 14,
        marginRight: 4,
        resizeMode: 'contain',
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
    removeButton: {
        backgroundColor: '#ff4d4d',
        width: 40,
        height: 40,
        borderRadius: 20, // Circular button
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 1,
        marginRight:10,
        marginTop:15,
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
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
    topButton2: {
        backgroundColor: '#FAA300',
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
    topHelpIcon2: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
    helpText: {
        color: '#ffffff',
        fontSize: 12,
        flexShrink: 1,
    },
    detailText: {
        color: '#B7B7B7FF',
        fontSize: 10,
        flexShrink: 1,
        marginRight: 5,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#007bff',
    },
    noResultsText: {
        marginTop: 20,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
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
    detailIcon2: {
        width: 14,
        height: 14,
        resizeMode: 'contain',
    },
    
    searchBar: {
        backgroundColor: '#f1f3f6',
        borderRadius: 8,
        marginHorizontal: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
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
    fileIcon: {
        width: 36,
        height: 36,
        marginRight: 12,
        resizeMode: 'contain',
    },
    fileName: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        fontWeight: 'bold',
    },
  
  
    floatingButton: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#007bff',
        borderRadius: 30,
        padding: 16,
        elevation: 5,
    },
    floatingButton2: {
        position: 'absolute',
        bottom: 30,
        right: 90,
        backgroundColor: '#FF6600',
        borderRadius: 30,
        padding: 16,
        elevation: 5,
    },
    floatingButtonIcon: {
        width: 24,
        height: 24,
        tintColor: '#fff',
    },
    editInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#28a745',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        padding: 10,
        borderRadius: 5,
        width: '45%',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default AudioVideoUploadScreen;
