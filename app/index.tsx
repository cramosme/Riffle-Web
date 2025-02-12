import { View, StyleSheet } from "react-native";
import { Link } from 'expo-router';

import Button from '@/components/Button';

export default function Index() {
  return (
    <View style={styles.container}>
      <Link href="http://localhost:8888">
        <Button theme="login-button" label="Login to Spotify" />
      </Link>
    </View>
  );
}

const getTokenFromUrl = (): Record<string, string> => {
  return window.location.hash.substring(1).split('&').reduce((initial, item) => {
    let parts = item.split("=");
    initial[parts[0]] = decodeURIComponent(parts[1]);
    return initial;
  }, {} as Record<string, string>);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
});