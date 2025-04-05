"use client";

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
const redirectUri = 'http://localhost:8081/callback'


export default function Callback() {
   const searchParams = useSearchParams();
   const router = useRouter();
   const code = searchParams.get("code");

   useEffect(() => {
      const exchangeCodeForToken = async () => {
         if (!code) {
            console.error('Authorization code not found.');
             // Delay navigation to allow Root Layout to mount
            setTimeout(() => {
               router.replace('/');
            }, 0);
            return;
         }

         try {
            const codeVerifier = localStorage.getItem('code_verifier');
            if (!codeVerifier) {
               console.error('Code verifier not found');
               setTimeout(() => {
                  router.replace('/');
               }, 0);
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
               localStorage.setItem('access_token', data.access_token); // Store the token
               
               if(data.refresh_token){
                  localStorage.setItem('refresh_token', data.refresh_token);
               }

               if( data.expires_in ){
                  expiryTime = Date.now() + (data.expires_in * 1000);
                  localStorage.setItem('token_expiry', expiryTime.toString());
               }

               const response = await sendTokenToBackend(data.access_token, data.refresh_token || null, expiryTime);
               const userId = response['user_id'];
               localStorage.setItem('user_id', userId);

               router.replace(`/stats/${userId}`);

            } else {
               console.error('Error getting access token:', data);
               setTimeout(() => {
                  router.replace('/');
               }, 0);
               return;
            }
         } catch (error) {
            console.error('Error exchanging code for token:', error);
            setTimeout(() => {
               router.replace('/');
            }, 0);
            return;
         }
      };

      exchangeCodeForToken();
   }, [code, router]); // Run when `code` is available from the redirect

   async function sendTokenToBackend( token, refreshToken, expiry ){
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
         return data;
      }
      catch(error){
         console.error('Error sending token to backend:', error);
      }
   }

   return null;
}