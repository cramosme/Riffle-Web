import { Stack } from 'expo-router';
import { Image, View, Text, StyleSheet } from 'react-native';


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
            <Text style={{ paddingHorizontal: 10, fontFamily: 'sans', fontSize: 25, fontWeight: 'bold', color: 'white' }}>
               Riffle
            </Text>
          </View>
        ),
      }}>
      <Stack.Screen name="stats" options={{ title: 'Stats' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 100,
    height: 200,
  }
})
