"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, FilledInput, FormControl, IconButton, InputAdornment, InputLabel, Link, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close, RemoveCircle, AddCircle } from '@mui/icons-material';
import { changePassword, createPoll, getUserData} from '@/actions/actions';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import ReactiveButton from '@/components/reactiveButton';

export default function CreatePoll() {
    const router = useRouter();

    // Form data
    const [question, setQuestion] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("Traditional");
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [options, setOptions] = useState(["", ""]);

    // User feedback
    const [error, setError] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [infoMessage, setInfoMessage] = useState<string>("");
    const [processing, setProcessing] = useState<boolean>(false);

    const handleQuestion = (newValue: SetStateAction<string>) => {
        setQuestion(newValue);
    }

    const handleDescription = (newValue: SetStateAction<string>) => {
        setDescription(newValue);
    }

    const handleTypeChange = (event: SelectChangeEvent) => {
        setType(event.target.value);
    }


    // Interacting with Options

    const handleOptionText = (newValue: string, index: number) => {
        var newOptions = [...options];
        newOptions[index] = newValue;
        setOptions(newOptions);
    }

    const addOption = () => {
        setOptions([...options, ""]);
    }

    const removeOption = (index: number) => {
        if(options.length > 2){
            var newOptions = [...options];
            newOptions.splice(index, 1);
            setOptions(newOptions);
        }
    }


    const publishPoll = async () => {
        setProcessing(true);
        setError(false);
        setInfoMessage("");

        // Check that none of the inputs were left empty:
        if(question !== "" && endDate !== null){
            // Format time field to a string
            const formattedTimestamp = endDate.format('YYYY-MM-DD HH:mm:ss');
            
            const res = await createPoll(
                question,
                description,
                type,
                formattedTimestamp,
                options,
            );

            if(res.status === "SUCCESS"){
                // Move to the poll page
                setSuccess(true);
                router.push("/home/poll/" + res.shareCode);
            }else{
                setError(true);
                setInfoMessage("Failed to create poll.");
            }
        }else{
            setError(true)
            setInfoMessage("Do not leave any inputs empty.");
        }

        setProcessing(false);
    }


    return (
        <>
            <div className={styles.header}>New Poll</div> 

            <Box sx={{
                border: "0px solid red",
            }} className={styles.fieldBox}>
                <Box sx={{
                    border: "0px solid blue",
                }} className={styles.fieldLabel}>
                    Question:
                </Box>
                <Box sx={{
                    border: "0px solid pink",
                }} className={styles.field}>
                    <TextField
                        value={question}
                        onChange={(event) => handleQuestion(event.target.value)}
                        variant="filled"
                        className={styles.textInput}
                    />
                </Box>
            </Box>

            <Box sx={{
                border: "0px solid red",
            }} className={styles.fieldBox}>
                <Box sx={{
                    border: "0px solid blue",
                }} className={styles.fieldLabel}>
                    Description:
                </Box>
                <Box sx={{
                    border: "0px solid pink",
                }} className={styles.field}>
                    <TextField
                        value={description}
                        onChange={(event) => handleDescription(event.target.value)}
                        variant="filled"
                        className={styles.textInput}
                    />
                </Box>
            </Box>

            <Box sx={{
                border: "0px solid red",
            }} className={styles.fieldBox}>
                <Box sx={{
                    border: "0px solid blue",
                }} className={styles.fieldLabel}>
                    Type:
                </Box>
                <Box sx={{
                    border: "0px solid pink",
                }} className={styles.field}>
                    <FormControl variant="filled" sx={{ minWidth: 150 }}>
                        <Select
                            labelId="poll-type"
                            id="poll-type"
                            value={type}
                            onChange={handleTypeChange}
                        >
                            <MenuItem value={"Traditional"}>Traditional</MenuItem>
                            <MenuItem value={"Ranked"}>Ranked</MenuItem>
                            <MenuItem value={"Approval"}>Approval</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <Box sx={{
                border: "0px solid red",
            }} className={styles.fieldBox}>
                <Box sx={{
                    border: "0px solid blue",
                }} className={styles.fieldLabel}>
                    End Date:
                </Box>
                <Box sx={{
                    border: "0px solid pink",
                }} className={styles.field}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker 
                            value={endDate}
                            onChange={(newValue) => setEndDate(newValue)}
                        />
                    </LocalizationProvider>
                </Box>
            </Box>

            <Box sx={{fontSize: "20px", margin: "10px", fontWeight: "600"}}>Options:</Box>


            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}>

                {options.map((opt, index) => (
                    <Box sx={{
                        margin: "5px",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                        key={index}
                    >
                        <TextField
                            value={options[index]}
                            label={"Option " + (index+1)}
                            onChange={(event) => handleOptionText(event.target.value, index)}
                            variant="filled"
                            className={styles.optionText}
                        />
                        <IconButton
                            onClick={() => removeOption(index)}
                        >
                            <RemoveCircle
                                sx={{
                                    color: "red",
                                }}
                            />
                        </IconButton>

                    </Box>
                ))}

                <IconButton
                    onClick={addOption}
                >
                    <AddCircle
                        sx={{
                            color: "green",
                        }}
                        fontSize={"large"}
                    />
                </IconButton>
            </Box>

            <Box sx={{
                marginTop: "40px",
            }}>
                <ReactiveButton
                    text="PUBLISH"
                    isSuccess={success}
                    isProcessing={processing}
                    onClick={publishPoll}
                />
            </Box>

            <Box sx={{
                marginTop: '10px',
                color: error ? 'red' : 'black',
            }}>
                {infoMessage}
            </Box>


        </>
    );
}

export { CreatePoll };
