import { StyleSheet, View, Pressable, Text } from 'react-native';

type Props = {
   label: string;
   theme?: 'login-button';
   onPress?: () => void;
};

export default function Button({ label, theme, onPress }: Props) {
   if( theme === 'login-button' ){
      return (
         <View style={[
            styles.buttonContainer,
         ]}>
         <Pressable 
            style={[styles.button, { backgroundColor: '#fff' }]} 
            onPress={onPress}>
            <Text style={[styles.buttonLabel, { color: '#25292e' }]}>{label}</Text>
            </Pressable>
         </View>
      );
   }

   return (
      <View style={styles.buttonContainer}>
         <Pressable style={styles.button} onPress={onPress}>
            <Text style={styles.buttonLabel}>{label}</Text>
         </Pressable>
      </View>
   );
}

const styles = StyleSheet.create({
   buttonContainer: {
     width: 320,
     height: 68,
     marginHorizontal: 20,
     alignItems: 'center',
     justifyContent: 'center',
     padding: 3,
   },
   button: {
     borderRadius: 10,
     width: '100%',
     height: '100%',
     alignItems: 'center',
     justifyContent: 'center',
     flexDirection: 'row',
   },
   buttonLabel: {
     color: '#fff',
     fontSize: 16,
   },
 });