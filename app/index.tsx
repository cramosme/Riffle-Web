/* Index is home page */

import { Text, View, StyleSheet } from "react-native";

export default function Index() {
   return (
      <View style={styles.container}>
        <Text style={styles.paragraph}>
          Welcome to Riffle!
          Riffle is a web application that uses the publicly available Spotify API to provide users with useful statistics about their listening habits.         
      </Text>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#979da6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paragraph: {
    fontSize: 25,
    lineHeight: 50,
    textAlign: 'justify',
  }
});