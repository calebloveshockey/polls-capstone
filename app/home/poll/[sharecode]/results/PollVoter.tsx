"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, FilledInput, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle } from '@mui/icons-material';
import { castVote, changePassword, createPoll, getPollData, getUserData, getVotes} from '@/actions/actions';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';

interface ShowVoteProps {
    shareCode: string;
}

export default function ShowVotes({ shareCode }: ShowVoteProps) {
    const router = useRouter();

    const [showPoll, setShowPoll] = useState(false);
    const [voteData, setVoteData] = useState([{option_name: "None", numVotes: 0}]);


    // Retrieve poll data
    useEffect( () => {
        const fetchData = async () => {
            try {
                // GET DATA
                const data = await getVotes(shareCode);

                if(data[0].option_name !== "None"){
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
                    borderTop: '2px solid black',
                    marginTop: '30px',
                }}>
                    DISCUSSION SECTION HERE
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

export { ShowVotes };
