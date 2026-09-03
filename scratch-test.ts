import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error with raw connectionString:', err);
  } else {
    console.log('Success with raw connectionString:', res.rows);
  }
});

const urlWithoutParams = connectionString.split('?')[0];
const pool2 = new Pool({ connectionString: urlWithoutParams, ssl: true });
pool2.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error with ssl: true:', err);
  } else {
    console.log('Success with ssl: true:', res.rows);
  }
  process.exit(0);
});
