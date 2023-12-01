"use client"

import { getAllUsers } from "@/actions/actions";
import { Box, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import styles from './page.module.css'
import { useRouter } from 'next/navigation';

interface User{
    id: number;
    username: string;
    type: string;
}

export default function UsersList() {
    const router = useRouter();

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]); 
    const [searchTerm, setSearchTerm] = useState(""); 


    const [isError, setIsError] = useState(false);
    const [errorText, setErrorText] = useState<string>("");

    const columns: GridColDef[] = [
        { field: 'username', headerName: 'Username', flex: 1 },
        { field: 'type', headerName: 'Type', width: 150 }
    ];

    // Retrieve users
    useEffect( () => {
        setIsError(false);
        setErrorText("");

        const fetchData = async () => {
            try{
                // GET DATA
                const data = await getAllUsers();

                // PROCESS DATA
                if(data.status === "SUCCESS" && data.listOfUsers){
                    const transformedData = data.listOfUsers.map((user, index) => ({
                        id: index,
                        ...user
                    }));
                    setAllUsers(transformedData);
                    setFilteredUsers(transformedData); 
                }else if(data.error){
                    setIsError(true);
                    setErrorText(data.error);
                }else{
                    setIsError(true);
                    setErrorText("Unknown error occurred in client trying to retrieve all users.")
                }
            }catch(error){
                setIsError(true);
                setErrorText("Unknown error occurred trying to retrieve all users.");
            }
        };

        fetchData();
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value.toLowerCase());
    };

    // Filter users whenever allUsers or searchTerm changes
    useEffect(() => {
        const filtered = allUsers.filter(user => 
            user.username.toLowerCase().includes(searchTerm) || 
            user.type.toLowerCase().includes(searchTerm)
        );
        setFilteredUsers(filtered);
    }, [allUsers, searchTerm]);

    // Route to users details page
    const handleRowClick = (params: any) => {
        router.push(`/home/admin/users/${params.row.username}`);
    }

    return(
        <Box sx={{
            maxWidth: '100vw',
            overflow: 'auto',
        }}>
            <TextField
                label="Search Users"
                variant="outlined"
                fullWidth
                margin="normal"
                onChange={handleSearchChange}
            />
            {isError && <div className={styles.errorText}>Error: {errorText}</div>}
            <div style={{minWidth: '400px'}}>
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
                    rows={filteredUsers}
                    onRowClick={handleRowClick}
                    columns={columns}
                    pagination
                />
            </div>
        </Box>
    );
}

export { UsersList };