// Landing page
import styles from './page.module.css';
import { FaUserAlt, FaMusic, FaPlay } from 'react-icons/fa';

export default function Home() {
  return (
    <div className={styles.container}>
      <p className={styles.welcomeText}>
        Welcome to Riffle! Riffle is a web application that uses the publicly available Spotify API to provide users with useful statistics about their listening habits.
      </p>

      <div className={styles.featuresContainer}>
        <Feature
          icon={<FaUserAlt size={50} />}
          title="View your top artists"
          description="Explore your top 5 most played artists in the past month."
        />
        <Feature
          icon={<FaMusic size={50} />}
          title="View your top songs"
          description="Check out your top 5 most listened to tracks in the past month."
        />
        <Feature
          icon={<FaPlay size={50} />}
          title="Use our web player"
          description="Play your personal favorites directly in-browser using our custom Spotify player."
        />
      </div>
    </div>
  );
}

function Feature({ icon, title, description }) {
  return (
    <div className={styles.featureItem}>
      <div className={styles.featureIcon}>{icon}</div>
      <div>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDesc}>{description}</p>
      </div>
    </div>
  );
}