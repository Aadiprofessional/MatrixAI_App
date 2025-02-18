import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const LeftNavbarBot = ({ chats, onSelectChat, onNewChat, onClose, onDeleteChat }) => {
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.sidebar}>
        {/* Header of Sidebar */}
        <View style={styles.header}>
          <Text style={styles.title}>Chats</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        {/* New Chat Button */}
        <TouchableOpacity style={styles.newChatButton} onPress={onNewChat}>
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 5 }} />
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>

        {/* List of Chats */}
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.chatItem}>
              <TouchableOpacity
                style={styles.chatContent}
                onPress={() => onSelectChat(item.id)}
              >
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={styles.chatDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDeleteChat(item.id)}
              >
                <Ionicons name="trash-outline" size={24} color="#FF0000" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  chatContent: {
    flex: 1,
  },
  deleteButton: {
    marginLeft: 10,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '75%',
    backgroundColor: '#FFFFFF',
    elevation: 5,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    // Removed text styles as vector icon is used
    // fontSize: 18,
    // color: '#888',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#4C8EF7',
    borderRadius: 5,
    // alignItems: 'center', // Already aligned with flexDirection: 'row'
  },
  newChatText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  chatItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatDescription: {
    fontSize: 12,
    color: '#666',
  },
});

export default LeftNavbarBot;
