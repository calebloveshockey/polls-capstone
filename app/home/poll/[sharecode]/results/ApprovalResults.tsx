"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, FilledInput, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle } from '@mui/icons-material';
import { castVote, changePassword, createPoll, getPollData, getUserData, getApprovalVotes} from '@/actions/actions';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';

interface ShowVoteProps {
    shareCode: string;
}

export default function ApprovalResults({ shareCode }: ShowVoteProps) {

    const [showPoll, setShowPoll] = useState(false);
    const [voteData, setVoteData] = useState({voters: 0, votes: [{option_name: "None", numVotes: 0, votePercentage: 0}]});

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
                }}>
                    {voteData.votes.map( (option, i) => (
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: '20% 80%',
                            justifyItems: 'start',
                            width: '100%',
                            marginTop: '10px',
                            marginBottom: '5px',
                        }} key={option.option_name}>
                            <Box sx={{
                                fontWeight: 'bold',
                                fontSize: '20px',
                                gridColumn: '1/2',
                                margin: '10px',
                                justifySelf: 'end',
                            }}>
                                {option.option_name}
                            </Box>
                            <Box sx={{
                                fontSize: '15px',
                                gridColumn: '2/3',
                                minWidth: "10%",
                                width: option.votePercentage+"%",
                                backgroundColor: (option.numVotes > 0) ? `rgb(var(--poll-color-${(option.option_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10) + 1}))` : "",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                whiteSpace: 'nowrap',
                            }}>
                                {option.votePercentage + "%" + " (" + option.numVotes + ")"}
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
