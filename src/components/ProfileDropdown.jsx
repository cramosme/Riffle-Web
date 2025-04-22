/* Will implement a profile drop down menu that displays either stats or settingss */

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './ProfileDropdown.module.css';
import defaultImage from '../../public/images/default_image.png'

export default function ProfileDropdown({ userId, profileImageUrl, userName }) {
   const [isOpen, setIsOpen] = useState(false);
   const dropdownRef = useRef(null);
   
   // Default profile image if none is provided
   const imageUrl = profileImageUrl || defaultImage;

   // Toggle dropdown state
   const toggleDropdown = () => {
      setIsOpen(!isOpen);
   };
   
   // Close dropdown when clicking outside
   useEffect(() => {
      function handleClickOutside(event) {
         if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
         setIsOpen(false);
         }
      }
      
      // Add event listener when dropdown is open
      if (isOpen) {
         document.addEventListener('mousedown', handleClickOutside);
      }
      
      // Clean up
      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
      };
   }, [isOpen]);
  
  return (
    <div className={styles.container} ref={dropdownRef}>
      <button className={styles.profileButton} onClick={toggleDropdown}>
         <span className={styles.userName}>{userName}</span>
         <Image 
            src={imageUrl}
            alt="Profile"
            width={50}
            height={50}
            className={styles.profileImage}
         />
      </button>
      
      {isOpen && (
        <div className={styles.dropdown}>
          <Link 
            href={`/stats/${userId}`}
            className={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
          >
            Stats
          </Link>
          <Link 
            href={`/settings/${userId}`}
            className={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          <Link
            href={`/import/${userId}`}
            className={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
          >
            Import
          </Link>
        </div>
      )}
    </div>
  );
}