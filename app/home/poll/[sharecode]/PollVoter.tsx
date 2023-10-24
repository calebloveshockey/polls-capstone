"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, FilledInput, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle } from '@mui/icons-material';
import { castVote, changePassword, createPoll, getPollData, getUserData} from '@/actions/actions';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';

interface PollVoterProps {
    shareCode: string;
}

export default function PollVoter({ shareCode }: PollVoterProps) {
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

    const [selectedOption, setSelectedOption] = useState("default");


    // Retrieve poll data
    useEffect( () => {
        const fetchData = async () => {
            try {
                // GET DATA
                const data = await getPollData(shareCode);

                if(data.status === "SUCCESS"){
                    setPollData(data.pollData);
                    setOptions(data.options);
                    setSelectedOption(data.options[0].option_id)
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


    const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedOption((event.target as HTMLInputElement).value);
    };

    const vote = async () => {
        console.log("Casting vote");

        const res = await castVote(pollData.poll_id, selectedOption);

        if(res.status === "SUCCESS"){
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
                }}>
                    {pollData.question}
                </Box>

                <Box sx={{

                }}>
                    <FormControl>
                        <RadioGroup
                            name="poll-options"
                            value={selectedOption}
                            onChange={handleOptionChange}
                        >
                            {options.map((opt) => (
                                <FormControlLabel 
                                    key={opt.option_id}
                                    value={opt.option_id} 
                                    control={<Radio/>} 
                                    label={opt.option_name} 
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>

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

                <Box sx={{
                    borderTop: '2px solid black',
                    marginTop: '30px',
                }}>
                    DISCUSSION SECTION HERE
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

export { PollVoter };
