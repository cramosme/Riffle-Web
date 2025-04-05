// Landing page
import styles from './page.module.css';

// Landing page
export default function Home() {
  return (
    <div className={styles.container}>
      <p className={styles.welcomeText}>
        Welcome to Riffle! Riffle is a web application that uses the publicly available Spotify API to provide users with useful statistics about their listening habits.
      </p>
    </div>
  );
}