"use client"

import { SetStateAction, useState } from 'react';
import styles from './components.module.css';
import { Box, Button, FilledInput, FormControl, IconButton, InputAdornment, InputLabel, Link, TextField } from '@mui/material';
import { VisibilityOff, Visibility } from '@mui/icons-material';
import { login } from '@/actions/actions';
import { useRouter } from 'next/navigation'

export default function LoginBox() {

    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const randomID = Math.random();

    const handleUsername = (newValue: SetStateAction<string>) => {
        setUsername(newValue);
    }
    const handlePassword = (newValue: SetStateAction<string>) => {
        setPassword(newValue);
    }
    const handleClickShowPassword = () => {
        setShowPassword((show) => !show);
    }

    const handleLogin = async () => {
        console.log("Attempting to login.");
        const resp = await login(username, password);
        if(resp === "SUCCESS"){
            router.push("/home");
        }else{
            console.log(resp);
        }
    }

    return (
        <div className={styles.LoginBox}>
            <TextField
                value={username}
                label="Username"
                onChange={(event) => handleUsername(event.target.value)}
                variant="filled"
                className={styles.standardTextBox}
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
            </div>
            <Button
                className={styles.loginButton}
                onClick={handleLogin}
                variant="contained"
            >Login</Button>
            <Link href={"/create-account"}><Box className={styles.loginLink}>Create an account...</Box></Link>
            <Link href={"/home"}><Box className={styles.loginLink}>&#8592; Back</Box></Link>
        </div>
    );
}

export { LoginBox };
