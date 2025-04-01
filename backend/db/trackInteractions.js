const supabase = require('../../lib/supabaseclient');

async function upsertTrackInteractions(userId, trackId, spotifyRank){

   

   const {  } = await supabase
      .from('Track Interactions')

}

module.exports = { upsertTrackInteractions };