import { Pool, QueryResult, QueryResultRow } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (process.env.NODE_ENV === "production") {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  } else {
    // Prevent multiple pools during hot reloading in Next.js development mode
    const globalWithDb = global as typeof globalThis & {
      _postgresPool?: Pool;
    };

    if (!globalWithDb._postgresPool) {
      globalWithDb._postgresPool = new Pool({
        connectionString,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    }
    pool = globalWithDb._postgresPool;
  }

  return pool;
}

/**
 * Execute a raw SQL query.
 * @param text SQL query string
 * @param params Parameterized query variables
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const activePool = getPool();
    const res = await activePool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "production") {
      console.log("Executed query", { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error("Database query failed:", { text, error });
    throw error;
  }
}

export default getPool;
