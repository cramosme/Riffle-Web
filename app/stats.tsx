import { Text, View, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import Button from './components/Button';

export default function Stats() {
   return (
      <View style= {styles.container}>
        <Text style={styles.text}>Your Stats</Text>
      </View>
    );
}

export const unstable_settings = {
   headerRight: () => (
      <Link href="/settings" style={{ marginRight: 16, color: 'white' }}>
        Settings
      </Link>
    ),
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#25292e',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: '#fff',
    },
    button: {
      fontSize: 20,
      textDecorationLine: 'underline',
      color: '#fff',
    },
});