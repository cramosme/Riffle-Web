"use client"

import styles from './TimeRangeDropdown.module.css';
import { useState, useEffect, useRef } from 'react';

export default function showAllButton({selectedOption, onChange}) {
   const [isOpen, setIsOpen] = useState(false);
   
   return (
      <div className={styles.container} ref={dropdownRef}>
        <button 
          className={styles.selector} 
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selectedLabel}</span>
          <span className={styles.arrow}>{isOpen ? 'Show Less ▲' : 'Show All ▼'}</span>
        </button>
      </div>
    );
}