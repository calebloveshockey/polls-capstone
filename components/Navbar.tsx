"use client"

import Link from 'next/link';
import Image from 'next/image';
import styles from './components.module.css';
import { useEffect, useState } from 'react';
import { validate } from '@/actions/actions';

export default function NavBar() {

  const [user, setUser] = useState();

  // Validate session
  useEffect(() => {
    const fetchData = async () => {
      try {
        const validation = await validate();
        if (validation.status && validation.status === 'SUCCESS') {
          setUser(validation.username);
        }
      } catch (error) {
        console.error('Error during validation:', error);
      }
    };
  
    fetchData();
  }, []);

  return (
    <div className={styles.NavBar}>
      <Image
        src="/polls.svg"
        width={80}
        height={80}
        alt="Website Logo"
        className={styles.logo}
      />
      <div className={styles.links}>
        <Link href='/home' className={styles.link}>Home</Link>

        {user ? 
          <>
            <Link href='/home/account' className={styles.link}>Account</Link>
            <Link href='/logout' className={styles.link}>Logout</Link>
          </>
        :
          <>
            <Link href='/login' className={styles.link}>Login</Link>
          </>
        }
      </div>
    </div>
  );
}

export { NavBar };
