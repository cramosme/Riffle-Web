require('dotenv').config();
const express = require('express');  // Web server framework
const axios = require('axios');  // Makes HTTP requests
const cors = require('cors');  // Allows frontend requests

/* Database access */
const { upsertUserProfile } = require('./db/userProfile');
const { upsertTrack } = require('./db/trackInfo');
const { upsertTrackInteractions,updateTrackInteraction, calculateMinutesListened, recalculateCounts } = require('./db/trackInteractions');
const { initializeUserSettings, updateUserSettings } = require('./db/userSettings');
const supabase = require('../lib/supabaseclient');
const { cache, use } = require('react');

const app = express();
app.use(cors());
app.use(express.json());

const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tokenEndpoint = 'https://accounts.spotify.com/api/token';

const activeConnections = new Map(); // Used for progress updates, will get sent to front end

/*---Helper functions---*/

async function getTrackData(trackIds, accessToken) {
   try{

      const batchSize = 50;
      const trackData = {};

      for( var i = 0; i < trackIds.length; i += batchSize ){
         const batch = trackIds.slice(i, i + batchSize);

         const response = await axios.get('https://api.spotify.com/v1/tracks', {
            params: {
               ids: batch.join(',')
            },
            headers: {
               'Authorization': `Bearer ${accessToken}`
            }
         });

         // Store duration for each track
         response["data"]["tracks"].forEach(track => {
            if( track ){
               trackData[track["id"]] = {
                  duration_ms: track["duration_ms"],
                  album_image: track['album'] && track['album']['images'] // checks to make sure album property exists and that the album has an image, if either is false sets album image to null
                     ? track['album']['images'][0]['url']
                     : null
               };
            }
         });

         // Delay to avoid hitting rate limits
         if( i + batchSize < trackIds.length ){
            await new Promise(resolve => setTimeout(resolve, 100));
         }
      }

      return trackData;
   } catch(error){
      console.error("Error fetching track durations:", error.message);
      return {};
   }
}

// Processing function
async function processImportInBackground(userId, files) {

   const connection = activeConnections.get(userId);

   try{

      // Get access token from connection
      const accessToken = connection?.accessToken;

      if( !accessToken ){
         throw new Error("Access token not available");
      }

      // Calculate total entries across all files for progress tracking
      let totalEntries = 0;
      files.forEach(file => {
         totalEntries += file.data.length;
      });

      // Track unique track ids for calculations later
      const uniqueTracks = new Set();
      const uniqueTrackIds = new Set();
      let processedEntries = 0;
      let skippedEntries = 0; // For tracks with no uri (User uploaded tracks)

      // First need to process all entries and collect track ids
      for( const fileData of files ){
         const entries = fileData.data; // Array of spotify history entries

         // Process each entry
         for( const entry of entries ){
            //Skip entries without URI
            if( !entry["spotify_track_uri"] ) {
               skippedEntries++;
               processedEntries++;
               continue;
            }

            // Extract the track id from the URI
            const trackId = entry["spotify_track_uri"].split(':')[2];

            // Collect unique track ids for fetching the total length of song (not included in json provided by spotify)
            uniqueTrackIds.add(trackId);

            uniqueTracks.add({
               userId,
               trackId,
               msPlayed: entry["ms_played"],
               trackName: entry["master_metadata_track_name"],
               artistName: entry["master_metadata_album_artist_name"],
               albumName: entry["master_metadata_album_album_name"]
            });

            processedEntries++;

            // Update progress every 10 entries or if completed
            if( processedEntries % 10 === 0 || processedEntries === totalEntries ){
               sendProgressUpdate(connection, {
                  status: "processing",
                  progress: Math.round((processedEntries/totalEntries) * 30), // 30% for first part
                  processed: processedEntries,
                  total: totalEntries,
                  phase: "collecting"
               });
            }
         }
      }

      // Fetch data from spotify api
      console.log("Fetching track data from spotify...");
      const apiTrackData = await getTrackData(Array.from(uniqueTrackIds), accessToken);

      sendProgressUpdate(connection, {
         status: "processing",
         progress: 50, // 50% after fetching data, these are just numbers based on how much calculation i think is being done, they can be anything
         phase: "fetching_track_data"
      });

      // Used to group interactions by track id
      const trackInteractions = new Map();

      for( const trackInfo of uniqueTracks ){
         if( !trackInteractions.has(trackInfo["trackId"]) ) {
            trackInteractions.set(trackInfo["trackId"], []);
         }
         trackInteractions.get(trackInfo["trackId"]).push(trackInfo);
      }

      // Process all track interactions
      console.log("Processing track interactions...");
      let interactionCount = 0;
      const totalTracks = trackInteractions.size;

      for( const[trackId, interactions] of trackInteractions ){
         const firstInteraction = interactions[0];
         const { duration_ms, album_image } = apiTrackData[trackId] || { duration_ms: 0, album_image: null };

         // Track data for table insert
         const trackData = {
            id: trackId,
            name: firstInteraction["trackName"],
            artists: [{ name: firstInteraction["artistName"] }],
            album: { name: firstInteraction["albumName"], images: album_image ? [{ url:album_image }] : [] }
         };

         const { track, error: trackError } = await upsertTrack(trackData);

         if( trackError ){
            console.error("Error upserting track:", trackError);
            continue;
         }

         // Process each interaction for this track
         for( const interaction of interactions ) {
            const { trackData: interactionData, error: interactionError } = await upsertTrackInteractions(userId, trackId, interaction["ms_played"], duration_ms);

            if( interactionError ){
               console.error("Error upserting track interaction:", interactionError);
            }
         }

         interactionCount++;

         // Update progress
         if( interactionCount % 10 === 0 || interactionCount === totalTracks ){
            sendProgressUpdate(connection, {
               status: "processing",
               progress: 50 + Math.round((interactionCount/totalTracks) * 40), // 50-90%
               phase: "processing_interactions",
               interactionCount,
               totalTracks
            });
         }
      }

      // Calculate minutes listened for all processed tracks
      console.log("Calculating minutes listened for all tracks...");
      let calculatedTracks = 0;
      const totalTrackIds = uniqueTrackIds.size;

      for( const trackId of uniqueTrackIds ){
         try {
            await calculateMinutesListened(userId, trackId);
            calculatedTracks++;

            // Update progress
            if( calculatedTracks % 10 === 0 || calculatedTracks === totalTrackIds ){
               sendProgressUpdate(connection, {
                  status: "processing",
                  progress: 90 + Math.round((calculatedTracks/totalTrackIds) * 10), // Last 10%
                  phase: "calculating",
                  calculatedTracks,
                  totalTracks: totalTrackIds
               });
            }
         } catch (err) {
            console.error(`Error calculating minutes for track ${trackId}:`, err);
            calculatedTracks++;
         }
      }

      // Send final completion update
      sendProgressUpdate(connection, {
         status: "complete",
         progress: 100,
         phase: "done",
         totalProcessed: processedEntries,
         totalSkipped: skippedEntries,
         uniqueTracks: uniqueTrackIds.size
      });

   } catch(error){
      console.error("Error in import process:", error);
      sendProgressUpdate(connection, {
         status: "error",
         error: error.message
      });
   }
}

// Function to send progress updates
function sendProgressUpdate(connection, data){
   if(connection){
      connection.write(`data: ${JSON.stringify(data)}\n\n`);
   }
}

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


/*------Endpoints------*/

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
         headers: { Authorization: `Bearer ${access_token}` }
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

   } catch (err) {
      console.error('Error processing user data:', err.response?.data || err.message);
   }
});

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
      // processUserTracks(userId, token).catch(err => {
      //    console.error("Error processing tracks:", err);
      // })

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

// Used to delete user account
app.delete('/user/:userId', async (req, res) =>{

   const userId = req.params.userId;

   try{
      const { data, error } = await supabase
         .from('User Profile')
         .delete()
         .eq('spotify_id', userId)
   
      if( error ){
         console.error("Error deleting user:", error);
         return res.status(500).json({error: "Failed to delete account"});
      }

      res.json({success: true, message: "Account successfully deleted"});
   } catch(error){
      console.error("Error deleting user account", error);
      res.status(500).json({error: "Failed to delete account"});
   }
});

// Used to update user settings
app.put('/settings/:userId', async (req, res) => {

   const userId = req.params.userId;
   const { skip_threshold, default_time_range, theme, data_display_format } = req.body;

   const udpateFields = {};
   if( skip_threshold !== undefined ) udpateFields.skip_threshold = skip_threshold;
   if( default_time_range !== undefined ) udpateFields.default_time_range = default_time_range;
   if( theme !== undefined ) udpateFields.theme = theme;
   if( data_display_format !== undefined ) udpateFields.data_display_format = data_display_format;

   if( Object.keys(udpateFields).length === 0 ){
      return res.status(400).json({error: "No update fields provided"});
   }

   try{
      const {data, error} = await supabase
         .from('Setings')
         .update(udpateFields)
         .eq('user_id', userId)
         .select(); 

      if( error ){
         console.error("Error updating settings:", error);
         return res.status(500).json({ error: 'Failed to update settings' });
      }

      res.json({
         success: true,
         message: "Settings updated successfully",
         settings: data[0]
      });

   } catch( error ){
      console.error("Error in settings update:", error);
      return res.status(500).json({error: "Failed to update settings"});
   }

});

// Used to fetch user settings to prefill settings page
app.get('/settings/:userId', async (req, res) => {

   const userId = req.params.userId;

   try{
      const { data, error } = await supabase
         .from('Settings')
         .select('*')
         .eq('user_id', userId)
         .single();
      
      if (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
      }
    
      res.json({ 
         success: true,
         settings: data
      });

   } catch( error ){
      console.error('Error in fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
   }

});

// Endpoint for progress updates, uses the connection declared at the top
app.get('/import-progress/:userId', (req, res) => {

   const userId = req.params.userId;

   // Get access token
   const accessToken = req.query.token;

   // Set headers for connection
   res.setHeader('Content-Type', 'text/event-stream');
   res.setHeader('Cache-Control', 'no-cache');
   res.setHeader('Connection', 'keep-alive');

   // Store connection with access token
   res.accessToken = accessToken;
   activeConnections.set(userId, res);

   // Send initial connection message
   res.write('data: {"status": "connected"}\n\n');

   req.on('close', () => {
      activeConnections.delete(userId);
   });

});

// Endpoint for processing and storing imported spotify history
app.post('/import-history/:userId', async (req, res) => {

   const userId = req.params.userId;
   const {files} = req.body;

   if( !files || !Array.isArray(files) || files.length === 0 ){
      return res.status(400).json({error: "No files provided"});
   }

   // Start processing
   res.json({
      message: "Import processing started",
      status: "processing"
   });

   processImportInBackground(userId, files);
});

const PORT = 3000;
app.listen(PORT, () => {
   console.log(`Server running on http://localhost:${PORT}`);
});