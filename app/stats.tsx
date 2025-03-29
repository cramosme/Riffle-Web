import { Text, View, StyleSheet, ScrollView, Image } from 'react-native';
import { useState, useEffect } from 'react';

export default function Stats () {
  const [userData, setUserData] = useState(null);


  useEffect(() => {
    fetchUserData();
  }, []);

   async function fetchUserData() {
      try{
         const response = await fetch('http://localhost:3000/me',);
         const data = await response.json();
         console.log('User Info:', data);
         setUserData(data);
      }
      catch(error){
         console.error('Error fetching user data', error);
      }
   };

    return(
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
         <View>
            {userData && (
               <View>
                  <Text style={{ fontSize: 20 }}>{userData['display_name']}</Text>
                  <Image source={{ uri: userData['images'][0]['url'] }} style={{ width: userData['images'][0]['width'], height: userData['images'][0]['height'] }} />
                  <Text>{JSON.stringify(userData, null, 2)}</Text>
               </View>
            )}
         </View>
    </ScrollView>
   );
}