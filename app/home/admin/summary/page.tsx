'use client'

import { Box, Button } from '@mui/material';
import styles from './page.module.css'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSummaryStats } from '@/actions/actions';

interface Stats{
    numUsers: number;
    numPolls: number;
    numVotes: number;
}

export default function SummaryStats() {
    const router = useRouter();

    const [stats, setStats] = useState<Stats>();

    const [isError, setIsError] = useState(false);
    const [errorText, setErrorText] = useState<string>("");

    // Retrieve stats
    useEffect( () => {
        setIsError(false);
        setErrorText("");

        const fetchData = async () => {
            try{
                // GET DATA
                const data = await getSummaryStats();

                // PROCESS DATA
                if(data.status === "SUCCESS" && data.stats){
                    setStats(data.stats);
                }else if(data.error){
                    setIsError(true);
                    setErrorText(data.error);
                }else{
                    setIsError(true);
                    setErrorText("Unknown error occurred in client trying to retrieve summary stats.")
                }
            }catch(error){
                setIsError(true);
                setErrorText("Unknown error occurred trying to retrieve summary stats.");
            }
        };

        fetchData();
    }, []);

    function goToUsers(){
        router.push('/home/admin/users');
    }
    function goToPolls(){
        router.push('/home/admin/polls');
    }

  return (
    <div className={styles.pollsContent}>
        <Box sx={{
            fontSize: '20px',
            fontWeight: 'bold',
            borderBottom: '2px solid black',
            marginBottom: '20px',
        }}>Site Summary Stats</Box>

        {isError && <div className={styles.errorText}>Error: {errorText}</div>}

        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
        }}>
            <Box className={styles.statRow}>
                <Box className={styles.stat}>
                    <Box sx={{
                        fontWeight: 'bold'
                    }}>Number of Users: </Box>
                    {stats?.numUsers}
                </Box>
                <Button
                    variant='contained'
                    onClick={goToUsers}
                >See all Users</Button>
            </Box>

            <Box className={styles.statRow}>
                <Box className={styles.stat}>
                    <Box sx={{
                        fontWeight: 'bold'
                    }}>Number of Polls: </Box>
                    {stats?.numPolls}
                </Box>
                <Button
                    className={styles.linkButtons}
                    variant='contained'
                    onClick={goToPolls}
                >See all Polls</Button>
            </Box>

            <Box className={styles.stat}>
                <Box sx={{
                    fontWeight: 'bold'
                }}>Number of Votes Counted: </Box>
                {stats?.numVotes}
            </Box>
            
        </Box>
    </div>
  )
}
