import Image from 'next/image'
import styles from './page.module.css'
import ThingsComponent from '../../components/ThingsComponent';
import ThingButton from '@/components/ThingButton';
import Link from 'next/link';

export default function Home() {

  return (
    <div className={styles.homeContent}>
      <div className={styles.banner}>Welcome to the home page. Some sort of banner would go here.</div>
      <Link href="/create-poll" className={styles.createButton}>Create a poll now!</Link>
    </div>
  )
}
