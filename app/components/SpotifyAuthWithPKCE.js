import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, View } from 'react-native';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

const isWeb = Platform.OS === 'web'; // Check if it's web


// Helper function to generate a random string for code_verifier
async function generateRandomString(length) {
   const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   let randomValues;
   if( isWeb ){
      randomValues = crypto.getRandomValues(new Uint8Array(length));
   } 
   else{
      randomValues = await Crypto.getRandomBytesAsync(length);
   }
   return randomValues.reduce((acc, x) => acc + possible[x % possible.length], "");
}

// Helper function for base64 encoding
const base64encode = (input) => {
   return btoa(String.fromCharCode(...new Uint8Array(input)))
     .replace(/=/g, '')
     .replace(/\+/g, '-')
     .replace(/\//g, '_');
}

// Helper function to make any base64 string URL-safe
const makeUrlSafe = (base64String) => {
   return base64String.replace(/=/g, '')
                      .replace(/\+/g, '-')
                      .replace(/\//g, '_');
 }

// Helper function to hash the code_verifier
const sha256 = async (plain) => {
   if(!isWeb){
      const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, plain, {encoding: 'base64' });
      return makeUrlSafe(hashed);
   }
   else{
      const encoder = new TextEncoder();
      const data = encoder.encode(plain);
      const hash = await window.crypto.subtle.digest('SHA-256', data); // Web-specific
      return base64encode(hash);
   }
}


export default function SpotifyAuth() {

   const handleLogin = async () => {
      // Generate the code_verifier and code_challenge
      const codeVerifier = await generateRandomString(64);
      const codeChallenge = await sha256(codeVerifier);
      // const codeChallenge = base64encode(hashed);

      // Store code_verifier for later use
      if (isWeb) {
         window.localStorage.setItem('code_verifier', codeVerifier);
         window.localStorage.setItem('code_challenge', codeChallenge);
      } else {
         AsyncStorage.setItem('code_verifier', codeVerifier);
         AsyncStorage.setItem('code_challenge', codeChallenge);
      }

      // Spotify Authorization URL
      const clientId = Constants.expoConfig?.extra?.CLIENT_ID;
      const redirectUri = isWeb
         ? 'http://localhost:8081/callback'
         : 'riffle-auth-login://callback'; // Custom scheme for mobile

      const scope = 'user-read-private user-read-email playlist-modify-public';
      
      const authUrl = new URL("https://accounts.spotify.com/authorize");
      const params = {
         response_type: 'code',
         client_id: clientId,
         scope,
         code_challenge_method: 'S256',
         code_challenge: codeChallenge,
         redirect_uri: redirectUri,
      };
      authUrl.search = new URLSearchParams(params).toString();

      // Redirect or open a browser for the Spotify login
      if (isWeb) {
         window.location.href = authUrl.toString(); // Web redirect
      } else {
         WebBrowser.openAuthSessionAsync(authUrl.toString(), redirectUri); // Native browser
      }
   };

   return(
      <View>
         <Button title="Login with Spotify" onPress={handleLogin} />
      </View>
   );
}
