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

    const copyUrlToClipboard = () => {
        let currentUrl = window.location.href; // Get the current URL

        // Remove the /results from the url if it exists
        currentUrl = currentUrl.replace(/\/results$/, '');

        navigator.clipboard.writeText(currentUrl) // Copy the URL to clipboard
          .then(() => {
            console.log('URL copied to clipboard:', currentUrl);
          })
          .catch((error) => {
            console.error('Error copying URL to clipboard:', error);
          });
      };


    return (
        <>
                {pollType === "Traditional" &&  <TradResults shareCode={shareCode}/> }
                {pollType === "Ranked" && <RankedResults shareCode={shareCode}/>}
                {pollType === "Approval" && <ApprovalResults shareCode={shareCode}/>}

                <Box sx={{
                    display: 'flex',
                }}>
                    <TextField
                        sx={{
                            marginTop: "40px",
                        }}
                        fullWidth
                        label="Share the poll"
                        variant="outlined"
                        value={window.location.href}
                        InputProps={{
                            readOnly: true, // Make the input read-only
                            endAdornment: (
                            <InputAdornment position="end">
                                {/* Add a button to copy the URL to clipboard */}
                                <Button onClick={copyUrlToClipboard}>Copy</Button>
                            </InputAdornment>
                            ),
                        }}
                    />
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
