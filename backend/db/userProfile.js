const supabase = require("../../lib/supabaseclient");

async function upsertUserProfile(profileData){

   try{
      // First, check if the user already exists
      const { data: existingUser, error: checkError } = await supabase
         .from("User Profile")
         .select("imported_history")
         .eq("spotify_id", profileData["id"])
         .single();
    
      // Determine imported_history value
      let importedHistory = false;
      
      // If user exists and has a history, preserve it
      if (!checkError && existingUser) {
         importedHistory = existingUser["imported_history"];
      }
    
      // Now, only explicitly set imported_history if it's provided in profileData
      const importedHistoryValue = profileData["imported_history"] !== undefined ? profileData["imported_history"] : importedHistory;

      // Construct user record using the Spotify profile data
      const userRecord = {
         spotify_id: profileData["id"],
         display_name: profileData["display_name"],
         profile_image:
         profileData.images && profileData.images.length > 0 // if image exists use image otherwise set it to null
            ? profileData["images"][0]["url"]
            : null,
         imported_history: importedHistoryValue
      };
         
      // Attempts to insert user. If user exists it does nothing
      const { error: insertError } = await supabase
         .from("User Profile")
         .upsert(userRecord, { onConflict: "spotify_id", returning: "representation"}); // Representation returns the full records that were inserted/updated
      
      // If there was an error that wasnt a conflict(already in the table), return the error
      if (insertError) {
         return { error: insertError };
      }
      
      // Fetch the user record from the database.
      const { data: user, error: selectError } = await supabase
      .from("User Profile")
      .select("*")
      .eq("spotify_id", profileData["id"])
      .single();
      
      if (selectError) {
         return { error: selectError };
      }
      
      return { user };
   } catch (error){
      console.error("Error in upsertingUserProfile:", error);
      return { error };
   }
}

module.exports = { upsertUserProfile }; // exports function so we can call it in server