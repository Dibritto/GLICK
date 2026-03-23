import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da raiz do projeto explicitamente
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.DB_HOST) {
  throw new Error('CONFIGURAÇÃO AUSENTE: DB_HOST não definido no ambiente. O sistema exige MySQL para operação.');
}

const dbConfig = {
  client: 'mysql2',
  connection: {
    host: '193.203.175.136',
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  },
  pool: { 
    min: 1, 
    max: 5,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    afterCreate: (conn: any, done: any) => {
      conn.query('SELECT 1', (err: any) => {
        done(err, conn);
      });
    }
  }
};

const db = knex(dbConfig);

export default db;
