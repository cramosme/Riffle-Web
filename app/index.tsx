import { View, StyleSheet } from "react-native";
import { Link } from 'expo-router';

import Button from '@/app/components/Button';
import SpotifyAuthWithPKCE from '@/app/components/SpotifyAuthWithPKCE';


export default function Index() {
   return (
      <View style={styles.container}>
         <SpotifyAuthWithPKCE/>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
});