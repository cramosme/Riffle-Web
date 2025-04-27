"use client"

import styles from './OrderButton.module.css';

export default function OrderButton({ isAscending, onChange }) {
   
   const handleToggle = () => {
      onChange(!isAscending);
   }

   return (
      <div className={styles.container}>
        <button 
          className={styles.selector} 
          onClick={handleToggle}
          aria-label={isAscending ? "Ascending" : "Descending"}
        >
         <span>{isAscending ? "Ascending" : "Descending"}</span>
         <span className={styles.arrow}>{isAscending ? "↑" : "↓"}</span>
        </button>
      </div>
   );
}