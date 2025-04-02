import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';

export default function NotFound() {

   useFonts({'Lato-Bold': require('../assets/fonts/Lato-Bold.ttf')});


   return(

      <View style = {styles.container}>
         <Text style = {styles.text}>
            Page not found.
         </Text>
      </View>


   );

}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
   text: {
      color: '#fff',
      fontSize: 25,
      fontFamily: 'Lato-Bold',
   }
});