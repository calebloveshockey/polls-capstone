'use client'

import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FilledInput, FormControl, IconButton, InputAdornment, InputLabel } from '@mui/material';
import styles from './page.module.css'
import { SetStateAction, useEffect, useState } from 'react';
import { getUserDetails, removeUserAccount } from '@/actions/actions';
import ReactiveButton from '@/components/ReactiveButton';
import { VisibilityOff, Visibility } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface User{
  user_id: number;
  username: string;
  type: string;
}

export default function UserAccountAdministration({params} : {params: {username: string}}) {
  const router = useRouter();
  
  const [userDetails, setUserDetails] = useState<User>();

  const [isError, setIsError] = useState(false);
  const [errorText, setErrorText] = useState<string>("");
  
  const [isAccountDeleted, setIsAccountDeleted] = useState<boolean>(false);
  const [isDeletionProcessing, setIsDeletionProcessing] = useState<boolean>(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState<boolean>(false);
  const [deletionPw, setDeletionPw] = useState<string>("");
  const [showDeletionPw, setShowDeletionPw] = useState<boolean>(false);

  // Retrieve users
  useEffect( () => {
    setIsError(false);
    setErrorText("");

    const fetchData = async () => {
        try{
            // GET DATA
            const data = await getUserDetails(params.username);

            // PROCESS DATA
            if(data.status === "SUCCESS" && data.userDetails){
              setUserDetails(data.userDetails);
            }else if(data.error){
                setIsError(true);
                setErrorText(data.error);
            }else{
                setIsError(true);
                setErrorText("Unknown error occurred in client trying to retrieve user details.")
            }
        }catch(error){
            setIsError(true);
            setErrorText("Unknown error occurred trying to retrieve user details.");
        }
    };

    fetchData();
  }, []);

  const confirmAccountDeletion = async (pw: string) => {
      setIsConfirmationOpen(false);
      setIsDeletionProcessing(true);

      const res = await removeUserAccount(pw, params.username);
      if(res.status === "SUCCESS"){
        setIsAccountDeleted(true);
        router.push('/home/admin/users');
      }else{
        setIsError(true);
        setErrorText("Unable to remove user account.");
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
    <div className={styles.usersContent}>
      <Box sx={{
        fontSize: '20px',
        fontWeight: 'bold',
        borderBottom: '2px solid black',
        marginBottom: '20px',
      }}>Account Administration</Box>

      {isError && <div className={styles.errorText}>Error: {errorText}</div>}

      <Box sx={{
          margin: "10px",
      }}><b>Username:</b> {userDetails?.username}</Box>
      <Box sx={{
          margin: "10px",
      }}><b>User ID:</b> {userDetails?.user_id}</Box>
      <Box sx={{
          margin: "10px",
          marginBottom: "40px",
      }}><b>Account Type:</b> {userDetails?.type}</Box>

      <ReactiveButton
          text="Remove User"
          isSuccess={isAccountDeleted}
          isProcessing={isDeletionProcessing}
          onClick={() => setIsConfirmationOpen(true)}
      />

      <Dialog
          open={isConfirmationOpen}
          onClose={closeConfirmation}
      >
          <DialogTitle>Are you sure you want to delete this user?</DialogTitle>   
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
    </div>
  )
}
