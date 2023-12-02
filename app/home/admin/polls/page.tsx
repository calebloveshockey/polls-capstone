import { Box } from '@mui/material';
import styles from './page.module.css'
import AdminPollsList from './AdminPollsList';
export default function Users() {

  return (
    <div className={styles.pollsContent}>
      <Box sx={{
        fontSize: '20px',
        fontWeight: 'bold',
        borderBottom: '2px solid black',
        marginBottom: '20px',
      }}>Polls</Box>
      <AdminPollsList/>
    </div>
  )
}
