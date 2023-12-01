import { Box } from '@mui/material';
import styles from './page.module.css'
import UsersList from './UsersList';

export default function Users() {

  return (
    <div className={styles.usersContent}>
      <Box sx={{
        fontSize: '20px',
        fontWeight: 'bold',
        borderBottom: '2px solid black',
        marginBottom: '20px',
      }}>Users</Box>
      <UsersList/>
    </div>
  )
}
