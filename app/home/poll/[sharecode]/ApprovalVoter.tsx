"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, Checkbox, FilledInput, FormControl, FormControlLabel, FormGroup, IconButton, InputAdornment, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle } from '@mui/icons-material';
import { castVote, changePassword, createPoll, getPollData, getUserData} from '@/actions/actions';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';

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


    // Retrieve poll data
    useEffect( () => {
        const fetchData = async () => {
            try {
                // GET DATA
                const data = await getPollData(shareCode);

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
                    console.error("Error on server retrieving poll data.")
                }

            } catch (error) {
                console.error('Error retrieving poll data:', error);
            }
        };
        
        fetchData();
    }, []);


    const vote = async () => {
        console.log("Casting vote");

        // Get the list of selected option ids
        const selectedOptionIds = Object.keys(options).filter((optionId: string) => options[parseInt(optionId, 10)].selected);

        // Create an array of promises for parallel execution
        const votePromises = selectedOptionIds.map((optionId: string) => castVote(pollData.poll_id, optionId));

        // Wait for all promises to resolve
        const results = await Promise.all(votePromises);

        // Check if all votes were successful
        if (results.every((res) => res.status === "SUCCESS")) {
            // Move to results page
            goToResults();
        }else{
            console.log("voting failed");
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

export { ApprovalVoter };
