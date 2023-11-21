"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, FilledInput, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle } from '@mui/icons-material';
import { castTradVote, getPollData, getUserData} from '@/actions/actions';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';

interface PollVoterProps {
    shareCode: string;
}

export default function TradVoter({ shareCode }: PollVoterProps) {
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
                    setSelectedOption(data.options[0].option_id)
                    setShowPoll(true);
                }else{
                    console.error("Error on server retrieving poll data.")
                }

            } catch (error) {
                setError(JSON.stringify(error));
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

        const res = await castTradVote(pollData.poll_id, selectedOption);

        if(res.status === "SUCCESS"){
            // Move to results page
            goToResults();
        }else if(res.status === "ERROR" && res.error){
            setError(res.error);
        }else{
            setError("Vote failed to cast.");
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
                    color: 'red',
                    fontWeight: 'bold',
                }}>
                    {error ? error : ""}
                </Box>

                <Box className={styles.bottomButtonContainer}>
                    <Button
                        className={styles.bottomButton}
                        onClick={vote}
                        variant="contained"
                    >Vote</Button>

                    <Button
                        className={styles.bottomButton}
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

export { TradVoter };
