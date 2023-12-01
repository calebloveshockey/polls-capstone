"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, Checkbox, FilledInput, FormControl, FormControlLabel, FormGroup, IconButton, InputAdornment, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField, Tooltip, Typography } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle, Help } from '@mui/icons-material';
import { castApprovalVote, getPollData, getUserData} from '@/actions/actions';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import ReactiveButton from '@/components/ReactiveButton';
import React from 'react';

interface PollVoterProps {
    shareCode: string;
}

interface Option {
    option_id: number;
    option_name: string;
    selected: boolean;
}

export default function ApprovalVoter({ shareCode }: PollVoterProps) {
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

    const [options, setOptions] = useState<{[key:number]: Option} >({});

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
                    setOptions(data.options);

                    // Initialize options object with selected state set to false for each option
                    const initialOptionsState: {[key:number]: Option} = {};
                    data.options.forEach((opt) => {
                        initialOptionsState[opt.option_id] = {
                            option_id: opt.option_id,
                            option_name: opt.option_name,
                            selected: false,
                        };
                    });
                    setOptions(initialOptionsState);
                    setShowPoll(true);
                }else{
                    setIsError(true);
                    setErrorText("Failed to retrieve poll.");
                }

            } catch (error) {
                setIsError(true);
                setErrorText("Unknown error occurred while retriving poll data.");
                console.error('Error retrieving poll data:', error);
            }
        };
        
        fetchData();
    }, []);


    const vote = async () => {
        setIsError(false);
        setErrorText("");

        // Get the list of selected option ids
        const selectedOptionIds = Object.keys(options).filter((optionId: string) => options[parseInt(optionId, 10)].selected);

        setIsVoteProcessing(true);
        // Create an array of promises for parallel execution
        const votePromises = selectedOptionIds.map((optionId: string) => castApprovalVote(pollData.poll_id, optionId));

        // Wait for all promises to resolve
        const results = await Promise.all(votePromises);

        // Check if all votes were successful
        if (results.every((res) => res.status === "SUCCESS")) {
            setIsVoteSuccessful(true);
            // Move to results page
            goToResults();
        }else{
            setIsError(true);
            setErrorText("Vote failed to cast.");
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
                                <Typography color="inherit">Approval Voting:</Typography>
                                {'Select any number of options you approve of. The option receiving the highest overall approval wins.'}
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

                }}>
                    <FormGroup>
                        {Object.values(options).map( (opt) => (
                            <FormControlLabel 
                                key = {opt.option_id}
                                control= {
                                    <Checkbox
                                        checked={opt.selected}
                                        onChange={() => {
                                            const updatedOptions = { ...options };
                                            updatedOptions[opt.option_id].selected = !opt.selected;
                                            setOptions(updatedOptions);
                                        }}
                                    />
                                } 
                                label={opt.option_name} 
                            />
                        ))}
                    </FormGroup>

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

export { ApprovalVoter };
