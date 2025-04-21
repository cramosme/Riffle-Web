const supabase = require('../../lib/supabaseclient');

// This function is used to instantiate track interactions for each user, is called as we read through the json passed in import page
async function upsertTrackInteractions(userId, trackId, playDuration, trackDuration){

   // First need to see if the record already exists. If it does we can just append the playDuration to the plays array
   const { data: existingRecord, error: fetchError } = await supabase
      .from('Track Interactions')
      .select('*')
      .match({user_id: userId, track_id: trackId})
      .single();

   // If there's an error and its not a "not found" error
   if( fetchError && fetchError.code !== 'PGRST116' ){
      return { error: fetchError };
   }

   // If the record exists, append the new play duration
   if( existingRecord ){
      const existingPlayData = existingRecord["play_data"];
      
      // Ensure we're pushing a number, not null or undefined
      if (playDuration || playDuration === 0) {
         existingPlayData["plays"].push(playDuration);
      }

      const updateRecord = {
         play_data: existingPlayData,
      };

      const { data, error } = await supabase
         .from('Track Interactions')
         .update(updateRecord)
         .match({user_id: userId, track_id: trackId});

      if( error ){
         return { error };
      }

      return { trackData: data };
   }
   
   /*---If record doesnt exist, create a new one---*/

   const playData = {
      plays: playDuration || playDuration === 0 ? [playDuration] : [],
   };

   // Only need to set columns we dont want to have a default value
   const record = {
      user_id: userId,
      track_id: trackId,
      track_duration: trackDuration,
      play_data: playData
   };

   // inserts into table
   const { data: trackData, error: insertError } = await supabase
      .from('Track Interactions')
      .insert(record)
      .select()
      .single();

   if( insertError ){
      return { error: insertError };
   }

   return { trackData: trackData };
}

// Function for updating track interaction (listened or skipped), based on web playback
async function updateTrackInteraction(userId, trackId, playDuration, skipThreshold, trackDuration){

   const lengthListened = (playDuration/trackDuration) * 100; // Calculates the total length of the song listened

   // Determine if interaction is a skip or listen
   const action = lengthListened <= skipThreshold ? 'skipped' : 'listened';

   const minutesListened = playDuration / (1000*60); // Convert to minutes so we can add it to the database field

   const { data: existingRecord, error: fetchError } = await supabase
      .from('Track Interactions')
      .select('*')
      .match({user_id: userId, track_id: trackId})
      .single();
   
   // If there was an error and its not because the record doesnt exist
   if( fetchError && fetchError.code !== 'PGRST116' ){
      return { error: fetchError };
   }

   // If the record doesnt exist, create one
   if( fetchError && fetchError.code === 'PGRST116' ){
      const { trackData, error } = await upsertTrackInteractions(userId, trackId, playDuration, trackDuration);
      if( error ){
         return { error };
      }

      // Update now that record exists
      return updateTrackInteraction(userId, trackId, playDuration, skipThreshold, trackDuration);
   }

   // Record does exist, so update it
   let playData = existingRecord["play_data"];

   playData["plays"].push(playDuration);

   let updateRecord = {
      play_data: playData,
      minutes_listened: (existingRecord["minutes_listened"] + minutesListened)
   };

   if( action === 'listened' ){
      updateRecord["listen_count"] = (existingRecord["listen_count"] + 1);
   }
   else{
      updateRecord["skip_count"] = (existingRecord["skip_count"] + 1);
   }

   const { data, error } = await supabase
      .from('Track Interactions')
      .update(updateRecord)
      .match({user_id: userId, track_id: trackId});

   if( error ){
      return { error };
   }

   return { data };
}

// This function only gets called when doing the import processing. 
async function calculateMinutesListened(userId, trackId){

   // Fetch the record
   const { data, error } = await supabase
      .from('Track Interactions')
      .select('*')
      .match({user_id: userId, track_id: trackId})
      .single();

   if( error ){
      return { error };
   }

   const playData = data["play_data"]["plays"];

   // Traverse jsonb adding up all of the ms
   let msListened = 0;

   for( var i = 0; i < playData.length; i++ ){
      msListened += playData[i];
   }

   // Convert ms to minutes
   const minutesListened = msListened / (1000*60);

   // Update minutes Listened
   const { data: minuteData, error: updateError } = await supabase
      .from('Track Interactions')
      .update({minutes_listened: minutesListened})
      .match({user_id: userId, track_id: trackId});

   if( updateError ){
      return { error: updateError };
   }

   return { data: minuteData };
}

// This function is used to recalculate skip and listen counts if the user changes their skip threshold
// Only need to pass userId because we want it to affect all of their tracks, not just one
async function recalculateCounts(userId, newThreshold) {

   const { data: interactions, error } = await supabase
      .from('Track Interactions')
      .select('*')
      .eq('user_id', userId);

   if( error ){
      return { error };
   }

   if( !interactions || interactions.length === 0 ) {
      return { success: true, message: "No interactions found", count: 0};
   }

   // Used to see how many tracks were updated
   let updatedCount = 0;

   for( const interaction of interactions ){

      // If there is no play data for the song then skip it
      if( !interaction["play_data"] || !Array.isArray(interaction["play_data"]["plays"]) ){
         continue;
      }

      let listenCount = 0;
      let skipCount = 0;

      // Get track duration
      const trackDuration = interaction["track_duration"];

      for( var i = 0; i < interaction["play_data"]["plays"].length; i++ ){
         let duration = interaction["play_data"]["plays"][i];
         let percentageListened = (duration/trackDuration) * 100;

         if( percentageListened < newThreshold ){
            skipCount++;
         }
         else{
            listenCount++;
         }
      }

      // If for some reason they are the same, skip it
      if( listenCount === interaction["listen_count"] && skipCount === interaction["skip_count"]) {
         continue;
      }

      // Update the song
      const { error: updateError } = await supabase
         .from('Track Interactions')
         .update({listen_count: listenCount, skip_count: skipCount})
         .match({id: interaction["id"]}) // id of the user+track id, so id of the record

      if( updateError ){
         console.error(`Error updating interaction ${interaction["id"]}:`, updateError);
      }
      else{
         updatedCount++;
      }
   }

   return{
      success: true,
      message: `Updated ${updatedCount} of ${interactions.length} interactions`,
      updatedCount
   };
}

module.exports = { upsertTrackInteractions, updateTrackInteraction, calculateMinutesListened, recalculateCounts };