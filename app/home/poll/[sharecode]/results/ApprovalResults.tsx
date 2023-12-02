"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, FilledInput, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle } from '@mui/icons-material';
import { getApprovalVotes} from '@/actions/actions';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';

interface ShowVoteProps {
    shareCode: string;
    colorIndex: number;
}

export default function ApprovalResults({ shareCode, colorIndex }: ShowVoteProps) {

    const [showPoll, setShowPoll] = useState(false);
    const [voteData, setVoteData] = useState({
        question: "",
        description: "",
        voters: 0, 
        votes: [{option_name: "None", numVotes: 0, votePercentage: 0}]
    });

    // Retrieve poll data
    useEffect( () => {
        const fetchData = async () => {
            try {
                // GET DATA
                const data = await getApprovalVotes(shareCode);
                console.log(data);

                if(data.votes[0].option_name !== "None"){
                    setVoteData(data);
                    setShowPoll(true);
                }else{
                    console.error("Error on server retrieving votes.")
                }

            } catch (error) {
                console.error('Error retrieving votes:', error);
            }
        };
        
        fetchData();
    }, []);


    return (
        <>

        {showPoll ? 
            <>
                <Box sx={{
                    width: '90%',
                    '@media (max-width: 700px)': {
                        width: '100%',
                        padding: '0px 5px 0px 5px'
                    },
                }}>
                    <Box className={styles.questionTitle}>
                        {voteData.question}
                    </Box>

                    <Box className={styles.descriptionTitle}>
                        {voteData.description}
                    </Box>

                    {voteData.votes.map( (option, i) => (
                        <Box 
                            className={styles.resultRowContainer}
                            key={option.option_name}
                        >
                            <Box className={styles.rowTitle}>
                                {option.option_name}
                            </Box>
                            <Box sx={{
                                width: option.votePercentage+"%",
                            }}>
                                <Box sx={{
                                    backgroundColor: (option.numVotes > 0) ? `rgb(var(--poll-color-${(i + colorIndex - 1) % 10 + 1}))` : "",
                                }} className={styles.rowBar}>
                                    {(option.numVotes > 0) ? (option.votePercentage + "%" + " (" + option.numVotes + ")") : ("-")}
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>

                <Box sx={{
                    marginTop: '20px',
                    fontSize: '18px',
                    fontWeight: '500',
                }}>
                    Number of Voters: {voteData.voters}
                </Box>

            </>
        :
            <>
                <div>Data is not available.</div>
            </>
        }


        </>
    );
}

export { ApprovalResults };
