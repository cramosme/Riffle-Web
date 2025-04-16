"use client";

import React from 'react';
import styles from './webPlayback.module.css';
import { useSpotify } from '@/context/SpotifyContext';

function WebPlayback() {
  const { 
    isReady,
    isActive,
    isPaused,
    currentTrack,
    error,
    transferPlayback,
    handlePreviousTrack, 
    handleTogglePlay,
    handleNextTrack
  } = useSpotify();

  // Loading state
  if (!isReady) {
    return;
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
    <div className={styles.mainWrapper}>
      <div className={styles.coverContainer}>
        <div className={styles.trackInfo}>
          <div className={styles.albumColumn}>
            <img 
              src={currentTrack.album.images[0].url} 
              className={styles.nowPlayingCover} 
              alt={`Album cover for ${currentTrack.name}`} 
            />
          </div>
          <div className={styles.nowPlayingSide}>
            <div className={styles.nowPlayingArtist}>
              {currentTrack.artists.map((artist, index) => (
                <span key={index}>
                  {index > 0 ? ", " : ""}
                  {artist.name}
                </span>
              ))}
            </div>
            <div className={styles.nowPlayingName}>{currentTrack.name}</div>
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
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? "PLAY" : "PAUSE"}
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