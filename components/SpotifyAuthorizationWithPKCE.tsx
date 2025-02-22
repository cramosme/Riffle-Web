import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();


// Endpoint
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export default function App() {
   const isWeb = Constants.platform?.web;

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: Constants.expoConfig?.extra?.CLIENT_ID,
      scopes: ['user-read-email', 'playlist-modify-public'],
      usePKCE: true,
      redirectUri: makeRedirectUri({
        scheme: 'riffle-auth-login',
        path: 'callback',
        // Use a loopback address for web
        native: isWeb ? 'http://localhost:8081/callback' : 'riffle-auth-login://callback',
      }),
    },
    discovery
  );
   
  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
    }
  }, [response]);

  return (
    <Button
      disabled={!request}
      title="Login"
      onPress={() => {
        promptAsync();
      }}
    />
  );
}
