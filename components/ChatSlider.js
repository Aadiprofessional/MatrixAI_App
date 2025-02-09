import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Dialog, Portal, Button, Provider } from 'react-native-paper';

const imageAssets = [
    require('../assets/Avatar/chat1.png'),
    require('../assets/Avatar/chat2.png'),
    require('../assets/Avatar/chat3.png'),
    require('../assets/Avatar/chat4.png'),
    require('../assets/Avatar/chat5.png'),
    require('../assets/Avatar/chat6.png'),
];

const ChatSlider = ({ isVisible, setIsVisible }) => {
    const navigation = useNavigation();
    const [chats, setChats] = useState([
        { name: 'Matrix Bot', description: 'Think, Create, and Earn', image: require('../assets/Avatar/Cat.png') },
        { name: 'StarryAI bot', description: 'AI Image Creator', image: imageAssets[0] },
        { name: 'Creative WritingsE', description: 'Text Generator', image: imageAssets[1] },
        { name: 'RealVisXL', description: 'Image Enhancer', image: imageAssets[2] },
        { name: 'MrTeacherGPT', description: 'Teaching Assistant', image: imageAssets[3] },
        { name: 'Photo CreateE', description: 'Photo Editing Bot', image: imageAssets[4] },
        { name: 'PsychologicalExpert', description: 'Mental Health Guide', image: imageAssets[5] },
    ]);

    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [newChatName, setNewChatName] = useState('');
    const [newChatDescription, setNewChatDescription] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    const addChat = () => {
        if (newChatName.trim()) {
            setChats([
                ...chats,
                {
                    name: newChatName,
                    description: newChatDescription,
                    image: selectedImage || imageAssets[0],
                },
            ]);
            setNewChatName('');
            setNewChatDescription('');
            setSelectedImage(null);
            setAddModalVisible(false);
        }
    };

    return (
        <Provider>
            <Portal>
                <Dialog visible={isVisible} onDismiss={() => setIsVisible(false)}>
                    <Dialog.Title>All Chats</Dialog.Title>
                    <Dialog.Content>
                        {/* Chat List */}
                        <FlatList
                            data={chats}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.chatItem}
                                    onPress={() => {
                                        setIsVisible(false);
                                        navigation.navigate('BotScreen', {
                                            chatName: item.name,
                                            chatDescription: item.description,
                                            chatImage: item.image,
                                            chatid: item.name
                                        });
                                    }}
                                >
                                    <Image source={item.image} style={styles.chatImage} />
                                    <View style={styles.chatTextContainer}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.chatName}>{item.name}</Text>
                                            {item.name === 'Matrix Bot' && (
                                                <View style={styles.rightContainer}>
                                                    <Image source={require('../assets/star.png')} style={styles.starImage} />
                                                    <Text style={styles.officialText}>Official</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.chatDescription}>{item.description}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setIsVisible(false)}>Cancel</Button>
                        <Button onPress={() => setAddModalVisible(true)}>Add Chat</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Add Chat Modal */}
                <Dialog visible={isAddModalVisible} onDismiss={() => setAddModalVisible(false)}>
                    <Dialog.Title>Add New Chat</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            placeholder="Chat Name"
                            value={newChatName}
                            onChangeText={setNewChatName}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Description"
                            value={newChatDescription}
                            onChangeText={setNewChatDescription}
                            style={styles.input}
                        />

                        {/* Image Selection */}
                        <Text style={styles.label}>Choose Image</Text>
                        <View style={styles.imageGrid}>
                            {imageAssets.map((img, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedImage(img)}
                                    style={[
                                        styles.imageWrapper,
                                        selectedImage === img && styles.selectedImage,
                                    ]}
                                >
                                    <Image source={img} style={styles.imageOption} />
                                    {selectedImage === img && <Text style={styles.checkmark}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={addChat}>Add Chat</Button>
                        <Button onPress={() => setAddModalVisible(false)}>Cancel</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </Provider>
    );
};



const styles = StyleSheet.create({
    modal: { margin: 0, justifyContent: 'flex-end' },
    container: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        height: '80%',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    closeIcon: { width: 24, height: 24 },
    addIcon: { width: 30, height: 30, tintColor: '#007BFF' },
    title: { fontSize: 22, fontWeight: 'bold' },
    chatItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    chatImage: { width: 45, height: 45, borderRadius: 25, marginRight: 10, backgroundColor: '#333' },
    chatTextContainer: { flex: 1 },
    chatName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    chatDescription: { fontSize: 12, color: '#666' },
    addModal: { justifyContent: 'center', alignItems: 'center' },
    addContainer: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, width: '90%' },
    addTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#E0E0E0', padding: 10, borderRadius: 8, marginBottom: 10 },
    label: { fontSize: 16, marginBottom: 8, fontWeight: 'bold' },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    imageWrapper: {
        borderWidth: 2,
        borderColor: '#DDD',
        backgroundColor: '#333',
        borderRadius: 50,
        padding: 5,
        marginBottom: 10,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDE8FF',
        borderRadius: 15,
        paddingVertical: 2,
        paddingHorizontal: 8,
        marginLeft: 8,
        justifyContent: 'center',
    },
    starImage: {
        width: 12,
        height: 12,
        marginRight: 3,
    },
    officialText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#6A2C9F',
    },
    imageOption: { width: 60, height: 60, borderRadius: 30 },
    selectedImage: { borderColor: '#007BFF' },
    checkmark: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        color: '#007BFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    addButton: { backgroundColor: '#007BFF', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});

export default ChatSlider;
