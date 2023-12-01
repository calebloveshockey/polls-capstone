// ---- SCRIPTS TO INITIALIZE DATABASE -------
// Runs automatically when server starts up

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

console.log("Running dbinitializer");

// Function that creates tables and fills with data
const createTablesAndData = async () => {

  const pool1 = new Pool({
    connectionString: process.env.POSTGRES_URL + "?sslmode=require",
  });

    try {
      // Connect to the database
      const client = await pool1.connect();
  
      // --- CREATE TABLES ---

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          username VARCHAR(100),
          passwordhash VARCHAR(100),
          type VARCHAR(20) NOT NULL
        )`);
        console.log('Table "users" created successfully.');

      // Keys table
      await client.query(`
        CREATE TABLE IF NOT EXISTS keys (
        key_id SERIAL PRIMARY KEY,
        key VARCHAR(200) NOT NULL,
        user_id INTEGER NOT NULL,
        datetime_issued TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )`);
      console.log('Table "keys" created successfully.');

      // Polls table
      await client.query(`
        CREATE TABLE IF NOT EXISTS polls (
          poll_id SERIAL PRIMARY KEY,
          question VARCHAR(1000) NOT NULL,
          description VARCHAR(1000),
          type VARCHAR(20) NOT NULL,
          create_date TIMESTAMP NOT NULL,
          close_date TIMESTAMP NOT NULL,
          share_link VARCHAR(500) NOT NULL,
          author INTEGER NOT NULL,
          FOREIGN KEY (author) REFERENCES users(user_id)
        )`);
        console.log('Table "polls" created successfully.');

      // Options table
      await client.query(`
        CREATE TABLE IF NOT EXISTS options (
          option_id SERIAL PRIMARY KEY,
          option_name VARCHAR(1000) NOT NULL,
          poll_id INTEGER NOT NULL,
          FOREIGN KEY (poll_id) REFERENCES polls(poll_id)
        )`);
        console.log('Table "options" created successfully.');

      // Responses table
      await client.query(`
        CREATE TABLE IF NOT EXISTS responses (
          response_id SERIAL PRIMARY KEY,
          poll_id INTEGER NOT NULL,
          option_id INTEGER NOT NULL,
          responder INTEGER NOT NULL,
          rank INTEGER,
          FOREIGN KEY (poll_id) REFERENCES polls(poll_id),
          FOREIGN KEY (option_id) REFERENCES options(option_id)
        )`);
        console.log('Table "responses" created successfully.');
  
      // Comments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS comments (
          comment_id SERIAL PRIMARY KEY,
          date TIMESTAMP NOT NULL,
          comment_text VARCHAR(10000) NOT NULL,
          user_id INTEGER NOT NULL,
          poll_id INTEGER NOT NULL,
          parent_comment INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(user_id),
          FOREIGN KEY (poll_id) REFERENCES polls(poll_id),
          FOREIGN KEY (parent_comment) REFERENCES comments(comment_id)
        )`);
        console.log('Table "comments" created successfully.');

      // Release the client instance
      client.release();
    } catch (error) {
      console.error('Error creating table and data:', error);
    } finally {
      // Close the pool connection
      pool1.end();
    }
  };

// Creates initial admin and user accounts
const createAutomaticAccounts = async () => {
  const pool3 = new Pool({
    connectionString: process.env.POSTGRES_URL + "?sslmode=require",
  });

  try {
    // Connect to the default postgres database
    const client = await pool3.connect();

    // Create Automatic Admin
    // Ensure username is unique
    const { rows: usernameCheck } = await client.query(`SELECT username FROM users WHERE username=$1`, [process.env.AUTOMATIC_ADMIN_USER])
    if (usernameCheck.length > 0) {
      console.log('Automatic Admin already exists.');    
    }else{
      // Hash password
      const hashedPassword = await bcrypt.hash(process.env.AUTOMATIC_ADMIN_PW, 10); // 10 is the number of salt rounds

      // Insert new user into the database using parameterized query
      await client.query(
        'INSERT INTO users (username, passwordhash, type) VALUES ($1, $2, $3)', 
        [process.env.AUTOMATIC_ADMIN_USER, hashedPassword, "admin"]
      );
      console.log("Automatic Admin created.");
    }

    // Create Automatic User
    // Ensure username is unique
    const { rows: usernameCheck2 } = await client.query(`SELECT username FROM users WHERE username=$1`, [process.env.AUTOMATIC_TEST_USER])
    if (usernameCheck2.length > 0) {
      console.log('Automatic Test User already exists.');    
    }else{
      // Hash password
      const hashedPassword2 = await bcrypt.hash(process.env.AUTOMATIC_TEST_PW, 10); // 10 is the number of salt rounds

      // Insert new user into the database using parameterized query
      await client.query(
        'INSERT INTO users (username, passwordhash, type) VALUES ($1, $2, $3)', 
        [process.env.AUTOMATIC_TEST_USER, hashedPassword2, "user"]
      );
      console.log("Automatic Test User created.");
    }

    client.release();

  }catch (error) {
    console.error('Error creating automatic accounts:', error);
  } finally {
    // Close the pool connection
    pool3.end();
  }

}


// Creates initial database
const createDatabase = async () => {
  const pool2 = new Pool({
    connectionString: process.env.POSTGRES_URL + "?sslmode=require",
  });

  try {
    // Connect to the default postgres database
    const client = await pool2.connect();

    // Check if the database exists
    const queryResult = await client.query(
      `SELECT datname FROM pg_catalog.pg_database WHERE datname = $1`,
      [process.env.DB_NAME]
    );

    if (queryResult.rowCount === 0) {
      // Database doesn't exist, create it
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database ${process.env.DB_NAME} created successfully.`);

      // Create tables
      createTablesAndData();
      createAutomaticAccounts();

    } else {
      console.log(`Database ${process.env.DB_NAME} already exists.`);
      createTablesAndData();
      createAutomaticAccounts();
    }

    // Release the client instance
    client.release();
  } catch (error) {
    console.error('Error creating database:', error);
  } finally {
    // Close the pool connection
    pool2.end();
  }
};

createDatabase();
