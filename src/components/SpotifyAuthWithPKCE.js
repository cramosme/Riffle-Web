"use client";

import React from "react";
import Button from "./Button";

// Helper function to generate a random string for code_verifier
function generateRandomString(length) {
   const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   const randomValues = new Uint8Array(length);
   crypto.getRandomValues(randomValues);
   return Array.from(randomValues).reduce(
     (acc, x) => acc + possible[x % possible.length],
     ""
   );
 }

// Helper function for base64 encoding
const base64encode = (input) => {
   return btoa(String.fromCharCode(...new Uint8Array(input)))
     .replace(/=/g, "")
     .replace(/\+/g, "-")
     .replace(/\//g, "_");
}

// Helper function to make any base64 string URL-safe
const makeUrlSafe = (base64String) => {
   return base64String.replace(/=/g, "")
                      .replace(/\+/g, "-")
                      .replace(/\//g, "_");
 }

// Helper function to hash the code_verifier using SHA-256
async function sha256(plain) {
   const encoder = new TextEncoder();
   const data = encoder.encode(plain);
   const hash = await window.crypto.subtle.digest("SHA-256", data);
   return base64encode(hash);
 }


export default function SpotifyAuthWithPKCE() {

   const handleLogin = async () => {
      // Generate the code_verifier and code_challenge
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await sha256(codeVerifier);

      // Store code_verifier for later use
      localStorage.setItem("code_verifier", codeVerifier);
      localStorage.setItem("code_challenge", codeChallenge);

      // Spotify Authorization URL
      const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
      const redirectUri = "http://localhost:8081/callback"; // Custom scheme for mobile

      const scope = [
         // Images
         "ugc-image-upload",
         // Spotify Connect
         "user-read-playback-state",
         "user-modify-playback-state",
         "user-read-currently-playing",
         // Playback
         "streaming",
         "app-remote-control",
         // Users
         "user-read-email",
         "user-read-private",
         // Playlists
         "playlist-read-collaborative",
         "playlist-modify-public",
         "playlist-read-private",
         "playlist-modify-private",
         // Library
         "user-library-modify",
         "user-library-read",
         // Listening History
         "user-top-read",
         "user-read-playback-position",
         "user-read-recently-played",
      ].join(" ");

      const authUrl = new URL("https://accounts.spotify.com/authorize");
      const params = {
         response_type: "code",
         client_id: clientId,
         scope,
         code_challenge_method: "S256",
         code_challenge: codeChallenge,
         redirect_uri: redirectUri,
      };
      authUrl.search = new URLSearchParams(params).toString();

      // Redirect or open a browser for the Spotify login
      window.location.href = authUrl.toString();
   };

   return(
      <Button label="Login" onClick={handleLogin}/>
   );
}