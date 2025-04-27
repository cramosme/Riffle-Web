'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import WebPlayback from '@/components/WebPlayback';
import TimeRangeDropdown from '@/components/TimeRangeDropdown';
import SortingDropdown from '@/components/SortingDropdown';
import ShowAllButton from '@/components/ShowAllButton';
import LoadMoreButton from '@/components/LoadMoreButton';

export default function Stats() {
   const [profileData, setProfileData] = useState(null);
   const [artistData, setArtistData] = useState(null);
   const [trackData, setTrackData] = useState(null);
   const [token, setToken] = useState(null);
   const [timeRange, setTimeRange] = useState("short_term");
   const [sortMethod, setSortMethod] = useState("listen_count");
   const [hasImportedHistory, setHasImportedHistory] = useState(false);
   const [showAllArtists, setShowAllArtists] = useState(false);
   const [showAllTracks, setShowAllTracks] = useState(false);
   const [isLoading, setIsLoading] = useState(true);

   // Helper function to add commas to follower count
   const formatNumberWithCommas = (number) => {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
   };

   // Helper function to truncate text
   const truncateText = (text, maxLength) => {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
   };

   useEffect(() => {
      const accessToken = localStorage.getItem("access_token");
      setToken(accessToken);

      // Check if user has imported history
      checkImportStatus();

      // Fetch data with the current time range
      fetchUserData(timeRange, sortMethod);

      // Set loading to false after everthing is loaded
      const timer = setTimeout(() => {
         setIsLoading(false);
      }, 200); // Waits 200 ms
   }, []);

   // Will call fetchUserData anytime timeRane or sortMethod changes
   useEffect(() => {

      if( token ){
         fetchUserData(timeRange, sortMethod);
      }
   }, [timeRange, sortMethod, token]);

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

   async function fetchUserData(range, sortMethod) {
      try {
         
         // These can be used in either statement
         const userId = localStorage.getItem("user_id");
         const token = localStorage.getItem("access_token");
         const requestOptions = {
            headers: {
               'Authorization': `Bearer ${token}`
            }
         };

         // Fetching life time stats
         if( range === "lifetime" && hasImportedHistory ) {
            const cachedData = localStorage.getItem(`lifetime_data_${sortMethod}`);
            const cachedTimeStamp = localStorage.getItem(`lifetime_data_timestamp_${sortMethod}`);
            
            const isCacheValid = cachedData && cachedTimeStamp && (Date.now() - parseInt(cachedTimeStamp) < 60 * 60 * 1000); // checks if values are null and checks if time is less than 1 hours

            if( isCacheValid ){
               const parsedData = JSON.parse(cachedData);
               console.log(`Using cached lifetime data sorted by ${sortMethod}`);
               setTrackData(parsedData);
               return;
            }

            // If cache is invalid fetch from backend
            console.log(`Fetching lifetime data sorted by ${sortMethod}`);

            try{
               const response = await fetch(`http://localhost:3000/lifetime-stats/${userId}?sort=${sortMethod}`, requestOptions);

               if( response.ok ){
                  const lifetimeData = await response.json();

                  //update state
                  setTrackData(lifetimeData.tracks);

                  localStorage.setItem(`lifetime_data_${sortMethod}`, JSON.stringify(lifetimeData.tracks));
                  localStorage.setItem(`lifetime_data_timestamp_${sortMethod}`, Date.now().toString());

                  console.log(`Cached lifetime data sorted by ${sortMethod}`);
               }
               else{
                  console.error("Error fetching lifetime data:", response.status);
               }
            } catch (err) {
               console.error("Error fetching lifetime data:", err);
            }
         }
         else{ // Fetching regular stats from spotify api
            const cachedData = localStorage.getItem(`spotify_data_${range}`);
            const cachedTimeStamp = localStorage.getItem(`spotify_data_timestamp_${range}`);
            
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
            const dataToCache = {
               profile: profileData,
               artists: artistData,
               tracks: trackData
            };
            
            localStorage.setItem(`spotify_data_${range}`, JSON.stringify(dataToCache));
            localStorage.setItem(`spotify_data_timestamp_${range}`, Date.now().toString());
            
            console.log(`Fetched and cached spotify data for ${range}`);
         }
      } catch (error) {
         console.error('Error fetching user data', error);
      }
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

   const handleLoadMoreTracks = (loadMoreTracks) => {
      return;
   }

   // Handle user selecting top track to fill in web playback
   // const handlePlayTrack = (track) => {

   // }

   // Show loading state while data is being fetched
   if (isLoading) {
      return (
         <div className={styles.container}>
            <div className={styles.loadingContainer}>
               <p>Loading your stats...</p>
            </div>
         </div>
      );
   }

   return (
      <div className={styles.container}>
         <div className={styles.contentWrapper}>
            {!hasImportedHistory && (
               <div className={styles.importTitle}>
                  Import Spotify Listening History to View Lifetime Stats
               </div>
            )}
         {artistData && trackData && (
            <div className={styles.contentWrapper}>
               <div className={styles.dropdownContainer}>
                  <TimeRangeDropdown
                     selectedRange={timeRange}
                     onChange={handleTimeRangeChange}
                     hasImportedHistory={hasImportedHistory}
                  />
               </div>
               <div className={styles.cardContainer}>
                  <div className={styles.webPlaybackContainer}>
                     {token && profileData ? <WebPlayback token={token} timeRange={timeRange}/> : null}
                  </div>
               </div>
               
               {timeRange !== "lifetime" ? (
                  <>
                  <div className={styles.displayTitle}>
                     <p className={styles.sectionTitle}>Top Artists</p>
                     <ShowAllButton
                        isShowingAll={showAllArtists}
                        onChange={handleShowAllArtistsChange}
                     />
                  </div>
                  <div className={styles.cardContainer}>
                  {artistData?.items?.slice(0, showAllArtists ? 50 : 5).map((artist, index) => (
                     <div key={index} className={styles.cardItem}>
                        {artist['images'] && artist['images'][2] && (
                        <Image 
                           src={artist['images'][1]['url']} 
                           alt={artist['name']} 
                           width={160} 
                           height={160}
                           className={styles.cardArtistImage}
                        />
                        )}
                        
                        <p className={styles.cardTitle}>
                        {index + 1}. {artist['name']}
                        </p>
                        
                        <p className={styles.cardSubtitle}>
                        Followers: {formatNumberWithCommas(artist.followers.total)}
                        </p>
                     </div>
                  ))}
                  </div>
                  
                  <div className={styles.displayTitle}>
                     <p className={styles.sectionTitle}>Top Tracks</p>
                     <ShowAllButton
                        isShowingAll={showAllTracks}
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
                              {index + 1}. {truncateText(track['name'], 25)}
                           </p>
                           
                           <p className={styles.cardSubtitle}>
                              Artist(s): {
                                 truncateText(
                                    track.artists.map(artist => artist.name).join(', '), 
                                    40
                                 )
                              }
                           </p>

                           {/* <p className={styles.cardDetail}>
                           Release Date: {track['album']['release_date']}
                           </p> */}
                        </div>
                     ))}
                  </div>
                  </>
               ) : (
                  <>
                     <div className={styles.displayTitle}>
                        <p className={styles.lifetimeTitle}>Lifetime Top Tracks</p>
                        <SortingDropdown
                           selectedMethod={sortMethod}
                           onChange={handleSortingChange}
                        />
                     </div>
                     <div className={styles.cardContainer}>
                        {trackData?.items?.slice(0, 50).map((track, index) => (
                           <div key={track["id"]} className={styles.cardItem}>
                              {/* Track Image */}
                              {track['album']['images'] && track['album']['images'][0] && (
                                 <Image 
                                    src={track['album']['images'][0]['url']} 
                                    alt={track['name']} 
                                    width={160} 
                                    height={160}
                                    className={styles.cardAlbumImage}
                                 />
                              )}
                                 
                              <p className={styles.cardTitle}>
                                 {index + 1}. { track['name'] }
                              </p>
                                 
                              <p className={styles.cardSubtitle}>
                                 Artist(s): {track.artists.map(artist => artist.name).join(', ')}
                              </p>

                              {/* Track Stats */}
                              {track["stats"] && (
                                 <div className={styles.statsContainer}>
                                    <div className={styles.statItem}>
                                       <span>Plays {track["stats"]["listen_count"]}</span>
                                    </div>
                                    <div className={styles.statItem}>
                                       <span>Minutes {track["stats"]["minutes_listened"].toFixed(2)}</span>
                                    </div>
                                    <div className={styles.statItem}>
                                       <span>Skips {track["stats"]["skip_count"]}</span>
                                    </div>
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                     <LoadMoreButton
                        onChange={handleLoadMoreTracks}
                     />
                  </>
               )}
            </div>
         )}
         </div>
      </div>
   );
}