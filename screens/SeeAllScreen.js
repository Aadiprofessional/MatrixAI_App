import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import ImageDealsSection from '../components/AIShop/ImageDealsSection';
import VideoDealsSection from '../components/AIShop/VideoDealsSection';
import MusicDealsSection from '../components/AIShop/MusicDealsSection';

const SeeAllScreen = ({ navigation, route }) => {
  const [bestDeals, setBestDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { category, type } = route.params;
return(
    <ScrollView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} >
                <Image source={require('../assets/back.png')} style={styles.backButtonIcon} />
            </TouchableOpacity>
            <Text style={styles.title}>All Deals</Text>
        </View>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{category} Deals</Text>
            <Text style={styles.sectionSubtitle}>{type} Deals</Text>
        </View>
    </ScrollView>
)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
    },
    backButtonIcon: {
        width: 24,
        height: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    
});

export default SeeAllScreen;


