import { MongoClient, ServerApiVersion } from "mongodb";


const uri = process.env.MONGO_URI || "mongodb+srv://dieng0097_db_user:AMeBE2h5Pu1xPDk7@cluster0.w6u76du.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

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

