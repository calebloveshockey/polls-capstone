import Image from 'next/image'
import styles from './page.module.css'
import Link from 'next/link';
import Box from '@mui/material/Box';

export default function Home() {

  return (
    <div className={styles.homeContent}>
      <Box
        sx={{
          fontSize: '40px',
          fontWeight: 'bold',
          margin: '20px 0px 20px 0px',
          '@media (max-width: 1000px)': {
            width: '100%',
            textAlign: 'left',
          },
        }}
      >
        Welcome to Caleb's Capstone project. 
      </Box>
      <Box
        sx={{
          fontSize: '20px',
          maxWidth: '1000px',
          margin: '20px 0px 20px 0px',
        }}
      >
        You can use this site to create and share polls using a variety of different voting systems, rather than just a traditional tally or "first past the post" system. Try it out now!
      </Box>
      <Link href="/home/create-poll" className={styles.createButton}>Create a poll</Link>
    </div>
  )
}
