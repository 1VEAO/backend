// server/index.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import fs from "fs";
import csv from "csv-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Para manejar __dirname en ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== CORS CONFIG ======
app.use(cors({
 origin: [
  "http://localhost:5173",
  "https://lucent-piroshki-c15011.netlify.app"
 ],
 methods: ["GET", "POST", "PUT", "DELETE"],
 credentials: true
}));

app.use(express.json());

// ====== MONGO CONNECTION ======
const mongoUrl = process.env.DB_DIRECT;
const client = new MongoClient(mongoUrl);

async function connectDB() {
 try {
  await client.connect();
  console.log("✅ Conectado a MongoDB Atlas");
 } catch (error) {
  console.error("❌ Error conectando a MongoDB:", error);
 }
}
connectDB();

// ====== CSV ROUTES ======
const csvRoutes = [
 { path: "/cursos", file: "cursos_programas_100.csv", separator: ";" },
 { path: "/programas", file: "programas_2024.csv", separator: ";" }
];

csvRoutes.forEach(route => {
 app.get(route.path, (req, res) => {
  const results = [];
  const filePath = path.join(__dirname, "data", route.file);

  fs.createReadStream(filePath)
   .pipe(csv({ separator: route.separator }))
   .on("data", (data) => results.push(data))
   .on("end", () => {
    res.json(results);
   })
   .on("error", (err) => {
    console.error(`Error leyendo ${route.file}:`, err);
    res.status(500).json({ error: "Error leyendo archivo CSV" });
   });
 });
});

// ====== TEST ROUTE ======
app.get("/", (req, res) => {
 res.send("Servidor funcionando 🚀");
});

// ====== START SERVER ======
app.listen(PORT, () => {
 console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
