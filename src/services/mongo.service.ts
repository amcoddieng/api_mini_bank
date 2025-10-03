import { MongoClient, ServerApiVersion } from "mongodb";


const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017"

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
let db: any;
export async function connectDB() {
  try {
    if (!db) {
      await client.connect();
      db = client.db("minibank"); 
      console.log("✅ Connecté à MongoDB Atlas");
    }
    return db;
  } catch (err) {
    console.error("❌ Erreur de connexion MongoDB :", err);
    process.exit(1);
  }
}

