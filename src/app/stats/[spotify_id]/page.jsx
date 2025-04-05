'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

export default function Stats({ params }) {
  const [profileData, setProfileData] = useState(null);
  const [artistData, setArtistData] = useState(null);
  const [trackData, setTrackData] = useState(null);

  /* function to get access token */
  async function getAccessToken() {
    try {
      const token = localStorage.getItem('access_token');
      return token;
    } catch (err) {
      return null;
    }
  }

  const token = getAccessToken();

  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
      const profileResponse = await fetch('http://localhost:3000/me');
      const artistResponse = await fetch('http://localhost:3000/me/top/artists');
      const trackResponse = await fetch('http://localhost:3000/me/top/tracks');
      
      const profileData = await profileResponse.json();
      const artistData = await artistResponse.json();
      const trackData = await trackResponse.json();
      
      setProfileData(profileData);
      setArtistData(artistData);
      setTrackData(trackData);
    } catch (error) {
      console.error('Error fetching user data', error);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* Insert web playback here */}
        {profileData && artistData && trackData && (
          <div className={styles.contentWrapper}>
            {profileData['images'] && profileData['images'][0] && (
              <Image 
                src={profileData['images'][0]['url']} 
                alt="Profile" 
                width={profileData['images'][0]['width'] || 200} 
                height={profileData['images'][0]['height'] || 200}
              />
            )}
            
            <p className={styles.displayName}>
              {profileData['display_name']}
            </p>
            
            <p className={styles.sectionTitle}>
              Top 5 Artists:
            </p>
            
            <div className={styles.cardContainer}>
              {artistData.items.slice(0, 5).map((artist, index) => (
                <div key={index} className={styles.cardItem}>
                  {artist['images'] && artist['images'][2] && (
                    <Image 
                      src={artist['images'][2]['url']} 
                      alt={artist['name']} 
                      width={artist['images'][2]['width'] || 100} 
                      height={artist['images'][2]['height'] || 100}
                    />
                  )}
                  
                  <p className={styles.cardTitle}>
                    {index + 1}: {artist['name']}
                  </p>
                  
                  <p className={styles.cardSubtitle}>
                    Followers: {formatNumberWithCommas(artist.followers.total)}
                  </p>
                </div>
              ))}
            </div>
            
            <p className={styles.sectionTitle}>
              Top 5 Songs:
            </p>
            
            <div className={styles.cardContainer}>
              {trackData.items.slice(0, 5).map((track, index) => (
                <div key={index} className={styles.cardItem}>
                  {track['album']['images'] && track['album']['images'][1] && (
                    <Image 
                      src={track['album']['images'][1]['url']} 
                      alt={track['name']} 
                      width={160} 
                      height={160}
                    />
                  )}
                  
                  <p className={styles.cardTitle}>
                    {index + 1}: {track['name']}
                  </p>
                  
                  <p className={styles.cardSubtitle}>
                    Artist(s):
                    <span>
                      {' '}{track['artists'][0]['name']}
                    </span>
                    
                    {track.artists.slice(1, track.artists.length).map((artist, artistIndex) => (
                      <span key={artistIndex}>
                        , {artist['name']}
                      </span>
                    ))}
                  </p>
                  
                  <p className={styles.cardDetail}>
                    Release Date: {track['album']['release_date']}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}