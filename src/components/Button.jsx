import styles from './Button.module.css';

export default function Button({ label, onClick, variant = "primary" }) {
  return (
    <button 
      className={`${styles.button} ${styles[variant]}`} 
      onClick={onClick}
    >
      {label}
    </button>
  );
}
