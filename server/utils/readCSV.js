// server/utils/readCSV.js
import fs from 'fs';
import csv from 'csv-parser';

export const readCSV = (filePath, separator = ',') => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv({
        separator,
        mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '') // 🔹 Elimina BOM
      }))
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};
