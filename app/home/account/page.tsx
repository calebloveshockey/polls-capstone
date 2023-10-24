import AccountManagement from './AccountManagement';
import styles from './page.module.css'
import Link from 'next/link';

export default function AccountPage() {

  return (
    <div className={styles.accountContent}>
      <AccountManagement/>
    </div>
  )
}
