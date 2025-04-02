require('dotenv').config({ path: '../.env' });
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

let accessToken = null;
let refreshToken = null;
let tokenExpiry = null;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tokenEndpoint = 'https://accounts.spotify.com/api/token';

/* Store token and instantiate all user related data */
app.post('/store-token', async (req, res) => {
   const {access_token, refresh_token, expires_in} = req.body;
   if(!access_token || !refresh_token || !expires_in){
      return res.status(400).json({error: 'Token, refresh token, or expiration time missing'});
   }

   // Stores tokens in memory
   accessToken = access_token;
   refreshToken = refresh_token;
   tokenExpiry = expires_in;
   console.log('Token stored successfully');

   try{

      /*---------------------------User Stuff Below---------------------------------------*/
      // Fetch the user's Spotify profile using the access token
      const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
         headers: { Authorization: `Bearer ${accessToken}` }
      });
      const profileData = profileResponse['data'];

      // Use the dedicated user profile function to upsert/fetch the user
      const { user, error: profileError } = await upsertUserProfile(profileData);
      if (profileError) {
         console.error('Error upserting user:', profileError);
         return res.status(500).json({ error: 'Error upserting user' });
      }

      const { settings, error: settingsError } = await initializeUserSettings(profileData['id'])
      if( settingsError ){
         console.error('Error initializing settings:', settingsError);
         return res.status(500).json({ error: 'Error initializing settings' })
      }

      console.log('User data fetched successfully:', user);
      console.log('Settings', settings);

      /*---------------------------Track Stuff Below---------------------------------------*/
      // Fetch the user's Top 50 tracks using the access token
      const tracksResponse = await axios.get('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50', {
         headers: { Authorization: `Bearer ${accessToken}` }
      });
      const topTracks = tracksResponse['data']['items'];

      // First reset previous track rankings from previous login to get new up-to-date rankings
      const { error: resetError } = await resetPreviousTopTracks(user['spotify_id']);
      if( resetError ){
         console.error('Error resetting track rankings:', resetError);
      }

      // This will work better than for loop bc it will combine all returns into one object, instead of just returning the last item inserted
      const result = await Promise.all(
         topTracks.map(async (trackData, index) => {
            const tracks = await upsertTrack(trackData);
            const interactions = await upsertTrackInteractions(user['spotify_id'], trackData['id'], index + 1);
            return { tracks, interactions };
         })
      );

      const trackResults = result.map(result => result.tracks);
      const interResults = result.map(result => result.interactions);
      console.log('Track Results:', trackResults);
      console.log('Interaction Results:', interResults);

      // Return the user's Spotify ID so the frontend knows which user is active. Public info so safe to send to the front end.
      res.json({
         message: 'Token stored and user data fetched successfully',
         user_id: user['spotify_id'],
         user: user,
       });

   } catch( err ){
      console.error('Error fetching user profile:', err.response?.data || err.message);
      res.status(500).json({ error: 'Failed to fetch user profile' });
   }
});

app.post('/refresh-token', async(req, res) => {
   
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

      accessToken = access_token;
      tokenExpiry = Date.now() + (expires_in*1000);

      res.json({
         access_token: accessToken,
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
   if(!accessToken){
      return res.status(401).json({error: 'No access token available'});
   }

   try{
      const response = await axios.get('https://api.spotify.com/v1/me', {
         headers: { Authorization: `Bearer ${accessToken}`}
      });
      res.json(response.data);
   }
   catch(error){
      console.error('Error fetching user data:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch user data' });
   }
});

/* GetUsersTopArtists */
app.get('/me/top/artists', async (req,res) => {
   if(!accessToken){
      return res.status(401).json({error: 'No access token available'});
   }

   try{
      const response = await axios.get('https://api.spotify.com/v1/me/top/artists?limit=5', {
         headers: { Authorization: `Bearer ${accessToken}`}
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
   if(!accessToken){
      return res.status(401).json({error: 'No access token available'});
   }

   try{
      const response = await axios.get('https://api.spotify.com/v1/me/top/tracks?limit=5', {
         headers: { Authorization: `Bearer ${accessToken}`}
      });
      res.json(response.data);
   }
   catch(error){
      console.error('Error fetching user data:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch user data' });
   }
});

const PORT = 3000;
app.listen(PORT, () => {
   console.log(`Server running on http://localhost:${PORT}`);
});