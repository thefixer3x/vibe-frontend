import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Use a dummy URL for build time if POSTGRES_URL is not set
const DATABASE_URL = process.env.POSTGRES_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

// Only connect to database if we have a real connection string
let client: postgres.Sql | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: ReturnType<typeof drizzle> | any = null;

try {
  if (DATABASE_URL && !DATABASE_URL.includes('dummy')) {
    client = postgres(DATABASE_URL);
    db = drizzle(client, { schema });
  } else {
    // Create a mock db for build time
    db = {
      select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
      insert: () => ({ values: () => Promise.resolve({ insertId: 'mock' }) }),
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
      delete: () => ({ where: () => Promise.resolve() })
    };
  }
} catch (_error) {
  console.warn('Database connection failed, using mock database');
  db = {
    select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
    insert: () => ({ values: () => Promise.resolve({ insertId: 'mock' }) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    delete: () => ({ where: () => Promise.resolve() })
  };
}

export { client, db };
