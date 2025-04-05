'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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
    <div className="flex flex-col items-center justify-center bg-[#25292e] p-5 min-h-screen overflow-y-auto">
      <div className="flex flex-col items-center justify-center p-5 bg-[#25292e] w-full max-w-6xl">
        {/* Insert web playback here */}
        {profileData && artistData && trackData && (
          <div className="flex flex-col items-center justify-center">
            {profileData['images'] && profileData['images'][0] && (
              <Image 
                src={profileData['images'][0]['url']} 
                alt="Profile" 
                width={profileData['images'][0]['width'] || 200} 
                height={profileData['images'][0]['height'] || 200}
              />
            )}
            
            <p className="text-xl py-5 text-white font-['Lato-Bold']">
              {profileData['display_name']}
            </p>
            
            <p className="text-3xl py-5 text-white font-['Lato-Bold']">
              Top 5 Artists:
            </p>
            
            <div className="flex flex-wrap justify-center items-center p-5 bg-[#1a1a1a] border-[5px] border-[#0eaa45] rounded-[10px]">
              {artistData.items.slice(0, 5).map((artist, index) => (
                <div key={index} className="flex flex-col justify-center items-center mb-5 px-5">
                  {artist['images'] && artist['images'][2] && (
                    <Image 
                      src={artist['images'][2]['url']} 
                      alt={artist['name']} 
                      width={artist['images'][2]['width'] || 100} 
                      height={artist['images'][2]['height'] || 100}
                    />
                  )}
                  
                  <p className="text-xl py-2.5 text-white font-['Lato-Bold']">
                    {index + 1}: {artist['name']}
                  </p>
                  
                  <p className="text-xl text-white font-['Lato-Bold']">
                    Followers: {formatNumberWithCommas(artist.followers.total)}
                  </p>
                </div>
              ))}
            </div>
            
            <p className="text-3xl py-5 text-white font-['Lato-Bold']">
              Top 5 Songs:
            </p>
            
            <div className="flex flex-wrap justify-center items-center p-5 mt-2.5 bg-[#1a1a1a] border-[5px] border-[#0eaa45] rounded-[10px]">
              {trackData.items.slice(0, 5).map((track, index) => (
                <div key={index} className="flex flex-col justify-center items-center mb-5 px-5">
                  {track['album']['images'] && track['album']['images'][1] && (
                    <Image 
                      src={track['album']['images'][1]['url']} 
                      alt={track['name']} 
                      width={160} 
                      height={160}
                    />
                  )}
                  
                  <p className="text-xl py-2.5 text-white font-['Lato-Bold']">
                    {index + 1}: {track['name']}
                  </p>
                  
                  <p className="text-xl py-2.5 text-white font-['Lato-Bold']">
                    Artist(s):
                    <span className="text-xl text-white font-['Lato-Bold']">
                      {' '}{track['artists'][0]['name']}
                    </span>
                    
                    {track.artists.slice(1, track.artists.length).map((artist, artistIndex) => (
                      <span key={artistIndex} className="text-xl text-white font-['Lato-Bold']">
                        , {artist['name']}
                      </span>
                    ))}
                  </p>
                  
                  <p className="text-xl py-2.5 text-white font-['Lato-Bold']">
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