'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './TimeRangeDropdown.module.css';

export default function TimeRangeDropdown({ selectedRange, onChange, hasImportedHistory = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
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
          {timeRanges.map((range) => (
            <li 
              key={range.id}
              className={`
                ${styles.option} 
                ${selectedRange === range.id ? styles.selected : ''} 
                ${range.disabled ? styles.disabled : ''}
              `}
              onClick={() => handleSelect(range.id)}
              role="option"
              aria-selected={selectedRange === range.id}
              aria-disabled={range.disabled}
            >
              {range.label}
              
              {range.disabled && (
                <span className={styles.lock}>🔒</span>
              )}
              
              {range.disabled && (
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