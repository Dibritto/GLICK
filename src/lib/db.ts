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
    host: process.env.DB_HOST || 'srv1601.hstgr.io',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 20000, // 20 segundos para conectar
    waitForConnections: true, // Recomendação Hostinger
    connectionLimit: 5, // Recomendação Hostinger (alinhado com pool.max)
    queueLimit: 0, // Sem limite de fila
  },
  pool: { 
    min: 2, 
    max: 5,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    idleTimeoutMillis: 600000, // 10 minutos
    reapIntervalMillis: 1000,
    propagateCreateError: true, // Falhar rápido se houver erro de conexão (ex: IP bloqueado)
    afterCreate: (conn: any, done: any) => {
      conn.query('SELECT 1', (err: any) => {
        done(err, conn);
      });
    }
  },
  // Timeout global para todas as queries para evitar conexões presas
  postProcessResponse: (result: any) => result,
  asyncStackTraces: !isProduction,
};

const db = knex(dbConfig);

// Adicionar listener de erro para diagnosticar ECONNRESET e outros problemas de conexão
db.on('error', (err: any) => {
  console.error('❌ Erro crítico no banco de dados:', err);
  if (err.code === 'ECONNRESET') {
    console.error('⚠️ Conexão resetada pelo servidor. O pool tentará reconectar na próxima requisição.');
  }
});

export default db;
