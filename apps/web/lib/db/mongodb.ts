import { MongoClient } from "mongodb"

import { resolveMongoDbName } from "@/lib/db/mongo-db-name"

let clientPromise: Promise<MongoClient> | null = null

function getConnectionUri(): string {
  const uri = process.env.MONGODB_URI ?? process.env.DATABASE_MONGODB_URI ?? ""
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set")
  }
  return uri
}

function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise
  }

  const uri = getConnectionUri()

  if (process.env.NODE_ENV === "development") {
    const globalForMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalForMongo._mongoClientPromise) {
      globalForMongo._mongoClientPromise = new MongoClient(uri).connect()
    }

    clientPromise = globalForMongo._mongoClientPromise
  } else {
    clientPromise = new MongoClient(uri).connect()
  }

  return clientPromise
}

export async function getDb() {
  const uri = getConnectionUri()
  const client = await getClientPromise()
  return client.db(resolveMongoDbName(uri))
}
