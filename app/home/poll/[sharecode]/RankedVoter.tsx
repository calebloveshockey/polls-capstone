"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, FilledInput, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle, FullscreenExitRounded } from '@mui/icons-material';
import { castRankedVote, getPollData, getUserData} from '@/actions/actions';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import ReactiveButton from '@/components/reactiveButton';

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
    const [options, setOptions] = useState([{option_id: "0", option_name: ""}]);
    const [rankings, setRankings] = useState<{ [key: string]: { option_id: string; ranking: number } }>({});

    const [isError, setIsError] = useState<boolean>(false);
    const [errorText, setErrorText] = useState<string>("");
    const [isVoteProcessing, setIsVoteProcessing] = useState<boolean>(false);
    const [isVoteSuccessful, setIsVoteSuccessful] = useState<boolean>(false);
    const [isResultsProcessing, setIsResultsProcessing] = useState<boolean>(false);

    // Retrieve poll data
    useEffect( () => {
        const fetchData = async () => {
            setIsError(false);
            setErrorText("");
            try {
                // GET DATA
                const data = await getPollData(shareCode);

                // PROCESS DATA
                if(data.status === "SUCCESS"){
                    setPollData(data.pollData);
                    setOptions(data.options);
                    setShowPoll(true);
                }else{
                    setIsError(false);
                    setErrorText("Error on server retrieving poll data.")
                }

            } catch (error) {
                setIsError(true);
                setErrorText("An unknown error occurred when attempting to retrieve poll data.");
                console.error('Error retrieving poll data:', error);
            }
        };
        
        fetchData();
    }, []);


    // Ensures a rankings list are valid: ranking starting from 1 and continuing without skipping.
    const checkForValidRanking = (ranks:{ [key: string]: { option_id: string; ranking: number } } ): boolean => {
        const sortedRankings = Object.values(ranks)
            .map((rank) => rank.ranking)
            .sort((a, b) => a - b);

        for (let i = 0; i < sortedRankings.length; i++) {
            if (sortedRankings[i] !== i + 1) {
                return false;
            }
        }
        return true;
    }

    const handleRankingChange = (optionId: string, value: string) => {
        //Ensure input is valid
        const parsedValue = parseInt(value, 10);
        if (!isNaN(parsedValue) && parsedValue > 0) {

            // Create a copy of rankings or initialize it if it's empty
            const newRankings = { ...rankings };

            // Check if the ranking for this optionId already exists
            if (newRankings[optionId]) {
                // Replace the previous ranking
                newRankings[optionId].ranking = parsedValue;
            } else {
                // Add a new ranking
                newRankings[optionId] = { option_id: optionId, ranking: parsedValue };
            }
            
            // Check that new ranking is valid
            if(checkForValidRanking(newRankings)){
                setIsError(false);
                setErrorText("");
                setRankings(newRankings);
            }else{
                setIsError(true);
                setErrorText("Invalid ranking. Please rank the options starting from 1.");
            }
        } else {
            setIsError(true);
            setErrorText("Invalid ranking. Please rank the options starting from 1.");
        }
    };

    const vote = async () => {
        setIsError(false);
        setErrorText("");

        const rankingValues = Object.values(rankings);

        // Check for duplicates and valid rankings
        if (!checkForValidRanking(rankings) || isError) {
            setIsError(false);
            setErrorText("Invalid rankings. Ensure each ranking is unique and starts from 1 without skips.");
            return;
        }

        setIsVoteProcessing(true);
        const votePromises = rankingValues.map((r) => castRankedVote(pollData.poll_id, r.option_id, r.ranking));

        try {
            // Wait for all promises to resolve
            const voteResults = await Promise.all(votePromises);

            // Check if all results have success status
            if(voteResults.every((res) => res.status === "SUCCESS")){
                setIsVoteSuccessful(true);
                // Move to results page
                goToResults();

            }else{
                // Check for individual errors
                const errorResults = voteResults.filter((res) => res.status !== "SUCCESS");
                if(errorResults.length > 0 ){
                    if(errorResults[0].status === "ERROR" && errorResults[0].error){
                        setIsError(true);
                        setErrorText(errorResults[0].error);
                    }else{
                        setIsError(true);
                        setErrorText("Votes failed to cast.");
                    }
                }else{
                    setIsError(true);
                    setErrorText("Votes failed to cast.");
                }
            }

        } catch (error) {
            setErrorText(JSON.stringify(error));
            console.error("Voting failed:", error);
        }
        setIsVoteProcessing(false);
    };

    const goToResults = () => {
        setIsResultsProcessing(!isVoteProcessing);
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
                        <Box 
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                marginRight: '100px',
                            }}
                            key={opt.option_id}
                        >
                            <Box sx={{
                                width: '200px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                marginRight: '5px',

                            }}>{opt.option_name}</Box>
                            <TextField
                                sx={{
                                    margin: '5px',
                                    width: '100px',
                                }}
                                key={opt.option_id}
                                variant="outlined"
                                type="number"
                                InputProps={{
                                    inputProps: { min: 1 },
                                }}
                                onChange={(e) => handleRankingChange(opt.option_id, e.target.value)}
                                error={isError}
                            />
                        </Box>
                    ))}

                </Box>

                <Box sx={{
                    color: 'red',
                    fontWeight: 'bold',
                }}>
                    {isError ? errorText : ""}
                </Box>

                <Box className={styles.bottomButtonContainer}>
                    <ReactiveButton 
                        text={"VOTE"} 
                        isSuccess={isVoteSuccessful} 
                        isProcessing={isVoteProcessing} 
                        onClick={vote}
                    />  

                    <ReactiveButton 
                        text={"VIEW RESULTS"} 
                        isSuccess={false} 
                        isProcessing={isResultsProcessing} 
                        onClick={goToResults}
                    />             
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
