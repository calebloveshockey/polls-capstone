import Image from 'next/image'
import styles from './page.module.css'
import Link from 'next/link';
import LoginBox from '@/components/LoginBox';
import SignupBox from '@/components/SignupBox';

export default function CreateAccount() {

  return (
    <div className={styles.mainLogin}>
      
      <Image
        src="/polls.svg"
        width={80}
        height={80}
        alt="Website Logo"
        className={styles.loginLogo}
      />
      <SignupBox/>

    </div>

  )
}
