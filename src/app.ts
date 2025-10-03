import express from "express";
import userRoutes from "./routes/user.routes.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// ✅ Corriger __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Servir les fichiers uploadés
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.use(
  cors({
    origin: "http://localhost:5173", // l’URL de ton frontend React (Vite)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/api", userRoutes);
// console.log("UPLOADS DIR:", path.join(__dirname, "../public/uploads"));
export default app;
