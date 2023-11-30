"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, FilledInput, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle, CopyAll, ArrowBack, Check } from '@mui/icons-material';
import { getPollType } from '@/actions/actions';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import TradVotes, { TradResults } from './TradResults';
import RankedResults from './RankedResults';
import ApprovalResults from './ApprovalResults';
import Discussion from '@/components/Discussion';


interface ShowVoteProps {
    shareCode: string;
}

export default function ShowVotes({ shareCode }: ShowVoteProps) {
    const router = useRouter();

    const [pollType, setPollType] = useState("");

    // Retrieve poll type
    useEffect( () => {
        const fetchData = async () => {
            try {
                // GET DATA
                const data = await getPollType(shareCode);

                if(data.status === "SUCCESS"){
                    setPollType(data.pollType);
                }else{
                    console.error("Error on server retrieving poll type.")
                }

            } catch (error) {
                console.error('Error retrieving poll type:', error);
            }
        };
        
        fetchData();
    }, []);

    // State for animation
    const [isAnimating, setIsAnimating] = useState(false);
    const [showCopy, setShowCopy] = useState(true);

    const returnToPoll = () => {
        let currentUrl = window.location.href;
        // Remove the /results from the url if it exists
        currentUrl = currentUrl.replace(/\/results$/, '');
        router.push(currentUrl);

    }

    const copyUrlToClipboard = () => {
        let currentUrl = window.location.href;

        // Remove the /results from the url if it exists
        currentUrl = currentUrl.replace(/\/results$/, '');

        navigator.clipboard.writeText(currentUrl)
        .then(() => {
            console.log('URL copied to clipboard:', currentUrl);
        })
        .catch((error) => {
            console.error('Error copying URL to clipboard:', error);
        });

        // Change button icon with animation
        setIsAnimating(true);
        setTimeout(() => setShowCopy(false), 250);
        setTimeout(() => setShowCopy(true), 1250);
        setTimeout(() => setIsAnimating(false), 2000);
    };


    return (
        <>
                {pollType === "Traditional" &&  <TradResults shareCode={shareCode}/> }
                {pollType === "Ranked" && <RankedResults shareCode={shareCode}/>}
                {pollType === "Approval" && <ApprovalResults shareCode={shareCode}/>}
                
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    '@media (max-width: 600px)': {
                        flexDirection: 'column',
                    },
                    marginTop: '20px',
                    gap: '5px',
                }}>
                    <Button
                        sx={{
                            fontSize: '15px',
                        }}
                        className={styles.bottomButtons}
                        variant='contained'
                        onClick={returnToPoll}                    
                    >
                        <ArrowBack sx={{marginRight: '3px'}}/>
                        Return to poll
                    </Button>
                    <Button
                        sx={{
                            fontSize: '15px',
                            position: 'relative',
                            paddingRight: '10px',
                            '--button-bg': '#1976d2',
                            '&:hover': {
                                '--button-bg': '#1565c0',
                            }
                        }}
                        className={styles.bottomButtons}
                        variant='contained'
                        onClick={copyUrlToClipboard}                    
                    >
                        <div className={styles.shareButtonText}>
                            { isAnimating ? "Copied!" : "Share this poll"}   
                        </div>
                        <div className={styles.iconsContainer}>
                            { showCopy 
                                ? <CopyAll className={styles.CopyAllIcon}/> 
                                : <Check className={styles.CheckIcon}/>
                            }
                            <div className={`${styles.curtain} ${isAnimating ? styles.slideCurtain : ''}`}></div>
                        </div>
                    </Button>
                </Box>



                <Box sx={{
                    borderTop: '2px solid black',
                    marginTop: '30px',
                    width: '80%'  
                }}>
                    <Discussion shareCode={shareCode}/>
                </Box>
        </>
    );
}

export { ShowVotes };
