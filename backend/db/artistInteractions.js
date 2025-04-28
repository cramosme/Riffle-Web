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

module.exports = { upsertArtistInteraction };