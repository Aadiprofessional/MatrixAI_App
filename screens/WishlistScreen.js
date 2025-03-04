import React, { useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { WishlistContext } from '../context/WishlistContext';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import MusicCard from '../components/AIShop/MusicCard';
import VideoCard from '../components/AIShop/VideoCard';
import { SafeAreaView } from 'react-native-safe-area-context';

const WishlistScreen = ({ navigation }) => {
  const { wishlistItems, removeFromWishlist } = useContext(WishlistContext);

  const renderRightActions = (item) => (
    <View style={styles.rightActions}>
      <RectButton
        style={[styles.actionButton, styles.addToCartButton]}
        onPress={() => console.log('Add to cart', item.id)}
      >
        <Text style={styles.actionButtonText}>Add to Cart</Text>
      </RectButton>
      <RectButton
        style={[styles.actionButton, styles.removeButton]}
        onPress={() => removeFromWishlist(item.id)}
      >
        <Text style={styles.actionButtonText}>Remove</Text>
      </RectButton>
    </View>
  );

  const renderItem = ({ item }) => {
    const commonProps = {
      title: item.name,
      price: item.price,
      image: item.image,
      navigation: navigation,
      item: item
    };

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
      >
        {item.type === 'music' ? (
          <MusicCard 
            {...commonProps}
            musicproductid={item.id}
          />
        ) : item.type === 'video' ? (
          <VideoCard
            {...commonProps}
            videoproductid={item.id}
            videoUrl={item.videoUrl}
          />
        ) : (
          <View style={styles.itemContainer}>
            {item.image && (
              <Image source={item.image} style={styles.itemImage} />
            )}
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.price}</Text>
            </View>
          </View>
        )}
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/back.png')} style={styles.backButton} />
        </TouchableOpacity>
        <Text style={styles.title}>Wishlist</Text>
      </View>
      {wishlistItems.length > 0 ? (
        <FlatList
          data={wishlistItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      ) : (
        <Text style={styles.emptyText}>Your wishlist is empty</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
     
    marginBottom: 16,
  },
  backButton: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  rightActions: {
    flexDirection: 'row',
    width: 200,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
  },
  removeButton: {
    backgroundColor: '#ff4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default WishlistScreen;
