import { Box } from '@mui/material';
import styles from './page.module.css'
import PollsList from './PollsList';
export default function Polls() {

  return (
    <div className={styles.pollsContent}>
      <Box sx={{
        fontSize: '20px',
        fontWeight: 'bold',
        borderBottom: '2px solid black',
        marginBottom: '20px',
      }}>Your Polls</Box>
      <PollsList/>
    </div>
  )
}
