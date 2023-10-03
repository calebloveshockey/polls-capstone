import Image from 'next/image'
import styles from './page.module.css'
import ThingsComponent from '../../components/ThingsComponent';
import Link from 'next/link';
import LoginBox from '@/components/LoginBox';

export default function Login() {

  return (
    <div className={styles.mainLogin}>
      
      <div className={styles.loginLogo}>LOGO HERE</div>
      <div className={styles.loginText}>Welcome to the login page</div>
      <LoginBox/>

    </div>

  )
}
