"use server";

import { Pool } from "pg";
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid';
import { TrySharp } from "@mui/icons-material";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});
  
// Create new user account
export async function createUserAccount(username: string, password: string) {
  console.log("SERVER: Entering createUserAccount");
  try {
    const client = await pool.connect();

    // Ensure username is unique
    const { rows: usernameCheck } = await client.query(`SELECT username FROM users WHERE username=$1`, [username])
    if (usernameCheck.length > 0) {
      console.log('SERVER: Username already exists.');

      // Close the database connection
      client.release();

      // Handle the case where the username already exists
      return "Error: Username already exists.";

    }else{
    
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

      // Insert new user into the database using parameterized query
      const { rows: creation } = await client.query(
        'INSERT INTO users (username, passwordhash, type) VALUES ($1, $2, $3)', 
        [username, hashedPassword, "user"]
      );

      // Close the database connection
      client.release();
      return "SUCCESS";

    }

  } catch (error) {
    console.error('SERVER: Error creating user: ', error);
    return "Error: " + error;
  }
};


// Create new anonymous user account
export async function createAnonAccount(){
  console.log("SERVER: Entering createAnonAccount");
  try {
    const client = await pool.connect();
    
    // Insert new user into the database using parameterized query
    const {rows: result} = await client.query(
      'INSERT INTO users (type) VALUES ($1) RETURNING user_id', 
      ["anon"]
    );

    // Add cookie with key to track anon users
    const key = uuidv4();
    await client.query('INSERT INTO keys (user_id, key, datetime_issued) VALUES ($1, $2, NOW())', [result[0].user_id, key]);
    cookies().set({
      name: 'key',
      value: key,
      httpOnly: true,
      secure: false,
    })

    // Close the database connection and return the new anon user id
    client.release();
    return result[0].user_id;

  } catch (error) {
    console.error('SERVER: Error creating anon: ', error);
    return "Error: " + error;
  }
}


// Login to user account
export async function login(username: string, password: string) {
  console.log("SERVER: Entering login");
  try {
    const client = await pool.connect();

    // Get password from that user and compare
    const { rows: userData } = await client.query('SELECT user_id, passwordhash FROM users WHERE username = $1', [username]);

    if (userData.length === 0) {
      // User not found
      client.release();
      return "ERROR: User not found";
    }

    // Compare the hashed input password with the stored hashed password
    const isPasswordMatch = await bcrypt.compare(password, userData[0].passwordhash);
    if (!isPasswordMatch) {
      // Incorrect password
      client.release();
      return "Incorrect password";
    }else{

      // Passwords match, generate a key
      const key = uuidv4(); 

      // Store the key
      await client.query('INSERT INTO keys (user_id, key, datetime_issued) VALUES ($1, $2, NOW())', [userData[0].user_id, key]);

      cookies().set({
        name: 'key',
        value: key,
        httpOnly: true,
        secure: false,
      })

      // Close the database connection
      client.release();
      return "SUCCESS";
    }


  } catch (error) {
    console.error('Error creating user: ', error);
    return "Error: " + error;
  }
}


// Validate requester has valid key
export async function validateKey(): Promise<any>{
  console.log("SERVER: Entering validateKey");
  try {
    const client = await pool.connect();

    //Check if cookie with name "key" exists
    const sessionKey = cookies().get('key');
    if(sessionKey && sessionKey.value !== "poison"){

      // Fetch corresponding key from the keys table
      const {rows: keyData} = await client.query('SELECT user_id, datetime_issued FROM keys WHERE key = $1', [sessionKey.value]);

      // Check if there was a matching key
      if (keyData.length > 0){
        const keyInfo = keyData[0];
        const currentTime = new Date();

        // Check if session is still valid based on expiry timer
        const sessionExpiryTime = new Date(keyInfo.datetime_issued);
        const sessionExpiryString = process.env.SESSION_EXPIRY_MINS;
        const sessionExpiryMinutes = sessionExpiryString ? parseInt(sessionExpiryString, 10) : 60;
        sessionExpiryTime.setMinutes(sessionExpiryTime.getMinutes() + sessionExpiryMinutes);

        if (currentTime <= sessionExpiryTime){
          // Key exists and is valid
          client.release();
          console.log("SERVER: Key validated successfully.");
          return {status: 'SUCCESS', user_id: keyData[0].user_id}

        }else{
          // Cookie exists and is in db, but it is expired
          console.log("SERVER: Key found, but it is expired.");
          client.release();
          // Delete cookie and revalidate
          cookies().set({
            name: 'key',
            value: "poison",
            httpOnly: true,
            secure: false,
          });
          const revalidate = await validateKey();
          return revalidate;
        }

      }else{
        // Cookie named key exists, but it doesn't match any in the database
        console.log("SERVER: Cookie found, but doesn't exist in the database.");
        client.release();
        // Delete cookie and revalidate
        cookies().set({
          name: 'key',
          value: "poison",
          httpOnly: true,
          secure: false,
        });
        const revalidate = await validateKey();
        return revalidate;
      }

    }else{
      // No cookie key, create anonymous account, attempt to validate again
      console.log("SERVER: No cookie, create anon account");
      await createAnonAccount();
      client.release();
      const revalidate = await validateKey();
      return revalidate;
    }

    // Failed to validate
    client.release();
    return {status: 'FAILURE'}

  }
  catch (error) {
    console.error('SERVER: Error validating key: ', error);
    return {status: 'ERROR', error: error};
  }
}



// Validate user account
export async function validateUser(){
  console.log("SERVER: Entering validateUser");

  // Check for valid key
  const keyCheck = await validateKey();
  if (keyCheck.status === "SUCCESS"){
    // valid key found
    try {
      const client = await pool.connect();

      // Fetch user
      const {rows: userData} = await client.query('SELECT username, type FROM users WHERE user_id = $1', [keyCheck.user_id]);

      // Ensure existing user account
      if (userData.length > 0 && (userData[0].type === "user" || userData[0].type === "admin")){
        // User exists
        console.log("SERVER: User exists and is valid");
        const username = userData[0].username;
        client.release();
        return {status: 'SUCCESS', username: username, user_id: keyCheck.user_id}

      }else{
        // No such user exists
        console.log("SERVER: No such user exists.");
        client.release();
        return {status: 'FAILURE'};
      }
  
    }
    catch (error) {
      console.error('SERVER: Error validating user account: ', error);
      return {status: 'ERROR', error: error};
    }

  // No valid key found
  }else{
    console.error('SERVER: User does not have a valid key.');
    return {status: 'FAILURE'};
  }
}


// Validate admin account
export async function validateAdmin(){
  console.log("SERVER: Entering validateAdmin");

  // Check for valid key
  const keyCheck = await validateKey();
  if (keyCheck.status === "SUCCESS"){
    // valid key found
    try {
      const client = await pool.connect();

      // Fetch user
      const {rows: userData} = await client.query('SELECT username, type FROM users WHERE user_id = $1', [keyCheck.user_id]);

      // Ensure existing user account
      if (userData.length > 0 && userData[0].type === "admin"){
        // Such an admin exists
        console.log("SERVER: Admin exists and is valid");
        const username = userData[0].username;
        client.release();
        return {status: 'SUCCESS', username: username, user_id: keyCheck.user_id}

      }else{
        // No such admin exists
        console.log("SERVER: No such admin exists.");
        client.release();
        return {status: 'FAILURE'};
      }
  
    }
    catch (error) {
      console.error('SERVER: Error validating admin account: ', error);
      return {status: 'ERROR', error: error};
    }

  // No valid key found
  }else{
    console.error('SERVER: User does not have a valid key.');
    return {status: 'FAILURE'};
  }
}



// Simple function to delete the key from the database and delete the corresponding cookie
export async function logout(){
  console.log("SERVER: logging out");

  try {
    const client = await pool.connect();

    //Check if cookie with name "key" exists
    const sessionKey = cookies().get('key');
    if(sessionKey){

      // Delete key from database
      await client.query('DELETE FROM keys WHERE key = $1', [sessionKey.value])
    }

    client.release();
  }
  catch (error) {
    console.error('SERVER: Error logging out: ', error);
  }

  cookies().delete("key");
}


// If a user wants to remove their own account
export async function removeOwnAccount(pw: string){
  console.log("SERVER: entering removeOwnAccount");

  // Validate user to confirm they are authorized and to get username
  const validation = await validateUser();
  if(validation.status && validation.status === "SUCCESS" && validation.username){

    try{
      const client = await pool.connect();

      // Get passwordhash from database
      const {rows: userData} = await client.query('SELECT passwordhash FROM users WHERE username = $1', [validation.username])
      if (userData.length > 0) {

        // Check that pw matches database password
        const isPasswordMatch = await bcrypt.compare(pw, userData[0].passwordhash);
        if (isPasswordMatch) {
            
          // Remove account from DB
          const res = await client.query('DELETE FROM users WHERE ctid IN (SELECT ctid FROM users WHERE username = $1 LIMIT 1)', [validation.username]);
          // Check that deletion was successful:
          if(res.rowCount > 0){
            console.log("SERVER: User was successfully deleted.");
            client.release();
            return {status: "SUCCESS"};
          }
        }
      }

      client.release();
    }
    catch(error){
      console.log('SERVER: Error getting user data: ', error);
    }
  }

  console.log("SERVER: User did not get deleted.");
  return {status: "FAILURE"};
}


// Admin remove an account
export async function removeUserAccount(pw: string, userToDelete: string){
  console.log("SERVER: entering removeUserAccount");

  // Validate admin
  const validation = await validateAdmin();
  if(validation.status && validation.status === "SUCCESS" && validation.username){

    try{
      const client = await pool.connect();

      // Get passwordhash from database
      const {rows: adminData} = await client.query('SELECT passwordhash FROM users WHERE username = $1', [validation.username])
      if (adminData.length > 0) {

        // Check that pw matches database password
        const isPasswordMatch = await bcrypt.compare(pw, adminData[0].passwordhash);
        if (isPasswordMatch) {

          // Get userToDelete details
          const { rows: userToDeleteData } = await client.query('SELECT user_id, type FROM users WHERE username = $1', [userToDelete]);
          if (userToDeleteData.length === 0) {
            client.release();
            return { status: "FAILURE", error: "User not found." };
          }

          // Check if userToDelete is not an admin
          if (userToDeleteData[0].type === "admin") {
            client.release();
            return { status: "FAILURE", error: "Cannot delete an admin account." };
          }

          // Proceed with deletion
          const deleteResult = await client.query('DELETE FROM users WHERE user_id = $1', [userToDeleteData[0].user_id]);
          client.release();
          if (deleteResult.rowCount > 0) {
            return { status: "SUCCESS" };
          } else {
            return { status: "FAILURE", error: "Deletion failed." };
          }
        }
      }
      client.release();
    }
    catch(error){
      console.log('SERVER: Error getting user data: ', error);
    }
  }

  console.log("SERVER: User did not get deleted.");
  return {status: "FAILURE", error: "Unknown error occured while trying to delete user."};
}



// Gets data associated with user
export async function getUserData(){

  // Validate 
  const validation = await validateUser();

  if(validation.status === "SUCCESS" && validation.username){

    try{
      const client = await pool.connect();

      const {rows: userData} = await client.query('SELECT username, type FROM users WHERE username = $1', [validation.username])

      if(userData.length > 0){
        client.release();
        return{
          status: 'SUCCESS',
          username: userData[0].username,
          type: userData[0].type,
        }
      }

      client.release();
    }
    catch(error){
      console.log('SERVER: Error getting use data: ', error);
    }
  }

  return {
    status: "FAILURE", 
    username: "FAILURE",
    type: "FAILURE",
  };
}


// Change user password
export async function changePassword(oldPass: string, newPass: string){
  console.log("SERVER: entering change password");

  // Validate user to confirm they are authorized and to get username
  const validation = await validateUser();
  if(validation.status && validation.status === "SUCCESS" && validation.username){

    try{
      const client = await pool.connect();

      // Get passwordhash from database
      const {rows: userData} = await client.query('SELECT passwordhash FROM users WHERE username = $1', [validation.username])
      if (userData.length > 0) {

        // Check that oldPass matches database password
        const isPasswordMatch = await bcrypt.compare(oldPass, userData[0].passwordhash);
        if (isPasswordMatch) {
            
          // Change database password to newPass
          const hashedNewPassword = await bcrypt.hash(newPass, 10);
          const res = await client.query('UPDATE users SET passwordhash = $1 WHERE username = $2', [hashedNewPassword, validation.username]);
          // Check that update was successful:
          if(res.rowCount === 1){

            // Successful password change
            client.release();
            return {status: "SUCCESS"};
          }
        }
      }

      client.release();
    }
    catch(error){
      console.log('SERVER: Error getting use data: ', error);
    }
  }

  // Something failed along the way
  return{
    status: "FAILURE"
  }
}



// Helper function to generate the code for shareable poll links
async function generateUniqueShareCode(): Promise<string> {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';

  for (let i = 0; i < 5; i++){
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex]
  }

  // Collision checking
  try{
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM polls WHERE share_link = $1', [code]);
    client.release();

    if(result.rows.length === 0){
      return code;
    }

  }catch(error){
    console.error("SERVER: Error generating unique share code: " + error);
  }

  return generateUniqueShareCode();
}

// Create poll
export async function createPoll(
  questionText: string,
  descText: string,
  pollType: string,
  endTime: string,
  options: string[],
){
  console.log("SERVER: entering create poll");

  // Validate key to confirm they are authorized and to get user id
  const validation = await validateKey();
  if(validation.status === "SUCCESS" && validation.user_id){

    try{
      const client = await pool.connect();

      // Genereate unique code for the poll's shareable link
      const code = await generateUniqueShareCode();

      try{

        // Begin transaction to add the poll and all its options
        await client.query('BEGIN');

        // Add data to poll table, and get back the resulting new poll_id
        const result = await client.query(
          'INSERT INTO polls (question, description, type, create_date, close_date, share_link, author) VALUES ($1, $2, $3, NOW(), $4, $5, $6) RETURNING poll_id', 
          [
            questionText,
            descText,
            pollType,
            endTime,
            code,
            validation.user_id, 
          ]
        );
        if(result.rowCount === 1){
          const newPollId = result.rows[0].poll_id;

          // Insert options with the new poll_id to the options table
          for (const opt of options) {
            await client.query('INSERT INTO options (option_name, poll_id) VALUES ($1, $2)', [opt, newPollId]);
          }

          // Commit the transaction now that poll and all options have been inserted
          await client.query('COMMIT');
          console.log('SERVER: Transaction committed successfully');

          return{status: "SUCCESS", shareCode: code};
        }

      } catch (error) {
        // If any operation fails, roll back the transaction
        await client.query('ROLLBACK');
        console.error('SERVER: Error in transaction:', error);
      } finally {
        // Release the client back to the pool
        client.release();
      }
      

      client.release();
    }
    catch(error){
      console.log('SERVER: Error creating poll: ', error);
    }
  }

  return{
    status: "FAILURE",
    shareCode: "",
  }
}

// Get poll type from shareCode
export async function getPollType(shareCode: string){
  console.log("SERVER: entering get poll type");

  try{
    const client = await pool.connect();

    // Select poll data
    const {rows: pollData} = await client.query("SELECT type, question FROM polls WHERE share_link = $1", [shareCode]);

    if(pollData.length === 1){
        client.release();
        return {status: "SUCCESS", pollType: pollData[0].type, pollName: pollData[0].question};
    }

    client.release();
  }catch(error){
    console.log("SERVER: Error retrieving poll data: " + error);
  }


  return{
    status: "FAILURE",
    pollType: "",
    pollName: "",
  }
}


// Get poll data from shareCode
export async function getPollData(shareCode: string){
  console.log("SERVER: entering get poll data");

  try{
    const client = await pool.connect();

    // Select poll data
    const {rows: pollData} = await client.query("SELECT poll_id, question, description, type, close_date FROM polls WHERE share_link = $1", [shareCode]);

    if(pollData.length === 1){
      // Select options data
      const {rows: optionsData} = await client.query("SELECT option_id, option_name FROM options WHERE poll_id = $1", [pollData[0].poll_id]);
      if(optionsData.length > 1){
        
        client.release();
        return {status: "SUCCESS", pollData: pollData[0], options: optionsData};
      }
    }

    client.release();
  }catch(error){
    console.log("SERVER: Error retrieving poll data: " + error);
  }


  return{
    status: "FAILURE",
    pollData: {},
    options: [],
  }
}


// Cast vote on a traditional poll
export async function castTradVote(poll_id: string, option_id: string){
  console.log("SERVER: entering castTradVote");

  // Validate key to confirm they are authorized and to get user id
  const validation = await validateKey();
  if(validation.status === "SUCCESS" && validation.user_id){

    try{
      const client = await pool.connect();

      // Check if user has already voted in this poll
      const {rows: checkForVotes} = await client.query('SELECT response_id FROM responses WHERE poll_id = $1 AND responder = $2', [poll_id, validation.user_id]);
      if(checkForVotes.length > 0){
        // Already voted in this poll
        client.release();
        return({status: "ERROR", error: "Cannot vote in the same poll twice."});

      }else{
        // Haven't voted before; Cast the vote
        await client.query('INSERT INTO responses (poll_id, option_id, responder) VALUES ($1, $2, $3)', [poll_id, option_id, validation.user_id]);
        client.release();
        return({status: "SUCCESS"});
      }
      
    }catch(error){
      console.log("SERVER: Error voting: " + error);
    }
  }
  return{status: "FAILURE"};
}

// Cast vote on a ranked poll
export async function castRankedVote(poll_id: string, option_id: string, ranking: number){
  console.log("SERVER: entering castRankedVote");

  // Validate key to confirm they are authorized and to get user id
  const validation = await validateKey();
  if(validation.status === "SUCCESS" && validation.user_id){
    try{
      const client = await pool.connect();

      // Check if user has already voted in this poll for this ranking number
      const {rows: checkForVotes} = await client.query('SELECT response_id FROM responses WHERE poll_id = $1 AND responder = $2 AND rank = $3', [poll_id, validation.user_id, ranking]);
      if(checkForVotes.length > 0){
        // Already voted in this poll for this ranking number
        client.release();
        return({status: "ERROR", error: "Cannot vote in the same poll twice."});

      }else{
        // Have not voted before, cast the vote;
        const result = await client.query('INSERT INTO responses (poll_id, option_id, responder, rank) VALUES ($1, $2, $3, $4)', [poll_id, option_id, validation.user_id, ranking]);
        client.release();
        return({status: "SUCCESS"});
        }
      
    }catch(error){
      console.log("SERVER: Error voting: " + error);
    }
  }

  return{status: "FAILURE"};
}

// Cast vote on a traditional poll
export async function castApprovalVote(poll_id: string, option_id: string){
  console.log("SERVER: entering castApprovalVote");

  // Validate key to confirm they are authorized and to get user id
  const validation = await validateKey();
  if(validation.status === "SUCCESS" && validation.user_id){

    try{
      const client = await pool.connect();

      // Check if user has already voted in this poll for this option
      const {rows: checkForVotes} = await client.query('SELECT response_id FROM responses WHERE poll_id = $1 AND responder = $2 AND option_id = $3', [poll_id, validation.user_id, option_id]);
      if(checkForVotes.length > 0){
        // Already voted in this poll for this option
        client.release();
        return({status: "ERROR", error: "Cannot vote in the same poll twice."});

      }else{
        // Haven't voted before; Cast the vote
        await client.query('INSERT INTO responses (poll_id, option_id, responder) VALUES ($1, $2, $3)', [poll_id, option_id, validation.user_id]);
        client.release();
        return({status: "SUCCESS"});
      }
      
    }catch(error){
      console.log("SERVER: Error voting: " + error);
    }
  }
  return{status: "FAILURE"};
}


// Get all votes for a traditional poll
export async function getTradVotes(shareCode: string){
  console.log("SERVER: Entering get trad votes");

  try{
    const client = await pool.connect();

    // Get poll id
    const {rows: pollData} = await client.query("SELECT poll_id, question, description FROM polls WHERE share_link = $1", [shareCode]);

    if(pollData.length === 1){
    
      // Get all votes for this poll_id
      const {rows: voteData} = await client.query('SELECT option_id FROM responses WHERE poll_id = $1', [pollData[0].poll_id]);

      // Get all options
      const {rows: optionsData} = await client.query("SELECT option_id, option_name FROM options WHERE poll_id = $1", [pollData[0].poll_id]);
      const optionVotes : {option_name : string, numVotes: number, votePercentage: number}[] = optionsData.reduce( (acc, option) => {
        acc[option.option_id] = {
          option_name: option.option_name,
          numVotes: 0,
          votePercentage: 0
        };
        return acc;
      }, {});

      // Tabulate votes for each option
      voteData.forEach((vote) => {
        const optionId = vote.option_id;
        optionVotes[optionId].numVotes++;
      });

      // Calculate total votes
      const totalVotes = Object.values(optionVotes).reduce((total : number, option) => total + option.numVotes, 0);

      // Calculate and set vote percentages
      Object.values(optionVotes).forEach((option) => {
        option.votePercentage = +((option.numVotes / totalVotes) * 100).toFixed(1);
      });

      client.release();
      const genericOptionVotes : {option_name: string, numVotes: number, votePercentage: number}[] = Object.values(optionVotes);
      return {
        question: pollData[0].question,
        description: pollData[0].description,
        votes: genericOptionVotes
      }

    }

    client.release();
    return {
      question: "",
      description: "",
      votes: [{option_name: "None", numVotes: 0, votePercentage: 0}]
    }
  }catch(error){
    console.log("SERVER: Error voting: " + error);
  }            


  return {
    question: "",
    description: "",
    votes: [{option_name: "None", numVotes: 0, votePercentage: 0}]
  }

}


// Get all votes for an approval poll
export async function getApprovalVotes(shareCode: string){
  console.log("SERVER: Entering get approval votes");
  try{
    const client = await pool.connect();

    // Get poll id
    const {rows: pollData} = await client.query("SELECT poll_id, question, description FROM polls WHERE share_link = $1", [shareCode]);
    if(pollData.length === 1){
    
      // Get all votes for this poll_id
      const {rows: voteData} = await client.query('SELECT option_id, responder FROM responses WHERE poll_id = $1', [pollData[0].poll_id]);

      // Get all options
      const {rows: optionsData} = await client.query("SELECT option_id, option_name FROM options WHERE poll_id = $1", [pollData[0].poll_id]);
      
      // Initialize data object with the options
      const optionVotes : {option_name : string, numVotes: number, votePercentage: number}[] = optionsData.reduce( (acc, option) => {
        acc[option.option_id] = {
          option_name: option.option_name,
          numVotes: 0,
          votePercentage: 0
        };
        return acc;
      }, {});

      // Tabulate votes for each option
      voteData.forEach((vote) => {optionVotes[vote.option_id].numVotes++});

      // Calculate total votes
      const totalVotes = Object.values(optionVotes).reduce((total : number, option) => total + option.numVotes, 0);

      //Tabulate number of unique voters
      const numUniqueVoters = new Set(voteData.map(vote => vote.responder)).size;

      // Calculate and set vote percentages (what percent of voters voted for that option)
      Object.values(optionVotes).forEach((option) => {
        option.votePercentage = +((option.numVotes / numUniqueVoters) * 100).toFixed(1);
      });

      client.release();
      const genericOptionVotes : {option_name: string, numVotes: number, votePercentage: number}[] = Object.values(optionVotes);
      return {
        question: pollData[0].question,
        description: pollData[0].description,
        voters: numUniqueVoters, 
        votes: genericOptionVotes
      };
    }

    client.release();
    return {
      question: "",
      description: "",
      voters: 0, 
      votes: [{option_name: "None", numVotes: 0, votePercentage: 0}]
    };
  }catch(error){
    console.log("SERVER: Error voting: " + error);
  }            


  return {
    question: "",
    description: "",
    voters: 0, 
    votes: [{option_name: "None", numVotes: 0, votePercentage: 0}]
  };
}



// Calculate results for a ranked poll
export async function getRankedVotes(shareCode: string){
  console.log("SERVER: Entering getRankedVotes");
  try{
    const client = await pool.connect();

    // Get poll id
    const {rows: pollData} = await client.query("SELECT poll_id, question, description FROM polls WHERE share_link = $1", [shareCode]);
    if(pollData.length === 1){
    
      // Get all votes for this poll_id
      const {rows: voteData} = await client.query('SELECT option_id, rank, responder FROM responses WHERE poll_id = $1', [pollData[0].poll_id]);

      // Get all options
      const {rows: optionsData} = await client.query("SELECT option_id, option_name FROM options WHERE poll_id = $1", [pollData[0].poll_id]);
      client.release();

      const optionVotes : {option_id : number, option_name : string, numVotes: number, votePercentage: number, eliminated: boolean}[] = optionsData.map( (option) => {
        return {
          option_id: option.option_id,
          option_name: option.option_name,
          numVotes: 0,
          votePercentage: 0,
          eliminated: false,
        }
      })

      //Tabulate number of unique voters
      const numUniqueVoters = new Set(voteData.map(vote => vote.responder)).size;

      // Initial voting round
      voteData.forEach((vote) => {
        if(vote.rank === 1){
          // Find option with matching option_id and increment its numVotes
          const matchingOption = optionVotes.find((option) => option.option_id === vote.option_id);
          if(matchingOption){
            matchingOption.numVotes++;
          }
        }
      });

      // Calculate and set vote percentages
      optionVotes.forEach((option) => {
        option.votePercentage = +((option.numVotes / numUniqueVoters) * 100).toFixed(1);
      });

      // Perform instant voter runoff calculations
      const ivrResult = instantRunoff({round: 1, optionsData: optionVotes, votes: voteData});

      // Process ivrResult into outputted data
      const genericOptionVotes : {option_name: string, numVotes: number, votePercentage: number}[] = Object.values(ivrResult.optionsData);
      console.log("SERVER: Instant Runoff complete.");
      return {
        question: pollData[0].question,
        description: pollData[0].description,
        voters: numUniqueVoters, 
        votes: genericOptionVotes, 
        rounds: ivrResult.round
      };
    }

    client.release();
    return {
      question: "",
      description: "",
      voters: 0, 
      votes: [{option_name: "None", numVotes: 0, votePercentage: 0}], 
      rounds: 0
    };

  }catch(error){
    console.log("SERVER: Error getting ranked voting results: " + error);
  }            

  return {
    question: "",
    description: "",
    voters: 0, 
    votes: [{option_name: "None", numVotes: 0, votePercentage: 0}], 
    rounds: 0
  };
}



// Recursive function that handles rounds of Instant Runoff Voting
function instantRunoff(ivr: {
  round: number, 
  optionsData: {option_id: number, option_name : string, numVotes: number, votePercentage: number, eliminated: boolean}[],
  votes: {option_id: number, rank: number, responder: string}[]
}): {
  round: number, 
  optionsData: {option_id: number, option_name : string, numVotes: number, votePercentage: number, eliminated: boolean}[],
  votes: {option_id: number, rank: number, responder: string}[]
}{

  // Check if any option has votePercentage of 50% or greater
  let thresholdReached = false;
  ivr.optionsData.forEach((option) => {
    if(option.votePercentage >= 50){
      thresholdReached = true;
    }
  });
  if(thresholdReached){
    return ivr;
  }

  if(ivr.round > ivr.optionsData.length){
    console.log("SERVER: Somehow the ivr failed to resolve.");
    return ivr;
  }

  // 1. Find option to eliminate
  var leastPopularOption = {option_id: 0, numVotes: 0}
  // Go through each option and find option with least amount of votes which isn't already eliminated
  ivr.optionsData.forEach((option) => {

    // Initialize leastPopularOption with first non-eliminated option
    if(leastPopularOption.option_id === 0){
      //leastPopularOption not initialized, check if this option is not eliminated
      if(!option.eliminated){
        // Not eliminated, initalize leastPopularOption
        leastPopularOption = {option_id: option.option_id, numVotes: option.numVotes};
      }

    }else{
      //leastPopularOption initialized
      // Check if this option isn't eliminated but has less votes than current leastPopularOption
      if(option.numVotes < leastPopularOption.numVotes && !option.eliminated){
        // Less popular option found
        leastPopularOption = {option_id: option.option_id, numVotes: option.numVotes};
      }
    }
  });
 

  // 2. Eliminate option and remove all votes for this option.
  // Copy optionsData array, but reset the votes and percentage
  var newOptionsData = ivr.optionsData.map((option) => {
    return {
      option_id: option.option_id,
      option_name: option.option_name,
      numVotes: 0,
      votePercentage: 0,
      eliminated: option.eliminated
    }
  });
  // Eliminate least popular option
  const leastPop = newOptionsData.find((option) => option.option_id === leastPopularOption.option_id);
  if(leastPop){
    leastPop.eliminated = true;
  }
  const newVotes = ivr.votes.filter((vote) => {
    return vote.option_id !== leastPopularOption.option_id;
  });

  // 3. Retabulate the votes
  //  3a. Create array of votes that are only the highest ranked option for each responder (using newVotes array, each vote has vote.rank, 1 is highest rank)
  var topRankVotes = newVotes.reduce((accumulator, vote) => {
    const existingVote = accumulator.find((v) => v.responder === vote.responder);
    if (!existingVote || vote.rank < existingVote.rank) {
      // Replace or add the vote if it's the highest-ranked so far
      if (existingVote) {
        accumulator.splice(accumulator.indexOf(existingVote), 1);
      }
      accumulator.push(vote);
    }
    return accumulator;
  }, [] as {option_id: number; rank: number; responder: string }[]);
  //  3b. Tabulate just the top ranked votes
  topRankVotes.forEach((vote) => {
    const matchingOption = newOptionsData.find((option) => option.option_id === vote.option_id);
    if(matchingOption){
      matchingOption.numVotes++;
    }
  });

  // 4. Calculate new amount of unique voters (some may no longer have any valid votes due to removal of least popular option)
  const numUniqueVoters = new Set(newVotes.map(vote => vote.responder)).size;

  // 5. Calculate and set vote percentages
  newOptionsData.forEach((option) => {
    option.votePercentage = +((option.numVotes / numUniqueVoters) * 100).toFixed(1);
  });

  // 6. Return the recursion (increment rounds)
  return instantRunoff({
    round: ivr.round + 1,
    optionsData: newOptionsData,
    votes: newVotes
  });
}


// Get all comments for a particular poll
export async function getComments(shareCode: string){
  console.log("SERVER: entering getComments");

  try{
    const client = await pool.connect();

    // Validate that key exists
    const validation = await validateKey();
    if(validation.status === "SUCCESS"){

      // Get poll id
      const {rows: pollData} = await client.query("SELECT poll_id FROM polls WHERE share_link = $1", [shareCode]);
      if(pollData.length === 1){

        // Get all comments for this poll
        const { rows: comments } = await client.query(
          `SELECT c.comment_id, c.date, c.comment_text, u.username, c.parent_comment
          FROM comments c
          JOIN users u ON c.user_id = u.user_id
          WHERE c.poll_id = $1`,
          [pollData[0].poll_id]
        );
        
        client.release();

        // Check whether user is logged in or not
        const userValidation = await validateUser();
        if(userValidation.status === "SUCCESS"){
          // User has account
          return {status: "SUCCESS", comments: comments};
        }else{
          // User does not have account, but is still allowed to see the comments
          return {status: "NOUSER", comments: comments};
        }
      }
    }

    // Failure to validate key
    client.release();
    return{
      status: "FAILURE",
      comments: []
    }
  }catch(error){
    console.log("SERVER: Error retrieving comments: " + error);
  }

  return{
    status: "FAILURE",
    comments: [],
  }
}


// Add new comment
export async function addComment(shareCode: string, newComment: string, replyingCommentId: number|null){
  console.log("SERVER: entering addComment");

  try{
    const client = await pool.connect();

    // Validate that user has an account
    const validation = await validateUser();

    if(validation.status === "SUCCESS"){
      // Get poll id
      const {rows: pollData} = await client.query("SELECT poll_id FROM polls WHERE share_link = $1", [shareCode]);
      if(pollData.length === 1){

        // Add comment to database
        if(replyingCommentId === null){
          // Add comment without parent_id
          await client.query("INSERT INTO comments (date, comment_text, user_id, poll_id) VALUES (NOW(), $1, $2, $3)", [newComment, validation.user_id, pollData[0].poll_id]);
        }else{
          // Add comment with parent_id
          await client.query("INSERT INTO comments (date, comment_text, user_id, poll_id, parent_comment) VALUES (NOW(), $1, $2, $3, $4)", [newComment, validation.user_id, pollData[0].poll_id, replyingCommentId]);
        }
        
        client.release();
        return {status: "SUCCESS"};
      }
    }

    // User does not have an account
    client.release();
  }catch(error){
    console.log("SERVER: Error adding comment: " + error);
  }

  return{status: "FAILURE"}
}


// Get list of all users (admin only)
export async function getAllUsers(){
  console.log("SERVER: entering getAllUsers");

  try{ const client = await pool.connect();

    // Validate that this is an admin account
    const validation = await validateAdmin();
    if(validation.status === "SUCCESS"){
      // Get users
      const {rows: userList} = await client.query("SELECT username, type FROM users WHERE username IS NOT NULL");
      client.release();
      return {status: "SUCCESS", listOfUsers: userList};
    }else{
      client.release();
      return {status: "FAILURE", error: "Only admins can access this data."}
    }

  } catch(error){
    console.log("SERVER: Error getting all users: " + error);
  }

  return {status: "FAILURE", error: "Server failed to retrieve all users."};
}


// Get details of a specific user (admin only)
export async function getUserDetails(username: string){
  console.log("SERVER: entering getUserDetails for user: " + username);

  try{ const client = await pool.connect();

    // Validate that this is an admin account
    const validation = await validateAdmin();
    if(validation.status === "SUCCESS"){
      // Get user
      const {rows: userData} = await client.query("SELECT user_id, username, type FROM users WHERE username = $1", [username]);
      if(userData.length === 1){
        client.release();
        return {status: "SUCCESS", userDetails: userData[0]};
      }
    }else{
      client.release();
      return {status: "FAILURE", error: "Only admins can access this data."}
    }

  } catch(error){
    console.log("SERVER: Error getting user: " + error);
  }

  return {status: "FAILURE", error: "Server failed to retrieve user."};
}


// Helper function to count how many unique responses a poll got
async function getNumResponses(poll_id: number){
  try{ const client = await pool.connect();

      // Get all responses for this poll_id
      const {rows: responses} = await client.query('SELECT responder FROM responses WHERE poll_id = $1', [poll_id]);

      //Count number of unique responders responded to this poll
      const numResponses = new Set(responses.map(response => response.responder)).size;

      client.release();
      return numResponses;

  }catch(error){
    console.log("SERVER: Error calculating number of responses: " + error);
    return 0;
  }
}



// Get list of all polls for this user
export async function getPolls(){
  console.log("SERVER: entering getPolls");

  try{ const client = await pool.connect();

    // Validate that this is a user
    const validation = await validateUser();
    if(validation.status === "SUCCESS"){

      // Get polls
      const {rows: pollsList} = await client.query("SELECT poll_id, question, type, create_date, close_date, share_link FROM polls WHERE author = $1", [validation.user_id]);
      client.release();

      if(pollsList.length > 0){

        // Get number of responses for each poll in pollsList using getNumResponses(poll_id), then return that plus the other fields we got from the DB
        const pollsWithResponses = await Promise.all(
          pollsList.map(async (poll) => {
            const numResponses = await getNumResponses(poll.poll_id);
            return {...poll, numResponses}
         }));

         return {status: "SUCCESS", polls: pollsWithResponses}


      }else{
        return {status: "FAILURE", error: "You have not created any polls yet."};
      }
    }else{
      client.release();
      return {status: "FAILURE", error: "Only users can access this data."};
    }
  } catch(error){
    console.log("SERVER: Error getting all user's polls: " + error);
  }

  return {status: "FAILURE", error: "Server failed to retrieve all users's polls."};
}


// Get list of all polls on the site -- admin only
export async function getAllPolls(){
  console.log("SERVER: entering getAllPolls");

  try{ const client = await pool.connect();

    // Validate that this is an admin
    const validation = await validateAdmin();
    if(validation.status === "SUCCESS"){

      // Get all polls
      const {rows: pollsList} = await client.query("SELECT p.poll_id, p.question, p.type,p.create_date, p.close_date, p.share_link, u.username FROM polls p INNER JOIN users u ON p.author = u.user_id");
      client.release();

      if(pollsList.length > 0){

        // Get number of responses for each poll in pollsList using getNumResponses(poll_id), then return that plus the other fields we got from the DB
        const pollsWithResponses = await Promise.all(
          pollsList.map(async (poll) => {
            const numResponses = await getNumResponses(poll.poll_id);
            return {...poll, numResponses}
         }));

         return {status: "SUCCESS", polls: pollsWithResponses}


      }else{
        return {status: "FAILURE", error: "No polls created yet."};
      }
    }else{
      client.release();
      return {status: "FAILURE", error: "Only admins can access this data."};
    }
  } catch(error){
    console.log("SERVER: Error getting all polls: " + error);
  }

  return {status: "FAILURE", error: "Server failed to retrieve all polls."};
}


// Get summary stats about the site -- admin only
export async function getSummaryStats(){
  console.log("SERVER: entering getSummaryStats");

  try{ const client = await pool.connect();

    // Validate that this is an admin
    const validation = await validateAdmin();
    if(validation.status === "SUCCESS"){
      
      // Get number of users
      const {rows: users} = await client.query("SELECT username FROM users WHERE username IS NOT NULL");
      const numUsers = users.length;

      // Get number of polls
      const {rows: polls} = await client.query("SELECT poll_id FROM polls");
      const numPolls = polls.length;

      // Get number of votes
      const {rows: votes} = await client.query("SELECT response_id FROM responses");
      const numVotes = votes.length;

      client.release();
      return{status: "SUCCESS", stats:{numUsers, numPolls, numVotes} }

    }else{
      client.release();
      return {status: "FAILURE", error: "Only admins can access this data."};
    }
  } catch(error){
    console.log("SERVER: Error getting summary data: " + error);
  }

  return {status: "FAILURE", error: "Server failed to retrieve summary data."};
}