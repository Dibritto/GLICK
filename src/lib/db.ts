import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
// No ambiente de preview do AI Studio, forçamos SQLite se o host for localhost
// pois o banco MySQL da Hostinger não é acessível daqui.
const isPreviewEnv = process.env.APP_URL?.includes('run.app') || process.env.SHARED_APP_URL?.includes('run.app');
const useSqlite = !process.env.DB_HOST || (process.env.DB_HOST === 'localhost' && isPreviewEnv);

const dbConfig = useSqlite 
  ? {
      client: 'better-sqlite3',
      connection: {
        filename: './data.sqlite'
      },
      useNullAsDefault: true,
      pool: {
        afterCreate: (conn: any, cb: any) => {
          conn.pragma('journal_mode = WAL');
          conn.pragma('foreign_keys = ON');
          cb(null, conn);
        }
      }
    }
  : {
      client: 'mysql2',
      connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: isProduction ? { rejectUnauthorized: false } : false
      },
      pool: { min: 0, max: 7 }
    };

console.log(`🗄️ Database mode: ${useSqlite ? 'SQLite (Preview)' : 'MySQL (Production)'}`);
const db = knex(dbConfig);

export default db;
