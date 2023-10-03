import Image from 'next/image'
import styles from './page.module.css'
import ThingsComponent from '../../components/ThingsComponent';
import Link from 'next/link';
import LoginBox from '@/components/LoginBox';
import SignupBox from '@/components/SignupBox';

export default function CreateAccount() {

  return (
    <div className={styles.mainLogin}>
      
      <div className={styles.loginLogo}>LOGO HERE</div>
      <div className={styles.loginText}>Welcome to the signup page</div>
      <SignupBox/>

    </div>

  )
}
