"use client"

import { SetStateAction, useState } from 'react';
import styles from './components.module.css';
import { Box, Button, FilledInput, FormControl, IconButton, InputAdornment, InputLabel, Link, TextField } from '@mui/material';
import { VisibilityOff, Visibility } from '@mui/icons-material';
import { createAccount } from '@/actions/actions';
import { useRouter } from 'next/navigation'

export default function SignupBox() {

    const router = useRouter();

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const randomID = Math.random();

    const handleEmail = (newValue: SetStateAction<string>) => {
        setEmail(newValue);
    }
    const handleUsername = (newValue: SetStateAction<string>) => {
        setUsername(newValue);
    }
    const handlePassword = (newValue: SetStateAction<string>) => {
        setPassword(newValue);
    }
    const handleConfirmPassword = (newValue: SetStateAction<string>) => {
        setConfirmPassword(newValue);
    }
    const handleClickShowPassword = () => {
        setShowPassword((show) => !show);
    }
    const handleClickShowConfirmPassword = () => {
        setShowConfirmPassword((show) => !show)
    }

    const handleCreate = async () => {
        console.log("Attempting to create account.");
        const resp = await createAccount(email, username, password);
        if(resp === "SUCCESS"){
            router.push('/login');
        }else{
            console.log(resp);
        }
    }

    return (
        <div className={styles.LoginBox}>
            <TextField
                value={email}
                label="E-mail"
                onChange={(event) => handleEmail(event.target.value)}
                variant="filled"
                className={styles.field}

            />
            <TextField
                value={username}
                label="Username"
                onChange={(event) => handleUsername(event.target.value)}
                variant="filled"
                className={styles.field}

            />
            <div className={styles.passwordContainer}>
                <FormControl 
                    variant="filled"
                >
                <InputLabel htmlFor={"mainpass"}>Password</InputLabel>
                <FilledInput
                    id={"mainpass"}
                    type={showPassword ? 'text' : 'password'}
                    inputProps={{maxLength: 100}}
                    onChange={(event) => handlePassword(event.target.value)}
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
                >
                <InputLabel htmlFor={"confirmpass"}>Confirm Password</InputLabel>
                <FilledInput
                    id={"confirmpass"}
                    type={showConfirmPassword ? 'text' : 'password'}
                    inputProps={{maxLength: 100}}
                    onChange={(event) => handleConfirmPassword(event.target.value)}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowConfirmPassword}
                                edge="end"
                            >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    }
                />
                </FormControl>
            </div>





            <Button
                className={styles.loginButton}
                onClick={handleCreate}
                variant="contained"
            >Create</Button>
            <Link href={"/login"}><Box className={styles.loginLink}>Back</Box></Link>
        </div>
    );
}

export { SignupBox };
