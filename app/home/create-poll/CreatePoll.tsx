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

export default function CreatePoll() {
    const router = useRouter();

    const [question, setQuestion] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("Traditional");
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [options, setOptions] = useState(["", ""]);

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
        console.log("Publishing poll");
        console.log(endDate);

        // Check that none of the inputs were left empty:
        if(question !== "" && description !== "" && endDate !== null){
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
                router.push("/home/poll/" + res.shareCode);
            }else{
                console.log("Create poll failed on server side.");
            }
        }else{
            console.log("Something wrong with the inputs");
        }
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


            <Button
                sx={{
                    marginTop: "40px",
                    fontSize: "20px",
                }}
                onClick={publishPoll}
                variant="contained"
            >PUBLISH</Button>


        </>
    );
}

export { CreatePoll };
