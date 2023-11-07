"use server";

import { Pool } from "pg";
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});
  


export async function createThing() {
    console.log("Entering createThing");
  try {
    const client = await pool.connect();

    // Query the "things" table
    const { rows } = await client.query("INSERT INTO things (name, fruit) VALUES ('Adam', 'Bonan');");
    console.log(rows);

    // Close the database connection
    client.release();

  } catch (error) {
    console.error('Error creating thing: ', error);
  }
};



// Create new user account
export async function createAccount(email: string, username: string, password: string) {
  console.log("Entering createAccount");
  try {
    const client = await pool.connect();

    // Ensure email is unique
    const { rows: emailCheck } = await client.query(`SELECT email FROM users WHERE email=$1`, [email])
    if (emailCheck.length > 0) {
      console.log('Email already exists.');

      // Close the database connection
      client.release();

      // Handle the case where the email already exists
      return "Error: Email already exists.";

    }else{
    
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

      // Insert new user into the database using parameterized query
      const { rows: creation } = await client.query(
        'INSERT INTO users (email, username, passwordhash, type) VALUES ($1, $2, $3, $4)', 
        [email, username, hashedPassword, "user"]
      );

      console.log(creation);

      // Close the database connection
      client.release();
      return "SUCCESS";

    }

  } catch (error) {
    console.error('Error creating user: ', error);
    return "Error: " + error;
  }
};



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

      // Store the key in the "keys" table in your database
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



// Validate that user has a valid session key
export async function validate(){
  console.log("SERVER: Entering validate");
  try {

    const client = await pool.connect();

    //Check if cookie with name "key" exists
    const sessionKey = cookies().get('key');
    if(sessionKey){

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

          // Session is still valid; fetch corresponding username
          const {rows: userData} = await client.query('SELECT username FROM users WHERE user_id = $1', [keyInfo.user_id]);

          // Ensure existing user
          if (userData.length > 0 ){
            const username = userData[0].username;

            client.release();
            return {status: 'SUCCESS', username: username}
          }
        }
      }
    }

    // Failed to verify
    client.release();
    return {status: 'FAILURE'};

  }
  catch (error) {
    console.error('Error validating: ', error);
    return {status: 'ERROR', error: error};
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
    console.error('Error logging out: ', error);
  }

  cookies().delete("key");
}



// Gets data associated with user
export async function getUserData(){

  // Validate 
  const validation = await validate();

  if(validation.status && validation.status === "SUCCESS" && validation.username){

    try{
      const client = await pool.connect();

      const {rows: userData} = await client.query('SELECT email, username, type FROM users WHERE username = $1', [validation.username])

      if(userData.length > 0){
        client.release();
        return{
          status: 'SUCCESS',
          username: userData[0].username,
          email: userData[0].email,
          type: userData[0].type,
        }
      }


      client.release();
    }
    catch(error){
      console.log('Error getting use data: ', error);
    }
  }

  return {
    status: "FAILURE", 
    username: "FAILURE",
    email: "FAILURE",
    type: "FAILURE",
  };
}


// Change user password
export async function changePassword(oldPass: string, newPass: string){
  console.log("SERVER: entering change password");

  // Validate user token to confirm they are authorized and to get username
  const validation = await validate();
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
      console.log('Error getting use data: ', error);
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
    console.log("ERROR: generating unique share code: " + error);
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

  // Validate user token to confirm they are authorized and to get username
  const validation = await validate();
  if(validation.status && validation.status === "SUCCESS" && validation.username){

    try{
      const client = await pool.connect();

      // Get user id
      const {rows: userData} = await client.query('SELECT user_id FROM users WHERE username = $1', [validation.username])
      if (userData.length > 0) {

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
              userData[0].user_id, 
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
            console.log('Transaction committed successfully');

            return{status: "SUCCESS", shareCode: code};
          }

        } catch (error) {
          // If any operation fails, roll back the transaction
          await client.query('ROLLBACK');
          console.error('Error in transaction:', error);
        } finally {
          // Release the client back to the pool
          client.release();
        }
      }

      client.release();
    }
    catch(error){
      console.log('Error creating poll: ', error);
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
    const {rows: pollData} = await client.query("SELECT type FROM polls WHERE share_link = $1", [shareCode]);

    if(pollData.length === 1){
        client.release();
        return {status: "SUCCESS", pollType: pollData[0].type};
    }

    client.release();
  }catch(error){
    console.log("Error retrieving poll data: " + error);
  }


  return{
    status: "FAILURE",
    pollType: "",
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
    console.log("Error retrieving poll data: " + error);
  }


  return{
    status: "FAILURE",
    pollData: {},
    options: [],
  }
}


// Cast vote on a poll
export async function castVote(poll_id: string, option_id: string, fakeUserId: number){
  console.log("SERVER: entering cast vote");

  // Check for user/validate
  const validation = await validate();
  if(validation.status && validation.status === "SUCCESS" && validation.username){

    // vote with a userid
    try{
      const client = await pool.connect();
      
      // Get user id
      const {rows: userData} = await client.query('SELECT user_id FROM users WHERE username = $1', [validation.username])
      if (userData.length > 0) {

        const result = await client.query('INSERT INTO responses (poll_id, option_id, responder) VALUES ($1, $2, $3)', [poll_id, option_id, userData[0].user_id]);
        client.release();
        return({status: "SUCCESS"});
      }
      client.release();
    }catch(error){
      console.log("Error voting: " + error);
    }
  }else{
    //vote without a userid

    try{
      const client = await pool.connect();
      
      const result = await client.query('INSERT INTO responses (poll_id, option_id, responder) VALUES ($1, $2, $3)', [poll_id, option_id, fakeUserId]);
      client.release();
      return({status: "SUCCESS"}); 

    }catch(error){
      console.log("Error voting: " + error);
    }
  }

  return{status: "FAILURE"};
}

// Cast vote on a poll
export async function castRankedVote(poll_id: string, option_id: string, ranking: number, fakeUserId: number){
  console.log("SERVER: entering cast vote");

  // Check for user/validate
  const validation = await validate();
  if(validation.status && validation.status === "SUCCESS" && validation.username){

    // vote with a userid
    try{
      const client = await pool.connect();
      
      // Get user id
      const {rows: userData} = await client.query('SELECT user_id FROM users WHERE username = $1', [validation.username])
      if (userData.length > 0) {

        const result = await client.query('INSERT INTO responses (poll_id, option_id, responder, rank) VALUES ($1, $2, $3, $4)', [poll_id, option_id, userData[0].user_id, ranking]);
        client.release();
        return({status: "SUCCESS"});
      }
      client.release();
    }catch(error){
      console.log("Error voting: " + error);
    }
  }else{
    //vote without a userid

    try{
      const client = await pool.connect();
      
      const result = await client.query('INSERT INTO responses (poll_id, option_id, responder, rank) VALUES ($1, $2, $3, $4)', [poll_id, option_id, fakeUserId, ranking]);
      client.release();
      return({status: "SUCCESS"}); 

    }catch(error){
      console.log("Error voting: " + error);
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
    const {rows: pollData} = await client.query("SELECT poll_id FROM polls WHERE share_link = $1", [shareCode]);

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
      return genericOptionVotes;

    }

    client.release();
    return [{option_name: "None", numVotes: 0, votePercentage: 0}];
  }catch(error){
    console.log("Error voting: " + error);
  }            


return [{option_name: "None", numVotes: 0, votePercentage: 0}];

}


// Get all votes for an approval poll
export async function getApprovalVotes(shareCode: string){
  console.log("SERVER: Entering get approval votes");

  try{
    const client = await pool.connect();

    // Get poll id
    const {rows: pollData} = await client.query("SELECT poll_id FROM polls WHERE share_link = $1", [shareCode]);

    if(pollData.length === 1){
    
      // Get all votes for this poll_id
      const {rows: voteData} = await client.query('SELECT option_id, responder FROM responses WHERE poll_id = $1', [pollData[0].poll_id]);

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

      //Tabulate number of unique voters
      const numUniqueVoters = new Set(voteData.map(vote => vote.responder)).size;


      // Calculate and set vote percentages 
      // CHATGPT WORK: change this to calculate what percentage of unique voters voted for each option, not based on total votes cast
      Object.values(optionVotes).forEach((option) => {
        option.votePercentage = +((option.numVotes / numUniqueVoters) * 100).toFixed(1);
      });

      client.release();
      const genericOptionVotes : {option_name: string, numVotes: number, votePercentage: number}[] = Object.values(optionVotes);
      return {voters: numUniqueVoters, votes: genericOptionVotes};

    }

    client.release();
    return {voters: 0, votes: [{option_name: "None", numVotes: 0, votePercentage: 0}]};
  }catch(error){
    console.log("Error voting: " + error);
  }            


return {voters: 0, votes: [{option_name: "None", numVotes: 0, votePercentage: 0}]};

}



// Get all votes for a traditional poll
export async function getRankedVotes(shareCode: string){
  console.log("SERVER: Entering get trad votes");

  try{
    const client = await pool.connect();

    // Get poll id
    const {rows: pollData} = await client.query("SELECT poll_id FROM polls WHERE share_link = $1", [shareCode]);

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
      return genericOptionVotes;

    }

    client.release();
    return [{option_name: "None", numVotes: 0, votePercentage: 0}];
  }catch(error){
    console.log("Error voting: " + error);
  }            


return [{option_name: "None", numVotes: 0, votePercentage: 0}];

}