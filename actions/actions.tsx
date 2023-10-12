"use server";

import { Pool } from "pg";
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
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






export async function login(username: string, password: string) {
  console.log("SERVER: Entering login");
  try {
    const client = await pool.connect();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

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