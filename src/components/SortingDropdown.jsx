/* Sorting dropdown */
'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './TimeRangeDropdown.module.css';

export default function SortingDropdown({selectedMethod, onChange}) {
   const [isOpen, setIsOpen] = useState(false);
   const dropdownRef = useRef(null);
   
   const sortingMethods = [
      { id: 'listen_count', label: 'Listen Count', disabled: false },
      { id: 'minutes_listened', label: 'Minutes Listened', disabled: false },
      { id: 'skip_count', label: 'Skip Count', disabled: false }
   ];
   
   const selectedLabel = sortingMethods.find(range => range.id === selectedMethod)?.label || 'Listen Count';
   
   const handleSelect = (rangeId) => {
     const range = sortingMethods.find(r => r.id === rangeId);
     
     if (range && !range.disabled) {
       onChange(rangeId);
       setIsOpen(false);
     }
   };
   
   // Close dropdown when clicking outside
   useEffect(() => {
     const handleClickOutside = (event) => {
       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
         setIsOpen(false);
       }
     };
     
     if (isOpen) {
       document.addEventListener('mousedown', handleClickOutside);
     }
     
     return () => {
       document.removeEventListener('mousedown', handleClickOutside);
     };
   }, [isOpen]);
   
   return (
     <div className={styles.container} ref={dropdownRef}>
       <button 
         className={styles.selector} 
         onClick={() => setIsOpen(!isOpen)}
         aria-haspopup="listbox"
         aria-expanded={isOpen}
       >
         <span>{selectedLabel}</span>
         <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
       </button>
       
       {isOpen && (
         <ul className={styles.dropdown} role="listbox">
           {sortingMethods.map((range) => (
             <li 
               key={range.id}
               className={`
                 ${styles.option} 
                 ${selectedMethod === range.id ? styles.selected : ''} 
                 ${range.disabled ? styles.disabled : ''}
               `}
               onClick={() => handleSelect(range.id)}
               role="option"
               aria-selected={selectedMethod === range.id}
               aria-disabled={range.disabled}
             >
               {range.label}
             </li>
           ))}
         </ul>
       )}
     </div>
   );
}