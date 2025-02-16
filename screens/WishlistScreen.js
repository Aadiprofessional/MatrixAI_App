import React, { useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { WishlistContext } from '../context/WishlistContext';
import { RectButton, Swipeable } from 'react-native-gesture-handler';

const WishlistScreen = () => {
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

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item)}
      overshootRight={false}
    >
      <View style={styles.itemContainer}>
        {item.image && (
          <Image source={item.image} style={styles.itemImage} />
        )}
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{item.name}</Text>
          <Text style={styles.itemPrice}>{item.price}</Text>
        </View>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wishlist</Text>
      {wishlistItems.length > 0 ? (
        <FlatList
          data={wishlistItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      ) : (
        <Text style={styles.emptyText}>Your wishlist is empty</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 50,
    color: '#000',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
