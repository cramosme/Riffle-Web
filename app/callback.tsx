import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Int32 } from 'react-native/Libraries/Types/CodegenTypes';

const clientId = Constants.expoConfig?.extra?.CLIENT_ID;
const redirectUri = 'http://localhost:8081/callback'; // Native redirect URI

const sleep = (ms: Int32) => new Promise(resolve => setTimeout(resolve, ms));


export default function Callback() {
   const { code } = useLocalSearchParams(); // Get the `code` from the URL query params
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const router = useRouter();
   const isWeb = Platform.OS === 'web';

   useEffect(() => {
      const exchangeCodeForToken = async () => {
         if (!code) {
            console.error('Authorization code not found.');
            setIsLoggedIn(false);
            await sleep(500);
            if(!isWeb) router.replace('/');
            // else window.location.href = 'http://localhost:8081';
            return;
         }

         try {
            const codeVerifier = await AsyncStorage.getItem('code_verifier');
            if (!codeVerifier) {
               console.error('Code verifier not found');
               setIsLoggedIn(false); // Set to false if code verifier is not found
               await sleep(500);
               if(!isWeb) router.replace('/');
               // else window.location.href = 'http://localhost:8081';
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
            if (data.access_token) {
               console.log('Access Token:', data.access_token);
               await AsyncStorage.setItem('access_token', data.access_token); // Store the token
               setIsLoggedIn(true);
               await sleep(500);
               if(!isWeb) router.replace('/');
               // else window.location.href = 'http://localhost:8081';
            } else {
               console.error('Error getting access token:', data);
               setIsLoggedIn(false); // Set to false if no access token
               await sleep(500);
               if(!isWeb) router.replace('/');
               // else window.location.href = 'http://localhost:8081';
            }
         } catch (error) {
            console.error('Error exchanging code for token:', error);
            setIsLoggedIn(false); // Set to false if no access token
            await sleep(500);
            if(!isWeb) router.replace('/');
            // else window.location.href = 'http://localhost:8081';
         }
      };

      exchangeCodeForToken();
   }, [code, router]); // Run when `code` is available from the redirect

   return(
      <div>
         {isLoggedIn ? (
            <h1>Login Successful!</h1>
            //send to new page
         ) : (
            <h1>Exited Login</h1>
         )
         }
      </div>
   );
}
