"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, FilledInput, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle } from '@mui/icons-material';
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


    return (
        <>
                {pollType === "Traditional" &&  <TradResults shareCode={shareCode}/> }
                {pollType === "Ranked" && <RankedResults shareCode={shareCode}/>}
                {pollType === "Approval" && <ApprovalResults shareCode={shareCode}/>}

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
