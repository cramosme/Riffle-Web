"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Create the context
const SpotifyContext = createContext(null);

// Default track structure
const defaultTrack = {
   name: "",
   album: {
      images: [{ url: "" }]
   },
   artists: [{ name: "" }]
};

// Provider component
export function SpotifyProvider({ children }) {
   // Player state
   const [player, setPlayer] = useState(null);
   const [isReady, setIsReady] = useState(false);
   const [isActive, setIsActive] = useState(false);
   const [isPaused, setIsPaused] = useState(false);
   const [deviceId, setDeviceId] = useState('');
   const [currentTrack, setCurrentTrack] = useState(defaultTrack);
   const [error, setError] = useState(null);
   
   // Refs to track state
   const scriptInjected = useRef(false);
   const reconnectAttempted = useRef(false);
   const lastTrackId = useRef(null);
   const lastPosition = useRef(0);
   const trackDuration = useRef(0);
   
   // Get token from localStorage
   const getToken = () => {
      if (typeof window !== 'undefined') {
         return localStorage.getItem('access_token');
      }
      return null;
   };
   
   // Initialize SDK and player on mount
   useEffect(() => {
      const token = getToken();
      if (!token) return;
      
      // Load Spotify SDK script if not already loaded
      if (!window.Spotify && !scriptInjected.current) {
         scriptInjected.current = true;
         const script = document.createElement('script');
         script.id = 'spotify-player';
         script.src = 'https://sdk.scdn.co/spotify-player.js';
         script.async = true;
         document.body.appendChild(script);
      }
      
      // When SDK is ready, initialize player
      window.onSpotifyWebPlaybackSDKReady = () => {
         console.log('Spotify Web Playback SDK Ready');
         initializePlayer(token);
      };
      
      // If SDK is already loaded, initialize immediately
      if (window.Spotify && !player) {
         initializePlayer(token);
      }
   }, []);
   
   // Initialize the player with the token
   const initializePlayer = (token) => {
      if (!token) return;
      
      const spotifyPlayer = new window.Spotify.Player({
         name: 'Riffle Web Player',
         getOAuthToken: cb => { cb(token); },
         volume: 0.25
      });
      
      // Setup player event listeners
      
      // Device ready
      spotifyPlayer.addListener('ready', ({ device_id }) => {
         console.log('Spotify player ready with device ID:', device_id);
         setDeviceId(device_id);
         setIsReady(true);
         localStorage.setItem('riffle_device_id', device_id);
         
         // Check if this device was previously active
         // Helps reconnect to an existing session when navigating back to a page
         const playbackStatus = localStorage.getItem('riffle_playback_status');
         if (playbackStatus === 'active' && !reconnectAttempted.current) {
            reconnectAttempted.current = true;
            setTimeout(() => checkCurrentPlayback(device_id, token), 1000);
         }
      });
      
      // Device offline
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
         console.log('Device has gone offline:', device_id);
         setIsReady(false);
      });
      
      // Player state changed (track changes, pauses, etc.)
      spotifyPlayer.addListener('player_state_changed', state => {
         if (!state) return;
         
         // Get current state details
         const trackId = state.track_window.current_track.id;
         const position = state.position;
         const duration = state.duration;
         const isPaused = state.paused;

         // Track changed
         if( lastTrackId.current && lastTrackId.current !== trackId ){
            const playDuration = lastPosition.current;
            recordTrackInteraction(lastTrackId.current, playDuration, trackDuration.current);
            console.log(`Track changed. Recorded ${playDuration}ms played for previous track.`);
         }
         
         // Set state with current track info
         setCurrentTrack(state.track_window.current_track);
         setIsPaused(state.paused);
         trackDuration.current = duration;

         // Update tracking refs
         lastTrackId.current = trackId;
         lastPosition.current = position;
         
         spotifyPlayer.getCurrentState().then(state => {
            if (!state) {
               setIsActive(false);
            } else {
               setIsActive(true);
               localStorage.setItem('riffle_playback_status', 'active');
            }
         });
      });
      
      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
         console.error('Spotify player initialization error:', message);
         setError(`Initialization error: ${message}`);
      });
      
      // Auth error (expired token, etc.)
      spotifyPlayer.addListener('authentication_error', ({ message }) => {
         console.error('Spotify player authentication error:', message);
         setError(`Authentication error: ${message}`);
         localStorage.removeItem('riffle_playback_status');
      });
      
      // Account errors (premium required, etc.)
      spotifyPlayer.addListener('account_error', ({ message }) => {
         console.error('Spotify player account error:', message);
         setError(`Account error: ${message}`);
      });
      
      // Playback errors (rate limiting, etc.)
      spotifyPlayer.addListener('playback_error', ({ message }) => {
         console.error('Spotify playback error:', message);
         // Don't set user-facing error for playback issues
      });
      
      // Connect to Spotify
      spotifyPlayer.connect()
         .then(success => {
            if (success) {
               console.log('Spotify player connected successfully');
               setPlayer(spotifyPlayer);
            } else {
               console.error('Failed to connect Spotify player');
               setError('Failed to connect to Spotify');
            }
         })
         .catch(err => {
            console.error('Error connecting Spotify player:', err);
            setError(`Error connecting to Spotify: ${err.message}`);
         });
   };
   
   // Record track interaction with the backend
   const recordTrackInteraction = async (trackId, playDuration, trackDuration) => {
      if( !trackId || !trackDuration ){
         console.log('Missing required data for recording track interaction');
         return; 
      }
      try {
         const userId = localStorage.getItem('user_id');
         const token = getToken();
         
         if (!userId || !token) {
            console.error('User ID or token missing');
            return;
         }
         
         console.log(`Recording interaction for track ${trackId}: ${playDuration}ms played out of ${trackDuration}ms`);

         const response = await fetch(`http://localhost:3000/track-interaction/${userId}/${trackId}`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
               playDuration,
               trackDuration
            })
         });
         
         if (!response.ok) {
            throw new Error('Failed to record track interaction');
         }
         
         const data = await response.json();
         console.log('Track interaction recorded:', data);
      } catch (error) {
         console.error('Error recording track interaction:', error);
      }
   };
   
   // Check current playback status, important when navigating back to stats page
   const checkCurrentPlayback = async (device_id, token) => {
      if (!token || !device_id) return;
      
      try {
         const response = await fetch("https://api.spotify.com/v1/me/player", {
            method: "GET",
            headers: {
               "Authorization": `Bearer ${token}`
            }
         });

         if (response.status === 204) {
            console.log("No active playback found");
            localStorage.removeItem("riffle_playback_status");
            setIsActive(false);
            return;
         }

         if (response.ok) {
            const data = await response.json();
            console.log("Current playback data:", data);

            // If our device is active or playback exists, update state
            if (data?.device?.id === device_id) {
               console.log("This device is currently active");
               setIsActive(true);
               
               // If there's an active track, set it
               if (data?.item) {
                  setCurrentTrack(data.item);
                  setIsPaused(!data.is_playing);
                  
                  // Set current track info for tracking
                  lastTrackId.current = data.item.id;
                  lastPosition.current = data.progress_ms || 0;
                  trackDuration.current = data.item.duration_ms || 0;
               }
            }
         }
      } catch (error) {
         console.error("Error checking playback:", error);
      }
   };
   
   // Transfer playback to this device
   const transferPlayback = async () => {
      const token = getToken();
      if (!token || !deviceId || !isReady || !player) {
         console.error("Cannot transfer playback: missing required data");
         return;
      }
      
      try {
         // Check for any current playback
         let spotifyVolume = 0.25;
         let shouldPlay = true;
         
         try {
            const volumeResponse = await fetch("https://api.spotify.com/v1/me/player", {
               method: "GET",
               headers: {
                  "Authorization": `Bearer ${token}`
               }
            });
            
            if (volumeResponse.ok && volumeResponse.status !== 204) {
               const data = await volumeResponse.json();
               console.log("Playback data before transfer:", data);
               
               if (data?.device?.volume_percent) {
                  spotifyVolume = (data.device.volume_percent / 100) * 0.8;
               }
               
               shouldPlay = data?.is_playing ?? true;
            }
         } catch (error) {
            console.log("Error checking current playback:", error);
         }
         
         // Transfer playback
         console.log("Transferring playback to device:", deviceId);
         const transferResponse = await fetch("https://api.spotify.com/v1/me/player", {
            method: "PUT",
            headers: {
               "Authorization": `Bearer ${token}`,
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               device_ids: [deviceId],
               play: shouldPlay,
            }),
         });
         
         if (!transferResponse.ok) {
            console.error("Transfer error:", transferResponse.status);
            
            // Special case for status 404
            if (transferResponse.status === 404) {
               // Try to start playback with user's recent tracks
               const startPlaybackResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                  method: "PUT",
                  headers: {
                     "Authorization": `Bearer ${token}`,
                     "Content-Type": "application/json",
                  }
               });
               
               if (!startPlaybackResponse.ok) {
                  throw new Error(`Failed to start playback: ${startPlaybackResponse.status}`);
               }
            } else {
               throw new Error(`Transfer failed: ${transferResponse.status}`);
            }
         }
         
         console.log("Playback transferred successfully!");
         localStorage.setItem("riffle_playback_status", "active");
         
         // Set volume after transfer
         if (player) {
            setTimeout(() => {
               console.log(`Setting volume to: ${spotifyVolume}`);
               player.setVolume(spotifyVolume).catch(err => {
                  console.error("Error setting volume:", err);
               });
            }, 1000);
         }
         
         // Force UI update after successful transfer
         setTimeout(() => {
            if (player) {
               player.getCurrentState().then(state => {
                  if (state) {
                     setIsActive(true);
                     setCurrentTrack(state.track_window.current_track);
                     setIsPaused(state.paused);
                     
                     // Initialize tracking for this track
                     lastTrackId.current = state.track_window.current_track.id;
                     lastPosition.current = state.position;
                     trackDuration.current = state.duration;
                  }
               });
            }
         }, 1500);
         
      } catch (error) {
         console.error("Error transferring playback:", error);
         setError(`Error: ${error.message}`);
      }
   };
   
   // Clean up event handling for track interactions when component unmounts
   useEffect(() => {
      return () => {
         // If we have a current track playing, record the interaction
         if (lastTrackId.current && lastPosition.current && trackDuration.current) {
            recordTrackInteraction(lastTrackId.current, playDuration, trackDuration.current);
            console.log(`Component unmounting. Recorded final play duration for current track.`);
         }
      };
   }, []);

   // Get current state including position
   const getCurrentState = async () => {
      if( player ){
         const state = await player.getCurrentState();
         if( state ){
            // Update position
            lastPosition.current = state.position;
            return state;
         }
      }
      return null;
   }

   // Set up polling to update position periodically
   useEffect(() => {
      const pollInterval = setInterval(async () => {
         if (isActive && !isPaused) {
            const state = await getCurrentState();
            if (state) {
               // This updates lastPosition.current inside getCurrentState
               console.log(`Current position: ${lastPosition.current}ms`);
            }
         }
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(pollInterval);
   }, [isActive, isPaused]);

   // Player control functions
   const handlePreviousTrack = () => {
      if (player && isReady) {
         // Record current track interaction before skipping
         if (lastTrackId.current && lastPosition.current && trackDuration.current) {
            recordTrackInteraction(lastTrackId.current, lastPosition.current, trackDuration.current);
            console.log(`Previous button clicked. Recorded ${lastPosition.current}ms for current track.`);
            
            // Reset position since we're changing tracks
            lastPosition.current = 0;
         }
         
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
         // Record current track interaction before skipping
         if (lastTrackId.current && lastPosition.current && trackDuration.current) {
            recordTrackInteraction(lastTrackId.current, lastPosition.current, trackDuration.current);
            console.log(`Next button clicked. Recorded ${lastPosition.current}ms for current track.`);
            
            // Reset position since we're changing tracks
            lastPosition.current = 0;
         }
         
         player.nextTrack().catch(err => {
            console.error("Error skipping to next track:", err);
         });
      }
   };
   
   // Values shared through context, everything that uses the useSpotify() hook will have access to these
   const contextValue = {
      // Player state
      isReady,
      isActive,
      isPaused,
      currentTrack,
      deviceId,
      error,
      
      // Player controls
      transferPlayback,
      handlePreviousTrack,
      handleTogglePlay,
      handleNextTrack,
   };
   
   return (
      <SpotifyContext.Provider value={contextValue}>
         {children}
      </SpotifyContext.Provider>
   );
}

// Custom hook to use the Spotify context
export function useSpotify() {
   const context = useContext(SpotifyContext);
   if (!context) {
      throw new Error("useSpotify must be used within a SpotifyProvider");
   }
   return context;
}