// server/index.js
import express from 'express';
import dotenv from 'dotenv';
import { readCSV } from './utils/readCSV.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { MongoClient } from 'mongodb'
import 'dotenv/config';

// cors('http://localhost:5173/', 'https://lucent-piroshki-c15011.netlify.app/');

const mongoUrl = process.env.DB_DIRECT;
const client = new MongoClient(mongoUrl, {
 tls: true,
});
// conection th db

const run = async () => {
 try {
  await client.connect();
  console.log('Conectado a la base de datos MongoDB');
 } catch (err) {
  console.error('Error conectando a la base de datos:', err);
 }
}

run().catch(console.error);

dotenv.config();



const app = express();
app.use(express.json());
app.use(cors({
 origin: [
  "http://localhost:5173",
  "https://lucent-piroshki-c15011.netlify.app"
 ],
 methods: ["GET", "POST", "PUT", "DELETE"],
 credentials: true
}));
app.options("*", cors());

const routes = [
 { path: '/cursos', file: 'server/data/cursos_programas_100.csv', separator: ';' },
 { path: '/demandaLenguajes', file: 'server/data/demanda_laboral_lenguajes.csv', separator: ',' },
 { path: '/demandaLenguajesExtranjero', file: 'server/data/demanda_laboral_extranjero.csv', separator: ';' },
 { path: '/preferenciaLenguajes', file: 'server/data/preferencias_lenguajes.csv', separator: ',' },
 { path: '/preferenciaLenguajesExtranjero', file: 'server/data/preferencias_lenguajes_extranjero.csv', separator: ',' }
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ruta put mongodb
app.put('/usuario', async (req, res) => {
 const db = client.db('mibasedatos')
 const { nombre, apellido, pais, edad, email } = req.body
 try {
  const result = await db.collection('usuarios').insertOne({
   nombre,
   apellido,
   pais,
   edad,
   email
  })
  res.status(200).json({ message: 'Usuario agregado', result })
 } catch (err) {
  console.error('Error agregando usuario:', err)
  res.status(500).json({ error: 'Error agregando usuario' })
 }
})



// === RUTA PARA EL JSON ===
app.get('/', (req, res) => {
 try {
  const lenguajesPath = path.join(__dirname, 'data', 'lenguajes.json');
  const lenguajes = JSON.parse(
   fs.readFileSync(lenguajesPath, 'utf8')
  );
  res.json(lenguajes);
 } catch (err) {
  console.error('Error leyendo lenguajes.json:', err);
  res.status(500).json({ error: 'No se pudo leer lenguajes.json' });
 }
});

routes.forEach(route => {
 // Ruta para todos los datos
 app.get(route.path, async (req, res) => {
  try {
   const data = await readCSV(route.file, route.separator);
   res.json(data);
  } catch (err) {
   console.error(`Error leyendo CSV (${route.file}):`, err);
   res.status(500).send('Error leyendo el archivo CSV');
  }
 });

 // Filtrar por lenguaje (con prefijo 'lenguaje')
 app.get(`${route.path}/lenguaje/:lenguaje`, async (req, res) => {
  try {
   const lenguaje = req.params.lenguaje.toLowerCase();
   const data = await readCSV(route.file, route.separator);

   const filtrados = data.filter(item =>
    item.Language && item.Language.toLowerCase() === lenguaje
   );

   res.json(filtrados);
  } catch (err) {
   console.error(`Error leyendo CSV (${route.file}):`, err);
   res.status(500).send('Error leyendo el archivo CSV');
  }
 });

 // Filtrar por institución
 app.get(`${route.path}/institucion/:institucion`, async (req, res) => {
  try {
   const institucion = req.params.institucion.toLowerCase();
   const data = await readCSV(route.file, route.separator);

   const filtrados = data.filter(item =>
    item.Institution && item.Institution.toLowerCase() === institucion
   );

   res.json(filtrados);
  } catch (err) {
   console.error(`Error leyendo CSV (${route.file}):`, err);
   res.status(500).send('Error leyendo el archivo CSV');
  }
 });

 // Filtrar por salario mínimo (Salary_USD >= valor)
 app.get(`${route.path}/salary/:minSalary`, async (req, res) => {
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
   console.error(`Error leyendo CSV (${route.file}):`, err);
   res.status(500).send('Error leyendo el archivo CSV');
  }
 });
 // filtrar por experiencia
 app.get(`${route.path}/experiencia/:nivel`, async (req, res) => {
  try {
   const nivel = req.params.nivel.toLowerCase();
   const data = await readCSV(route.file, route.separator);

   const filtrados = data.filter(item =>
    item.Experience_Level && item.Experience_Level.toLowerCase().includes(nivel)
   );

   res.json(filtrados);
  } catch (err) {
   console.error(`Error leyendo CSV (${route.file}):`, err);
   res.status(500).send('Error leyendo el archivo CSV');
  }
 });


});




app.listen(process.env.PORT, () => {
 console.log(`Servidor escuchando en puerto ${process.env.PORT}`);
});
