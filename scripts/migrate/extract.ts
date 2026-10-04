import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

const MONGODB_URI = process.env.MONGODB_URI || "";
const OUTPUT_DIR = path.join(__dirname, "data");

async function extract() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is required");
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db("learning-med");

  const collections = ["users", "courses", "sessions", "contentBlocks", "comments", "visits"];

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const collectionName of collections) {
    const collection = db.collection(collectionName);
    const documents = await collection.find({}).toArray();
    const outputPath = path.join(OUTPUT_DIR, `${collectionName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2));
    console.log(`Extracted ${documents.length} documents from ${collectionName}`);
  }

  await client.close();
  console.log("Extraction complete!");
}

extract().catch(console.error);
