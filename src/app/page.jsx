// Landing page
import styles from './page.module.css';
import { FaUserAlt, FaMusic, FaPlay } from 'react-icons/fa';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* <div className={styles.artistBackground}>
        {[
          { src: '/images/beethovenimage.jpg', top: '10%', left: '5%' },
          { src: '/images/kendrickimage.jpg', top: '20%', right: '10%' },
          { src: '/images/weekendimage.png', top: '50%', left: '13%' },
          { src: '/images/szaimage.jpg', bottom: '15%', right: '12%' },
          { src: '/images/metallicaimage.jpg', bottom: '10%', right: '35%' },
          { src: '/images/travisscottimage.jpg', bottom: '7%', left: '31%' },
        ].map((artist, i) => (
          <img
            key={i}
            src={artist.src}
            alt={`artist-${i}`}
            className={styles.floatingArtist}
            style={{
              top: artist.top,
              left: artist.left,
              right: artist.right,
              bottom: artist.bottom,
            }}
          />
        ))}
      </div> */}
      <p className={styles.welcomeText}>
        Welcome to Riffle! Riffle is a web application that uses the publicly available Spotify API to provide users with useful statistics about their listening habits.
      </p>

      <div className={styles.featuresContainer}>
        <Feature
          icon={<FaUserAlt size={50} />}
          title="View your top artists"
          description="Explore your top played artists."
        />
        <Feature
          icon={<FaMusic size={50} />}
          title="View your top songs"
          description="Check out your most listened to tracks."
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