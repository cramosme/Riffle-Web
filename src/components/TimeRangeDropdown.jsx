'use client';

import { useState, useEffect } from 'react';
import styles from './TimeRangeDropdown.module.css';

export default function TimeRangeDropdown({ selectedRange, onChange, hasImportedHistory = false }) {
   const [isOpen, setIsOpen] = useState(false);
   const [tooltipVisible, setTooltipVisible] = useState(false);
   
   const timeRanges = [
      { id: 'short_term', label: '4 Weeks', disabled: false },
      { id: 'medium_term', label: '6 Months', disabled: false },
      { id: 'long_term', label: 'Past Year', disabled: false },
      { id: 'lifetime', label: 'Lifetime', disabled: !hasImportedHistory }
   ];
   
   const selectedLabel = timeRanges.find(range => range.id === selectedRange)?.label || '4 Weeks';
   
   const handleSelect = (rangeId) => {
      const range = timeRanges.find(r => r.id === rangeId);
      
      if (range && !range.disabled) {
         onChange(rangeId);
         setIsOpen(false);
      }
   };
   
   // Use a client-side only effect
   useEffect(() => {
      // Check if we're running in the browser
      if (typeof window !== 'undefined') {
         const handleClickOutside = (event) => {
         if (isOpen && !event.target.closest(`.${styles.container}`)) {
            setIsOpen(false);
         }
         };
         
         document.addEventListener('mousedown', handleClickOutside);
         return () => {
         document.removeEventListener('mousedown', handleClickOutside);
         };
      }
   }, [isOpen, styles.container]);
   
   return (
      <div className={styles.container}>
         <button 
         className={styles.selector} 
         onClick={() => setIsOpen(!isOpen)}
         aria-haspopup="listbox"
         aria-expanded={isOpen}
         >
         <span>{selectedLabel}</span>
         <svg 
            className={`${styles.arrow} ${isOpen ? styles.up : ''}`} 
            width="12" 
            height="8" 
            viewBox="0 0 12 8" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
         >
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
         </svg>
         </button>
         
         {isOpen && (
         <ul className={styles.dropdown} role="listbox">
            {timeRanges.map((range) => (
               <li 
               key={range.id}
               className={`
                  ${styles.option} 
                  ${selectedRange === range.id ? styles.selected : ''} 
                  ${range.disabled ? styles.disabled : ''}
               `}
               onClick={() => handleSelect(range.id)}
               onMouseEnter={() => {
                  if (range.disabled) setTooltipVisible(true);
               }}
               onMouseLeave={() => setTooltipVisible(false)}
               role="option"
               aria-selected={selectedRange === range.id}
               aria-disabled={range.disabled}
               >
               {range.label}
               
               {range.disabled && (
                  <svg className={styles.lockIcon} width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2"/>
                     <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="currentColor" strokeWidth="2"/>
                  </svg>
               )}
               
               {range.disabled && tooltipVisible && (
                  <div className={styles.tooltip}>
                     Please import your listening history first
                  </div>
               )}
               </li>
            ))}
         </ul>
         )}
      </div>
   );
}