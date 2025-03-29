import { Text, View, StyleSheet, ScrollView, Image } from 'react-native';
import { useState, useEffect } from 'react';

export default function Stats () {
  const [profileData, setProfileData] = useState(null);
  const [artistData, setArtistData] = useState(null);


  useEffect(() => {
    fetchUserData();
  }, []);

   async function fetchUserData() {
      try{
         const profileResponse = await fetch('http://localhost:3000/me',);
         const artistResponse = await fetch('http://localhost:3000/me/top/artists',)
         const profileData = await profileResponse.json();
         const artistData = await artistResponse.json();
         setProfileData(profileData);
         setArtistData(artistData);
      }
      catch(error){
         console.error('Error fetching user data', error);
      }
   };

    return(
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
         <View>
            {profileData && artistData && (
               <View>
                  <Text style={{ fontSize: 20 }}>{profileData['display_name']}</Text>
                  <Image source={{ uri: profileData['images'][0]['url'] }} style={{ width: profileData['images'][0]['width'], height: profileData['images'][0]['height'] }} />
                  <Text>{JSON.stringify(profileData, null, 2)}</Text>
                  <Text>{JSON.stringify(artistData, null, 2)}</Text>
               </View>
            )}
         </View>
    </ScrollView>
   );
}