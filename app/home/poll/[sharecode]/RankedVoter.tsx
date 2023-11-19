"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, FilledInput, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle } from '@mui/icons-material';
import { castRankedVote, castVote, changePassword, createPoll, getPollData, getUserData} from '@/actions/actions';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';

interface PollVoterProps {
    shareCode: string;
}

export default function RankedVoter({ shareCode }: PollVoterProps) {
    const router = useRouter();

    const [showPoll, setShowPoll] = useState(false);
    const [pollData, setPollData] = useState({
        poll_id: "",
        question: "",
        description: "",
        type: "",
        close_date: "",
        options: [{id: "", name: ""}],
    });
    const [options, setOptions] = useState([{option_id: 0, option_name: ""}]);
    const [rankings, setRankings] = useState<{ [key: string]: { option_id: string; ranking: number } }>({});

    const [error, setError] = useState<string | null>(null);


    // Retrieve poll data
    useEffect( () => {
        const fetchData = async () => {
            try {
                // GET DATA
                const data = await getPollData(shareCode);

                if(data.status === "SUCCESS"){
                    setPollData(data.pollData);
                    setOptions(data.options);
                    setShowPoll(true);
                }else{
                    console.error("Error on server retrieving poll data.")
                }

            } catch (error) {
                console.error('Error retrieving poll data:', error);
            }
        };
        
        fetchData();
    }, []);


    const handleRankingChange = (optionId: number, value: string) => {
        setError(null);
        const parsedValue = parseInt(value, 10);
        if (!isNaN(parsedValue) && parsedValue > 0) {
            const newRankings = { ...rankings, [optionId]: { option_id: optionId, ranking: parsedValue } };
            setRankings(newRankings);
        } else {
            setError("Invalid ranking. Please enter a positive number.");
        }
    };

    const vote = async () => {
        console.log("Casting vote");

        const rankingValues = Object.values(rankings);

        // Check for duplicates and valid rankings
        if (
            new Set(rankingValues.map((r) => r.ranking)).size !== rankingValues.length ||
            !rankingValues.every((r) => r.ranking >= 1)
        ) {
            setError("Invalid rankings. Ensure each ranking is unique and starts from 1 without skips.");
            return;
        }

        const votePromises = rankingValues.map((r) => castRankedVote(pollData.poll_id, r.option_id, r.ranking));

        try {
            // Wait for all promises to resolve
            await Promise.all(votePromises);
            // Move to results page
            goToResults();
        } catch (error) {
            console.error("Voting failed:", error);
        }

    };

    const goToResults = () => {
        router.push("/home/poll/" + shareCode + "/results");
    };

    return (
        <>

        {showPoll ? 
            <>
                <Box sx={{
                    margin: "20px",
                    fontSize: "20px",
                    fontWeight: "500",
                }}>
                    {pollData.question}
                </Box>

                <Box sx={{
                    margin: "20px",
                    marginTop: "0px",
                    fontSize: "15px",
                }}>
                    {pollData.description}
                </Box>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                }}>
  
                    {options.map((opt) => (
                        <TextField
                            sx={{
                                margin: '5px',
                            }}
                            key={opt.option_id}
                            label={opt.option_name}
                            variant="outlined"
                            type="number"
                            InputProps={{
                                inputProps: { min: 1 },
                            }}
                            onChange={(e) => handleRankingChange(opt.option_id, e.target.value)}
                            error={error !== null}
                        />
                    ))}

                </Box>

                <Box sx={{
                    color: 'red',
                    fontWeight: 'bold',
                }}>
                    {error ? error : ""}
                </Box>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                }}>
                    <Button
                        sx={{
                            marginTop: "40px",
                            fontSize: "20px",
                        }}
                        onClick={vote}
                        variant="contained"
                    >Vote</Button>

                    <Button
                        sx={{
                            marginTop: "40px",
                            fontSize: "20px",
                        }}
                        onClick={goToResults}
                        variant="contained"
                    >View Results</Button>                  
                </Box>
            </>
        :
            <>
                <div>Poll is not available.</div>
            </>
        }


        </>
    );
}

export { RankedVoter };
