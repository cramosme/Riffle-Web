import React from 'react';
import { Pressable, Text, StyleSheet, GestureResponderEvent } from 'react-native';

type CustomButtonProps = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
};

export default function CustomButton({ label, onPress }: CustomButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0eaa45',
    borderRadius: 15, // increased roundness
    paddingVertical: 12, // extra vertical padding
    paddingHorizontal: 20, // extra horizontal padding
    marginRight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: '#0c8a3e', // a slightly different shade when pressed
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Lato-Bold', // Ensure Lato is loaded using expo-font
  },
});
