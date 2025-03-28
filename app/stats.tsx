import { Text, View, StyleSheet } from 'react-native';

export default function Stats() {
   return (
      <View style= {styles.container}>
  
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
    text: {
      color: '#fff',
    },
    button: {
      fontSize: 20,
      textDecorationLine: 'underline',
      color: '#fff',
    },
});