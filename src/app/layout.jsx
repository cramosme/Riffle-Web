'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SpotifyAuthWithPKCE from '@/components/SpotifyAuthWithPKCE';
import styles from './layout.module.css';
import { isUserLoggedIn, getLoggedInUserId } from '@/utils/auth';
import ProfileDropdown from '@/components/ProfileDropdown';
import BackgroundParticles from '@/components/BackgroundParticles';
import './globals.css';
import { useEffect, useState } from 'react';

export default function RootLayout({ children }) {

   const pathname = usePathname();
   const [authChecked, setAuthChecked] = useState(false);
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [userId, setUserId] = useState(null);
   const [profileImage, setProfileImage] = useState(null);

   // Function to check access token and refresh token if needed
   const checkAndRefreshToken = async () => {
      if( typeof window === 'undefined' ) return;

      try{
         const accessToken = localStorage.getItem("access_token");
         const refreshToken = localStorage.getItem("refresh_token");
         const tokenExpiry = localStorage.getItem("token_expiry");

         // If theres no token or expiry, we can't refresh
         if( !accessToken || !refreshToken || !tokenExpiry ) return;

         const expiryTime = parseInt(tokenExpiry);

         // Check if token will expire soon
         if( Date.now() > expiryTime - 5 * 60 * 1000){
            console.log("Token expiring soon, refreshing...");

            const response = await fetch('http://localhost:3000/refresh-token', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json'
               },
               body: JSON.stringify({
                  refresh_token: refreshToken
               })
            });

            if( response.ok ){
               const data = await response.json();

               console.log("Access token after refresh:", data["access_token"]);
               console.log("Token expiry after refresh:", data["expires_in"]);

               // Update the items in local storage
               localStorage.setItem('access_token', data["access_token"]);
               localStorage.setItem("token_expiry", data["expires_in"]);

               console.log("Token refreshed successfully");
            }
            else{
               console.error("Failed to refresh token. Redirecting to login");

               // Clear all auth data from localStorage
               localStorage.clear();

               window.location.href = '/'; // redirect back to home page

               // Update states to reflect logout
               setIsLoggedIn(false);
               setUserId(null);
               setProfileImage(null);

            }
         }
      } catch( err ){
         console.error("Error refreshing token:", err);

         // On error, also clear auth data and redirect
         localStorage.clear();
         
         window.location.href = '/';
         
         setIsLoggedIn(false);
         setUserId(null);
         setProfileImage(null);
      }
   }

   function logTokenExpiry() {
      const tokenExpiry = localStorage.getItem('token_expiry');
      
      if (!tokenExpiry) {
        console.log('No token expiry found');
        return;
      }
      
      const expiryTime = parseInt(tokenExpiry);
      const currentTime = Date.now();
      const timeRemaining = expiryTime - currentTime;
      
      if (timeRemaining <= 0) {
        console.log('Token has expired');
        return;
      }
      
      // Convert to minutes and seconds
      const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
      const secondsRemaining = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
      console.log(`Token expires in: ${minutesRemaining} minutes and ${secondsRemaining} seconds`);
    }

   // Helper to check if we're on a specific route type
   const isStatsRoute = pathname?.includes('/stats/');
   const isSettingsRoute = pathname?.includes('/settings/');
   const isIndexRoute = pathname === '/';

   useEffect(() => {
      if (typeof window !== 'undefined') {
         setTimeout(() =>{

            const loggedIn = isUserLoggedIn();
            setIsLoggedIn(loggedIn);
            
            if (loggedIn) {
               const storedUserId = getLoggedInUserId();
               const storedProfilePic = localStorage.getItem('profile_pic');
               setUserId(storedUserId);
               setProfileImage(storedProfilePic);
               // Log token expiry information
               logTokenExpiry();
            }
            setAuthChecked(true);
         }, 500)
      }
      }, []);

   useEffect(() => {
      checkAndRefreshToken();

      // Set up interval to check every minute
      const interval = setInterval(checkAndRefreshToken, 60*1000);

      return () => clearInterval(interval);
   }, []);

  return (
    <html lang="en" className={styles.html}>
      <head>
        <title>Riffle</title>
        <meta httpEquiv="Content-Language" content="en" />
        <meta name="google" content="notranslate" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/images/riffle_logo.png" />
      </head>
      <body className={styles.body}>
         <BackgroundParticles/>
        <header className={styles.header}>
            {/* Logo and title on the left */}
            <Link href="/" className={styles.logoContainer}>
                  <Image 
                     src="/images/riffle_logo.png" 
                     alt="Riffle Logo" 
                     width={50} 
                     height={50}
                     className={styles.logoImage}
                  />
                  <span className={styles.logoText}>
                     Riffle
                  </span>
            </Link>
          
          {/* Navigation links or auth button on the right */}
          <div className={styles.navContainer}>
            {isIndexRoute && authChecked && ( isLoggedIn ? (
               <ProfileDropdown userId={userId} profileImageUrl={profileImage} />
            ) : (
               <SpotifyAuthWithPKCE/>
            )
            )}
            
            {isStatsRoute && (
              <Link 
                href={pathname?.replace('/stats/', '/settings/')} 
                className={styles.navLink}
              >
                Settings
              </Link>
            )}
            
            {isSettingsRoute && (
              <Link 
                href={pathname?.replace('/settings/', '/stats/')} 
                className={styles.navLink}
              >
                Stats
              </Link>
            )}
          </div>
        </header>
        
        <main className={styles.main}>
          {children}
        </main>
      </body>
    </html>
  );
}