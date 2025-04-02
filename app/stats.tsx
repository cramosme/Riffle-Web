import { Text, View, StyleSheet, ScrollView, Image } from 'react-native';
import { useState, useEffect } from 'react';

export default function Stats () {
  const [profileData, setProfileData] = useState(null);
  const [artistData, setArtistData] = useState(null);
  const [trackData, setTrackData] = useState(null);

   /* add call to refresh-token function */


  useEffect(() => {
    fetchUserData();
  }, []);

   async function fetchUserData() {
      try{
         const profileResponse = await fetch('http://localhost:3000/me',);
         const artistResponse = await fetch('http://localhost:3000/me/top/artists',)
         const trackResponse = await fetch('http://localhost:3000/me/top/tracks',)
         const profileData = await profileResponse.json();
         const artistData = await artistResponse.json();
         const trackData = await trackResponse.json();
         setProfileData(profileData);
         setArtistData(artistData);
         setTrackData(trackData);
      }
      catch(error){
         console.error('Error fetching user data', error);
      }
   };

   return(
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#25292e', }}>
         <View style={styles.container}>
            {profileData && artistData && trackData && (
               <View>
                  <Image source={{ uri: profileData['images'][0]['url'] }} style={{ width: profileData['images'][0]['width'], height: profileData['images'][0]['height'] }} />
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>{profileData['display_name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>Top 5 Artists: </Text>
                  <Image source={{ uri: artistData['items'][0]['images'][1]['url'] }} style={{ width: artistData['items'][0]['images'][1]['width'], height: artistData['items'][0]['images'][1]['height'] }} />
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>#1 {artistData['items'][0]['name']}      Followers: {artistData['items'][0]['followers']['total']}</Text>
                  <Image source={{ uri: artistData['items'][1]['images'][1]['url'] }} style={{ width: artistData['items'][1]['images'][1]['width'], height: artistData['items'][1]['images'][1]['height'] }} />
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>#2 {artistData['items'][1]['name']}      Followers: {artistData['items'][1]['followers']['total']}</Text>
                  <Image source={{ uri: artistData['items'][2]['images'][1]['url'] }} style={{ width: artistData['items'][2]['images'][1]['width'], height: artistData['items'][2]['images'][1]['height'] }} />
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>#3 {artistData['items'][2]['name']}      Followers: {artistData['items'][2]['followers']['total']}</Text>
                  <Image source={{ uri: artistData['items'][3]['images'][1]['url'] }} style={{ width: artistData['items'][3]['images'][1]['width'], height: artistData['items'][3]['images'][1]['height'] }} />
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>#4 {artistData['items'][3]['name']}      Followers: {artistData['items'][3]['followers']['total']}</Text>
                  <Image source={{ uri: artistData['items'][4]['images'][1]['url'] }} style={{ width: artistData['items'][4]['images'][1]['width'], height: artistData['items'][4]['images'][1]['height'] }} />
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>#5 {artistData['items'][4]['name']}      Followers: {artistData['items'][4]['followers']['total']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>Top 5 Tracks: </Text>
                  <Image source={{ uri: trackData['items'][0]['album']['images'][1]['url']}} style={{ width: trackData['items'][0]['album']['images'][1]['width'], height: trackData['items'][0]['album']['images'][1]['height'] }} />
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>#1 {trackData['items'][0]['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Album: {trackData['items'][0]['album']['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Artist: {trackData['items'][0]['album']['artists'][0]['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Release Date: {trackData['items'][0]['album']['release_date']}</Text>

                  <Image source={{ uri: trackData['items'][1]['album']['images'][1]['url']}} style={{ width: trackData['items'][1]['album']['images'][1]['width'], height: trackData['items'][1]['album']['images'][1]['height'] }} />
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>#2 {trackData['items'][1]['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Album: {trackData['items'][1]['album']['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Artist: {trackData['items'][1]['album']['artists'][0]['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Release Date: {trackData['items'][1]['album']['release_date']}</Text>

                  <Image source={{ uri: trackData['items'][2]['album']['images'][1]['url']}} style={{ width: trackData['items'][2]['album']['images'][1]['width'], height: trackData['items'][2]['album']['images'][1]['height'] }} />
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>#3 {trackData['items'][2]['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Album: {trackData['items'][2]['album']['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Artist: {trackData['items'][2]['album']['artists'][0]['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Release Date: {trackData['items'][2]['album']['release_date']}</Text>

                  <Image source={{ uri: trackData['items'][3]['album']['images'][1]['url']}} style={{ width: trackData['items'][3]['album']['images'][1]['width'], height: trackData['items'][3]['album']['images'][1]['height'] }} />
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>#4 {trackData['items'][1]['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Album: {trackData['items'][3]['album']['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Artist: {trackData['items'][3]['album']['artists'][0]['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Release Date: {trackData['items'][3]['album']['release_date']}</Text>

                  <Image source={{ uri: trackData['items'][4]['album']['images'][1]['url']}} style={{ width: trackData['items'][4]['album']['images'][1]['width'], height: trackData['items'][4]['album']['images'][1]['height'] }} />
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>#5 {trackData['items'][4]['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Album: {trackData['items'][4]['album']['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Artist: {trackData['items'][4]['album']['artists'][0]['name']}</Text>
                  <Text style={{ fontSize: 20, paddingVertical: 20, color: 'white' }}>      Release Date: {trackData['items'][4]['album']['release_date']}</Text>
                  {/* <Text>{JSON.stringify(profileData, null, 2)}</Text>
                  <Text>{JSON.stringify(artistData, null, 2)}</Text> */}
                  {/* <Text>{JSON.stringify(trackData, null, 2)}</Text> */}
               </View>
            )}
         </View>
    </ScrollView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#25292e',
   },
});