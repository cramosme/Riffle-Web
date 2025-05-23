"use client";

import React, { useState, useEffect } from 'react';
import styles from './webPlayback.module.css';
import { useSpotify } from '@/context/SpotifyContext';

function WebPlayback({token, timeRange}) {

   const [trackStats, setTrackStats] = useState(null);
   const [isLoadingStats, setIsLoadingStats] = useState(false);
   const [statsError, setStatsError] = useState(null);
   const [currentTrackId, setCurrentTrackId] = useState(null);

   function formatTime(seconds){
      // Have to use isNaN bc i set the state to "" not a number
      if(isNaN(seconds) || seconds < 0) return "0:00";
      const msToSeconds = seconds/1000;
      const minutes = Math.floor(msToSeconds/60);
      const remainingSeconds = Math.round(msToSeconds%60);

      // If it rounds to 60 we need to change display
      if( remainingSeconds == 60 ){
         return`${minutes+1}:00`;
      }

      // Pad seconds with a leading 0 if less than 10
      const paddedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

      return `${minutes}:${paddedSeconds}`;
   }
   
   try{
      const { 
         isReady,
         isActive,
         isPaused,
         currentTrack,
         error,
         position,
         skipThreshold,
         transferPlayback,
         handlePreviousTrack, 
         handleTogglePlay,
         handleNextTrack
      } = useSpotify();
   
      // Fetch track statistics when currentTrack changes
      useEffect(() => {
         const fetchTrackStats = async () => {
            if (!isActive || !currentTrack || !currentTrack["id"]) return;

            // Only fetch if it's a new track
            if(currentTrack["id"] === currentTrackId) return;
            
            setCurrentTrackId(currentTrack["id"]);
            setIsLoadingStats(true);
            setStatsError(null);
            
            try {
               const userId = localStorage.getItem('user_id');
               const response = await fetch(`http://localhost:3000/track-stats/${userId}/${currentTrack["id"]}`, {
                  headers: {
                     "Authorization": `Bearer ${token}`
                  }
               });
               
               if (!response.ok) {
                  throw new Error('Failed to fetch track statistics');
               }
               
               const data = await response.json();
               setTrackStats(data);
            } catch (error) {
               console.error('Error fetching track statistics:', error);
               setStatsError('Could not load track statistics');
            } finally {
               setIsLoadingStats(false);
            }
         };
         
         fetchTrackStats();
      }, [isActive, currentTrack]);

      // Loading state
      if (!isReady) {
         // return;
         return (
            <div className={styles.loadingContainer}>
              Loading player...
            </div>
          );
      }
   
      // Error state
      if (error) {
         return (
            <div className={styles.errorContainer}>
            <p>{error}</p>
            <button 
               className={styles.retryButton} 
               onClick={() => window.location.reload()}
            >
               Retry
            </button>
            </div>
         );
      }
   
      // Not active state
      if (!isActive) {
         return (
            <div className={styles.buttonContainer} onClick={transferPlayback}>
            Play Music on Web
            </div>
         );
      }
      
      // Active playback state
      return (
         <div className={styles.playerContainer}>
            {/* Left section: Album image and controls */}
            <div className={styles.albumSection}>
               <img 
                  src={currentTrack.album.images[0].url} 
                  className={styles.albumCover} 
                  alt={`Album cover for ${currentTrack.name}`} 
               />
               <div className={styles.controls}>
                  <button className={styles.controlButton} onClick={handlePreviousTrack}>
                     &lt;&lt;
                  </button>
                  <button className={styles.controlButton} onClick={handleTogglePlay}>
                     {isPaused ? "PLAY" : "PAUSE"}
                  </button>
                  <button className={styles.controlButton} onClick={handleNextTrack}>
                     &gt;&gt;
                  </button>
               </div>
            </div>
            
            {/* Middle section: Track info */}
            <div className={styles.infoContainer}>
               <div className={styles.trackDetails}>
                  <div className={styles.artistName}>
                     {currentTrack.artists.map((artist, index) => (
                        <span key={index}>
                           {index > 0 ? ", " : ""}
                           {artist.name}
                        </span>
                     ))}
                  </div>
                  <div className={styles.trackName}>{currentTrack.name}</div>
               </div>
               
               {/* Progress bar */}
               <div className={styles.progressSpace}>
                  <div className={styles.progressBarContainer}>
                     <div 
                        className={styles.progressBar} 
                        style={{width: trackStats && trackStats.trackDuration ? 
                           `${(position / trackStats.trackDuration) * 100}%` : '0%'
                        }}
                     />   
                  </div>
                  <div className={styles.progressTimeContainer}>
                     <span>{formatTime(position)}</span>
                     <span>{trackStats ? formatTime(trackStats.trackDuration) : '0:00'}</span>
                  </div>
               </div>
            </div>
            
            {/* Right section: Track stats */}
            <div className={styles.statsContainer}>
               {isLoadingStats ? (
                  <p className={styles.loadingStats}>Loading stats...</p>
               ) : statsError ? (
                  <p className={styles.statsError}>{statsError}</p>
               ) : trackStats ? (
                  trackStats.isFirstPlay ? (
                     <div className={styles.firstPlay}>
                        First time listening!
                        <div style={{ fontSize: '14px', marginTop: '6px' }}>
                           Replay the song to view updated stats.
                        </div>
                     </div>
                  ) : (
                     <>
                        <div className={styles.statsRow}>
                           {timeRange === "lifetime" && (
                              <div className={styles.statItem}>
                                 <span className={styles.statLabel}>Rank:</span>
                                 <span className={styles.statValue}>
                                    N/A
                                    <span className={styles.rankTooltip}>
                                    Based on sorting method
                                    </span>
                                 </span>
                              </div>
                           )}
                           <div className={styles.statItem}>
                              <span className={styles.statLabel}>Skips:</span>
                              <span className={styles.statValue}>{trackStats.skipCount}</span>
                           </div>
                        </div>
                        <div className={styles.statsRow}>
                           <div className={styles.statItem}>
                              <span className={styles.statLabel}>Plays:</span>
                              <span className={styles.statValue}>
                                 { trackStats.listenCount }
                                 {
                                    ((position / trackStats.trackDuration) * 100) >= skipThreshold && (
                                    <span className={styles.currentListen}>
                                    (+1)
                                    </span>
                                 )}
                              </span>
                           </div>
                           <div className={styles.statItem}>
                              <span className={styles.statLabel}>Minutes:</span>
                              <span className={styles.statValue}>
                                 {trackStats.minutesListened.toFixed(2)}
                                 <span className={styles.currentListen}>
                                    (+{(position / 1000 / 60).toFixed(2)})
                                 </span>
                              </span>
                           </div>
                        </div>
                     </>
                  )
               ) : null}
            </div>
         </div>
      );
   } catch (error) {
      // Fallback if context isn't available
      console.error("Spotify context error:", error);
      return (
         <div className={styles.buttonContainer} onClick={() => window.location.reload()}>
            Spotify Player Unavailable - Click to Reload
         </div>
      );
   }
}

export default WebPlayback;