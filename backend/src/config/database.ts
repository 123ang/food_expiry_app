import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseAdapter {
  query<T extends QueryResultRow = any>(
    text: string,
    params?: readonly unknown[]
  ): Promise<QueryResult<T>>;
  getClient?: () => Promise<PoolClient>;
}

let pool: Pool | undefined;
let injectedDatabase: DatabaseAdapter | undefined;

const isTestEnvironment = () => process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

const getDatabaseUrl = (): string => {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    const message = 'DATABASE_URL is not set. Expected postgresql://username:password@localhost:5432/database_name';

    if (isTestEnvironment()) {
      throw new Error(message);
    }

    console.error(message);
    process.exit(1);
  }

  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    const message = `Invalid DATABASE_URL format: ${dbUrl.substring(0, 20)}...`;

    if (isTestEnvironment()) {
      throw new Error(message);
    }

    console.error('DATABASE_URL must start with postgresql:// or postgres://');
    console.error(message);
    process.exit(1);
  }

  return dbUrl;
};

const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err: Error) => {
      console.error('Unexpected database error:', err);
    });
  }

  return pool;
};

export const setDatabaseForTesting = (database?: DatabaseAdapter) => {
  if (!isTestEnvironment()) {
    throw new Error('setDatabaseForTesting can only be used while NODE_ENV=test');
  }

  injectedDatabase = database;
};

// Helper function to execute queries
export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: readonly unknown[]
) => {
  try {
    const res = injectedDatabase
      ? await injectedDatabase.query<T>(text, params)
      : await getPool().query<T>(text, params as unknown[]);
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper function to get a client from the pool
export const getClient = async (): Promise<PoolClient> => {
  if (injectedDatabase?.getClient) {
    return await injectedDatabase.getClient();
  }

  return await getPool().connect();
};

export const closeDatabase = async () => {
  injectedDatabase = undefined;

  if (pool) {
    await pool.end();
    pool = undefined;
  }
};

export default {
  query,
  getClient,
  closeDatabase,
};
