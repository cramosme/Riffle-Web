import { Link, Stack } from 'expo-router';
import { Image, View, Text, StyleSheet } from 'react-native';
import SpotifyAuthWithPKCE from '@/app/components/SpotifyAuthWithPKCE';
import { useFonts } from 'expo-font'


const RiffleLogo = require('@/assets/images/riffle_logo.png');

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerLeft: () => null,
        headerStyle: {
          backgroundColor: '#1b1811',
        },
        headerTransparent: true,
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center'}}>
            <Image source={RiffleLogo} style={{ width:50, height:50, marginLeft: 40}}/>
            <Text style={{ paddingHorizontal: 10, fontFamily: 'Lato-Bold', fontSize: 25, fontWeight: 'bold', color: 'white' }}>
               Riffle
            </Text>
          </View>
        ),
      }}>
      <Stack.Screen name="stats" options={{ 
        title: 'Stats',
        headerRight: () => (
          <Link href="/settings" style={{ marginRight: 40, fontFamily: 'sans', fontSize: 25, fontWeight: 'bold', color: 'white' }}>
            Settings
          </Link>
        ),
      }} />
      <Stack.Screen name="settings" options={{
         title: 'Settings',
         headerRight: () => (
          <Link href="/stats" style={{ marginRight: 40, fontFamily: 'sans', fontSize: 25, fontWeight: 'bold', color: 'white' }}>
            Stats
          </Link>
         ), 
      }} />
      <Stack.Screen name="index" options={{
        title: 'Home',
        headerRight: () => (
          <SpotifyAuthWithPKCE/>
        ),
      }} />
    </Stack>
  );
}