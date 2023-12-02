"use client"

import { Box, Button, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import styles from './page.module.css'
import { useRouter } from 'next/navigation';
import { getAllPolls, getPolls } from "@/actions/actions";

interface Poll{
    id: number;
    question: string;
    type: string;
    username: string;
    numResponses: number;
    create_date: string;
    close_date: string;
    shareCode: string;
}

export default function AdminPollsList() {
    const router = useRouter();

    const [polls, setPolls] = useState<Poll[]>([]);
    const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]); 
    const [searchTerm, setSearchTerm] = useState(""); 


    const [isError, setIsError] = useState(false);
    const [errorText, setErrorText] = useState<string>("");

    const columns: GridColDef[] = [
        { field: 'question', headerName: 'Question', flex: 1 },
        { field: 'type', headerName: 'Type', width: 120 },
        { field: 'username', headerName: "User", width: 150 },
        { field: 'numResponses', headerName: "Responses", width: 150, align: 'center'},
        { field: 'create_date', headerName: "Date Opened", width: 165},
        { field: 'close_date', headerName: "Date Closed", width: 160}
    ];

    // Retrieve polls
    useEffect( () => {
        setIsError(false);
        setErrorText("");

        const fetchData = async () => {
            try{
                // GET DATA
                const data = await getAllPolls();

                // PROCESS DATA
                if(data.status === "SUCCESS" && data.polls){
                    const transformedData = data.polls.map((poll, index) => ({
                        id: index,
                        question: poll.question,
                        type: poll.type,
                        username: poll.username,
                        numResponses: poll.numResponses,
                        create_date: formatToDate(poll.create_date),
                        close_date: formatToDate(poll.close_date),
                        shareCode: poll.share_link
                    }));
                    setPolls(transformedData);
                    setFilteredPolls(transformedData); 
                }else if(data.error){
                    setIsError(true);
                    setErrorText(data.error);
                }else{
                    setIsError(true);
                    setErrorText("Unknown error occurred in client trying to retrieve your polls.")
                }
            }catch(error){
                setIsError(true);
                setErrorText("Unknown error occurred trying to retrieve your polls.");
            }
        };

        fetchData();
    }, []);

    // Take string date from DB and convert into 'Oct 12, 2022' Format
    function formatToDate(str: string){
        const date = new Date(str);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString("en-US", options);
    }

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value.toLowerCase());
    };

    // Filter polls whenever polls or searchTerm changes
    useEffect(() => {
        const filtered = polls.filter(poll => 
            poll.question.toLowerCase().includes(searchTerm) || 
            poll.type.toLowerCase().includes(searchTerm) ||
            poll.username.toLowerCase().includes(searchTerm)
        );
        setFilteredPolls(filtered);
    }, [polls, searchTerm]);

    // Route to users details page
    const handleRowClick = (params: any) => {
        router.push(`/home/poll/${params.row.shareCode}`);
    }

    // Take user to poll creation page
    function goToCreate(){
        router.push('/home/create-poll');
    }

    return(
        <Box sx={{
            width: '100%',
        }}>
            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                height: '56px',
                marginBottom: '30px',
                marginLeft: '5px',
            }}>
                <TextField
                    label="Search Polls"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    onChange={handleSearchChange}
                />
                <Button
                    sx={{
                        height:'100%',
                        margin: '16px',
                    }}
                    onClick={goToCreate}
                    variant="contained"
                >
                    Create new poll
                </Button>
            </Box>
            {isError && <div className={styles.errorText}>Error: {errorText}</div>}

            <Box sx={{
                maxWidth: '100vw',
                overflow: 'auto',
            }}>
                <div style={{width: '1100px'}}>
                    <DataGrid
                        sx={{
                            boxShadow: 5,
                            border: 2,
                            borderColor: 'primary.light',
                            '& .MuiDataGrid-cell:hover': {
                            color: 'primary.main',
                            },
                            '& .MuiDataGrid-columnHeader': {
                                backgroundColor: 'lightgray',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            },
                        }}
                        rows={filteredPolls}
                        onRowClick={handleRowClick}
                        columns={columns}
                        pagination
                    />
                </div>
            </Box>
        </Box>
    );
}

export { AdminPollsList };