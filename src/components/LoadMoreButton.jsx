"use client"

import styles from './LoadMoreButton.module.css';

export default function LoadMoreButton({onChange}) {

   const handleToggle = () => {
      onChange(console.log("Button pressed"));
   }

   return (
      <div className={styles.container}>
        <button 
          className={styles.selector} 
          onClick={handleToggle}
          aria-label={"Load More Tracks"}
        >
         <span>{"Load More Tracks"}</span>
        </button>
      </div>
   );
}