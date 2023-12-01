"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, FilledInput, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField, Tooltip, Typography } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle, FullscreenExitRounded, ArrowCircleDown, ArrowCircleUp, Help } from '@mui/icons-material';
import { castRankedVote, getPollData, getUserData} from '@/actions/actions';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import ReactiveButton from '@/components/reactiveButton';
import React from 'react';

interface PollVoterProps {
    shareCode: string;
}

interface Option{
    option_id: string;
    option_name: string;
    ranking: number;
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
    const [options, setOptions] = useState<Option[]>([]);

    const [isError, setIsError] = useState<boolean>(false);
    const [errorText, setErrorText] = useState<string>("");
    const [isVoteProcessing, setIsVoteProcessing] = useState<boolean>(false);
    const [isVoteSuccessful, setIsVoteSuccessful] = useState<boolean>(false);
    const [isResultsProcessing, setIsResultsProcessing] = useState<boolean>(false);

    const [pollTypeTipOpen, setPollTypeTipOpen] = useState(false);

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

                    // Process options data into options with rankings
                    setOptions(data.options.map( (opt) => {
                        return({
                            option_id: opt.option_id,
                            option_name: opt.option_name,
                            ranking: 0    
                        });
                    }));

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


    // Helper function to order options based on their ranking
    function sortOptions(options: Option[]){
        return options.sort((a, b) => {
            // Both have non-zero rankings
            if (a.ranking !== 0 && b.ranking !== 0) {
                return a.ranking - b.ranking;
            }
            // One of them has a ranking of 0
            else if (a.ranking === 0 && b.ranking !== 0) {
                return 1; // a should come after b
            }
            else if (a.ranking !== 0 && b.ranking === 0) {
                return -1; // a should come before b
            }
            // Both have a ranking of 0
            return 0;
        });
    }


    function upRanking(opt : Option){
        // Cannot go above ranking of 1
        if(opt.ranking === 1){
            return;
        }

        // If no ranking, give lowest ranking
        if(opt.ranking === 0){
            // Get highest current ranking
            const highestRanking = options.reduce((max, o) => 
                (o.ranking > max) ? (o.ranking) : (max), 
                options[0].ranking
            );

            // Find opt in options and update its ranking to highestRanking + 1
            const index = options.findIndex(o => o.option_id === opt.option_id);
            const newOptions = [...options];
            newOptions[index].ranking = highestRanking + 1;
            setOptions(newOptions);
            return;
        }

        // Otherwise, just swap ranking with option above        
        // Get index of this option
        const index = options.findIndex(o => o.option_id === opt.option_id);
        // Get index of option it will be trading places with
        const targetRanking = opt.ranking - 1;
        const targetIndex = options.findIndex(o => o.ranking === targetRanking);
        // Swap rankings
        const newOptions = [...options];
        newOptions[targetIndex].ranking = opt.ranking;
        newOptions[index].ranking = targetRanking;
        setOptions(newOptions);
    }

    function downRanking(opt : Option){
        // Cannot go below ranking of 0
        if(opt.ranking === 0){
            return;
        }

        // If highest rank value, change to 0
        const highestRanking = options.reduce((max, o) => 
            (o.ranking > max) ? (o.ranking) : (max), 
            options[0].ranking
        );
        if(opt.ranking === highestRanking){
            // Find opt in options and update its ranking to highestRanking + 1
            const index = options.findIndex(o => o.option_id === opt.option_id);
            const newOptions = [...options];
            newOptions[index].ranking = 0;
            setOptions(newOptions);
            return;
        }

        // Otherwise, just swap ranking with option below        
        // Get index of this option
        const index = options.findIndex(o => o.option_id === opt.option_id);
        // Get index of option it will be trading places with
        const targetRanking = opt.ranking + 1;
        const targetIndex = options.findIndex(o => o.ranking === targetRanking);

        // Swap rankings
        const newOptions = [...options];
        newOptions[targetIndex].ranking = opt.ranking;
        newOptions[index].ranking = targetRanking;
        setOptions(newOptions);
    }

    // Submit votes
    const vote = async () => {
        setIsError(false);
        setErrorText("");
        setIsVoteProcessing(true);

        // Remove all options left unranked (ranking of 0)
        const rankings = options.filter( (opt) => opt.ranking !== 0);
        const votePromises = rankings.map((r) => castRankedVote(pollData.poll_id, r.option_id, r.ranking));

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
                    <Tooltip
                        title={
                            <React.Fragment>
                                <Typography color="inherit">Ranked Voting:</Typography>
                                {'Rank the options in order of your preference. Utilizes the STV (Single Transferable Vote) system. If no clear winner emerges, the least popular option is eliminated, and their votes are transferred to the next preference. This process repeats until a winner is determined.'}
                            </React.Fragment>
                        }
                        placement="right"
                        onClose={() => setPollTypeTipOpen(false)}
                        open={pollTypeTipOpen}
                        PopperProps={{
                            sx: {...{
                                color: 'rgba(100, 0, 0, 0.87)',
                                maxWidth: 220,
                                fontSize: '15',
                                '.MuiTooltip-tooltip': {
                                    backgroundColor: 'var(--main-blue)'
                                }
                            }}
                        }}
                    >
                        <IconButton
                            sx={{
                                marginLeft: '5px',
                            }}
                            onClick={() => setPollTypeTipOpen(true)}
                        >
                            <Help
                                fontSize='medium'
                                color='info'
                            />
                        </IconButton>
                    </Tooltip>
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
  
                    {sortOptions(options).map((opt) => (
                        <Box 
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
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

                            }}>{opt.option_name}:</Box>

                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '20px',
                                fontWeight: 'bold',
                                fontSize: '20px',
                                width: '30px',

                            }}>{(opt.ranking !== 0) ? opt.ranking : "-"}</Box>

                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                marginLeft: '5px',
                            }}>
                                <IconButton
                                    sx={{padding: '0px'}}
                                    size="small" 
                                    onClick={() => upRanking(opt)}>
                                    <ArrowCircleUp color='success'/>
                                </IconButton>
                                <IconButton 
                                    sx={{padding: '0px'}}
                                    size="small" 
                                    onClick={() => downRanking(opt)}>
                                    <ArrowCircleDown color='error'/>
                                </IconButton>
                            </Box>

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
