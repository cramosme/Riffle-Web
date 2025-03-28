import { Text, View, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import Slider from '@react-native-community/slider';

export default function MySlider() {

    const [sliderValue, setSliderValue] = useState(0);

    return (
        <View style={styles.container}>
          <Slider
            style={{ width: 300, height: 150 }}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor='#FFFFFF'
            maximumTrackTintColor='#000000'
            onValueChange={(value) => setSliderValue(value)}
          />
          <Text style={styles.text}>Value: {sliderValue.toFixed(0)}</Text>
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
      fontSize: 25,
    },
    button: {
      fontSize: 20,
      textDecorationLine: 'underline',
      color: '#fff',
    },
  });