import { MongoClient } from "mongodb"

import { resolveMongoDbName } from "@/lib/db/mongo-db-name"

const globalForMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

function getConnectionUri(): string {
  const uri = process.env.MONGODB_URI ?? process.env.DATABASE_MONGODB_URI ?? ""
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set")
  }
  return uri
}

function getClientPromise(): Promise<MongoClient> {
  if (globalForMongo._mongoClientPromise) {
    return globalForMongo._mongoClientPromise
  }

  const uri = getConnectionUri()
  const client = new MongoClient(uri)
  globalForMongo._mongoClientPromise = client.connect()
  return globalForMongo._mongoClientPromise
}

export async function getDb() {
  const uri = getConnectionUri()
  const client = await getClientPromise()
  return client.db(resolveMongoDbName(uri))
}
