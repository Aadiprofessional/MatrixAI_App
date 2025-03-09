import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';

const ReferralScreen = () => {
  const referralCode = '03AERET78';

  const copyToClipboard = () => {
    Alert.alert('Copied!', 'Referral code copied to clipboard.');
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton}>
        <Image source={require('../../assets/back.png')} style={styles.backIcon} />
      </TouchableOpacity>

      {/* Blue Area */}
      <View style={styles.blueArea}>
        <Text style={styles.header}>Refer Your Friends</Text>
        <Text style={styles.subHeader}>Get 25 coins for each Invite</Text>
      </View>

      {/* Coin Box Overlapping Blue and White Areas */}
      <View style={styles.coinBoxContainer}>
        <View style={styles.coinBox}>
          <Image source={require('../../assets/coin.png')} style={styles.coinIcon} />
          <View style={styles.coinBox2}>
          <Text style={styles.coinText}>Total Coins</Text>
          <Text style={styles.coinAmount}>80</Text>
          </View>
        </View>
      </View>

      {/* White Area */}
      <View style={styles.whiteArea}>
        {/* Instructions Section */}
        <View style={styles.instructions}>
          <View style={styles.instructionRow}>
            <Image source={require('../../assets/invite-icon.png')} style={styles.icon} />
            <Text style={styles.instructionText}>
              Invite your friend to install the app via link or ask to add code during signup
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <Image source={require('../../assets/gift-icon.png')} style={styles.icon} />
            <Text style={styles.instructionText}>
              When your friend signs up, you will get <Text style={styles.highlight}>25 coins</Text> and they will get{' '}
              <Text style={styles.highlight}>15 coins</Text>
            </Text>
          </View>
        </View>

        {/* Referral Code Section */}
        <View style={styles.referralContainer}>
          <Text style={styles.referralText}>Your referral code</Text>
          <TouchableOpacity style={styles.codeBox} onPress={copyToClipboard}>
            <Text style={styles.code}>{referralCode}</Text>
            <Image source={require('../../assets/copy.png')} style={styles.copyIcon} />
          </TouchableOpacity>
        </View>

        {/* Invite Button */}
        <TouchableOpacity style={styles.inviteButton}>
          <Text style={styles.inviteButtonText}>Invite Friend</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFFFF',
     
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  blueArea: {
    backgroundColor: '#2158AB',
    padding: 20,
   
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
paddingBottom:60,
  },
  header: {
    fontSize: 18,
    marginTop:30,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'left',
  },
  subHeader: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'left',
    marginTop: 10,
  },
  coinBoxContainer: {
    position: 'absolute',
    top: 120,
    left: '3%',
    right: '3%',
    alignItems: 'center',
    zIndex: 10,
  },
  coinBox: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    flexDirection:'row',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    elevation: 13,
  },
  coinBox2: {
  
    padding: 10,
    flexDirection:'column',
 
 
  },
  coinIcon: {
    width: 50,
    height: 50,

  },
  coinText: {
    fontSize: 16,
    color: '#333',
  },
  coinAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B4B4BFF',
  },
  whiteArea: {
    flex: 1,
    backgroundColor: '#fff',
   marginTop:10,
    paddingHorizontal: 16,
    paddingTop: 50,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  instructions: {
    backgroundColor: '#eaf3ff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#003399',
  },
  referralContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  referralText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  codeBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#003399',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  code: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  copyIcon: {
    width: 24,
    height: 24,
  },
  inviteButton: {
    backgroundColor: '#FF6600',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReferralScreen;
