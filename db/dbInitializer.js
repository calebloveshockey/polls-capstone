// ---- SCRIPTS TO INITIALIZE DATABASE -------
// Runs automatically when server starts up

const { Pool } = require('pg');

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

      // Example things table with some random data TODO delete
      await client.query(`
        CREATE TABLE IF NOT EXISTS things (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          fruit VARCHAR(100) NOT NULL
        )
      `);
      // Generate random names and fruits
      const names = ['John', 'Jane', 'Alice', 'Bob'];
      const fruits = ['Apple', 'Banana', 'Orange', 'Mango'];
      const getRandomIndex = (array) => Math.floor(Math.random() * array.length);
      // Insert three random rows into the "things" table
      for (let i = 0; i < 3; i++) {
        const randomName = names[getRandomIndex(names)];
        const randomFruit = fruits[getRandomIndex(fruits)];
  
        await client.query(
          `INSERT INTO things (name, fruit) VALUES ($1, $2)`,
          [randomName, randomFruit]
        );
      };

      console.log('Table "things" created successfully.');

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          email VARCHAR(100) NOT NULL,
          username VARCHAR(100) NOT NULL,
          passwordhash VARCHAR(100) NOT NULL,
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
          type VARCHAR(20),
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
          poll_id INTEGER NOT NULL,
          option_id INTEGER NOT NULL,
          responder INTEGER NOT NULL,
          rank INTEGER,
          PRIMARY KEY (poll_id, option_id, responder),
          FOREIGN KEY (poll_id) REFERENCES polls(poll_id),
          FOREIGN KEY (option_id) REFERENCES options(option_id),
          FOREIGN KEY (responder) REFERENCES users(user_id)
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

    } else {
      console.log(`Database ${process.env.DB_NAME} already exists.`);
      createTablesAndData();
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
