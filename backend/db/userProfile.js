const supabase = require("../../lib/supabaseclient");

async function upsertUserProfile(profileData){

   // Construct user record using the Spotify profile data
   const userRecord = {
      spotify_id: profileData["id"],
      display_name: profileData["display_name"],
      profile_image:
         profileData.images && profileData.images.length > 0 // if image exists use image otherwise set it to null
            ? profileData["images"][0]["url"]
            : null,
      imported_history: profileData["imported_history"] ? profileData["imported_history"] : false
   };

   // Attempts to insert user. If user exists it does nothing
   const { error: insertError } = await supabase
      .from("User Profile")
      .upsert(userRecord, { onConflict: "spotify_id", returning: "representation"}); // Representation returns the full records that were inserted/updated

   // If there was an error that wasnt a conflict(already in the table), return the error
   if (insertError && insertError.code !== "PGRST116") {
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
}

module.exports = { upsertUserProfile }; // exports function so we can call it in server