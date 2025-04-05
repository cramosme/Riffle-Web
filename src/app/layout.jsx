'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SpotifyAuthWithPKCE from '@/components/SpotifyAuthWithPKCE';
import styles from './layout.module.css';
import { isUserLoggedIn, getLoggedInUserId } from '@/utils/auth';
import ProfileDropdown from '@/components/ProfileDropdown';
import './globals.css';
import { useEffect, useState } from 'react';

export default function RootLayout({ children }) {

  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  
  // Helper to check if we're on a specific route type
  const isStatsRoute = pathname?.includes('/stats/');
  const isSettingsRoute = pathname?.includes('/settings/');
  const isIndexRoute = pathname === '/';

   useEffect(() => {
      const loggedIn = isUserLoggedIn();
      setIsLoggedIn(loggedIn);

      if( isLoggedIn ){
         setUserId(getLoggedInUserId);
         const profileImageUrl = localStorage.getItem('profile_pic');
         if( profileImageUrl ){
            setProfileImage(profileImageUrl);
         }
      }

      setAuthChecked(true);
   }, [pathname]);

  return (
    <html lang="en" className={styles.html}>
      <head>
        <title>Riffle</title>
        <meta httpEquiv="Content-Language" content="en" />
        <meta name="google" content="notranslate" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={styles.body}>
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