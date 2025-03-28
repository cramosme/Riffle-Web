import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ScrollView } from 'react-native';

const clientId = Constants.expoConfig?.extra?.CLIENT_ID;
const redirectUri = 'http://localhost:8081/callback'


export default function Callback() {
   const { code } = useLocalSearchParams(); // Get the `code` from the URL query params
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [userData, setUserData] = useState(null);
   const router = useRouter();

   useEffect(() => {
      const exchangeCodeForToken = async () => {
         if (!code) {
            console.error('Authorization code not found.');
            setIsLoggedIn(false);
            window.location.href = 'http://localhost:8081';
            return;
         }

         try {
            const codeVerifier = await AsyncStorage.getItem('code_verifier');
            if (!codeVerifier) {
               console.error('Code verifier not found');
               setIsLoggedIn(false); // Set to false if code verifier is not found
               window.location.href = 'http://localhost:8081';
               return;
            }

            const url = 'https://accounts.spotify.com/api/token';
            const payload = new URLSearchParams({
               client_id: clientId,
               grant_type: 'authorization_code',
               code: code.toString(),
               redirect_uri: redirectUri,
               code_verifier: codeVerifier,
            });

            const response = await fetch(url, {
               method: 'POST',
               headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
               body: payload,
            });

            const data = await response.json();
            let expiryTime = null;
            if (data.access_token) {
               console.log('Access Token:', data.access_token);
               await AsyncStorage.setItem('access_token', data.access_token); // Store the token
               
               if(data.refresh_token){
                  await AsyncStorage.setItem('refresh_token', data.refresh_token);
               }

               if( data.expires_in ){
                  expiryTime = Date.now() + (data.expires_in * 1000);
                  await AsyncStorage.setItem('token_expiry', expiryTime.toString());
               }

               sendTokenToBackend(data.access_token, data.refresh_token || null, expiryTime);
               fetchUserData(data.access_token);

               setIsLoggedIn(true);

            } else {
               console.error('Error getting access token:', data);
               setIsLoggedIn(false); // Set to false if no access token
               window.location.href = 'http://localhost:8081';
               return;
            }
         } catch (error) {
            console.error('Error exchanging code for token:', error);
            setIsLoggedIn(false); // Set to false if no access token
            window.location.href = 'http://localhost:8081';
            return;
         }
      };

      exchangeCodeForToken();
   }, [code, router]); // Run when `code` is available from the redirect

   async function sendTokenToBackend( token:string, refreshToken: string | null, expiry:number | null ){
      try{
         const response = await fetch('http://localhost:3000/store-token',{
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
               access_token: token,
               refresh_token: refreshToken,
               expires_in: expiry,
            }),
         });
         const data = await response.json();
         console.log('Backend response: ', data);
      }
      catch(error){
         console.error('Error sending token to backend:', error);
      }
   }

   async function fetchUserData(token:string) {
      try{
         const response = await fetch('http://localhost:3000/me',{
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });
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
         {isLoggedIn ? (
         <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Login Successful!</Text>
            {userData && (
               <View>
               <Text style={{ fontSize: 20 }}>User Info:</Text>
               <Text>{JSON.stringify(userData, null, 2)}</Text>
               </View>
            )}
         </View>
         ) : (
         <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Exited Login</Text>
         )}
    </ScrollView>
   );
}
