// server/index.js
import express from 'express';
import dotenv from 'dotenv';
import { readCSV } from './utils/readCSV.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { MongoClient } from 'mongodb';
import 'dotenv/config';

dotenv.config();

// 🔐 Verifica que la URL de Mongo esté definida
const mongoUrl = process.env.DB_DIRECT;
if (!mongoUrl || !mongoUrl.startsWith("mongodb")) {
 throw new Error("❌ DB_DIRECT no está definida o es inválida");
}

const client = new MongoClient(mongoUrl, { tls: true });

const run = async () => {
 try {
  await client.connect();
  console.log('✅ Conectado a la base de datos MongoDB');
 } catch (err) {
  console.error('❌ Error conectando a la base de datos:', err);
 }
};

run().catch(console.error);

const app = express();
app.use(express.json());

// ✅ Middleware CORS personalizado
const allowedOrigins = [
 "http://localhost:5173",
 "https://lucent-piroshki-c15011.netlify.app"
];

app.use((req, res, next) => {
 const origin = req.headers.origin;
 if (allowedOrigins.includes(origin)) {
  res.setHeader("Access-Control-Allow-Origin", origin);
 }
 res.setHeader("Access-Control-Allow-Credentials", "true");
 res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
 res.setHeader("Access-Control-Allow-Headers", "Content-Type");
 next();
});

// ✅ Manejo de preflight (OPTIONS)
app.options("*", (req, res) => {
 res.sendStatus(200);
});

const routes = [
 { path: '/cursos', file: 'server/data/cursos_programas_100.csv', separator: ';' },
 { path: '/demandaLenguajes', file: 'server/data/demanda_laboral_lenguajes.csv', separator: ',' },
 { path: '/demandaLenguajesExtranjero', file: 'server/data/demanda_laboral_extranjero.csv', separator: ';' },
 { path: '/preferenciaLenguajes', file: 'server/data/preferencias_lenguajes.csv', separator: ',' },
 { path: '/preferenciaLenguajesExtranjero', file: 'server/data/preferencias_lenguajes_extranjero.csv', separator: ',' }
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Ruta MongoDB
app.put('/usuario', async (req, res) => {
 const db = client.db('mibasedatos');
 const { nombre, apellido, pais, edad, email } = req.body;
 try {
  const result = await db.collection('usuarios').insertOne({
   nombre,
   apellido,
   pais,
   edad,
   email
  });
  res.status(200).json({ message: 'Usuario agregado', result });
 } catch (err) {
  console.error('❌ Error agregando usuario:', err);
  res.status(500).json({ error: 'Error agregando usuario' });
 }
});

// ✅ Ruta JSON
app.get('/', (req, res) => {
 try {
  const lenguajesPath = path.join(__dirname, 'data', 'lenguajes.json');
  const lenguajes = JSON.parse(fs.readFileSync(lenguajesPath, 'utf8'));
  res.json(lenguajes);
 } catch (err) {
  console.error('❌ Error leyendo lenguajes.json:', err);
  res.status(500).json({ error: 'No se pudo leer lenguajes.json' });
 }
});

// ✅ Rutas CSV con normalización
routes.forEach(route => {
 const basePath = route.path.replace(/\/$/, ""); // elimina barra final si existe

 app.get(basePath, async (req, res) => {
  try {
   const data = await readCSV(route.file, route.separator);
   res.json(data);
  } catch (err) {
   console.error(`❌ Error leyendo CSV (${route.file}):`, err);
   res.status(500).send('Error leyendo el archivo CSV');
  }
 });

 app.get(`${basePath}/lenguaje/:lenguaje`, async (req, res) => {
  try {
   const lenguaje = req.params.lenguaje.toLowerCase();
   const data = await readCSV(route.file, route.separator);
   const filtrados = data.filter(item =>
    item.Language && item.Language.toLowerCase() === lenguaje
   );
   res.json(filtrados);
  } catch (err) {
   console.error(`❌ Error filtrando por lenguaje (${route.file}):`, err);
   res.status(500).send('Error leyendo el archivo CSV');
  }
 });

 app.get(`${basePath}/institucion/:institucion`, async (req, res) => {
  try {
   const institucion = req.params.institucion.toLowerCase();
   const data = await readCSV(route.file, route.separator);
   const filtrados = data.filter(item =>
    item.Institution && item.Institution.toLowerCase() === institucion
   );
   res.json(filtrados);
  } catch (err) {
   console.error(`❌ Error filtrando por institución (${route.file}):`, err);
   res.status(500).send('Error leyendo el archivo CSV');
  }
 });

 app.get(`${basePath}/salary/:minSalary`, async (req, res) => {
  try {
   const minSalary = Number(req.params.minSalary);
   if (isNaN(minSalary)) {
    return res.status(400).send('El salario mínimo debe ser un número');
   }
   const data = await readCSV(route.file, route.separator);
   const filtrados = data.filter(item => {
    const salary = Number(item.Salary_USD);
    return !isNaN(salary) && salary >= minSalary;
   });
   res.json(filtrados);
  } catch (err) {
   console.error(`❌ Error filtrando por salario (${route.file}):`, err);
   res.status(500).send('Error leyendo el archivo CSV');
  }
 });

 app.get(`${basePath}/experiencia/:nivel`, async (req, res) => {
  try {
   const nivel = req.params.nivel.toLowerCase();
   const data = await readCSV(route.file, route.separator);
   const filtrados = data.filter(item =>
    item.Experience_Level && item.Experience_Level.toLowerCase().includes(nivel)
   );
   res.json(filtrados);
  } catch (err) {
   console.error(`❌ Error filtrando por experiencia (${route.file}):`, err);
   res.status(500).send('Error leyendo el archivo CSV');
  }
 });
});

// ✅ Ruta de prueba opcional
app.get('/ping', (req, res) => {
 res.send('pong');
});

// ✅ Escucha en puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
 console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});
