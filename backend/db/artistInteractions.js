const supabase = require('../../lib/supabaseclient');


async function upsertArtistInteraction({ userId, artistName, listenCount = 0, skipCount = 0, minutesListened = 0}) {
   try {
      // Check if record exists
      const { data: existingRecord, error: fetchError } = await supabase
         .from('Artist Interactions')
         .select('*')
         .match({ user_id: userId, artist_name: artistName })
         .single();

      // If there's an error and it's not a "not found" error
      if (fetchError && fetchError.code !== 'PGRST116') {
         return { error: fetchError };
      }

      // If the record exists, update it
      if (existingRecord) {
         const updateRecord = {
            listen_count: existingRecord["listen_count"] + listenCount,
            skip_count: existingRecord["skip_count"] + skipCount,
            minutes_listened: existingRecord["minutes_listened"] + minutesListened
         };

         const { data, error } = await supabase
            .from('Artist Interactions')
            .update(updateRecord)
            .match({ user_id: userId, artist_name: artistName });

         if (error) {
            return { error };
         }

         return { data };
      }

      // If record doesn't exist, create a new one
      const newRecord = {
         user_id: userId,
         artist_name: artistName,
         listen_count: listenCount,
         skip_count: skipCount,
         minutes_listened: minutesListened
      };

      const { data, error } = await supabase
         .from('Artist Interactions')
         .insert(newRecord)
         .select();

      if (error) {
         return { error };
      }

      return { data };
   } catch (error) {
      console.error('Error in upsertArtistInteraction:', error);
      return { error };
   }
}

// Helper function to update artist interactions when a track is played/skipped through web playback
async function updateArtistInteraction(userId, artistName, listenCount, skipCount, minutesListened){
   try {
      // Check if artist record exists
      const { data: existingArtist, error: fetchError } = await supabase
         .from('Artist Interactions')
         .select('*')
         .match({
            user_id: userId, 
            artist_name: artistName
         })
         .single();

      // If there's an error and it's not "not found"
      if (fetchError && fetchError.code !== 'PGRST116') {
         console.error('Error fetching artist interaction:', fetchError);
         return { error: fetchError };
      }

      if (existingArtist) {
         // Update existing artist record
         const { data, error } = await supabase
            .from('Artist Interactions')
            .update({
               listen_count: existingArtist["listen_count"] + listenCount,
               skip_count: existingArtist["skip_count"] + skipCount,
               minutes_listened: existingArtist["minutes_listened"] + minutesListened
            })
            .match({
               user_id: userId, 
               artist_name: artistName
            });

         if (error) {
            console.error('Error updating artist interaction:', error);
            return { error };
         }
         return { data };
      } else {
         // Create new artist record
         const { data, error } = await supabase
            .from('Artist Interactions')
            .insert({
               user_id: userId,
               artist_name: artistName,
               listen_count: listenCount,
               skip_count: skipCount,
               minutes_listened: minutesListened
            })
            .select();

         if (error) {
            console.error('Error creating artist interaction:', error);
            return { error };
         }
         return { data };
      }
   } catch (error) {
      console.error('Error in updateArtistInteraction:', error);
      return { error };
   }
}

// This function is for during import after we calculate stats for users or when user changes their skip threshold
async function sumArtistStats(userId, artistName){
   try {
      // Get all tracks for this artist
      const { data: tracks, error: tracksError } = await supabase
         .from('Track Interactions')
         .select('listen_count, skip_count, minutes_listened')
         .match({
            user_id: userId,
            artist_name: artistName
         });

      if (tracksError) {
         console.error('Error fetching tracks for artist sumation:', tracksError);
         return { error: tracksError };
      }

      // Calculate totals
      let totalListens = 0;
      let totalSkips = 0;
      let totalMinutes = 0;

      tracks.forEach(track => {
         totalListens += track.listen_count || 0;
         totalSkips += track.skip_count || 0;
         totalMinutes += track.minutes_listened || 0;
      });

      // Update or create artist record
      const { data: existingArtist, error: fetchError } = await supabase
         .from('Artist Interactions')
         .select('*')
         .match({
            user_id: userId,
            artist_name: artistName
         })
         .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
         console.error('Error checking for existing artist record:', fetchError);
         return { error: fetchError };
      }

      if (existingArtist) {
         // Update existing record
         const { data, error } = await supabase
            .from('Artist Interactions')
            .update({
               listen_count: totalListens,
               skip_count: totalSkips,
               minutes_listened: totalMinutes
            })
            .match({
               user_id: userId,
               artist_name: artistName
            });

         if (error) {
            console.error('Error updating artist stats:', error);
            return { error };
         }
         return { data };
      } else {
         // Create new record
         const { data, error } = await supabase
            .from('Artist Interactions')
            .insert({
               user_id: userId,
               artist_name: artistName,
               listen_count: totalListens,
               skip_count: totalSkips,
               minutes_listened: totalMinutes
            })
            .select();

         if (error) {
            console.error('Error creating artist stats:', error);
            return { error };
         }
         return { data };
      }
   } catch (error) {
      console.error('Error in sumArtistStats:', error);
      return { error };
   }
}

module.exports = { upsertArtistInteraction, updateArtistInteraction, sumArtistStats };