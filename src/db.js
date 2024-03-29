import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}
// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development mode, þ.e.a.s. á local vél
const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(q, values = []) {
  const client = await pool.connect();

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    console.error('Error selecting', e);
  } finally {
    client.release();
  }
  return null;
}

/**
 * Bætir við undirskrift.
 *
 * @param {array} data Fylki af gögnum fyrir umsókn
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
export async function insert(data) {
  const q = 'INSERT INTO signatures(name, nationalId, comment, anonymous) VALUES ($1, $2, $3, $4)';
  const values = [data.name, data.nationalId, data.comment, data.anonymous];

  return query(q, values);
}

/**
 * Sækir allar undirskriftir
 *
 * @returns {array} Fylki af öllum umsóknum
 */
export async function select() {
  const result = await query('SELECT * FROM signatures ORDER BY id');

  return result.rows;
}
