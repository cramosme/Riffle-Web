import React, { useState, useEffect } from 'react';
import styles from './webPlayback.module.css';

const track = {
    name: "",
    album: {
        images: [
            { url: "" }
        ]
    },
    artists: [
        { name: "" }
    ]
}

function WebPlayback(props) {
   const [is_paused, setPaused] = useState(false);
   const [is_active, setActive] = useState(false);
   const [player, setPlayer] = useState(undefined);
   const [current_track, setTrack] = useState(track);
   const [deviceId, setDeviceId] = useState("");
   const [isReady, setIsReady] = useState(false);

   const [wasTransferred, setWasTransferred] = useState(false); // Used to fix issue of web playback disappearing when navigating away from stats page

   useEffect(() => {

      if (!props.token) {
         console.error("No token provided to WebPlayback component");
         return;
      }

      const storedPlaybackStatus = localStorage.getItem("playback_status");
      const storedDeviceId = localStorage.getItem("device_id");

      if( storedPlaybackStatus === "active" ){
         setWasTransferred(true);
         if( storedDeviceId ){
            setDeviceId(storedDeviceId);
         }
      }

      // Check if the script is already loaded
      if (!document.getElementById('spotify-player')) {
         const script = document.createElement("script");
         script.id = 'spotify-player';
         script.src = "https://sdk.scdn.co/spotify-player.js";
         script.async = true;

         document.body.appendChild(script);
      }

      window.onSpotifyWebPlaybackSDKReady = () => {
         console.log("Spotify Web Playback SDK Ready");
         
         const player = new window.Spotify.Player({
               name: 'Riffle Web Player',
               getOAuthToken: cb => { cb(props.token); },
               volume: 0.25
         });

         setPlayer(player);

         player.addListener('ready', ({ device_id }) => {
               console.log('Ready with Device ID', device_id);
               setDeviceId(device_id);
               setIsReady(true);
               localStorage.setItem("device_id", device_id);

               if( wasTransferred ){
                  checkCurrentPlayback(device_id);
               }
         });

         player.addListener('not_ready', ({ device_id }) => {
               console.log('Device ID has gone offline', device_id);
               setIsReady(false);
         });

         player.addListener('player_state_changed', (state => {
               if (!state) {
                  return;
               }

               setTrack(state.track_window.current_track);
               setPaused(state.paused);

               player.getCurrentState().then(state => { 
                  if (!state){
                     setActive(false);
                  }
                  else{
                     setActive(true);
                     localStorage.setItem("playback_status", "active");
                  }
               }).catch(error => {
                  console.error("Error getting current state:", error);
               });
         }));

         // Connect player
         player.connect().then(success => {
               if (success) {
                  console.log("Player connected successfully!");
               } else {
                  console.log("Failed to connect player");
               }
         }).catch(err => {
               console.error("Error connecting player:", err);
         });
      };

      // Cleanup function
      return () => {
         if (player) {
               // player.disconnect();
               player.removeListener("ready");
               player.removeListener("not_ready");
               player.removeListener("player_state_changed");
         }
      };
   }, [props.token, wasTransferred]);

   const checkCurrentPlayback = async (device_id) => {
      try{
         const response = await fetch("https://api.spotify.com/v1/me/player", {
            method: "GET",
            headers: {
               "Authorization": `Bearer ${props.token}`
            }
         });

         if( response.ok && response.status !== 204 ){ // 204 means no content( no playback instance )
            const data = await response.json();

            if( data?.device?.id === device_id) {
               setActive(true);
               if( player ){
                  player.getCurrentState().then(state => {
                     if( state ) {
                        setTrack(state.track_window.current_track);
                        setPaused(state.paused);
                     }
                  });
               }
            }
         }
      } catch( error ){
         console.error("Error checking playback:", error);
      }
   };

   // Function to transfer playback with volume matching
   const transferPlayback = async () => {
      if (!deviceId) {
         console.log("No device ID available yet");
         return;
      }
      
      if (!isReady) {
         console.log("Player is not ready yet");
         return;
      }
      
      try {
         // First, get current volume from any active session
         let spotifyVolume = 0.25; // Default fallback
         
         try {
               const volumeResponse = await fetch("https://api.spotify.com/v1/me/player", {
                  method: "GET",
                  headers: {
                     "Authorization": `Bearer ${props.token}`
                  }
               });
               
               if (volumeResponse.ok && volumeResponse.status !== 204) {
                  const data = await volumeResponse.json();
                  console.log("Playback data before transfer:", data);
                  
                  if (data && data.device && typeof data.device.volume_percent === "number") {
                     spotifyVolume = (data.device.volume_percent / 100) * 0.8; // 80% adjustment
                     console.log(`Found volume from active device: ${spotifyVolume}`);
                  }
               } else {
                  console.log("No active playback found or status:", volumeResponse.status);
               }
         } catch (volumeError) {
               console.log("Could not get volume, using default:", volumeError);
         }
         
         // Then transfer playback
         console.log("Transferring playback to device:", deviceId);
         const response = await fetch("https://api.spotify.com/v1/me/player", {
               method: "PUT",
               headers: {
                  "Authorization": `Bearer ${props.token}`,
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  device_ids: [deviceId],
                  play: true,
               }),
         });
         
         if (!response.ok) {
               console.error("Error transferring playback. Status:", response.status);
         } else {
               console.log("Playback transferred successfully!");
               localStorage.setItem("playback_status", "active");
               setWasTransferred(true);
               
               // Set volume after successful transfer
               if (player) {
                  // Add a small delay to ensure playback is transferred
                  setTimeout(() => {
                     console.log(`Setting volume to: ${spotifyVolume}`);
                     player.setVolume(spotifyVolume).then(() => {
                           console.log("Volume set successfully");
                     }).catch(err => {
                           console.error("Error setting volume:", err);
                     });
                  }, 1000);
               }
         }
      } catch (error) {
         console.error("Error transferring playback:", error);
      }
   };

   // Safe handlers for player controls
   const handlePreviousTrack = () => {
      if (player && isReady) {
         player.previousTrack().catch(err => {
               console.error("Error skipping to previous track:", err);
         });
      }
   };

   const handleTogglePlay = () => {
      if (player && isReady) {
         player.togglePlay().catch(err => {
               console.error("Error toggling play state:", err);
         });
      }
   };

   const handleNextTrack = () => {
      if (player && isReady) {
         player.nextTrack().catch(err => {
               console.error("Error skipping to next track:", err);
         });
      }
   };

   // Show loading state when not ready
   if (!isReady || !player) {
      return;
   }

   // Not active state
   if (!is_active) {
      return (
         <div className={styles.buttonContainer} onClick={transferPlayback}>
            Play Music on Web
         </div>
      );
   }

   // Active player state with improved structure
   return (
      <div className={styles.mainWrapper}>
         <div className={styles.coverContainer}>
               <div className={styles.trackInfo}>
                  <div className={styles.albumColumn}>
                     <img 
                           src={current_track.album.images[0].url} 
                           className={styles.nowPlayingCover} 
                           alt={`Album cover for ${current_track.name}`} 
                     />
                  </div>
                  <div className={styles.nowPlayingSide}>
                     <div className={styles.nowPlayingArtist}>
                           {current_track.artists.map((artist, index) => (
                              <span key={index}>
                                 {index > 0 ? ", " : ""}
                                 {artist.name}
                              </span>
                           ))}
                     </div>
                     <div className={styles.nowPlayingName}>{current_track.name}</div>
                  </div>
               </div>

               <div className={styles.container}>
                  <button 
                     className={styles.btnSpotify}
                     onClick={handlePreviousTrack}
                     aria-label="Previous track"
                  >
                     &lt;&lt;
                  </button>

                  <button 
                     className={styles.btnSpotify}
                     onClick={handleTogglePlay}
                     aria-label={is_paused ? "Play" : "Pause"}
                  >
                     {is_paused ? "PLAY" : "PAUSE"}
                  </button>

                  <button 
                     className={styles.btnSpotify} 
                     onClick={handleNextTrack}
                     aria-label="Next track"
                  >
                     &gt;&gt;
                  </button>
               </div>
         </div>
      </div>   
   );
}

export default WebPlayback;