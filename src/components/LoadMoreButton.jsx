"use client"

import styles from './LoadMoreButton.module.css';

export default function LoadMoreButton({ isLoading, hasMore, onClick }) {
   return (
      <div className={styles.container}>
        <button 
          className={styles.selector} 
          onClick={onClick}
          disabled={isLoading || !hasMore}
          aria-label={isLoading ? "Loading..." : "Load More Tracks"}
        >
         <span>{isLoading ? "Loading..." : "Load More Tracks"}</span>
        </button>
      </div>
   );
}