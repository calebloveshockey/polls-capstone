import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

import {cache} from 'react';

export const getData = async () => {
    console.log("Entering getData");
  try {
    const client = await pool.connect();

    // Query the "things" table
    const { rows } = await client.query('SELECT * FROM things');

    // Close the database connection
    client.release();

    return {rowData : rows[0]};

  } catch (error) {
    console.error('Error fetching data:', error);
    return {rowData : null};
  }
};

export default async function ThingsComponent() {
    const rowData = await getData();
    console.log(rowData);
  return (
    <div>
      {rowData ? (
        <div>
          <h1>Name: {rowData.rowData.name}</h1>
          <h2>Fruit: {rowData.rowData.fruit}</h2>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export { ThingsComponent };
