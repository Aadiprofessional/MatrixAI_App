import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const tabIcons = [
  require('../../assets/card/popular.png'),
  require('../../assets/card/music.png'),
  require('../../assets/card/video1.png'),
  require('../../assets/card/ImageIcon.png'),
  require('../../assets/card/all.png'),
];

const tabs = ['Popular', 'Music', 'Video', 'Image', 'All Category'];

const CategoryTabs = ({ selectedTab, setSelectedTab }) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => (
        <View style={styles.tabContainer} key={index}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === index && styles.selectedTab, // Apply selected style
            ]}
            onPress={() => setSelectedTab(index)} // Set selected tab
          >
            <Image
              source={tabIcons[index]}
              style={[
                styles.icon,
                selectedTab === index && styles.iconSeleted,
                index === 0 && selectedTab !== index && styles.iconUnselectedPopular, // Apply orange tint if "Popular" is unselected
              ]}
            />
          </TouchableOpacity>
          <Text style={[styles.tabText, selectedTab === index && styles.selectedText]}>
            {tab}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    backgroundColor: '#fff', // Debugging background color
  },
  tabContainer: {
    alignItems: 'center',
  },
  tab: {
    width: 40,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 25,
    height: 25,
    tintColor: '#333',
  },
  tabText: {
    fontSize: 12,
    color: 'black',
    marginTop: 5,
    textAlign: 'center',
    width: 60,
  },
  selectedTab: {
    backgroundColor: '#F9690E',
  },
  selectedText: {
    color: '#000',
  },
  iconSeleted: {
    tintColor: '#fff',
  },
  iconUnselectedPopular: {
    tintColor: '#F9690E',
  },
});

export default CategoryTabs;
