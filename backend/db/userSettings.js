const supabase = require('../../lib/supabaseclient');

// This function is called if the user doesn't exist or if theyre logging in again
async function initializeUserSettings(userId){

   // Check if settings already exists, dont want to change updated settings with default values
   const { data, error } = await supabase
      .from('Settings')
      .select('*')
      .eq('user_id', userId)
      .single();

   if( error && error.code !== 'PGRST116'){
      return { error };
   }

   if( data ){
      return { settings: data } // settings exist so return them
   }
   else{
      // Inser the user, only have to do id because DB gives default values
      const { data: insertedData, error: insertError } = await supabase
         .from('Settings')
         .insert({'user_id': userId})
         .single();

      if( insertError ){
         return { error: insertError };
      }
      return { settings: insertedData }
   }

}

module.exports = { initializeUserSettings};