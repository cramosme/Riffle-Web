require('dotenv').config({ path: '../.env' });
const express = require('express');  // Web server framework
const axios = require('axios');  // Makes HTTP requests
const cors = require('cors');  // Allows frontend requests

/* Database access */
const { upsertUserProfile } = require('./db/userProfile');
const { upsertTrack } = require('./db/trackInfo');
const trackInteractions = require('./db/trackInteractions');
const userSettings = require('./db/userSettings');

const app = express();
app.use(cors());
app.use(express.json());

let accessToken = null;
let refreshToken = null;
let tokenExpiry = null;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tokenEndpoint = 'https://accounts.spotify.com/api/token';

/* Store token and upsert user */
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

      // Fetch the user's Spotify profile using the access token
      const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
         headers: { Authorization: `Bearer ${accessToken}` }
      });
      const profileData = profileResponse.data;

      // Use the dedicated user profile function to upsert/fetch the user
      const { user, error: profileError } = await upsertUserProfile(profileData);
      if (profileError) {
         console.error('Error upserting user:', profileError);
         return res.status(500).json({ error: 'Error upserting user' });
      }

      console.log('User data fetched successfully:', user);

      // Return the user's Spotify ID so the frontend knows which user is active
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
      const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
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