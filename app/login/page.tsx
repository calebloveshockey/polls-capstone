import Image from 'next/image'
import styles from './page.module.css'
import Link from 'next/link';
import LoginBox from '@/components/LoginBox';

export default function Login() {

  return (
    <div className={styles.mainLogin}>
      <Image
        src="/polls.svg"
        width={80}
        height={80}
        alt="Website Logo"
        className={styles.loginLogo}
      />
      <LoginBox/>

    </div>

  )
}
