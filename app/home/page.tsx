import Image from 'next/image'
import styles from './page.module.css'
import ThingsComponent from '../../components/ThingsComponent';
import ThingButton from '@/components/ThingButton';
import Link from 'next/link';

export default function Home() {

  return (
    <div className={styles.homeContent}>
      <div className={styles.banner}>Welcome to the home page. BANNER HERE</div>
      <Link href="/home/create-poll" className={styles.createButton}>Create a poll now!</Link>
    </div>
  )
}
