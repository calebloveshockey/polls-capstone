"use client"

import { SetStateAction, useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FilledInput, FormControl, IconButton, InputAdornment, InputLabel, Link, TextField } from '@mui/material';
import { VisibilityOff, Visibility, CheckBox, Close } from '@mui/icons-material';
import { changePassword, getUserData, removeOwnAccount} from '@/actions/actions';
import ReactiveButton from '@/components/ReactiveButton';
import { useRouter } from 'next/navigation';

export default function AccountManagement() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [type, setType] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [curPass, setCurPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmNewPass, setConfirmNewPass] = useState("");

    const [passStatus, setPassStatus] = useState("");
    const [passStatusMessage, setPassStatusMessage] = useState("");

    const [isChangePwProcessing, setIsChangePwProcessing] = useState<boolean>(false);

    const [isAccountDeleted, setIsAccountDeleted] = useState<boolean>(false);
    const [isDeletionProcessing, setIsDeletionProcessing] = useState<boolean>(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState<boolean>(false);
    const [deletionPw, setDeletionPw] = useState<string>("");
    const [showDeletionPw, setShowDeletionPw] = useState<boolean>(false);

  
    // Retrieve user data
    useEffect( () => {
        const fetchData = async () => {
            try {
              // GET DATA
              const data = await getUserData();
              setUsername(data.username);
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
        setIsChangePwProcessing(true);
        // Confirm that newPass and confirmNewPass are the same
        if(newPass === confirmNewPass){
            // Change password
            const resp = await changePassword(curPass, newPass);
            
            // Update UI
            if(resp.status === "SUCCESS"){
                setPassStatus("SUCCESS");
                setPassStatusMessage("Password changed successfully!");
                setCurPass("");
                setNewPass("");
                setConfirmNewPass("");
            }else{
                setPassStatus("FAIL");
                setPassStatusMessage("Password change failed.");
            }
        }else{
            setPassStatus("FAIL");
            setPassStatusMessage("Passwords do not match.");
        }
        setIsChangePwProcessing(false);

        setTimeout(() => setPassStatus(""), 3000);
    }

    const confirmAccountDeletion = async (pw: string) => {
        setIsConfirmationOpen(false);
        setIsDeletionProcessing(true);

        const res = await removeOwnAccount(pw);
        if(res.status === "SUCCESS"){
            setIsAccountDeleted(true);
            router.push('/logout');
        }

        setIsDeletionProcessing(false);
    }
    const closeConfirmation = () => {
        setDeletionPw("");
        setIsConfirmationOpen(false);
    }
    const handleDeletePass = (newValue: SetStateAction<string>) => {
        setDeletionPw(newValue);
    }


    return (
        <>
            <div className={styles.accountHeader}>My Account</div>
            <Box sx={{
                margin: "10px",
            }}><b>Username:</b> {username}</Box>
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
                value={curPass}
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
                value={newPass}
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
                value={confirmNewPass}
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

            <ReactiveButton
                text="Change Password"
                isSuccess={passStatus === "SUCCESS"}
                isProcessing={isChangePwProcessing}
                onClick={handleChangePassword}
            />

            <Box sx={{
                margin: "5px",
            }}>
                {passStatusMessage}
            </Box>

            <ReactiveButton
                text="Delete Account"
                isSuccess={isAccountDeleted}
                isProcessing={isDeletionProcessing}
                onClick={() => setIsConfirmationOpen(true)}
            />

            <Dialog
                open={isConfirmationOpen}
                onClose={closeConfirmation}
            >
                <DialogTitle>Are you sure you want to delete your account?</DialogTitle>   
                <DialogContent>
                    <DialogContentText>Confirm your password.</DialogContentText>
                    <FormControl 
                        variant="filled"
                        className={styles.passwordBox}
                    >
                    <InputLabel htmlFor={"deletepass"}></InputLabel>
                    <FilledInput
                        id={"deletepass"}
                        value={deletionPw}
                        type={showDeletionPw ? 'text' : 'password'}
                        inputProps={{maxLength: 100}}
                        onChange={(event) => handleDeletePass(event.target.value)}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={() => setShowDeletionPw(!showDeletionPw)}
                                    edge="end"
                                >
                                    {showDeletionPw ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        }
                    />
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeConfirmation}>Cancel</Button>
                    <Button onClick={() => confirmAccountDeletion(deletionPw)}>Confirm</Button>
                </DialogActions>
            </Dialog>



        </>
    );
}

export { AccountManagement };
