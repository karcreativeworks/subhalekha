import { config } from "dotenv"
import { MongoClient } from "mongodb"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { resolveMongoDbName } from "../lib/db/mongo-db-name"

const scriptDir = fileURLToPath(new URL(".", import.meta.url))
config({ path: resolve(scriptDir, "../.env") })

const DEFAULT_CLIENT_ID = "subhakar"
const DEFAULT_CLIENT_KEY = "srilekhalovesme"

async function main() {
  const uri = process.env.MONGODB_URI ?? process.env.DATABASE_MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI is not set")
  }

  const clientId = process.env.SEED_ADMIN_CLIENT_ID ?? DEFAULT_CLIENT_ID
  const clientKey = process.env.SEED_ADMIN_CLIENT_KEY ?? DEFAULT_CLIENT_KEY
  const dbName = resolveMongoDbName(uri)

  const client = new MongoClient(uri)

  try {
    await client.connect()
    const col = client.db(dbName).collection("admin_clients")

    await col.createIndex({ clientId: 1 }, { unique: true })
    await col.createIndex({ apiKey: 1 }, { unique: true })

    const result = await col.updateOne(
      { clientId },
      {
        $set: {
          clientId,
          apiKey: clientKey,
          clientName: "Admin",
          isValid: true,
          updatedAt: new Date(),
        },
        $addToSet: {
          access: "superAdmin",
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    const action = result.upsertedCount > 0 ? "Created" : "Updated"
    console.log(`${action} admin client in "${dbName}.admin_clients":`)
    console.log(`  clientId: ${clientId}`)
    console.log(`  clientKey: ${clientKey}`)
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error("Seed failed:", error)
  process.exit(1)
})
