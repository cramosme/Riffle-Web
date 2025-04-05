const supabase = require('../../lib/supabaseclient');

// This function is userd to instantiate track interactions for each user
async function upsertTrackInteractions(userId, trackId, spotifyRank){

   const record = {
      user_id: userId,
      track_id: trackId,
      spotify_rank: spotifyRank,
   };

   // inserts into table
   const { data: trackData, error } = await supabase
      .from('Track Interactions')
      .upsert(record, { onConflict: ['user_id, track_id'], returning: 'representation'});

   if( error && error.code != 'PGRST116' ){
      return (error);
   }

   // If data is null or empty, perform fetch the existing record.
   if (!trackData || trackData.length === 0) {
      const { data: fetchedData, error: selectError } = await supabase
      .from('Track Interactions')
      .select('*')
      .match({ user_id: userId, track_id: trackId })
      .single();

      if (selectError) {
      return { error: selectError };
      }

      return { trackData: fetchedData };
   }

   return { trackData: trackData[0] };
}

// Function for updating track interaction (listened or skipped)
async function updateTrackInteraction(userId, trackId, action){

   const now = new Date().toISOString();

   // Fetches the existing record for the user
   const { data: existingRecord, error: fetchError } = await supabase
      .from('Track Interactions')
      .select('*')
      .match({user_id: userId, track_id: trackId})
      .single();

   if( fetchError && fetchError.code !== 'PGRST116' ){
      return { fetchError };
   }


   let updateRecord = {};
   if( action === 'listened' ){
      updateRecord = {
         listen_count: existingRecord['listen_count'] + 1,
         last_listened_at: now
      };
   }
   else if( action === 'skipped' ){
      updateRecord = {
         skip_count: existingRecord['skip_count'] + 1,
         last_skipped_at: now
      };
   }
   else{
      return { error: "Invalid action provided" };
   }

   const { data, error } = await supabase
      .from('Track Interactions')
      .update(updateRecord)
      .match({user_id: userId, track_id: trackId})

   if( error ){
      return { error };
   }

   return { data };

}

// Function to reset previous top tracks
async function resetPreviousTopTracks(userId){

   const { error } = await supabase
      .from('Track Interactions')
      .update({spotify_rank: null}) // sets all spotify track ranks associated with this user to null, doesnt affect other users
      .match({ user_id: userId });

   if( error ){
      return { error }
   }

   return{ success: true };

}

module.exports = { upsertTrackInteractions, updateTrackInteraction, resetPreviousTopTracks };