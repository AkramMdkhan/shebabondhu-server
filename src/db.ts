import "dotenv/config";
import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "shebabondhu";

if (!uri) {
  throw new Error("MONGODB_URI is missing in the .env file");
}

const client = new MongoClient(uri);
let db: Db | undefined;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;
  await client.connect();
  db = client.db(dbName);
  console.log("Connected to MongoDB");
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("Database is not connected yet");
  }
  return db;
}