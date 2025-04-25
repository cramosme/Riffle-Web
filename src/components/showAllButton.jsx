"use client"

import styles from './ShowAllButton.module.css';

export default function showAllButton({isShowingAll, onChange}) {

   const handleToggle = () => {
      onChange(!isShowingAll);
   }

   return (
      <div className={styles.container}>
        <button 
          className={styles.selector} 
          onClick={handleToggle}
          aria-label={isShowingAll ? "Show less items" : "Show all items"}
        >
         <span>{isShowingAll ? "Show Less" : "Show All"}</span>
         <span className={styles.arrow}>{isShowingAll ? "▲" : "▼"}</span>
        </button>
      </div>
   );
}