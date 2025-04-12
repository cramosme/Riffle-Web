'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import WebPlayback from '@/components/WebPlayback';

export default function Stats() {
  const [profileData, setProfileData] = useState(null);
  const [artistData, setArtistData] = useState(null);
  const [trackData, setTrackData] = useState(null);
  const [token, setToken] = useState(null);

  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  useEffect(() => {

    const accessToken = localStorage.getItem("access_token");
    setToken(accessToken);
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {

      const cachedData = localStorage.getItem('spotify_data');
      const cachedTimeStamp = localStorage.getItem('spotify_data_timestamp');

      const isCacheValid = cachedData && cachedTimeStamp && (Date.now() - parseInt(cachedTimeStamp) < 60 * 60 * 1000); // checks if values are null and checks if time is less than 1 hours

      if( isCacheValid ){
         const parsedData = JSON.parse(cachedData);
         setProfileData(parsedData["profile"]);
         setArtistData(parsedData["artists"]);
         setTrackData(parsedData["tracks"]);
         console.log("Using cached spotify data");
         return;
      }

      // No valid cache so fetch new data
      const userId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");

      const requestOptions = {
         headers: {
            'Authorization': `Bearer ${token}`
         }
      };

      const profileResponse = await fetch('http://localhost:3000/me', requestOptions);
      const artistResponse = await fetch('http://localhost:3000/me/top/artists', requestOptions);
      const trackResponse = await fetch('http://localhost:3000/me/top/tracks', requestOptions);
      
      const profileData = await profileResponse.json();
      const artistData = await artistResponse.json();
      const trackData = await trackResponse.json();
      
      setProfileData(profileData);
      setArtistData(artistData);
      setTrackData(trackData);

      // Cache the data for later use
      const dataToCache = {
         profile: profileData,
         artists: artistData,
         tracks: trackData,
      };

      localStorage.setItem('spotify_data', JSON.stringify(dataToCache));
      localStorage.setItem("spotify_data_timestamp", Date.now().toString());
      console.log("Fetched and cached new spotify data");

    } catch (error) {
      console.error('Error fetching user data', error);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {profileData && artistData && trackData && (
           <div className={styles.contentWrapper}>
            <div className={styles.cardContainer}>
              <div className={styles.profileContainer}>
            {profileData['images'] && profileData['images'][0] && (
               <Image 
               src={profileData['images'][0]['url']} 
               alt="Profile" 
               width={ 160 } 
               height={ 160 }
               className={styles.profileImage}
               />
            )}
            <p className={styles.displayName}>
              {profileData['display_name']}
            </p>
            </div>
            <div className={styles.webPlaybackContainer}>
               {token && <WebPlayback token={token}/>}
            </div>
            </div>
            

            
            <p className={styles.sectionTitle}>
              Top 5 Artists:
            </p>
            
            <div className={styles.cardContainer}>
              {artistData?.items?.slice(0, 5).map((artist, index) => (
                <div key={index} className={styles.cardItem}>
                  {artist['images'] && artist['images'][2] && (
                    <Image 
                      src={artist['images'][2]['url']} 
                      alt={artist['name']} 
                      width={artist['images'][2]['width'] || 100} 
                      height={artist['images'][2]['height'] || 100}
                      className={styles.cardArtistImage}
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
              {trackData?.items?.slice(0, 5).map((track, index) => (
                <div key={index} className={styles.cardItem}>
                  {track['album']['images'] && track['album']['images'][1] && (
                    <Image 
                      src={track['album']['images'][1]['url']} 
                      alt={track['name']} 
                      width={160} 
                      height={160}
                      className={styles.cardAlbumImage}
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
                    
                    {track?.artists?.slice(1, track.artists.length).map((artist, artistIndex) => (
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