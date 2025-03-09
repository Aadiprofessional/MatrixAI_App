import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ImageBackground, ActivityIndicator, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
  import { useAuth } from '../context/AuthContext'; 
const BoostModal = ({ visible, onClose, onBoost, selectedDays, setSelectedDays }) => {
  const { uid } = useAuth();
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Boost Your Product</Text>
          <Text style={styles.modalText}>
            You can boost your income with this! It will show your product to front screen so that users buy more rapidly with 5 coins/day
          </Text>
          
          <View style={styles.radioContainer}>
            <TouchableOpacity 
              style={styles.radioButton}
              onPress={() => setSelectedDays('5')}
            >
              <View style={[styles.radioCircle, selectedDays === '5' && styles.radioSelected]}>
                {selectedDays === '5' && <View style={styles.radioInnerCircle} />}
              </View>
              <Text style={styles.radioLabel}>5 Days</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.radioButton}
              onPress={() => setSelectedDays('15')}
            >
              <View style={[styles.radioCircle, selectedDays === '15' && styles.radioSelected]}>
                {selectedDays === '15' && <View style={styles.radioInnerCircle} />}
              </View>
              <Text style={styles.radioLabel}>15 Days</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.radioButton}
              onPress={() => setSelectedDays('30')}
            >
              <View style={[styles.radioCircle, selectedDays === '30' && styles.radioSelected]}>
                {selectedDays === '30' && <View style={styles.radioInnerCircle} />}
              </View>
              <Text style={styles.radioLabel}>30 Days</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalNote}>More number of days increase your income</Text>

          <TouchableOpacity 
            style={styles.modalBoostButton}
            onPress={onBoost}
          >
            <Text style={styles.modalBoostText}>Boost</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const ManageProductsScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState({
    images: [],
    videos: [],
    music: []
  });
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedDays, setSelectedDays] = useState('5');

  const handleBoost = async (type, id) => {
    try {
      const endpoint = type === 'image' ? 'addBestDealsImageProduct' :
                      type === 'video' ? 'addBestDealsVideoProduct' :
                      'addBestDealsMusicProduct';
      
      const response = await fetch(`https://matrix-server.vercel.app/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: uid,
          [type === 'image' ? 'imageproductid' : 
           type === 'video' ? 'videoproductid' : 
           'musicproductid']: id,
          days: selectedDays
        })
      });

      if (!response.ok) {
        throw new Error('Failed to boost product');
      }

      // Close modal after successful boost
      setShowBoostModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error boosting product:', error);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://matrix-server.vercel.app/getOwnerAllProducts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: uid
          })
        });
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleRemoveProduct = async (type, id) => {
    setRemoving(id);
    try {
      await fetch('https://matrix-server.vercel.app/removeProduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: uid,
          [type === 'image' ? 'imageproductid' : 
           type === 'video' ? 'videoproductid' : 
           'musicproductid']: id
        })
      });
      setProducts(prev => ({
        ...prev,
        [type]: prev[type].filter(p => 
          p.imageproductid !== id && 
          p.videoproductid !== id && 
          p.musicproductid !== id
        )
      }));
    } catch (error) {
      console.error('Error removing product:', error);
    } finally {
      setRemoving(null);
    }
  };

  const renderProductSection = (title, products, isVideo = false, isMusic = false) => {
    if (products.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {products.map((product) => (
          <View key={product.imageproductid || product.videoproductid || product.musicproductid} style={styles.productContainer}>
            <View style={styles.mainRow}>
              <View style={[styles.mediaContainer, isMusic && styles.musicContainer]}>
                {playing === product.imageproductid || playing === product.videoproductid || playing === product.musicproductid ? (
                  <View style={styles.mediaPlayer}>
                    {/* Media player would go here */}
                  </View>
                ) : (
                  <>
                    <Image 
                      source={{ uri: isVideo ? product.thumbnail_url : product.image_url || product.thumbnail_url }} 
                      style={styles.productImage} 
                    />
                    <TouchableOpacity 
                      style={styles.playButton}
                      onPress={() => setPlaying(product.imageproductid || product.videoproductid || product.musicproductid)}
                    >
                      <Image 
                        source={require('../assets/play.png')}
                        style={styles.playIcon}
                      />
                    </TouchableOpacity>
                  </>
                )}
              </View>
              <View style={styles.detailsColumn}>
                <View style={styles.nameContainer}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Image 
                    source={require('../assets/pencil.png')}
                    style={styles.pencilIcon}
                  />
                </View>
                <Text style={styles.productPrice}>${product.price}</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={styles.iconButton}
                    onPress={() => handleRemoveProduct(
                      isVideo ? 'video' : isMusic ? 'music' : 'image',
                      product.imageproductid || product.videoproductid || product.musicproductid
                    )}
                    disabled={!!removing}
                  >
                    {removing === (product.imageproductid || product.videoproductid || product.musicproductid) ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Image 
                        source={require('../assets/remove.png')}
                        style={styles.removeIcon}
                      />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.boostButton}
                    onPress={() => {
                      setSelectedProduct({
                        type: isVideo ? 'video' : isMusic ? 'music' : 'image',
                        id: product.imageproductid || product.videoproductid || product.musicproductid
                      });
                      setShowBoostModal(true);
                    }}
                  >
                    <Text style={styles.boostText}>Boost</Text>
                    <Text style={styles.boostText}>5</Text>
                    <Image 
                      source={require('../assets/coin.png')}
                      style={styles.coinIcon}
                    />
                    <Text style={styles.boostText}>/ Day</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image 
            source={require('../assets/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Your Products</Text>
      </View>
      <ImageBackground 
        source={require('../assets/matrix.png')} 
        style={styles.background}
        imageStyle={{ opacity: 0.25 }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
          </View>
        ) : (
          <>
            {renderProductSection('Your Images', products.images)}
            {renderProductSection('Your Videos', products.videos, true)}
            {renderProductSection('Your Music', products.music, false, true)}
          </>
        )}
      </ImageBackground>
      <BoostModal
        visible={showBoostModal}
        onClose={() => setShowBoostModal(false)}
        onBoost={() => {
          if (selectedProduct) {
            handleBoost(selectedProduct.type, selectedProduct.id);
          }
        }}
        selectedDays={selectedDays}
        setSelectedDays={setSelectedDays}
      />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 10,
    color: '#333',
  },
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  productContainer: {
    flexDirection: 'column',
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    margin: 10,
    backgroundColor: '#FFF',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mediaContainer: {
    width: 160,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicContainer: {
    height: 80,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playButton: {
    position: 'absolute',
  },
  playIcon: {
    width: 40,
    height: 40,
    tintColor: '#FFF',
  },
  detailsColumn: {
    flex: 1,
    marginLeft: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  pencilIcon: {
    width: 20,
    height: 20,
  },
  productPrice: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    backgroundColor: '#FF5733',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  boostButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    padding: 8,
    minWidth: 120,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  boostText: {
    color: '#FFF',
    fontSize: 14,
  },
  coinIcon: {
    width: 16,
    height: 16,
  },
  removeIcon: {
    width: 24,
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  radioContainer: {
    marginBottom: 15,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioSelected: {
    borderColor: '#007BFF',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007BFF',
  },
  radioLabel: {
    fontSize: 16,
  },
  modalNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBoostButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBoostText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ManageProductsScreen;
