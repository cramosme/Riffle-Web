'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import WebPlayback from '@/components/WebPlayback';
import TimeRangeDropdown from '@/components/TimeRangeDropdown';
import SortingDropdown from '@/components/SortingDropdown';
import showAllButton from '@/components/showAllButton';

export default function Stats() {
   const [profileData, setProfileData] = useState(null);
   const [artistData, setArtistData] = useState(null);
   const [trackData, setTrackData] = useState(null);
   const [token, setToken] = useState(null);
   const [timeRange, setTimeRange] = useState("short_term");
   const [sortMethod, setSortMethod] = useState("count");
   const [hasImportedHistory, setHasImportedHistory] = useState(false);
   const [showAllArtists, setShowAllArtists] = useState(false);
   const [showAllTracks, setShowAllTracks] = useState(false);

   const formatNumberWithCommas = (number) => {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
   };

   useEffect(() => {
      const accessToken = localStorage.getItem("access_token");
      setToken(accessToken);

      // Check if user has imported history
      checkImportStatus();

      // Fetch data with the current time range
      fetchUserData(timeRange);
   }, []);

   useEffect(() => {

      if( token ){
         fetchUserData(timeRange);
      }
   }, [timeRange, token]);

   async function checkImportStatus() {
      try{
         const userId = localStorage.getItem("user_id");
         const response = await fetch(`http://localhost:3000/user/import-status/${userId}`);

         if( response.ok ){
            const data = await response.json();
            setHasImportedHistory(data["hasImported"]);
         }
      } catch ( error ){
         console.error("Error checking import status:", error);
      }
   }

   async function fetchUserData(range) {
      try {

         const cachedData = localStorage.getItem('spotify_data' + range);
         const cachedTimeStamp = localStorage.getItem('spotify_data_timestamp' + range);

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

         if( range === "lifetime" && hasImportedHistory ) {
            console.log("Fetching database...");
            return;
         }

         // For Spotify API time ranges
         const profileResponse = await fetch('http://localhost:3000/me', requestOptions);
         const artistResponse = await fetch(`http://localhost:3000/me/top/artists?time_range=${range}`, requestOptions);
         const trackResponse = await fetch(`http://localhost:3000/me/top/tracks?time_range=${range}`, requestOptions);
         
         const profileData = await profileResponse.json();
         const artistData = await artistResponse.json();
         const trackData = await trackResponse.json();
         
         setProfileData(profileData);
         setArtistData(artistData);
         setTrackData(trackData);

         // Cache the data for later use
         cacheData(range, profileData, artistData, trackData);
      } catch (error) {
         console.error('Error fetching user data', error);
      }
   }

   // Helper function to cache data
   function cacheData(range, profileData, artistData, trackData){
      const dataToCache = {
         profile: profileData,
         artists: artistData,
         tracks: trackData,
      };

      localStorage.setItem(`spotify_data_${range}`, JSON.stringify(dataToCache));
      localStorage.setItem(`spotify_data_timestamp_${range}`, Date.now().toString());
      console.log(`Fetched and cached new spotify data for ${range}`);
   }

   // Handle time range change
   const handleTimeRangeChange = (newRange) => {
      setTimeRange(newRange);
   }

   // Handle sorting change
   const handleSortingChange = (newSort) => {
      setSortMethod(newSort);
   }

   const handleShowAllArtistsChange = (showAllArtists) => {
      setShowAllArtists(showAllArtists);
   }

   const handleShowAllTracksChange = (showAllTracks) => {
      setShowAllTracks(showAllTracks);
   }

   // Handle user selecting top track to fill in web playback
   // const handlePlayTrack = (track) => {

   // }

   return (
      <div className={styles.container}>
         <div className={styles.contentWrapper}>
         {artistData && trackData && (
            <div className={styles.contentWrapper}>
               <div className={styles.cardContainer}>
                  <div className={styles.webPlaybackContainer}>
                     {token && profileData ? <WebPlayback token={token}/> : null}
                  </div>
               </div>
               

               <div className={styles.dropdownContainer}>
                  {/* {timeRange === "Lifetime" && ( */}
                     <SortingDropdown
                        selectedRange={sortMethod}
                        onChange={handleSortingChange}
                     />
                  {/* )} */}
                  <TimeRangeDropdown
                     selectedRange={timeRange}
                     onChange={handleTimeRangeChange}
                     hasImportedHistory={hasImportedHistory}
                  />
               </div>
               <p className={styles.sectionTitle}>
               Top Artists:
               </p>
               
               <div>
                  <showAllButton
                     selectedOption={showAllArtists}
                     onChange={handleShowAllArtistsChange}
                  />
               </div>
               <div className={styles.cardContainer}>
               {artistData?.items?.slice(0, showAllArtists ? 50 : 5).map((artist, index) => (
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
               Top Songs:
               </p>
               <div>
                  <showAllButton
                     selectedOption={showAllTracks}
                     onChange={handleShowAllTracksChange}
                  />
               </div>
               <div className={styles.cardContainer}>
               {trackData?.items?.slice(0, showAllTracks ? 50 : 5).map((track, index) => (
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