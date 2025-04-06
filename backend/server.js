require('dotenv').config();
const express = require('express');  // Web server framework
const axios = require('axios');  // Makes HTTP requests
const cors = require('cors');  // Allows frontend requests

/* Database access */
const { upsertUserProfile } = require('./db/userProfile');
const { upsertTrack } = require('./db/trackInfo');
const { upsertTrackInteractions, resetPreviousTopTracks } = require('./db/trackInteractions');
const { initializeUserSettings, updateUserSettings } = require('./db/userSettings');

const app = express();
app.use(cors());
app.use(express.json());

const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tokenEndpoint = 'https://accounts.spotify.com/api/token';

/* Store token and instantiate all user related data */
app.post('/store-token', async (req, res) => {
   const {access_token, refresh_token, expires_in} = req.body;
   if(!access_token || !refresh_token || !expires_in){
      return res.status(400).json({error: 'Token, refresh token, or expiration time missing'});
   }

   // This allows the client to continue without waiting for data processing
   res.json({
      message: 'Token stored successfully',
      status: 'processing'
   });

   try {
      // Fetch the user's Spotify profile using the access token
      const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
         headers: { Authorization: `Bearer ${accessToken}` }
      });
      const profileData = profileResponse['data'];

      // Use the dedicated user profile function to upsert/fetch the user
      const { user, error: profileError } = await upsertUserProfile(profileData);
      if (profileError) {
         console.error('Error upserting user:', profileError);
         return;
      }

      const { settings, error: settingsError } = await initializeUserSettings(profileData['id'])
      if (settingsError) {
         console.error('Error initializing settings:', settingsError);
         return;
      }

      console.log('User data fetched successfully:', user);
      console.log('Settings', settings);

      // Process tracks in the background
      processUserTracks(user['spotify_id'], accessToken);

   } catch (err) {
      console.error('Error processing user data:', err.response?.data || err.message);
   }
});

// Separate function to process tracks in the background
async function processUserTracks(userId, accessToken) {
   try {
      // Fetch the user's Top 50 tracks using the access token
      const tracksResponse = await axios.get('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50', {
         headers: { Authorization: `Bearer ${accessToken}` }
      });
      const topTracks = tracksResponse['data']['items'];

      // Reset previous track rankings from previous login to get new up-to-date rankings
      const { error: resetError } = await resetPreviousTopTracks(userId);
      if (resetError) {
         console.error('Error resetting track rankings:', resetError);
      }

      // Process tracks in batches instead of all at once, helps manage database load
      const batchSize = 10;
      for (let i = 0; i < topTracks.length; i += batchSize) {
         const batch = topTracks.slice(i, i + batchSize);
         
         await Promise.all(
            batch.map(async (trackData, batchIndex) => {
               const index = i + batchIndex;
               const tracks = await upsertTrack(trackData);
               const interactions = await upsertTrackInteractions(userId, trackData['id'], index + 1);
               return { tracks, interactions };
            })
         );
         
         console.log(`Processed tracks ${i + 1} to ${Math.min(i + batchSize, topTracks.length)}`);
      }
      
      console.log('All tracks processed successfully.');
   } catch (error) {
      console.error('Error processing tracks:', error);
   }
}

app.post('/refresh-token', async(req, res) => {
   
   const refreshToken = req.body.refresh_token;

   if(!refreshToken){
      return res.status(401).json({error: 'No refresh token available'});
   }

   try{
      const response = await axios.post(tokenEndpoint, new URLSearchParams({
         grant_type: 'refresh_token',
         refresh_token: refreshToken,
         client_id: clientId,
         client_secret: clientSecret,
      }));

      const { access_token, expires_in } = response.data;
      const tokenExpiry = Date.now() + (expires_in*1000);

      res.json({
         access_token: access_token,
         expires_in: tokenExpiry,
      });
   }
   catch(error){
      console.error('Error refreshing token:', error.response.data || error.message);
      res.status(500).json({ error: 'Failed to refresh token' });
   }
});

/* Test API Call */
app.get('/me', async (req,res) => {

   const token = req.headers.authorization?.split(' ')[1];

   if(!token){
      return res.status(401).json({error: 'No access token available'});
   }


   try{
      const response = await axios.get('https://api.spotify.com/v1/me', {
         headers: { Authorization: `Bearer ${token}`}
      });
      const userId = response["data"]["id"];

      // Have to call this here since user might not always login, this takes care of users who are still logged in from previous session
      processUserTracks(userId, token).catch(err => {
         console.error("Error processing tracks:", err);
      })

      res.json(response.data);
   }
   catch(error){
      console.error('Error fetching user data:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch user data' });
   }
});

/* GetUsersTopArtists */
app.get('/me/top/artists', async (req,res) => {

   const token = req.headers.authorization?.split(' ')[1];


   if(!token){
      return res.status(401).json({error: 'No access token available'});
   }

   try{
      const response = await axios.get('https://api.spotify.com/v1/me/top/artists?limit=5', {
         headers: { Authorization: `Bearer ${token}`}
      });
      res.json(response.data);
   }
   catch(error){
      console.error('Error fetching user data:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch user data' });
   }
});

/* get top tracks */
app.get('/me/top/tracks', async (req,res) => {

   const token = req.headers.authorization?.split(' ')[1];


   if(!token){
      return res.status(401).json({error: 'No access token available'});
   }

   try{
      const response = await axios.get('https://api.spotify.com/v1/me/top/tracks?limit=5', {
         headers: { Authorization: `Bearer ${token}`}
      });
      res.json(response.data);
   }
   catch(error){
      console.error('Error fetching user data:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch user data' });
   }
});

app.post


const PORT = 3000;
app.listen(PORT, () => {
   console.log(`Server running on http://localhost:${PORT}`);
});