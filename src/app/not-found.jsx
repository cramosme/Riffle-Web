'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isUserLoggedIn, getLoggedInUserId } from '@/utils/auth';
import styles from './not-found.module.css';

export default function NotFound() {
  // Use state to handle client-side rendering
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Check login status after component mounts
    const loggedIn = isUserLoggedIn();
    setIsLoggedIn(loggedIn);
    
    if (loggedIn) {
      setUserId(getLoggedInUserId());
    }
    
    setAuthChecked(true);
  }, []);

  return (
    <div className={styles.container}>
      <p className={styles.message}>
        Sorry, we couldn't find the page you're looking for.
      </p>
      
      {authChecked && (
        isLoggedIn ? (
          <div className={styles.linksContainer}>
            <Link 
              href="/"
              className={`${styles.link} ${styles.homeLink}`}
            >
              Go Home
            </Link>
            <Link 
              href={`/stats/${userId}`}
              className={`${styles.link} ${styles.statsLink}`}
            >
              Go to My Stats
            </Link>
          </div>
        ) : (
          <Link 
            href="/"
            className={`${styles.link} ${styles.homeLink}`}
          >
            Go Home
          </Link>
        )
      )}
    </div>
  );
}