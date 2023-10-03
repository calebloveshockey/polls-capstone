import Link from 'next/link';
import styles from './components.module.css';

export default function NavBar() {
  return (
    <div className={styles.NavBar}>
      <div className={styles.logo}>LOGO</div>
      <div className={styles.links}>
        <Link href='/home' className={styles.link}>Home</Link>
        <Link href='/login' className={styles.link}>Login</Link>
      </div>
    </div>
  );
}

export { NavBar };
