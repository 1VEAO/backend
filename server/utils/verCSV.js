// server/utils/verCSV.js
import fs from 'fs';
import path from 'path';

// Ruta absoluta al CSV
const filePath = path.join(process.cwd(), 'server', 'data', 'cursos_programas_100.csv');

// Lee solo las primeras 5 líneas del archivo
const data = fs.readFileSync(filePath, 'utf8')
  .split('\n')
  .slice(0, 5)
  .join('\n');

console.log(data);

