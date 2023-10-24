"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, FilledInput, FormControl, IconButton, InputAdornment, InputLabel, Link, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close } from '@mui/icons-material';
import { changePassword, getUserData} from '@/actions/actions';

export default function AccountManagement() {

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [type, setType] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [curPass, setCurPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmNewPass, setConfirmNewPass] = useState("");

    const [passStatus, setPassStatus] = useState("");
    const [passStatusMessage, setPassStatusMessage] = useState("");

  
    // Retrieve user data
    useEffect( () => {
        const fetchData = async () => {
            try {
              // GET DATA
              const data = await getUserData();
              setUsername(data.username);
              setEmail(data.email);
              setType(data.type);

            } catch (error) {
              console.error('Error during validation:', error);
          }
        };
        
        fetchData();
    }, []);


    const handleClickShowPassword = () => {
        setShowPassword((show) => !show);
    }

    const handleCurPass = (newValue: SetStateAction<string>) => {
        setCurPass(newValue);
    }
    const handleNewPass = (newValue: SetStateAction<string>) => {
        setNewPass(newValue);
    }
    const handleConfirmNewPass = (newValue: SetStateAction<string>) => {
        setConfirmNewPass(newValue);
    }

    const handleChangePassword = async () => {
        console.log("Attempting to change password");
        // Confirm that newPass and confirmNewPass are the same
        if(newPass === confirmNewPass){
            // Change password
            const resp = await changePassword(curPass, newPass);
            
            // Update UI
            if(resp.status === "SUCCESS"){
                setPassStatus("SUCCESS");
                setPassStatusMessage("Password changed successfully!");
            }else{
                setPassStatus("FAIL");
                setPassStatusMessage("Password change failed.");
            }
        }else{
            setPassStatus("FAIL");
            setPassStatusMessage("Passwords do not match.");
        }
    }


    return (
        <>
            <div className={styles.accountHeader}>My Account</div>
            <Box sx={{
                margin: "10px",
            }}><b>Username:</b> {username}</Box>
            <Box sx={{
                margin: "10px",
            }}><b>Email:</b> {email}</Box>
            <Box sx={{
                margin: "10px",
                marginBottom: "40px",
            }}><b>Account Type:</b> {type}</Box>


            <div className={styles.accountHeader}>Change Password</div>
            <FormControl 
                variant="filled"
                className={styles.passwordBox}
            >
            <InputLabel htmlFor={"curpass"}>Current Password</InputLabel>
            <FilledInput
                id={"curpass"}
                type={showPassword ? 'text' : 'password'}
                inputProps={{maxLength: 100}}
                onChange={(event) => handleCurPass(event.target.value)}
                endAdornment={
                    <InputAdornment position="end">
                        <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                        >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </InputAdornment>
                }
            />
            </FormControl>

            <FormControl 
                variant="filled"
                className={styles.passwordBox}
            >
            <InputLabel htmlFor={"newpass"}>New Password</InputLabel>
            <FilledInput
                id={"newpass"}
                type={showPassword ? 'text' : 'password'}
                inputProps={{maxLength: 100}}
                onChange={(event) => handleNewPass(event.target.value)}
                endAdornment={
                    <InputAdornment position="end">
                        <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                        >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </InputAdornment>
                }
            />
            </FormControl>

            <FormControl 
                variant="filled"
                className={styles.passwordBox}
            >
            <InputLabel htmlFor={"confirmpass"}>Confirm New Password</InputLabel>
            <FilledInput
                id={"confirmpass"}
                type={showPassword ? 'text' : 'password'}
                inputProps={{maxLength: 100}}
                onChange={(event) => handleConfirmNewPass(event.target.value)}
                endAdornment={
                    <InputAdornment position="end">
                        <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                        >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </InputAdornment>
                }
            />
            </FormControl>

            <Button
                className={styles.loginButton}
                onClick={handleChangePassword}
                variant="contained"
            >Change Password</Button>

            <Box sx={{
                margin: "5px", 
            }}>
                {passStatus === "SUCCESS" && <CheckBox sx={{color: "green"}} fontSize='large'/>}
                {passStatus === "FAIL" && <Close sx={{color: "red"}} fontSize='large'/>}
            </Box>

            <Box sx={{
                margin: "5px",
            }}>
                {passStatusMessage}
            </Box>
        </>
    );
}

export { AccountManagement };
