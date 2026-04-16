import { MongoClient, Db, Collection } from 'mongodb';
import { env, getEnv } from './env';

type GlobalWithMongo = typeof globalThis & {
  __mongoClient?: MongoClient;
  __mongoClientPromise?: Promise<MongoClient>;
};

const g = globalThis as GlobalWithMongo;

export async function getMongoClient(): Promise<MongoClient> {
  if (!env.MONGODB_URI) getEnv('MONGODB_URI');

  if (g.__mongoClient) return g.__mongoClient;
  if (!g.__mongoClientPromise) {
    const client = new MongoClient(env.MONGODB_URI);
    g.__mongoClientPromise = client.connect().then((c) => {
      g.__mongoClient = c;
      return c;
    });
  }
  return g.__mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  // Prefer explicit DB name, otherwise use the DB name from the MongoDB URI.
  const explicit = process.env.MONGODB_DB;
  if (explicit && explicit.trim().length > 0) return client.db(explicit.trim());
  return client.db();
}

export async function getCollection<T extends object>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

