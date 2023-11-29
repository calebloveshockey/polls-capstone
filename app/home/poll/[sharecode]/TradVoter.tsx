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
import ReactiveButton from '@/components/reactiveButton';

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
                    setSelectedOption(data.options[0].option_id)
                    setShowPoll(true);
                }else{
                    setIsError(false);
                    setErrorText("Unable to retrieve poll data.");
                }

            } catch (error) {
                setIsError(true);
                setErrorText("An unknown error occurred when attempting to retrieve poll data.");
                console.error('Error retrieving poll data:', error);
            }
        };
        
        fetchData();
    }, []);


    const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedOption((event.target as HTMLInputElement).value);
    };

    const vote = async () => {
        setIsError(false);
        setErrorText("");
        setIsVoteProcessing(true);

        const res = await castTradVote(pollData.poll_id, selectedOption);

        if(res.status === "SUCCESS"){
            setIsVoteSuccessful(true);
            // Move to results page
            goToResults();
        }else if(res.status === "ERROR" && res.error){
            setIsError(true);
            setErrorText(res.error);
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

export { TradVoter };
